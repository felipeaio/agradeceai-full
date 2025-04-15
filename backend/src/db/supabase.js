import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Adicione esta linha

// Verificação das variáveis de ambiente
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export { supabase };