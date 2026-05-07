require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT 
        NOW() as now, 
        '2026-05-07T01:54:04.590Z'::timestamp as no_tz, 
        ('2026-05-07T01:54:04.590Z'::timestamp < NOW()) as is_expired
    `);
    console.log(res.rows[0]);
  } finally {
    pool.end();
  }
}
run();
