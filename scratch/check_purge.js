require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('Public Tables:', res.rows.map(r => r.table_name));
  
  for (const table of res.rows.map(r => r.table_name)) {
    const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
    console.log(`${table}: ${count.rows[0].count} rows`);
  }
  pool.end();
}
check();
