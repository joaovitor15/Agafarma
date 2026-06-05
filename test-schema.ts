import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = Object.fromEntries(envFile.split('\n').filter(line => line.includes('=')).map(line => line.split('=', 2)));

const supabaseUrl = envVars.VITE_SUPABASE_URL || '';
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('notas_fiscais_nf').select('*').limit(1);
  if (error) console.log("notas_fiscais_nf Error:", error);
  else console.log("notas_fiscais_nf Data keys:", data.length > 0 ? Object.keys(data[0]) : 'Empty table');
  
  const { data: itens, error: err2 } = await supabase.from('itens_nf').select('*').limit(1);
  if (err2) console.log("itens_nf Error:", err2);
  else console.log("itens_nf Data keys:", itens.length > 0 ? Object.keys(itens[0]) : 'Empty table');
}
test();
