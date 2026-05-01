const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const email = 'jackdagooc6@gmail.com';
    const role = 'creator';
    
    console.log(`Fixing role for ${email} to ${role}...`);
    
    const res = await pool.query(
      'UPDATE users SET role = $1 WHERE email = $2',
      [role, email]
    );

    if (res.rowCount > 0) {
      console.log('✅ Role updated successfully!');
    } else {
      console.log('❌ User not found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
