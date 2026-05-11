import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import db from "@/lib/db";
import { logActivity } from "@/lib/activity";

// GET /api/master/promo - List all promo codes
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = auth.user!;
    if (user.role !== "superadmin" && user.role !== "master_admin") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const codes = await db.getAll(`
      SELECT p.*, o.name as org_name 
      FROM promo_codes p
      LEFT JOIN organizations o ON p.used_by_org_id = o.id
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json({ codes });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch promo codes", details: error.message }, { status: 500 });
  }
}

// POST /api/master/promo - Generate a new promo code
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = auth.user!;
    if (user.role !== "superadmin" && user.role !== "master_admin") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { plan, days, prefix } = await request.json();

    // Generate a clean, readable code: PREFIX-XXXX-YYYY
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${prefix || "TF"}-${randomPart}`;

    await db.execute(`
      INSERT INTO promo_codes (code, plan, days)
      VALUES (?, ?, ?)
    `, [code, plan, days]);

    await logActivity({
      action: "PROMO_CODE_GENERATED",
      entityId: "SYSTEM",
      entityType: "SYSTEM",
      userId: user.id,
      userName: user.name,
      details: { code, plan, days }
    });

    return NextResponse.json({ success: true, code });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to generate promo code", details: error.message }, { status: 500 });
  }
}

// DELETE /api/master/promo - Delete a code
export async function DELETE(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = auth.user!;
    if (user.role !== "superadmin" && user.role !== "master_admin") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { id } = await request.json();

    await db.execute(`DELETE FROM promo_codes WHERE id = ?`, [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete promo code", details: error.message }, { status: 500 });
  }
}
