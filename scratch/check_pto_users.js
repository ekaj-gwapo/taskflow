const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT u.email, u.role, o.name as org_name 
      FROM users u 
      LEFT JOIN organizations o ON u.orgid = o.id 
      WHERE o.name = 'PTO'
    `);
    console.log('Users in PTO:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
