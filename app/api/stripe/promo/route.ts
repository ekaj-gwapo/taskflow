import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import db from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const auth = requireAuth(request);
    
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const decoded = auth.user!;
    if (decoded.role !== "creator" && decoded.role !== "head_admin") {
      return NextResponse.json({ error: "Only organization leads can redeem promo codes." }, { status: 403 });
    }

    // Find code in DB
    const promo = await db.getOne(`
      SELECT * FROM promo_codes 
      WHERE code = ? AND is_used = FALSE
    `, [code.toUpperCase()]);

    if (!promo) {
      return NextResponse.json({ error: "Invalid, expired, or already used promo code." }, { status: 400 });
    }

    const orgId = decoded.orgId;
    if (!orgId) {
      return NextResponse.json({ error: "Organization ID not found in session." }, { status: 400 });
    }
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + promo.days);

    // Update the organization
    await db.execute(`
      UPDATE organizations 
      SET plan = ?, 
          subscription_status = 'TRIAL',
          trial_ends_at = ?,
          updatedat = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [promo.plan, trialEndsAt.toISOString(), orgId]);

    // Mark promo as used
    await db.execute(`
      UPDATE promo_codes
      SET is_used = TRUE,
          used_by_org_id = ?
      WHERE id = ?
    `, [orgId, promo.id]);

    // Log the activity
    await logActivity({
      action: "PROMO_CODE_REDEEMED",
      entityId: orgId,
      entityType: "ORGANIZATION",
      userId: decoded.id,
      userName: decoded.name,
      details: { code: code.toUpperCase(), plan: promo.plan, days: promo.days }
    });

    return NextResponse.json({ 
      message: `Successfully redeemed! Your organization is now on the ${promo.plan} plan for ${promo.days} days.`,
      plan: promo.plan,
      trialEndsAt: trialEndsAt.toISOString()
    });

  } catch (error: any) {
    console.error("PROMO REDEEM ERROR:", error);
    return NextResponse.json({ error: "Failed to redeem code", details: error.message }, { status: 500 });
  }
}
