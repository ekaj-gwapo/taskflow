/**
 * Run once: adds email notification columns to the users table
 * Usage: npx tsx scripts/add-email-columns.ts
 */
import { config } from "dotenv"
config({ path: ".env" })
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
})

async function execute(sql: string) {
  try {
    const result = await pool.query(sql);
    return { changes: result.rowCount };
  } catch (error) {
    throw error;
  }
}

async function migrate() {
  console.log("Running email columns migration...")

  const statements = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerifyToken" TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerifyExpiry" TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "notifyOnAssign" BOOLEAN DEFAULT TRUE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "notifyOnDeadline" BOOLEAN DEFAULT TRUE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "notifyOnDiscussion" BOOLEAN DEFAULT TRUE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "notifyOnExtension" BOOLEAN DEFAULT TRUE`,
  ]

  for (const sql of statements) {
    try {
      await execute(sql)
      console.log("✓", sql)
    } catch (err: any) {
      if (err.message?.includes("duplicate column") || err.message?.includes("already exists") || err.message?.includes("column already exists")) {
        console.log("⚠ Already exists, skipping:", sql)
      } else {
        throw err
      }
    }
  }

  console.log("Migration complete.")
  process.exit(0)
}

migrate().catch((err) => { console.error(err); process.exit(1) })
