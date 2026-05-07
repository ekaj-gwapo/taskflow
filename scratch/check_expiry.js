require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query('SELECT "emailVerifyExpiry", "emailVerifyExpiry"::text as str FROM users ORDER BY createdat DESC LIMIT 1');
    console.log("DB Result:", res.rows[0]);
    
    if (res.rows[0]) {
      const expiryDate = res.rows[0].emailVerifyExpiry;
      const expiryStr = res.rows[0].str;
      console.log("Parsed by pg as Date:", expiryDate instanceof Date);
      if (expiryDate instanceof Date) {
         console.log("Date string:", expiryDate.toString());
         console.log("Date ISO:", expiryDate.toISOString());
      }
      
      const now = new Date();
      console.log("Now ISO:", now.toISOString());
      
      // Let's simulate verify-otp logic
      let simulatedStr = String(expiryStr);
      if (!simulatedStr.endsWith('Z') && !simulatedStr.includes('+')) {
        simulatedStr += 'Z';
      }
      // Need to replace space with T for valid ISO parsing in node
      simulatedStr = simulatedStr.replace(' ', 'T');
      const parsed = new Date(simulatedStr);
      
      console.log("Simulated logic parsed date:", parsed.toISOString());
      console.log("Expired?", parsed < now);
    }
  } finally {
    pool.end();
  }
}
run();
