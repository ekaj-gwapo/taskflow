import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-utils"
import db from "@/lib/db"
import { logActivity } from "@/lib/activity"
import bcrypt from "bcryptjs"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdmin(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { newPassword } = await request.json()
    const { id } = await params

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await db.execute(
      "UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [hashedPassword, id]
    )

    // Get user name for better logging
    const targetUser = await db.getOne("SELECT name FROM users WHERE id = ?", [id]);
    const targetName = targetUser?.name || "Unknown User";

    await logActivity({
      action: "PASSWORD_RESET",
      entityId: id,
      entityType: "USER",
      userId: auth.user!.id,
      userName: auth.user!.name,
      details: { 
        resetUserId: id,
        name: targetName
      }
    });

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}
