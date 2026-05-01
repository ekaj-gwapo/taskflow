const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Suspending PTO...');
    await pool.query("UPDATE organizations SET status = 'SUSPENDED' WHERE name = 'PTO'");
    console.log('✅ Suspended!');
    
    const res = await pool.query("SELECT * FROM organizations WHERE name = 'PTO'");
    console.log('Current Status:', res.rows[0].status);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
