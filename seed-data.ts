import { db } from './lib/db';
import bcrypt from 'bcryptjs';

async function seedData() {
  console.log('🚀 Supabase Database Reset & Seeding Started ---');
  try {
    // 1. Clear all data
    console.log('Clearing tables...');
    const tables = ['task_assignments', 'step_notes', 'progress_notes', 'action_steps', 'tasks', 'users'];
    for (const table of tables) {
      try {
        await db.execute(`TRUNCATE ${table} CASCADE`);
      } catch (e: any) {
        console.warn(`  ! Could not clear ${table}: ${e.message}`);
      }
    }

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Create Super Admin (SUPERADMIN)
    console.log('Seeding users...');
    await db.execute(`
      INSERT INTO users (name, email, password, role, phone)
      VALUES ($1, $2, $3, $4, $5)
    `, ['Super Admin', 'superadmin@example.com', hashedPassword, 'SUPERADMIN', '555-0000']);

    // Create Head Admin (HEAD_ADMIN)
    await db.execute(`
      INSERT INTO users (name, email, password, role, phone)
      VALUES ($1, $2, $3, $4, $5)
    `, ['Head Admin', 'headadmin@example.com', hashedPassword, 'HEAD_ADMIN', '555-0001']);

    // Create 2nd Admin (ADMIN)
    await db.execute(`
      INSERT INTO users (name, email, password, role, phone)
      VALUES ($1, $2, $3, $4, $5)
    `, ['Linmark G. Benlot', 'mark@gmail.com', hashedPassword, 'ADMIN', '555-0002']);

    // Create Regular Employee (EMPLOYEE)
    await db.execute(`
      INSERT INTO users (name, email, password, role, phone)
      VALUES ($1, $2, $3, $4, $5)
    `, ['Regular Employee', 'employee@example.com', hashedPassword, 'EMPLOYEE', '555-0003']);

    console.log('✅ Successfully seeded sample data to Supabase!');
    console.log('');
    console.log('Logins (Password: Password123!):');
    console.log(' - superadmin@example.com (SUPERADMIN)');
    console.log(' - headadmin@example.com (HEAD_ADMIN)');
    console.log(' - mark@gmail.com (ADMIN)');
    console.log(' - employee@example.com (EMPLOYEE)');
    
  } catch (error: any) {
    console.error('❌ Error seeding data:', error.message);
  } finally {
    process.exit(0);
  }
}

seedData();
