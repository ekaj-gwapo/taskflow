require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function migrate() {
  console.log('Adding trial columns to organizations table...\n');

  // Use Supabase's SQL endpoint via pg (REST doesn't support DDL)
  // Instead, let's use the direct database connection
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    statement_timeout: 15000,
  });

  try {
    const client = await pool.connect();
    
    // Add missing columns (IF NOT EXISTS prevents errors if they already exist)
    const queries = [
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ`,
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'TRIAL'`,
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE'`,
    ];

    for (const q of queries) {
      await client.query(q);
      console.log(`[OK] ${q.substring(0, 70)}...`);
    }

    // Show current columns
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      ORDER BY ordinal_position
    `);
    console.log('\nOrganizations table columns:');
    cols.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));

    client.release();
    console.log('\n--- Migration complete! ---');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
