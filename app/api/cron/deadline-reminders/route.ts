import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { sendDeadlineReminderEmail } from "@/lib/email"

// Vercel Cron: runs every day at 8AM PH time (00:00 UTC)
// Add to vercel.json:
// { "crons": [{ "path": "/api/cron/deadline-reminders", "schedule": "0 0 * * *" }] }

export async function GET(request: NextRequest) {
  // Protect cron route from public access
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Find tasks due in the next 24 hours that are not yet completed
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStart = new Date(tomorrow)
    tomorrowStart.setHours(0, 0, 0, 0)
    const tomorrowEnd = new Date(tomorrow)
    tomorrowEnd.setHours(23, 59, 59, 999)

    const tasks = await db.getAll(`
      SELECT 
        t.id, t.title, t.dueDate, t.status,
        u.id as userId, u.name as userName, u.email as userEmail,
        u."emailVerified", u."notifyOnDeadline"
      FROM tasks t
      JOIN users u ON (u.id = t.assigneeId OR u.id IN (
        SELECT userId FROM task_assignees WHERE taskId = t.id
      ))
      WHERE t.status NOT IN ('completed')
        AND t.dueDate >= ? AND t.dueDate <= ?
        AND u."emailVerified" = TRUE
        AND u."notifyOnDeadline" = TRUE
        AND u.email IS NOT NULL
    `, [tomorrowStart.toISOString(), tomorrowEnd.toISOString()])

    let sent = 0
    let failed = 0

    for (const row of tasks) {
      try {
        await sendDeadlineReminderEmail({
          to: row.userEmail,
          recipientName: row.userName,
          taskTitle: row.title,
          taskId: row.id,
          dueDate: new Date(row.dueDate).toLocaleDateString("en-PH", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
          }),
          status: row.status,
        })
        sent++
      } catch (err) {
        console.error(`Failed to send deadline reminder to ${row.userEmail}:`, err)
        failed++
      }
    }

    return NextResponse.json({ ok: true, sent, failed, total: tasks.length })
  } catch (error) {
    console.error("Cron deadline reminders error:", error)
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
  }
}
