import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

// Promisify sqlite3 methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

async function verify() {
  console.log('--- Verification Started ---');

  // Initialize schema
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'EMPLOYEE',
      phone TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'MEDIUM',
      status TEXT DEFAULT 'TODO',
      dueDate DATETIME,
      assigneeId TEXT,
      createdById TEXT,
      delegatedById TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigneeId) REFERENCES users(id),
      FOREIGN KEY (createdById) REFERENCES users(id),
      FOREIGN KEY (delegatedById) REFERENCES users(id)
    );
  `);

  // 1. Check tables
  const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables in database:', tables.map((t: any) => t.name).join(', '));

  // 2. Create a test admin user
  const adminId = uuidv4();
  const hashedPassword = await bcrypt.hash('admin123', 10);

  try {
    await dbRun(`
      INSERT INTO users (id, name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `, [adminId, 'Admin User', 'admin@example.com', hashedPassword, 'ADMIN']);
    console.log('Test admin user created.');
  } catch (e: any) {
    console.log('Admin user might already exist:', e.message);
  }

  // 3. Verify user exists
  const user: any = await dbGet("SELECT * FROM users WHERE email = ?", ['admin@example.com']);
  if (user) {
    console.log('Successfully fetched user:', user.email, 'Role:', user.role);
  } else {
    console.error('Failed to fetch user!');
    process.exit(1);
  }

  // 4. Test Task Creation
  const taskId = uuidv4();
  await dbRun(`
    INSERT INTO tasks (id, title, description, priority, assigneeId, createdById, dueDate)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [taskId, 'Test Task', 'This is a test task', 'HIGH', adminId, adminId, new Date().toISOString()]);
  console.log('Test task created.');

  // 5. Verify Task
  const task: any = await dbGet("SELECT * FROM tasks WHERE id = ?", [taskId]);
  if (task) {
    console.log('Successfully fetched task:', task.title);
  } else {
    console.error('Failed to fetch task!');
    process.exit(1);
  }

  console.log('--- Verification Successful ---');
  db.close();
}

verify().catch(console.error);
