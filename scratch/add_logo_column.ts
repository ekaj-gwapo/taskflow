import 'dotenv/config';
import { db } from './lib/db';

async function run() {
  try {
    console.log("Connecting to database...");
    await db.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT');
    console.log('Column logo_url added successfully to organizations table');
    process.exit(0);
  } catch (e) {
    console.error('Failed to add column:', e);
    process.exit(1);
  }
}

run();
