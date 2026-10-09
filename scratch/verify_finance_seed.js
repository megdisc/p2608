import fs from 'fs';

let url = 'http://127.0.0.1:54321';
let key = '';
try {
  const env = fs.readFileSync('.env.local', 'utf-8');
  for (const line of env.split('\n')) {
    const [k, v] = line.split('=');
    if (k?.trim() === 'VITE_SUPABASE_URL') url = v?.trim();
    if (k?.trim() === 'VITE_SUPABASE_ANON_KEY') key = v?.trim();
  }
} catch (e) {}

async function get(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  return res.json();
}

async function verify() {
  console.log('--- Verifying Office Finance Seed Data via REST ---');
  const offices = await get('offices?select=id,code,name');
  console.log('Offices count:', offices.length);

  for (const office of offices) {
    console.log(`\nOffice: [${office.code}] ${office.name}`);

    const finRecs = await get(`general_financial_details?office_id=eq.${office.id}&select=id,type,activity_category,subject,amount`);
    console.log(`  - general_financial_details: ${finRecs.length} items`);

    const projects = await get(`projects?office_id=eq.${office.id}&select=id,code,name`);
    console.log(`  - projects: ${projects.length} items`);

    const members = await get(`office_member_settings?office_id=eq.${office.id}&select=member_id`);
    console.log(`  - assigned members: ${members.length} items`);

    const wages = await get(`wage_summaries?office_id=eq.${office.id}&select=id,target_period,member_id,wage_total`);
    console.log(`  - wage_summaries: ${wages.length} items`);

    const works = await get(`member_work_records?office_id=eq.${office.id}&select=id,target_period,member_id,work_time`);
    console.log(`  - member_work_records: ${works.length} items`);
  }
}

verify().catch(console.error);
