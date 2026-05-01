const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query('SELECT id, email FROM users WHERE role = \'master_admin\'');
    const masterAdmin = res.rows[0];

    if (!masterAdmin) {
      console.log("No Master Admin found!");
      return;
    }

    // 1. Unlink Master Admin from any org
    await pool.query('UPDATE users SET orgid = NULL WHERE id = $1', [masterAdmin.id]);

    // 2. Delete all other users
    await pool.query('DELETE FROM users WHERE id != $1', [masterAdmin.id]);

    // 3. Delete everything else
    const tables = [
      'step_notes', 'action_steps', 'progress_notes', 'task_comments', 
      'extension_requests', 'activity_logs', 'notifications', 
      'task_assignments', 'tasks', 'organizations'
    ];

    for (const table of tables) {
      try {
        await pool.query(`DELETE FROM ${table}`);
        console.log(`- ${table} cleared`);
      } catch (e) {
        console.warn(`! Skip ${table}: ${e.message}`);
      }
    }

    console.log("System Purge Complete!");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
