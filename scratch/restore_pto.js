const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Restoring PTO to ACTIVE...');
    await pool.query("UPDATE organizations SET status = 'ACTIVE' WHERE name = 'PTO'");
    console.log('✅ Restored!');
    
    const res = await pool.query("SELECT id, name, status FROM organizations WHERE name = 'PTO'");
    console.log('Final Status:', res.rows[0].status);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
