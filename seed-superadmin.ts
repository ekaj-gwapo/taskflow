import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new sqlite3.Database(dbPath);

// Promisify sqlite3 methods
const dbRun = promisify(db.run.bind(db));

async function seed() {
  const email = 'super-admin@taskflow.com';
  const password = 'SuperAdmin123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = uuidv4();

  try {
    await dbRun(`
      INSERT INTO users (id, name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `, [id, 'Super Admin', email, hashedPassword, 'SUPERADMIN']);

    console.log('Successfully added SUPER ADMIN user:');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.log('Super Admin user already exists.');
    } else {
      console.error('Error seeding super admin:', error.message);
    }
  } finally {
    db.close();
  }
}

seed();
