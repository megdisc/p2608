import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:15432/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to Postgres');
    const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20261007000000_add_member_daily_services.sql'), 'utf-8');
    await client.query(sql);
    console.log('Successfully executed migration 20261007000000_add_member_daily_services.sql');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
