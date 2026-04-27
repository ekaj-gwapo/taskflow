import { db } from './lib/db';
import bcrypt from 'bcryptjs';

async function seed() {
  const email = 'super-admin@taskflow.com';
  const password = 'SuperAdmin123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('🚀 Seeding Super Admin to Supabase...');

  try {
    await db.execute(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Super Admin', email, hashedPassword, 'SUPERADMIN']);

    console.log('Successfully added SUPER ADMIN user:');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error: any) {
    console.error('❌ Error seeding super admin:', error.message);
  } finally {
    process.exit(0);
  }
}

seed();
