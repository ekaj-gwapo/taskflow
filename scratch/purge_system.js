require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function purge() {
  console.log('🚀 Starting system purge (Keeping Master Admin)...');
  
  try {
    // 1. Get Master Admin ID
    const res = await pool.query("SELECT id FROM users WHERE email = 'masteradmin@gmail.com' LIMIT 1");
    const masterAdmin = res.rows[0];
    
    if (!masterAdmin) {
      console.error('❌ Master Admin not found! Aborting to prevent total data loss.');
      process.exit(1);
    }
    
    console.log(`Found Master Admin ID: ${masterAdmin.id}`);

    // 2. Clear all tables except 'users'
    // Order matters due to foreign keys, or use CASCADE
    const tables = [
      'task_assignments',
      'step_notes',
      'progress_notes',
      'action_steps',
      'tasks',
      'activity_logs',
      'support_requests',
      'organizations'
    ];

    for (const table of tables) {
      console.log(`Clearing ${table}...`);
      try {
        await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
      } catch (e) {
        console.warn(`  ! Note: ${table} table issue: ${e.message}`);
      }
    }

    // 3. Delete all users except Master Admin
    console.log('Cleaning user table...');
    await pool.query('UPDATE users SET orgid = NULL WHERE id = $1', [masterAdmin.id]);
    await pool.query('DELETE FROM users WHERE id != $1', [masterAdmin.id]);

    console.log('✅ System purged successfully. Only Master Admin remains.');
  } catch (err) {
    console.error('❌ Purge failed:', err);
  } finally {
    await pool.end();
  }
}

purge();
