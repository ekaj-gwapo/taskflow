const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  console.log("Fixing jobTitle column name...");
  try {
    // Check if "jobTitle" (quoted) exists
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='jobTitle';
    `);

    if (res.rowCount > 0) {
      await pool.query(`ALTER TABLE users RENAME COLUMN "jobTitle" TO jobtitle;`);
      console.log("Renamed 'jobTitle' to 'jobtitle' successfully.");
    } else {
      console.log("'jobTitle' column not found (quoted).");
      
      // Check if it's already "jobtitle"
      const res2 = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='jobtitle';
      `);
      if (res2.rowCount > 0) {
        console.log("'jobtitle' already exists.");
      } else {
        // Doesn't exist at all? Create it
        await pool.query(`ALTER TABLE users ADD COLUMN jobtitle TEXT;`);
        console.log("Created 'jobtitle' column.");
      }
    }
  } catch (err) {
    console.error("Fix failed:", err);
  } finally {
    await pool.end();
  }
}

fix();
