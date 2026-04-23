const { Pool } = require('pg');
require('dotenv').config();

async function inspect() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const result = await pool.query('SELECT * FROM activity_logs LIMIT 1');
    console.log('Columns:', Object.keys(result.rows[0] || {}));
    console.log('Sample Row:', result.rows[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

inspect();
