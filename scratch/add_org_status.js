const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Adding status column to organizations...');
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'ACTIVE\'');
    console.log('✅ Column added successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
