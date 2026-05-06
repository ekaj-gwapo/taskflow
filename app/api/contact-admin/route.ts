import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { notifyMasterAdminFromCreator } from "@/lib/notify"
import db from "@/lib/db"

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { role, name, email, orgId } = auth.user
  if (role.toLowerCase() !== "creator") {
    return NextResponse.json({ error: "Only Creators can contact Master Admins" }, { status: 403 })
  }

  try {
    const { message } = await request.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Get organization name
    let organizationName = "Unknown Organization"
    if (orgId) {
      const org = await db.getOne('SELECT name FROM organizations WHERE id = ?', [orgId])
      if (org) organizationName = org.name
    }

    // Save to support_requests table
    await db.execute(
      'INSERT INTO support_requests (creator_id, message) VALUES (?, ?)',
      [auth.user.id, message]
    )

    // Send notifications
    await notifyMasterAdminFromCreator({
      creatorName: name,
      creatorEmail: email,
      organizationName,
      message,
    })

    // Log the activity using the shared helper
    const { logActivity } = await import("@/lib/activity")
    await logActivity({
      action: "SUPPORT_REQUEST_SENT",
      entityId: auth.user.id,
      entityType: "SUPPORT_REQUEST",
      userId: auth.user.id,
      userName: name,
      details: { message: message.substring(0, 100) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("API contact-admin error:", error)
    return NextResponse.json({ error: "Failed to send message", details: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const requests = await db.query(`
      SELECT sr.*, u.name as replied_by_name
      FROM support_requests sr
      LEFT JOIN users u ON sr.replied_by = u.id
      WHERE sr.creator_id = ?
      ORDER BY sr.created_at DESC
    `, [auth.user.id])

    return NextResponse.json(requests.rows)
  } catch (error: any) {
    console.error("API get contact-admin error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
