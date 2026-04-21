const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_URL || 'local.db');
const db = new sqlite3.Database(dbPath);

console.log('📦 Running migration: add extension_requests table...');
console.log('   Database:', dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS extension_requests (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      requestedById TEXT NOT NULL,
      requestedByName TEXT NOT NULL,
      currentDueDate TEXT NOT NULL,
      proposedDueDate TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      reviewedById TEXT,
      reviewedByName TEXT,
      reviewerRemark TEXT,
      reviewedAt TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (taskId) REFERENCES tasks(id),
      FOREIGN KEY (requestedById) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Failed to create extension_requests table:', err.message);
    } else {
      console.log('✅ extension_requests table created successfully');
    }
  });

  // Create index for faster lookups by taskId
  db.run(`CREATE INDEX IF NOT EXISTS idx_extension_requests_taskId ON extension_requests(taskId)`, (err) => {
    if (err) {
      console.error('❌ Failed to create index:', err.message);
    } else {
      console.log('✅ Index on taskId created');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('❌ Error closing database:', err.message);
  } else {
    console.log('🎉 Migration complete!');
  }
});
