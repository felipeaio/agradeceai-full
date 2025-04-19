import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Resolve o caminho do diretório raiz do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..'); // Diretório backend/
const envPath = path.join(rootDir, '.env');

// Verifica se o arquivo .env existe
try {
  if (!fs.existsSync(envPath)) {
    console.error(`[${new Date().toISOString()}] Erro: Arquivo .env não encontrado em: ${envPath}`);
    process.exit(1);
  }
  console.log(`[${new Date().toISOString()}] Arquivo .env encontrado em: ${envPath}`);
} catch (err) {
  console.error(`[${new Date().toISOString()}] Erro ao verificar .env:`, err.message);
  process.exit(1);
}

// Carrega variáveis de ambiente
const dotenvResult = dotenv.config({ path: envPath });
if (dotenvResult.error) {
  console.error(`[${new Date().toISOString()}] Erro ao carregar .env:`, dotenvResult.error.message);
  process.exit(1);
}

// Log para depuração
console.log(`[${new Date().toISOString()}] Conteúdo do .env carregado:`);
console.log(`[${new Date().toISOString()}] SUPABASE_URL: ${process.env.SUPABASE_URL || 'Não definido'}`);
console.log(`[${new Date().toISOString()}] SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY || 'Não definido'}`);
console.log(`[${new Date().toISOString()}] PORT: ${process.env.PORT || 'Não definido'}`);

// Valida variáveis de ambiente
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`[${new Date().toISOString()}] Erro: Variáveis de ambiente faltando: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Inicializa o aplicativo Express
const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Ajuste para produção (ex.: 'http://localhost:8080')
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'X-Token-Edit'],
}));
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requisições por IP
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rotas
app.use('/cards', (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Requisição recebida: ${req.method} ${req.url}`);
  import('./routes/cards.js').then(module => {
    module.default(req, res, next);
  }).catch(err => {
    console.error(`[${new Date().toISOString()}] Erro ao carregar cards.js:`, err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ message: 'AgradeceAí Backend' });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Erro:`, err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Servidor rodando na porta ${PORT}`);
});