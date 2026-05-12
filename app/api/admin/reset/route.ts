import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = auth.user!;
    if (user.role !== "master_admin") {
      return NextResponse.json({ error: "Unauthorized. Master Admin only." }, { status: 403 });
    }

    const { confirmText } = await request.json();
    if (confirmText !== "RESET_ALL_DATA") {
      return NextResponse.json({ error: "Invalid confirmation text." }, { status: 400 });
    }

    console.log("SYSTEM RESET INITIATED BY MASTER ADMIN:", user.email);

    // 1. Delete dependent task data
    await db.execute("DELETE FROM task_assignments");
    await db.execute("DELETE FROM step_notes");
    await db.execute("DELETE FROM action_steps");
    await db.execute("DELETE FROM progress_notes");
    await db.execute("DELETE FROM task_comments");
    await db.execute("DELETE FROM extension_requests");
    
    // 2. Delete tasks
    await db.execute("DELETE FROM tasks");
    
    // 3. Delete logs and notifications
    await db.execute("DELETE FROM activity_logs");
    await db.execute("DELETE FROM notifications");
    await db.execute("DELETE FROM audit_log");
    await db.execute("DELETE FROM support_requests");
    
    // 4. Delete promo codes
    await db.execute("DELETE FROM promo_codes");
    
    // 5. Delete users (EXCEPT the current master admin)
    // We keep the master admin so they stay logged in and the system is still accessible
    await db.execute("DELETE FROM users WHERE id != ?", [user.id]);
    
    // 6. Delete organizations
    await db.execute("DELETE FROM organizations");

    // Optional: Reset master admin's orgId since the organization was deleted
    await db.execute("UPDATE users SET orgid = NULL WHERE id = ?", [user.id]);

    console.log("SYSTEM RESET COMPLETED SUCCESSFULLY");

    return NextResponse.json({ 
      message: "System has been reset successfully. All data except your account has been cleared.",
      status: "success" 
    });
  } catch (error: any) {
    console.error("SYSTEM RESET ERROR:", error);
    return NextResponse.json({ error: "Failed to reset system", details: error.message }, { status: 500 });
  }
}
