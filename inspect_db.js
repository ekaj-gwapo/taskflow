const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

// Promisify sqlite3 methods
const dbAll = promisify(db.all.bind(db));

async function inspect() {
  try {
    const tasks = await dbAll('SELECT id, title, status, assigneeId FROM tasks');
    const users = await dbAll('SELECT id, name, email, role FROM users');

    const result = {
      tasks,
      users
    };

    fs.writeFileSync('db_inspect_result.json', JSON.stringify(result, null, 2));
    console.log('Results written to db_inspect_result.json');
  } catch (error) {
    console.error('Error inspecting database:', error);
  } finally {
    db.close();
  }
}

inspect();
