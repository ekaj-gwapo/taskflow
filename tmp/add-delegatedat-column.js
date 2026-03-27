const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("ALTER TABLE tasks ADD COLUMN delegatedAt TEXT", (err) => {
    if (err) {
      if (err.message.includes("duplicate column name")) {
        console.log("Column delegatedAt already exists.");
      } else {
        console.error("Error adding column:", err.message);
      }
    } else {
      console.log("Column delegatedAt added successfully.");
    }
  });
});

db.close();
