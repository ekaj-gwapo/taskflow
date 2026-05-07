require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    // Add stripe columns to organizations table if they don't exist
    await pool.query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`);
    console.log('✅ Added stripe_customer_id column');
    
    await pool.query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`);
    console.log('✅ Added stripe_subscription_id column');

    // Check current columns
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'organizations'
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Organizations table columns:');
    console.table(result.rows);

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    pool.end();
  }
}

migrate();
