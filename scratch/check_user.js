require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT email, "emailVerifyToken", "emailVerifyExpiry", NOW(), ("emailVerifyExpiry" < NOW()) as is_expired
      FROM users WHERE email = 'jackdagooc6@gmail.com'
    `);
    console.log(res.rows[0]);
  } finally {
    pool.end();
  }
}
run();
