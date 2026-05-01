import { NextRequest, NextResponse } from "next/server";
import { requireMasterAdmin } from "@/lib/auth-utils";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const auth = requireMasterAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get all organizations with owner info and user count
    const organizations = await db.getAll(`
      SELECT o.*, 
             u.name as "ownerName", 
             u.email as "ownerEmail",
             (SELECT COUNT(*) FROM users WHERE orgid = o.id) as "userCount"
      FROM organizations o
      LEFT JOIN users u ON u.orgid = o.id AND u.role = 'creator'
      ORDER BY o.createdat DESC
    `);

    return NextResponse.json({ organizations });

  } catch (error: any) {
    console.error("MASTER ORGS LIST ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
  }
}
