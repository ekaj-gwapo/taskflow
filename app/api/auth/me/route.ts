import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth.error) {
       return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const userId = auth.user!.id;
    const user = await db.getOne(`
      SELECT u.id, u.name, u.email, u.role, u.phone, u.location, u.jobtitle AS "jobTitle", 
             u.avatarUrl as avatar, u.theme, u.mode, u.orgid AS "orgId", 
             u.createdAt as "createdAt", u.updatedAt as "updatedAt",
             o.name as "organizationName"
      FROM users u
      LEFT JOIN organizations o ON u.orgid = o.id
      WHERE u.id = ?
    `, [userId]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("ME ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch user context", details: error.message }, { status: 500 });
  }
}
