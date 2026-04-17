import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

const dbRun = promisify(db.run.bind(db));

async function createActivityLogsTable() {
  console.log('--- Creating activity_logs table ---');

  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        entityId TEXT NOT NULL,
        entityType TEXT NOT NULL,
        userId TEXT NOT NULL,
        userName TEXT NOT NULL,
        details TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Successfully created activity_logs table.');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    db.close();
  }
}

createActivityLogsTable();
