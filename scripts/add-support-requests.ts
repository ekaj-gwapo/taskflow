import db from "../lib/db";

async function migrate() {
  console.log("Creating support_requests table...");
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS support_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        reply_message TEXT,
        replied_by UUID REFERENCES users(id),
        replied_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table support_requests created successfully.");
  } catch (error) {
    console.error("Error creating table:", error);
    process.exit(1);
  }
}

migrate();
