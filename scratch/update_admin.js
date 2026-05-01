const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const newEmail = 'masteradmin@gmail.com';
  const newPass = 'jake123';
  
  try {
    const hashedPassword = await bcrypt.hash(newPass, 10);
    
    console.log(`Updating Master Admin to: ${newEmail}`);
    
    // Update the existing master_admin or superadmin
    const res = await pool.query(
      'UPDATE users SET email = $1, password = $2, role = \'master_admin\', "emailVerified" = true WHERE role = \'master_admin\' OR role = \'SUPERADMIN\' OR email = \'superadmin@example.com\'',
      [newEmail, hashedPassword]
    );

    if (res.rowCount > 0) {
      console.log('✅ Master Admin credentials updated successfully!');
    } else {
      console.log('❌ No admin account found to update. Creating a new one...');
      await pool.query(
        'INSERT INTO users (id, name, email, password, role, "emailVerified", createdat, updatedat) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [require('uuid').v4(), 'Master Admin', newEmail, hashedPassword, 'master_admin', true]
      );
      console.log('✅ New Master Admin account created!');
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

run();
