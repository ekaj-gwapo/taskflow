import { NextRequest, NextResponse } from "next/server";
import { requireMasterAdmin } from "@/lib/auth-utils";
import db from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = requireMasterAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { orgId } = await params;
    const { status } = await request.json();
    console.log(`UPDATE ORG STATUS: ${orgId} -> ${status}`);

    if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await db.query('UPDATE organizations SET status = ? WHERE id = ?', [status, orgId]);

    return NextResponse.json({ success: true, status });

  } catch (error: any) {
    console.error("MASTER ORG STATUS UPDATE ERROR:", error);
    return NextResponse.json({ error: "Failed to update organization status" }, { status: 500 });
  }
}
