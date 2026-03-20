const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

db.serialize(() => {
  console.log('Creating task_assignments table...');
  db.run(`
    CREATE TABLE IF NOT EXISTS task_assignments (
      taskId TEXT NOT NULL,
      userId TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      PRIMARY KEY (taskId, userId),
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
      process.exit(1);
    }
  });

  console.log('Migrating existing task assignees...');
  db.all("SELECT id, assigneeId, priority FROM tasks WHERE assigneeId IS NOT NULL", [], (err, rows) => {
    if (err) {
      console.error('Error fetching tasks for migration:', err.message);
      process.exit(1);
    }

    if (rows.length === 0) {
      console.log('No tasks to migrate.');
      db.close();
      return;
    }

    const stmt = db.prepare("INSERT OR IGNORE INTO task_assignments (taskId, userId, points) VALUES (?, ?, ?)");
    let processed = 0;

    for (const row of rows) {
      let points = 2; // Default Easy
      if (row.priority === 'MEDIUM') points = 3;
      if (row.priority === 'HIGH') points = 5;

      stmt.run(row.id, row.assigneeId, points, (err) => {
        if (err) {
          console.error(`Error inserting assignee for task ${row.id}:`, err.message);
        }
        processed++;
        if (processed === rows.length) {
          stmt.finalize();
          console.log(`Successfully migrated ${rows.length} records.`);
          db.close();
        }
      });
    }
  });
});
