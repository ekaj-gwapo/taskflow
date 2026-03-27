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
  console.log('Adding delegatedById column to tasks table...');
  db.run(`
    ALTER TABLE tasks ADD COLUMN delegatedById TEXT REFERENCES users(id);
  `, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column delegatedById already exists. Skipping.');
      } else {
        console.error('Error altering table:', err.message);
        process.exit(1);
      }
    } else {
      console.log('Successfully added delegatedById column.');
    }
    db.close();
  });
});
