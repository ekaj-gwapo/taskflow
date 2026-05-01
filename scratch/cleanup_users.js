const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    // 1. Identify superadmin
    const res = await pool.query('SELECT id, email FROM users WHERE LOWER(role) = \'superadmin\'');
    const superadmin = res.rows[0];

    if (!superadmin) {
      console.log("No superadmin found! Please create one first or register a new account.");
      return;
    }

    console.log(`Found Superadmin: ${superadmin.email} (${superadmin.id})`);

    // 2. Auto-verify the superadmin
    await pool.query('UPDATE users SET "emailVerified" = true WHERE id = $1', [superadmin.id]);
    console.log("Superadmin account verified.");

    // 3. Clear all related data to avoid FK violations
    console.log("Cleaning up all data except superadmin records...");
    
    // Check if task_assignments table exists first
    try {
      await pool.query('DELETE FROM task_assignments');
      console.log("- task_assignments cleared");
    } catch (e) {}

    await pool.query('DELETE FROM step_notes');
    await pool.query('DELETE FROM action_steps');
    await pool.query('DELETE FROM progress_notes');
    await pool.query('DELETE FROM task_comments');
    await pool.query('DELETE FROM extension_requests');
    await pool.query('DELETE FROM activity_logs');
    await pool.query('DELETE FROM notifications');
    await pool.query('DELETE FROM tasks');
    
    console.log("Related tables cleared.");

    // 4. Delete all users except superadmin
    const deleteRes = await pool.query('DELETE FROM users WHERE id != $1', [superadmin.id]);
    console.log(`Deleted ${deleteRes.rowCount} other users.`);

    console.log("Cleanup complete!");
    console.log("You can now log in with: " + superadmin.email);
  } catch (err) {
    console.error("CLEANUP ERROR:", err);
  } finally {
    await pool.end();
  }
}

run();
