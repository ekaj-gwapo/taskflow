const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

console.log('--- Database Cleanup ---');
console.log(`Connecting to: ${dbPath}`);

db.serialize(() => {
  // Get all table names
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error fetching tables:', err.message);
      process.exit(1);
    }

    const tablesToClear = tables
      .map(t => t.name)
      .filter(name => name !== 'users' && name !== 'sqlite_sequence' && !name.startsWith('sqlite_'));

    if (tablesToClear.length === 0) {
      console.log('No data tables found to clear.');
      db.close();
      return;
    }

    console.log(`Tables to clear: ${tablesToClear.join(', ')}`);

    let completed = 0;
    tablesToClear.forEach(table => {
      db.run(`DELETE FROM ${table}`, (deleteErr) => {
        if (deleteErr) {
          console.error(`Error clearing ${table}:`, deleteErr.message);
        } else {
          console.log(`[OK] Cleared table: ${table}`);
        }
        
        completed++;
        if (completed === tablesToClear.length) {
          console.log('--- Cleanup Complete! ---');
          console.log('All data (excluding users) has been deleted.');
          db.close();
        }
      });
    });
  });
});
