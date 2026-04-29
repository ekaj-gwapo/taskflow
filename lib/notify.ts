/**
 * Shared helper to send email notifications.
 * Always silently fails — never blocks the main request.
 */
import db from "@/lib/db"
import {
  sendTaskAssignedEmail,
  sendExtensionReviewedEmail,
  sendNewDiscussionEmail,
  sendTaskCompletedEmail,
} from "@/lib/email"

type Recipient = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  notifyOnAssign: boolean
  notifyOnDeadline: boolean
  notifyOnDiscussion: boolean
  notifyOnExtension: boolean
}

async function getVerifiedUser(userId: string): Promise<Recipient | null> {
  return db.getOne(
    `SELECT id, name, email, "emailVerified", "notifyOnAssign", "notifyOnDeadline", "notifyOnDiscussion", "notifyOnExtension"
     FROM users WHERE id = ? AND "emailVerified" = TRUE AND email IS NOT NULL`,
    [userId]
  )
}

async function getVerifiedUsers(userIds: string[]): Promise<Recipient[]> {
  if (!userIds.length) return []
  const placeholders = userIds.map(() => "?").join(",")
  return db.getAll(
    `SELECT id, name, email, "emailVerified", "notifyOnAssign", "notifyOnDeadline", "notifyOnDiscussion", "notifyOnExtension"
     FROM users WHERE id IN (${placeholders}) AND "emailVerified" = TRUE AND email IS NOT NULL`,
    userIds
  )
}

// ─── Notify: Task Assigned ───────────────────────────────────────────────────

export async function notifyTaskAssigned(opts: {
  assigneeIds: string[]
  taskTitle: string
  taskId: string
  priority: string
  dueDate: string
  assignedByName: string
}) {
  try {
    const recipients = await getVerifiedUsers(opts.assigneeIds)
    for (const r of recipients) {
      if (!r.notifyOnAssign) continue
      sendTaskAssignedEmail({
        to: r.email,
        recipientName: r.name,
        taskTitle: opts.taskTitle,
        taskId: opts.taskId,
        priority: opts.priority,
        dueDate: new Date(opts.dueDate).toLocaleDateString("en-PH", {
          weekday: "short", year: "numeric", month: "short", day: "numeric"
        }),
        assignedBy: opts.assignedByName,
      }).catch((e) => console.error("notifyTaskAssigned email failed:", e))
    }
  } catch (e) {
    console.error("notifyTaskAssigned error:", e)
  }
}

// ─── Notify: Extension Reviewed ─────────────────────────────────────────────

export async function notifyExtensionReviewed(opts: {
  requesterId: string
  taskTitle: string
  approved: boolean
  remark?: string
}) {
  try {
    const r = await getVerifiedUser(opts.requesterId)
    if (!r || !r.notifyOnExtension) return
    sendExtensionReviewedEmail({
      to: r.email,
      recipientName: r.name,
      taskTitle: opts.taskTitle,
      approved: opts.approved,
      remark: opts.remark,
    }).catch((e) => console.error("notifyExtensionReviewed email failed:", e))
  } catch (e) {
    console.error("notifyExtensionReviewed error:", e)
  }
}

// ─── Notify: New Discussion Message ─────────────────────────────────────────

export async function notifyNewDiscussion(opts: {
  participantIds: string[]   // all task participants EXCEPT the comment author
  authorId: string
  authorName: string
  taskTitle: string
  messageContent: string
}) {
  try {
    const otherIds = opts.participantIds.filter((id) => id !== opts.authorId)
    const recipients = await getVerifiedUsers(otherIds)
    for (const r of recipients) {
      if (!r.notifyOnDiscussion) continue
      sendNewDiscussionEmail({
        to: r.email,
        recipientName: r.name,
        taskTitle: opts.taskTitle,
        authorName: opts.authorName,
        messagePreview: opts.messageContent,
      }).catch((e) => console.error("notifyNewDiscussion email failed:", e))
    }
  } catch (e) {
    console.error("notifyNewDiscussion error:", e)
  }
}

// ─── Notify: Task Completed (to admin/creator) ───────────────────────────────

export async function notifyTaskCompleted(opts: {
  creatorId: string
  completedByName: string
  taskTitle: string
}) {
  try {
    const r = await getVerifiedUser(opts.creatorId)
    if (!r || !r.notifyOnAssign) return  // reuse notifyOnAssign pref for "task events"
    sendTaskCompletedEmail({
      to: r.email,
      recipientName: r.name,
      taskTitle: opts.taskTitle,
      completedBy: opts.completedByName,
    }).catch((e) => console.error("notifyTaskCompleted email failed:", e))
  } catch (e) {
    console.error("notifyTaskCompleted error:", e)
  }
}
