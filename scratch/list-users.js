require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const res = await pool.query(`SELECT id, name, email, role, orgid FROM users ORDER BY role`);
  console.table(res.rows);
  pool.end();
}
run().catch(e => { console.error(e); pool.end(); });
