import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-utils"
import db from "@/lib/db"
import { logActivity } from "@/lib/activity"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdmin(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { isActive } = await request.json()
    const { id } = await params

    const isActiveValue = typeof isActive === "boolean" ? isActive : !!isActive;

    await db.execute(
      "UPDATE users SET isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [isActiveValue, id]
    )

    // Get user name for better logging
    const targetUser = await db.getOne("SELECT name FROM users WHERE id = ?", [id]);
    const targetName = targetUser?.name || "Unknown User";

    await logActivity({
      action: "USER_STATUS_UPDATED",
      entityId: id,
      entityType: "USER",
      userId: auth.user!.id,
      userName: auth.user!.name,
      details: { 
        updatedUserId: id, 
        name: targetName,
        isActive: !!isActiveValue 
      }
    });

    return NextResponse.json(
      { message: "User status updated successfully", isActive },
      { status: 200 }
    )
  } catch (error) {
    console.error("Update user status error:", error)
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    )
  }
}
