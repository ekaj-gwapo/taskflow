import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);
const dbRun = promisify(db.run.bind(db));

async function updateDb() {
  console.log('Running database migration for isActed...');
  try {
    // Check if column exists by trying to add it
    await dbRun(`ALTER TABLE action_steps ADD COLUMN isActed BOOLEAN DEFAULT 0;`);
    console.log('✅ Successfully added isActed column to action_steps table.');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('✅ isActed column already exists.');
    } else {
      console.error('Error updating database schema:', error.message);
    }
  } finally {
    db.close();
  }
}

updateDb();
