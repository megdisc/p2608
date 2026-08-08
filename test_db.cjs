const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  });
  
  await client.connect();
  
  try {
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'financial_records';
    `);
    console.log(res.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  }
  
  await client.end();
}

run();
