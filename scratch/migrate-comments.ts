import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

const dbRun = promisify(db.run.bind(db));

async function createCommentsTable() {
  console.log('--- Creating task_comments table ---');

  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        taskId TEXT NOT NULL,
        authorId TEXT,
        authorName TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
      );
    `);
    
    // Also add it to schema.sql if it exists for consistency
    console.log('Successfully created task_comments table.');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    db.close();
  }
}

createCommentsTable();
