require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`SELECT id, name, email, role, orgid FROM users WHERE name ILIKE '%jake%' OR email ILIKE '%jake%'`);
    console.table(res.rows);
  } finally {
    pool.end();
  }
}
run();
