import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const activityCols = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'activity_logs'");
    const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    
    // Check if support_requests exists
    let supportRequestCols = [];
    try {
      const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'support_requests'");
      supportRequestCols = res.rows.map((r: any) => r.column_name);
    } catch (e) {}

    return NextResponse.json({
      activity_logs_columns: activityCols.rows.map((r: any) => r.column_name),
      tables: tables.rows.map((r: any) => r.table_name),
      support_requests_columns: supportRequestCols
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
