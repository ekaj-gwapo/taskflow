import { NextRequest, NextResponse } from "next/server";
import { requireMasterAdmin } from "@/lib/auth-utils";
import db from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const auth = requireMasterAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { orgId } = params;

    // 1. Get Organization basic info
    const organization = await db.getOne('SELECT * FROM organizations WHERE id = ?', [orgId]);
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // 2. Get Users in this organization
    const users = await db.getAll('SELECT id, name, email, role, "emailVerified" FROM users WHERE orgid = ? ORDER BY role', [orgId]);

    // 3. Get Tasks for this organization
    const tasks = await db.getAll(`
      SELECT t.*, u.name as "assigneeName"
      FROM tasks t
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN users u ON ta.user_id = u.id
      WHERE t.orgid = ?
      ORDER BY t.createdat DESC
    `, [orgId]);

    return NextResponse.json({
      organization,
      users,
      tasks
    });

  } catch (error: any) {
    console.error("MASTER ORG DETAILS ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch organization details" }, { status: 500 });
  }
}
