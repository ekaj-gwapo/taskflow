require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function restore() {
  console.log('🛠 Restoring Master Admin...');
  const hashedPassword = await bcrypt.hash('jake123', 10);
  
  try {
    await pool.query(`
      INSERT INTO users (id, name, email, password, role, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, ['b7cfd476-b5a5-4106-b952-53a668ca1f96', 'Super Admin', 'masteradmin@gmail.com', hashedPassword, 'master_admin', '555-0000']);
    
    console.log('✅ Master Admin restored.');
  } catch (err) {
    console.error('❌ Restore failed:', err);
  } finally {
    await pool.end();
  }
}

restore();
