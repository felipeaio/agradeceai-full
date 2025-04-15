import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

// Importações de rotas (note a adição de .js nas extensões)
import cardRoutes from './routes/cards.js';
import paymentRoutes from './routes/payments.js';
import errorHandler from './middlewares/errorHandler.js';

// Importação do Supabase corrigida
import { supabase } from './db/supabase.js';

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Rotas
app.use('/cards', cardRoutes);
app.use('/payments', paymentRoutes);

// Rota raiz
app.get('/', (req, res) => res.json({ message: 'AgradeceAí Backend' }));

// Teste do banco de dados
app.get('/test-db', async (req, res) => {
    try {
        const { data, error } = await supabase.from('cards').select('id').limit(1);
        if (error) throw error;
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', async (req, res) => {
    try {
        const { error } = await supabase.from('cards').select('id').limit(1);
        if (error) throw error;
        res.json({ status: 'ok', supabase: true });
    } catch (error) {
        res.status(500).json({ status: 'error', supabase: false });
    }
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));