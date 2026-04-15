const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

const dbAll = promisify(db.all.bind(db));

async function checkSchema() {
  try {
    const stepNotesSchema = await dbAll("PRAGMA table_info(step_notes)");
    console.log('Step Notes Schema:', JSON.stringify(stepNotesSchema, null, 2));
    
    const progressNotesSchema = await dbAll("PRAGMA table_info(progress_notes)");
    console.log('Progress Notes Schema:', JSON.stringify(progressNotesSchema, null, 2));
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    db.close();
  }
}

checkSchema();
