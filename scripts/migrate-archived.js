const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

console.log('--- Migrating Tasks Table: Adding "archived" Column ---');

db.serialize(() => {
  // Check if column already exists
  db.all("PRAGMA table_info(tasks)", (err, columns) => {
    if (err) {
      console.error('Error checking table info:', err.message);
      process.exit(1);
    }

    const archivedColumn = columns.find(c => c.name === 'archived');

    if (archivedColumn) {
      console.log('[INFO] "archived" column already exists. Skipping migration.');
      db.close();
      return;
    }

    console.log('[ACTION] Adding "archived" column to tasks table...');
    db.run("ALTER TABLE tasks ADD COLUMN archived INTEGER DEFAULT 0", (alterErr) => {
      if (alterErr) {
        console.error('Error adding column:', alterErr.message);
        process.exit(1);
      }
      console.log('[SUCCESS] Task table updated with "archived" column.');
      db.close();
    });
  });
});
