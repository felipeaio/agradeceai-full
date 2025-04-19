import express from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import mercadopago from 'mercadopago';

// Inicializa o roteador Express
const router = express.Router();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL e SUPABASE_ANON_KEY devem ser definidos no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Classe de erro personalizado
class APIError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Schema de validação com Zod
const cardSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
  url: z.string().url({ message: 'URL inválida' }).optional(),
  qrcode_url: z.string().url({ message: 'URL do QR code inválida' }).optional(),
  status_pagamento: z.enum(['pendente', 'aprovado'], {
    invalid_type_error: 'Status de pagamento inválido',
    required_error: 'Status de pagamento é obrigatório',
  }),
  plano: z.enum(['para_sempre', 'anual'], {
    invalid_type_error: 'Plano inválido',
    required_error: 'Plano é obrigatório',
  }),
  conteudo: z.object({
    pageName: z
      .string()
      .min(3, { message: 'Nome da página deve ter pelo menos 3 caracteres' })
      .max(30, { message: 'Nome da página deve ter no máximo 30 caracteres' }),
    title: z
      .string()
      .min(3, { message: 'Título deve ter pelo menos 3 caracteres' })
      .max(50, { message: 'Título deve ter no máximo 50 caracteres' }),
    message: z
      .string()
      .min(10, { message: 'Mensagem deve ter pelo menos 10 caracteres' })
      .max(5000, { message: 'Mensagem deve ter no máximo 5000 caracteres' }),
    background: z
      .string()
      .nullable()
      .refine(val => !val || ['none', 'starry-sky', 'emoji-rain', 'rain'].includes(val), {
        message: 'Efeito de fundo inválido',
      })
      .optional(),
    images: z
      .array(z.string().url({ message: 'URL de imagem inválida' }))
      .max(7, { message: 'Máximo de 7 imagens permitidas' }),
    music: z
      .string()
      .url({ message: 'URL de música inválida' })
      .nullable()
      .optional(),
  }),
  token_edit: z.string().optional(),
});

// Rota POST: Criar um novo cartão
router.post('/', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Nova requisição POST /cards`);

  try {
    // Verificar Content-Type
    if (!req.is('application/json')) {
      throw new APIError('Content-Type deve ser application/json', 415);
    }

    // Verificar tamanho do payload
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 10 * 1024 * 1024) {
      throw new APIError('Payload muito grande', 413);
    }

    // Validar dados
    const validatedData = cardSchema.parse(req.body);

    // Gerar ID e token
    const id = uuidv4();
    const token_edit = uuidv4();
    const sanitizedPageName = validatedData.conteudo.pageName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const url = `agradeceai.com/c/${id}-${sanitizedPageName}`;

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('cards')
      .insert({
        id,
        email: validatedData.email,
        url,
        qrcode_url: validatedData.qrcode_url,
        status_pagamento: validatedData.status_pagamento,
        plano: validatedData.plano,
        conteudo: validatedData.conteudo,
        token_edit,
      })
      .select();

    if (error) {
      console.error(`[${new Date().toISOString()}] Erro no Supabase:`, error);
      throw new APIError(`Falha ao criar card no banco de dados: ${error.message}`, 500);
    }

    console.log(`[${new Date().toISOString()}] Card criado com ID: ${id}`);

    res.status(201).json({
      success: true,
      data: {
        id,
        url,
        token_edit,
        ...data[0],
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        errors: formattedErrors,
        message: 'Erro de validação',
      });
    }
    next(error);
  }
});

// Rota GET: Recuperar cartões por e-mail
router.get('/:email', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Nova requisição GET /cards/:email`);

  try {
    const email = z.string().email({ message: 'E-mail inválido' }).parse(req.params.email);
    const { data, error } = await supabase
      .from('cards')
      .select('id, url, qrcode_url, conteudo')
      .eq('email', email)
      .eq('status_pagamento', 'aprovado');

    if (error) {
      console.error(`[${new Date().toISOString()}] Erro no Supabase:`, error);
      throw new APIError(`Falha ao recuperar cartões: ${error.message}`, 500);
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }
    next(error);
  }
});

// Rota PATCH: Atualizar um cartão
router.patch('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Nova requisição PATCH /cards/:id`);

  try {
    const id = z.string().uuid({ message: 'ID inválido' }).parse(req.params.id);
    const token_edit = z.string({ required_error: 'Token de edição é obrigatório' }).parse(
      req.headers['x-token-edit']
    );
    const data = cardSchema.partial().parse(req.body);

    console.log(`[${new Date().toISOString()}] Tentando atualizar card com ID: ${id}`);
    console.log(`[${new Date().toISOString()}] Token de edição: ${token_edit}`);
    console.log(`[${new Date().toISOString()}] Dados para atualização:`, data);

    // Verificar existência do cartão e validade do token
    const { data: card, error: checkError } = await supabase
      .from('cards')
      .select('id, conteudo')
      .eq('id', id)
      .eq('token_edit', token_edit)
      .single();

    if (checkError || !card) {
      console.error(`[${new Date().toISOString()}] Erro ao verificar token:`, checkError);
      throw new APIError('Token de edição inválido', 403);
    }

    // Atualizar no Supabase
    const updateData = {
      conteudo: data.conteudo
        ? {
            ...card.conteudo,
            ...data.conteudo,
            images: data.conteudo.images || card.conteudo.images || [],
            music: data.conteudo.music !== undefined ? data.conteudo.music : card.conteudo.music,
          }
        : card.conteudo,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error(`[${new Date().toISOString()}] Erro ao atualizar o banco de dados:`, updateError);
      throw new APIError(`Falha ao atualizar cartão: ${updateError.message}`, 500);
    }

    console.log(`[${new Date().toISOString()}] Card atualizado com sucesso: ${id}`);
    res.json({
      success: true,
      message: 'Cartão atualizado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        errors: formattedErrors,
        message: 'Erro de validação',
      });
    }
    next(error);
  }
});

export default router;