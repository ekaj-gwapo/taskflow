const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clearPtoData() {
  console.log('--- Starting PTO Organization Data Cleanup ---');
  try {
    // 1. Find Provincial Treasurer's Office organization
    const orgRes = await pool.query(`SELECT id, name FROM organizations WHERE name ILIKE $1`, ['%Provincial Treasurer%']);
    if (orgRes.rows.length === 0) {
      console.error('❌ No organization found matching "pto".');
      
      // Let's list all organizations to see what exists
      const allOrgs = await pool.query(`SELECT id, name FROM organizations`);
      console.log('Available organizations:', allOrgs.rows);
      process.exit(1);
    }

    const org = orgRes.rows[0];
    console.log(`✅ Found Organization: "${org.name}" (ID: ${org.id})`);

    // 2. Find users in this org
    const usersRes = await pool.query(`SELECT id, name, email, role FROM users WHERE orgid = $1`, [org.id]);
    console.log(`👥 Found ${usersRes.rows.length} users in "${org.name}":`);
    usersRes.rows.forEach(u => console.log(`   - ${u.name} (${u.email}) [${u.role}]`));

    // 3. Clear dependent tables for tasks belonging to this org
    console.log('\n🧹 Clearing task-related data...');
    
    const stepNotesRes = await pool.query(`
      DELETE FROM step_notes 
      WHERE stepId IN (
        SELECT id FROM action_steps WHERE taskId IN (
          SELECT id FROM tasks WHERE orgid = $1
        )
      )
    `, [org.id]);
    console.log(`   - Deleted ${stepNotesRes.rowCount} step notes.`);

    const actionStepsRes = await pool.query(`
      DELETE FROM action_steps WHERE taskId IN (SELECT id FROM tasks WHERE orgid = $1)
    `, [org.id]);
    console.log(`   - Deleted ${actionStepsRes.rowCount} action steps.`);

    const commentsRes = await pool.query(`
      DELETE FROM task_comments WHERE taskId IN (SELECT id FROM tasks WHERE orgid = $1)
    `, [org.id]);
    console.log(`   - Deleted ${commentsRes.rowCount} task comments.`);

    const progressNotesRes = await pool.query(`
      DELETE FROM progress_notes WHERE taskId IN (SELECT id FROM tasks WHERE orgid = $1)
    `, [org.id]);
    console.log(`   - Deleted ${progressNotesRes.rowCount} progress notes.`);

    const assignmentsRes = await pool.query(`
      DELETE FROM task_assignments WHERE taskId IN (SELECT id FROM tasks WHERE orgid = $1)
    `, [org.id]);
    console.log(`   - Deleted ${assignmentsRes.rowCount} task assignments.`);

    const extensionsRes = await pool.query(`
      DELETE FROM extension_requests WHERE taskId IN (SELECT id FROM tasks WHERE orgid = $1)
    `, [org.id]);
    console.log(`   - Deleted ${extensionsRes.rowCount} extension requests.`);

    // 4. Clear tasks
    const tasksRes = await pool.query(`DELETE FROM tasks WHERE orgid = $1`, [org.id]);
    console.log(`   - Deleted ${tasksRes.rowCount} tasks.`);

    // 5. Clear logs and notifications for users in this org
    console.log('\n🧹 Clearing user activity logs, notifications, and support requests...');
    
    const activityRes = await pool.query(`
      DELETE FROM activity_logs WHERE userid IN (SELECT id FROM users WHERE orgid = $1)
    `, [org.id]);
    console.log(`   - Deleted ${activityRes.rowCount} activity logs.`);

    const notifRes = await pool.query(`
      DELETE FROM notifications WHERE userId IN (SELECT id FROM users WHERE orgid = $1)
    `, [org.id]);
    console.log(`   - Deleted ${notifRes.rowCount} notifications.`);

    const supportRes = await pool.query(`
      DELETE FROM support_requests WHERE creator_id IN (SELECT id FROM users WHERE orgid = $1)
    `, [org.id]);
    console.log(`   - Deleted ${supportRes.rowCount} support requests.`);

    console.log('\n✨ PTO organization data cleanup completed successfully! (Users were NOT deleted)');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await pool.end();
  }
}

clearPtoData();
