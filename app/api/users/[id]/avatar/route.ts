import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"
import { logActivity } from "@/lib/activity"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params

    if (auth.user?.id !== id && auth.user?.role?.toUpperCase() !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { avatarBase64 } = await request.json()

    if (!avatarBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    await db.execute("UPDATE users SET avatarUrl = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?", [
      avatarBase64,
      id,
    ])

    await logActivity({
      action: "AVATAR_UPDATED",
      entityId: id,
      entityType: "USER",
      userId: auth.user!.id,
      userName: auth.user!.name,
      details: { updatedUserId: id }
    });

    const updatedUser = await db.getOne("SELECT id, name, email, role, phone, location, avatarUrl as avatar, createdAt, updatedAt FROM users WHERE id = ?", [id])

    return NextResponse.json({ message: "Avatar updated", user: updatedUser })
  } catch (error) {
    console.error("Avatar update error:", error)
    return NextResponse.json(
      { error: "Failed to update avatar" },
      { status: 500 }
    )
  }
}
