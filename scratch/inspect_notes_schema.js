const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

const dbAll = promisify(db.all.bind(db));

async function inspectSchema() {
  try {
    const progressNotesSchema = await dbAll("PRAGMA table_info(progress_notes)");
    const stepNotesSchema = await dbAll("PRAGMA table_info(step_notes)");

    console.log('Progress Notes Schema:', JSON.stringify(progressNotesSchema, null, 2));
    console.log('Step Notes Schema:', JSON.stringify(stepNotesSchema, null, 2));
  } catch (error) {
    console.error('Error inspecting schema:', error);
  } finally {
    db.close();
  }
}

inspectSchema();
