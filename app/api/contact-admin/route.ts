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

    // Send notifications
    await notifyMasterAdminFromCreator({
      creatorName: name,
      creatorEmail: email,
      organizationName,
      message,
    })

    // Log the activity
    await db.execute(
      'INSERT INTO activity_logs (user_id, organization_id, action, details) VALUES (?, ?, ?, ?)',
      [auth.user.id, orgId, 'CONTACT_ADMIN', `Sent a message to Master Admin: ${message.substring(0, 50)}...`]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("API contact-admin error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
