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

async function seedData() {
  console.log('--- Database Reset & Seeding Started ---');
  try {
    // 1. Clear all data
    console.log('Clearing tables...');
    const tables = ['task_assignments', 'step_notes', 'progress_notes', 'action_steps', 'tasks', 'users'];
    for (const table of tables) {
      try {
        await dbRun(`DELETE FROM ${table}`);
      } catch (e: any) {
        console.warn(`  ! Could not clear ${table} (it might not exist): ${e.message}`);
      }
    }

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Create Super Admin (SUPERADMIN)
    const superAdminId = uuidv4();
    await dbRun(`
      INSERT INTO users (id, name, email, password, role, phone, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [superAdminId, 'Super Admin', 'superadmin@example.com', hashedPassword, 'SUPERADMIN', '555-0000']);

    // Create Head Admin (HEAD_ADMIN)
    const headAdminId = uuidv4();
    await dbRun(`
      INSERT INTO users (id, name, email, password, role, phone, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [headAdminId, 'Head Admin', 'headadmin@example.com', hashedPassword, 'HEAD_ADMIN', '555-0001']);

    // Create 2nd Admin (ADMIN)
    const adminId = uuidv4();
    await dbRun(`
      INSERT INTO users (id, name, email, password, role, phone, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [adminId, 'Linmark G. Benlot', 'mark@gmail.com', hashedPassword, 'ADMIN', '555-0002']);

    // Create Regular Employee (EMPLOYEE)
    const employeeId = uuidv4();
    await dbRun(`
      INSERT INTO users (id, name, email, password, role, phone, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [employeeId, 'Regular Employee', 'employee@example.com', hashedPassword, 'EMPLOYEE', '555-0003']);

    console.log('✅ Successfully seeded sample data to start from zero:');
    console.log('');
    console.log('Super Admin (SUPERADMIN):');
    console.log('  Email: superadmin@example.com | Password: Password123!');
    console.log('');
    console.log('Head Admin (HEAD_ADMIN):');
    console.log('  Email: headadmin@example.com | Password: Password123!');
    console.log('');
    console.log('2nd Admin (ADMIN):');
    console.log('  Email: mark@gmail.com | Password: Password123!');
    console.log('');
    console.log('Regular Employee (EMPLOYEE):');
    console.log('  Email: employee@example.com | Password: Password123!');
    console.log('');
    
  } catch (error: any) {
    console.error('Error seeding data:', error.message);
  } finally {
    db.close();
  }
}

seedData();
