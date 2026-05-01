import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-utils"
import db from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const isMasterAdmin = auth.user?.role?.toLowerCase() === "master_admin";
    
    let users;
    if (isMasterAdmin) {
      users = await db.getAll(`
        SELECT u.id, u.name, u.email, u.phone, u.location, u.jobtitle AS "jobTitle", u.role, u.avatarurl as avatar, u.isactive as "isActive", u.createdat as "createdAt", u.orgid AS "orgId", o.name as "organizationName"
        FROM users u
        LEFT JOIN organizations o ON u.orgid = o.id
        ORDER BY u.createdat DESC
      `);
    } else {
      const orgId = auth.user?.orgId;
      console.log(`FETCH USERS for orgId: ${orgId}, role: ${auth.user?.role}`);
      if (!orgId) {
        return NextResponse.json({ users: [] });
      }
      users = await db.getAll(`
        SELECT id, name, email, phone, location, jobtitle AS "jobTitle", role, avatarurl as avatar, isactive as "isActive", createdat as "createdAt" 
        FROM users
        WHERE orgid = ?
        ORDER BY createdat DESC
      `, [orgId]);
    }

    return NextResponse.json({ users }, { status: 200 })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
