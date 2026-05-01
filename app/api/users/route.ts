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
        SELECT u.id, u.name, u.email, u.phone, u.location, u.jobtitle AS "jobTitle", u.role, u.avatarUrl as avatar, u.isActive, u.createdAt, u.orgid AS "orgId", o.name as "organizationName"
        FROM users u
        LEFT JOIN organizations o ON u.orgid = o.id
        ORDER BY u.createdAt DESC
      `);
    } else {
      const orgId = auth.user?.orgId;
      if (!orgId) {
        return NextResponse.json({ users: [] });
      }
      users = await db.getAll(`
        SELECT id, name, email, phone, location, jobtitle AS "jobTitle", role, avatarUrl as avatar, isActive, createdAt 
        FROM users
        WHERE orgid = $1
        ORDER BY createdAt DESC
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
