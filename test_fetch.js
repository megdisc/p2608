import { createClient } from '@supabase/supabase-js';

// Since we're in the local project, we can read the anon key from .env.local
import fs from 'fs';
import dotenv from 'dotenv';
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('member_skill_evaluations').select('*');
  console.log('Evals:', data);
  const { data: mData } = await supabase.from('members').select('id, name');
  console.log('Members:', mData);
}
test();
