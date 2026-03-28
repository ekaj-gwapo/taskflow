const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

async function partialReset() {
  console.log('--- Partial Database Reset & Cleaning Started ---');
  
  const tablesToClear = [
    'task_assignments',
    'step_notes',
    'progress_notes',
    'action_steps',
    'tasks'
  ];

  try {
    // 1. Clear Task-related data
    for (const table of tablesToClear) {
      await new Promise((resolve, reject) => {
        db.run(`DELETE FROM ${table}`, function(err) {
          if (err) {
            console.warn(`  ! Could not clear ${table}: ${err.message}`);
            return resolve(); // Continue anyway
          }
          console.log(`  - Cleared ${table} (${this.changes} rows deleted)`);
          resolve();
        });
      });
    }

    // 2. Clear Users except Super Admin
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM users WHERE role != 'SUPERADMIN'`, function(err) {
        if (err) {
          console.error(`  ! Could not clear users: ${err.message}`);
          return reject(err);
        }
        console.log(`  - Cleared non-superadmin users (${this.changes} rows deleted)`);
        resolve();
      });
    });

    // 3. Verify remaining users
    console.log('\n--- Final Users in Database ---');
    await new Promise((resolve, reject) => {
      db.all(`SELECT name, email, role FROM users`, (err, rows) => {
        if (err) return reject(err);
        rows.forEach(row => {
          console.log(`  - [${row.role}] ${row.name} (${row.email})`);
        });
        resolve();
      });
    });

    console.log('\n✅ Partial Reset Completed Successfully!');
    console.log('You can now log in as Super Admin to start fresh.');

  } catch (error) {
    console.error('\n❌ Reset Failed:', error.message);
  } finally {
    db.close();
  }
}

partialReset();
