const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log("Running migration to add jobTitle column...");
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='jobtitle';
    `);

    if (res.rowCount === 0) {
      await pool.query(`ALTER TABLE users ADD COLUMN "jobTitle" TEXT;`);
      console.log("Column 'jobTitle' added successfully.");
    } else {
      console.log("Column 'jobTitle' already exists.");
    }
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
