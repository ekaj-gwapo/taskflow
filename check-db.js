const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('local.db');

db.all("SELECT id, name, email, role FROM users", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
