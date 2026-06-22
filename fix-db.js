import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function fix() {
  const getRes = await fetch(`${supabaseUrl}/rest/v1/monthly_member_contributions?select=id,contribution_ratio`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const data = await getRes.json();
  if (!getRes.ok) {
    console.error(data);
    return;
  }
  
  for (const row of data) {
    if (row.contribution_ratio > 1) { // presumably > 1 means it was stored as 100 or 50
      const newRatio = row.contribution_ratio / 100;
      console.log(`Updating id ${row.id}: ${row.contribution_ratio} -> ${newRatio}`);
      
      const patchRes = await fetch(`${supabaseUrl}/rest/v1/monthly_member_contributions?id=eq.${row.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ contribution_ratio: newRatio })
      });
      if (!patchRes.ok) {
        console.error(await patchRes.text());
      }
    }
  }
  console.log('Done!');
}
fix();
