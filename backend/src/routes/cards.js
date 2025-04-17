import express from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import mercadopago from 'mercadopago';

class APIError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

const router = express.Router();

const cardSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  url: z.string().url({ message: "URL inválida" }).optional(),
  qrcode_url: z.string().url({ message: "URL do QR code inválida" }).optional(),
  status_pagamento: z.enum(['pendente', 'aprovado'], {
    invalid_type_error: "Status de pagamento inválido",
    required_error: "Status de pagamento é obrigatório"
  }),
  plano: z.enum(['para_sempre', 'anual'], {
    invalid_type_error: "Plano inválido",
    required_error: "Plano é obrigatório"
  }),
  conteudo: z.object({
    pageName: z.string()
      .min(3, { message: "Nome da página deve ter pelo menos 3 caracteres" })
      .max(30, { message: "Nome da página deve ter no máximo 30 caracteres" }),
    title: z.string()
      .min(3, { message: "Título deve ter pelo menos 3 caracteres" })
      .max(50, { message: "Título deve ter no máximo 50 caracteres" }),
    message: z.string()
      .min(10, { message: "Mensagem deve ter pelo menos 10 caracteres" })
      .max(5000, { message: "Mensagem deve ter no máximo 5000 caracteres" }),
      background: z.string()
      .nullable()
      .refine(val => !val || ['none', 'starry-sky', 'emoji-rain', 'rain'].includes(val), {
        message: "Efeito de fundo inválido"
      })
      .optional(),
    images: z.array(z.string().url({ message: "URL de imagem inválida" }))
      .max(7, { message: "Máximo de 7 imagens permitidas" }),
    music: z.string()
      .url({ message: "URL de música inválida" })
      .nullable()
      .optional()
  }),
  token_edit: z.string().optional()
});

router.post('/', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Nova requisição POST /cards`);

  try {
    if (!req.is('application/json')) {
      throw new APIError("Content-Type deve ser application/json", 415);
    }

    if (req.headers['content-length'] > 1024 * 1024) {
      throw new APIError("Payload muito grande", 413);
    }

    const validatedData = cardSchema.parse(req.body);
    const id = uuidv4();
    const token_edit = uuidv4();
    const sanitizedPageName = validatedData.conteudo.pageName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const url = `agradeceai.com/c/${id}-${sanitizedPageName}`;

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
        token_edit
      })
      .select();

    if (error) {
      console.error('Erro no Supabase:', error);
      throw new APIError("Falha ao criar card no banco de dados", 500);
    }

    console.log(`[${new Date().toISOString()}] Card criado com ID: ${id}`);

    res.status(201).json({
      success: true,
      data: {
        id,
        url,
        token_edit,
        ...data[0]
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        errors: formattedErrors,
        message: "Erro de validação"
      });
    }
    next(error);
  }
});

router.get('/:email', async (req, res) => {
  try {
    const email = z.string().email().parse(req.params.email);
    const { data, error } = await supabase
      .from('cards')
      .select('id, url, qrcode_url, conteudo')
      .eq('email', email)
      .eq('status_pagamento', 'aprovado');

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const token_edit = z.string().parse(req.headers['x-token-edit']);
    const data = cardSchema.partial().parse(req.body);

    console.log('Tentando atualizar card com ID:', id);
    console.log('Token de edição:', token_edit);
    console.log('Dados para atualização:', data);

    const { data: card, error: checkError } = await supabase
      .from('cards')
      .select('id')
      .eq('id', id)
      .eq('token_edit', token_edit)
      .single();

    if (checkError || !card) {
      console.error('Erro ao verificar token:', checkError);
      return res.status(403).json({ error: 'Token inválido' });
    }

    const { error: updateError } = await supabase
      .from('cards')
      .update({
        conteudo: {
          ...data,
          images: data.images || [],
          music: data.music || null
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Erro ao atualizar o banco de dados:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    console.log('Card atualizado com sucesso:', id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro na rota PATCH:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;