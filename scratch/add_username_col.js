const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Adding username column...');
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT");
    
    // Check if unique constraint exists
    const checkUnique = await pool.query(`
      SELECT count(*) 
      FROM pg_indexes 
      WHERE tablename = 'users' AND indexname = 'users_username_key'
    `);
    
    if (checkUnique.rows[0].count == 0) {
       console.log('Adding unique constraint...');
       // Populate with email first to avoid unique violation if we add it now
       await pool.query("UPDATE users SET username = email WHERE username IS NULL");
       await pool.query("ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username)");
    }
    
    console.log('Database updated successfully');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

run();
