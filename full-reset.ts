import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);
const dbRun = promisify(db.run.bind(db));

async function reset() {
  console.log('--- Full Database Reset Started ---');

  try {
    // 1. Clear all data
    console.log('Clearing tables...');
    const tables = ['step_notes', 'progress_notes', 'action_steps', 'tasks', 'users'];
    for (const table of tables) {
      try {
        await dbRun(`DELETE FROM ${table}`);
        console.log(`  ✓ Cleared ${table}`);
      } catch (e: any) {
        console.warn(`  ! Could not clear ${table} (it might not exist): ${e.message}`);
      }
    }

    // 2. Re-seed Super Admin
    console.log('Seeding Super Admin...');
    const email = 'super-admin@taskflow.com';
    const password = 'SuperAdmin123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await dbRun(`
      INSERT INTO users (id, name, email, password, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [id, 'Super Admin', email, hashedPassword, 'SUPERADMIN']);

    console.log('\n--- Reset Successful ---');
    console.log('Login with:');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error: any) {
    console.error('Reset error:', error.message);
  } finally {
    db.close();
  }
}

reset();
