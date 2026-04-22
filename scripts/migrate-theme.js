const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

console.log('--- Database Migration: Adding Theme and Mode Columns ---');

db.serialize(() => {
  // Add theme column
  db.run("ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'emerald'", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column "theme" already exists.');
      } else {
        console.error('Error adding "theme" column:', err.message);
      }
    } else {
      console.log('Successfully added "theme" column.');
    }
  });

  // Add mode column
  db.run("ALTER TABLE users ADD COLUMN mode TEXT DEFAULT 'light'", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column "mode" already exists.');
      } else {
        console.error('Error adding "mode" column:', err.message);
      }
    } else {
      console.log('Successfully added "mode" column.');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database migration complete.');
  }
});
