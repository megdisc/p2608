import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczODk3MDU0NCwiZXhwIjoyMDU0NTQ2NTQ0fQ.zO6aD9f_XUu-Q9a3_V-P2R32gX_qA_K66gW7mO_Q0qE'; // from supabase start output
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('financial_records').select(`
          id, period, type, subject, amount, recorded_date, is_limited,
          project:projects(id, name),
          staff:staffs(id, name),
          client:clients(id, name)
        `, { count: 'exact' }).limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', data);
  }
}

run();
