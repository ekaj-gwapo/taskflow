import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// GET — Fetch notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const user = auth.user!
    const notifications = (await db.getAll(
      "SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50",
      [user.id]
    )).map((n: any) => ({
      ...n,
      isRead: n.isRead !== undefined ? n.isRead : (n.isread !== undefined ? n.isread : false),
      createdAt: n.createdAt || n.createdat
    }))

    return NextResponse.json({ notifications }, { status: 200 })
  } catch (error) {
    console.error("Fetch notifications error:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

// PUT — Mark all notifications as read or mark a specific one as read
export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const user = auth.user!
    const { id, taskId } = await request.json()

    if (id) {
      await db.execute(
        "UPDATE notifications SET isRead = true WHERE id = ? AND userId = ?",
        [id, user.id]
      )
    } else if (taskId) {
      // Mark all notifications for this task as read
      await db.execute(
        "UPDATE notifications SET isRead = true WHERE userId = ? AND link LIKE ?",
        [user.id, `%${taskId}%`]
      )
    } else {
      await db.execute(
        "UPDATE notifications SET isRead = true WHERE userId = ?",
        [user.id]
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Update notifications error:", error)
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    )
  }
}
