const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  user: 'postgres.veshgjylgddntmbtoetz',
  password: 'jt0Xax6EeF6VFQa0',
  host: 'aws-0-ap-southeast-1.pooler.southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
};

// Use the environment variable if available
const connectionString = process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } }) : new Pool(dbConfig);

async function migrate() {
  console.log('🚀 Adding attachment columns to task_comments...');
  try {
    await pool.query(`
      ALTER TABLE task_comments 
      ADD COLUMN IF NOT EXISTS attachmentUrl TEXT,
      ADD COLUMN IF NOT EXISTS attachmentName TEXT,
      ADD COLUMN IF NOT EXISTS attachmentType TEXT;
    `);
    console.log('✅ task_comments updated successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
