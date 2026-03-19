import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

// Promisify sqlite3 methods
const dbRun = promisify(db.run.bind(db));

async function cleanup() {
  console.log('--- Database Cleanup Started ---');

  try {
    // Delete all tasks and related data
    await dbRun("DELETE FROM step_notes");
    await dbRun("DELETE FROM progress_notes");
    await dbRun("DELETE FROM action_steps");
    await dbRun("DELETE FROM tasks");

    // Delete users that are NOT the admins we just created
    // We keep 'admin@taskflow.com' and 'super-admin@taskflow.com'
    await dbRun("DELETE FROM users WHERE email NOT IN (?, ?)", ['admin@taskflow.com', 'super-admin@taskflow.com']);

    console.log('Successfully cleared all tasks and non-admin users.');
  } catch (error: any) {
    console.error('Cleanup error:', error.message);
  } finally {
    db.close();
  }

  console.log('--- Cleanup Successful ---');
}

cleanup();
