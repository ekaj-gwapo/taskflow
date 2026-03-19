const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./local.db');

db.exec(`ALTER TABLE users ADD COLUMN isActive INTEGER DEFAULT 1;`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column')) {
      console.log('Column isActive already exists');
    } else {
      console.error('Error adding isActive:', err.message);
    }
  } else {
    console.log('Success adding isActive column');
  }
  db.close();
});
