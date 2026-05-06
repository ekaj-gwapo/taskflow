import { NextRequest, NextResponse } from "next/server"
import { requireMasterAdmin } from "@/lib/auth-utils"
import db from "@/lib/db"
import { sendEmail } from "@/lib/email" // Wait, does email.ts export sendEmail? Yes, but it's not exported.
// I should check email.ts again.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireMasterAdmin(request)
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { message } = await request.json()
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Reply message is required" }, { status: 400 })
    }

    // Get the request and creator email

    // Get the request and creator email
    const supportRequest = await db.getOne(`
      SELECT sr.*, u.email as creator_email, u.name as creator_name
      FROM support_requests sr
      JOIN users u ON sr.creator_id = u.id
      WHERE sr.id = ?
    `, [id])

    if (!supportRequest) {
      return NextResponse.json({ error: "Support request not found" }, { status: 404 })
    }

    // Update the request
    await db.execute(`
      UPDATE support_requests 
      SET status = 'REPLIED', 
          reply_message = ?, 
          replied_by = ?, 
          replied_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [message, auth.user.id, id])

    // Send email to creator
    const { sendSupportReplyEmail } = await import("@/lib/email")
    await sendSupportReplyEmail({
      to: supportRequest.creator_email,
      recipientName: supportRequest.creator_name,
      originalMessage: supportRequest.message,
      replyMessage: message,
    }).catch(e => console.error("Failed to send support reply email:", e))

    // Log activity
    const { logActivity } = await import("@/lib/activity")
    await logActivity({
      action: "SUPPORT_REQUEST_REPLIED",
      entityId: id,
      entityType: "SUPPORT_REQUEST",
      userId: auth.user.id,
      userName: auth.user.name,
      details: { reply: message.substring(0, 100) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("API reply support-request error:", error)
    return NextResponse.json({ error: "Failed to send reply", details: error.message }, { status: 500 })
  }
}
