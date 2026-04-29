const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function clearData() {
  console.log('--- Database Cleanup (PostgreSQL) ---');
  console.log(`Connecting to: ${process.env.DATABASE_URL ? 'Supabase/PostgreSQL' : 'Unknown'}`);

  try {
    // Get all tables from the public schema
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('users', 'pg_stat_statements')
    `);

    const tablesToClear = res.rows.map(row => row.table_name);

    if (tablesToClear.length === 0) {
      console.log('No data tables found to clear.');
      return;
    }

    console.log(`Tables to clear: ${tablesToClear.join(', ')}`);

    // Use TRUNCATE with CASCADE to handle foreign key constraints
    const truncateQuery = `TRUNCATE TABLE ${tablesToClear.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`;
    
    await pool.query(truncateQuery);
    
    tablesToClear.forEach(table => {
      console.log(`[OK] Cleared table: ${table}`);
    });

    console.log('--- Cleanup Complete! ---');
    console.log('All data (excluding users) has been deleted.');
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  } finally {
    await pool.end();
  }
}

clearData();

