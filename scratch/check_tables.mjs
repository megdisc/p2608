import pg from 'pg';
const { Client } = pg;

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:15432/postgres'
  });

  try {
    await client.connect();
    
    // Check reward_items
    const resReward = await client.query('SELECT count(*) FROM public.reward_items;');
    console.log('reward_items count in postgres:', resReward.rows[0].count);
    
    // Check qualifications
    const resQual = await client.query('SELECT count(*) FROM public.qualifications;');
    console.log('qualifications count in postgres:', resQual.rows[0].count);
    
    // Check service_types
    const resService = await client.query('SELECT count(*) FROM public.service_types;');
    console.log('service_types count in postgres:', resService.rows[0].count);

    // List columns for reward_items
    const colReward = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reward_items';");
    console.log('reward_items columns:', colReward.rows.map(r => r.column_name).join(', '));

    // List columns for qualifications
    const colQual = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'qualifications';");
    console.log('qualifications columns:', colQual.rows.map(r => r.column_name).join(', '));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
