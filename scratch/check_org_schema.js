const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'organizations';
  `);
  console.log(res.rows);
  process.exit(0);
}

run().catch(console.error);
