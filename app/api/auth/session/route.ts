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
        u.*, 
        o.name as organizationName, 
        o.logo as organizationLogo, 
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
