const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const email = 'ronald@gmail.com';
    console.log(`Checking login check for ${email}...`);
    
    // Simulate the query in login/route.ts
    const user = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.orgid AS "orgId", 
             o.status as "orgStatus"
      FROM users u
      LEFT JOIN organizations o ON u.orgid = o.id
      WHERE u.email = $1
    `, [email]);

    const u = user.rows[0];
    console.log('User found:', u);
    
    if (u.orgStatus === 'SUSPENDED' && u.role !== 'master_admin') {
      console.log('❌ BLOCKED: Organization suspended.');
    } else {
      console.log('✅ ALLOWED: Login proceeding.');
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
