const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

const dbRun = promisify(db.run.bind(db));

async function migrate() {
  try {
    console.log('Starting migration to add attachment columns...');

    // Progress Notes
    await dbRun('ALTER TABLE progress_notes ADD COLUMN attachmentUrl TEXT').catch(err => {
      if (!err.message.includes('duplicate column name')) throw err;
      console.log('attachmentUrl already exists in progress_notes');
    });
    await dbRun('ALTER TABLE progress_notes ADD COLUMN attachmentName TEXT').catch(err => {
      if (!err.message.includes('duplicate column name')) throw err;
      console.log('attachmentName already exists in progress_notes');
    });
    await dbRun('ALTER TABLE progress_notes ADD COLUMN attachmentType TEXT').catch(err => {
      if (!err.message.includes('duplicate column name')) throw err;
      console.log('attachmentType already exists in progress_notes');
    });

    // Step Notes
    await dbRun('ALTER TABLE step_notes ADD COLUMN attachmentUrl TEXT').catch(err => {
      if (!err.message.includes('duplicate column name')) throw err;
      console.log('attachmentUrl already exists in step_notes');
    });
    await dbRun('ALTER TABLE step_notes ADD COLUMN attachmentName TEXT').catch(err => {
      if (!err.message.includes('duplicate column name')) throw err;
      console.log('attachmentName already exists in step_notes');
    });
    await dbRun('ALTER TABLE step_notes ADD COLUMN attachmentType TEXT').catch(err => {
      if (!err.message.includes('duplicate column name')) throw err;
      console.log('attachmentType already exists in step_notes');
    });

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrate();
