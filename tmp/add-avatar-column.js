const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./local.db');
db.exec('ALTER TABLE users ADD COLUMN avatarUrl TEXT;', (err) => {
  if (err) {
    if (err.message.includes('duplicate column')) {
      console.log("Column already exists");
    } else {
      console.error(err);
    }
  } else {
    console.log("Success adding avatarUrl column");
  }
});
