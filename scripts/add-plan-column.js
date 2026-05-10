const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    console.log("Adding 'plan' column to 'organizations' table...");
    await pool.query(`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'FREE_TRIAL';
    `);
    
    console.log("Setting existing active orgs to 'PRO'...");
    await pool.query(`
      UPDATE organizations 
      SET plan = 'PRO'
      WHERE subscription_status = 'ACTIVE' OR plan IS NULL;
    `);

    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

run();
