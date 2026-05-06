import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Running migration from API...");
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
    return NextResponse.json({ success: true, message: "Table support_requests created or already exists" });
  } catch (error: any) {
    console.error("Migration from API failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
