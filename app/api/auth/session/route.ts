import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const userId = auth.user?.id;

  try {
    // Fetch latest user and organization plan data
    const user = await db.getOne(`
      SELECT 
        u.id, u.name, u.email, u.username, u.role, u.phone, u.location, u.jobtitle AS "jobTitle", 
        u.avatarUrl as avatar, u.theme, u.mode, u.orgid AS "orgId", 
        u.createdAt as "createdAt", u.updatedAt as "updatedAt",
        u."emailVerified", u."notifyOnAssign", u."notifyOnDeadline", 
        u."notifyOnDiscussion", u."notifyOnExtension", u.isActive as "isActive",
        o.name as organizationName, 
        o.logo_url as organizationLogo, 
        o.plan, 
        o.subscription_status as subscriptionStatus
      FROM users u
      JOIN organizations o ON u.orgid = o.id
      WHERE u.id = ?
    `, [userId]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove sensitive data
    const { password, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("Session refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
