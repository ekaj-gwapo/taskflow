import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireMasterAdmin } from "@/lib/auth-utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = requireMasterAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { orgId } = await params;

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // Unlink users from this organization
    await db.execute('UPDATE users SET orgid = NULL, role = \'employee\' WHERE orgid = ?', [orgId]);

    // If there are other tables like tasks or activity_logs, they might need to be cleared 
    // or we can rely on CASCADE if it's set up. We'll attempt to delete the organization directly.
    try {
      await db.execute('DELETE FROM activity_logs WHERE "entityType" = \'ORGANIZATION\' AND "entityId" = ?', [orgId]);
    } catch (e) {
      // ignore
    }

    // Try deleting the organization itself
    const result = await db.execute('DELETE FROM organizations WHERE id = ?', [orgId]);

    if (result.changes === 0) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Organization deleted successfully" });
  } catch (error: any) {
    console.error("DELETE ORG ERROR:", error);
    
    // Check for foreign key violations if CASCADE is missing
    if (error.message?.includes('foreign key constraint')) {
       return NextResponse.json({ 
         error: "Cannot delete organization because it has linked tasks or data. You may need to clear the organization's data first." 
       }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to delete organization", details: error.message }, { status: 500 });
  }
}
