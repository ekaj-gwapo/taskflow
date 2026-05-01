const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Cleaning up verification states...');
    await pool.query('UPDATE users SET "emailVerified" = FALSE WHERE email IS NULL');
    console.log('States cleaned up');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

run();
