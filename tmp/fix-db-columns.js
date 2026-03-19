const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./local.db');

const addColumn = (colName) => {
  return new Promise((resolve) => {
    db.exec(`ALTER TABLE users ADD COLUMN ${colName} TEXT;`, (err) => {
      if (err) {
        if (err.message.includes('duplicate column')) {
          console.log(`Column ${colName} already exists`);
        } else {
          console.error(`Error adding ${colName}:`, err.message);
        }
      } else {
        console.log(`Success adding ${colName} column`);
      }
      resolve();
    });
  });
};

async function run() {
  await addColumn('phone');
  await addColumn('location');
  await addColumn('avatarUrl');
  db.close();
}
run();
