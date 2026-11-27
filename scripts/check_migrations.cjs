const { Client } = require('pg');

async function checkMigrations() {
  const client = new Client({
    host: '127.0.0.1',
    port: 15432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });
  await client.connect();

  const res = await client.query(`
    SELECT * 
    FROM supabase_migrations.schema_migrations 
    ORDER BY version;
  `);

  console.log('Applied migrations in DB:');
  res.rows.forEach(r => console.log(r.version));

  await client.end();
}

checkMigrations().catch(console.error);
