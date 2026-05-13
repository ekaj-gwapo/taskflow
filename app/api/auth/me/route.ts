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
      SELECT u.id, u.name, u.email, u.username, u.role, u.phone, u.location, u.jobtitle AS "jobTitle", 
             u.avatarUrl as avatar, u.theme, u.mode, u.orgid AS "orgId", 
             u.createdAt as "createdAt", u.updatedAt as "updatedAt",
             u."emailVerified", u."notifyOnAssign", u."notifyOnDeadline", 
             u."notifyOnDiscussion", u."notifyOnExtension", u.isActive as "isActive",
             o.name as "organizationName", o.status as "orgStatus", o.logo_url as "organizationLogo", 
             o.trial_ends_at as "trialEndsAt", o.subscription_status as "subscriptionStatus",
             o.plan as "plan"
      FROM users u
      LEFT JOIN organizations o ON u.orgid = o.id
      WHERE u.id = ?
    `, [userId]);
    
    if (user && user.orgId) {
       const { processTrialCheck } = await import("@/lib/trial");
       // Run trial check asynchronously (don't block the request)
       processTrialCheck(user.orgId).catch(e => console.error("Trial check failed:", e));
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.orgStatus === 'SUSPENDED' && user.role !== 'master_admin') {
       return NextResponse.json({ error: "ORGANIZATION_SUSPENDED", user }, { status: 403 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("ME ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch user context", details: error.message }, { status: 500 });
  }
}
