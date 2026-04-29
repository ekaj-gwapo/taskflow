import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"

export async function PATCH(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const {
      notifyOnAssign,
      notifyOnDeadline,
      notifyOnDiscussion,
      notifyOnExtension,
    } = await request.json()

    await db.execute(
      `UPDATE users SET
        "notifyOnAssign"    = COALESCE(?, "notifyOnAssign"),
        "notifyOnDeadline"  = COALESCE(?, "notifyOnDeadline"),
        "notifyOnDiscussion"= COALESCE(?, "notifyOnDiscussion"),
        "notifyOnExtension" = COALESCE(?, "notifyOnExtension"),
        updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        notifyOnAssign    ?? null,
        notifyOnDeadline  ?? null,
        notifyOnDiscussion?? null,
        notifyOnExtension ?? null,
        auth.user!.id,
      ]
    )

    const user = await db.getOne(
      `SELECT "notifyOnAssign", "notifyOnDeadline", "notifyOnDiscussion", "notifyOnExtension" FROM users WHERE id = ?`,
      [auth.user!.id]
    )

    return NextResponse.json({ message: "Notification preferences updated", preferences: user }, { status: 200 })
  } catch (error) {
    console.error("Update notification prefs error:", error)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}
