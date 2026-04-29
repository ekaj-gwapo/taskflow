import { Resend } from "resend"

// Use a fallback key to prevent build failures if the env var is missing
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_builds")

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://taskflow-olive-omega.vercel.app"
const FROM_EMAIL = process.env.EMAIL_FROM || "TaskFlow <onboarding@resend.dev>"

// ─── Email Templates ────────────────────────────────────────────────────────

function baseLayout(title: string, body: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; background:#f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width:560px; margin:32px auto; }
    .card { background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
    .header { background:#16a34a; padding:28px 32px; }
    .header h1 { margin:0; color:#ffffff; font-size:20px; font-weight:700; letter-spacing:-0.3px; }
    .header span { color:rgba(255,255,255,0.75); font-size:13px; }
    .body { padding:28px 32px; }
    .body p { margin:0 0 16px; color:#374151; font-size:14px; line-height:1.6; }
    .task-box { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:16px 20px; margin:16px 0; }
    .task-box .label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:#6b7280; margin-bottom:4px; }
    .task-box .value { font-size:14px; font-weight:600; color:#111827; }
    .badge { display:inline-block; padding:2px 10px; border-radius:99px; font-size:11px; font-weight:700; }
    .badge-high { background:#fee2e2; color:#dc2626; }
    .badge-medium { background:#fef3c7; color:#d97706; }
    .badge-low { background:#d1fae5; color:#065f46; }
    .btn { display:inline-block; margin:8px 0 0; padding:12px 28px; background:#16a34a; color:#ffffff !important; text-decoration:none; border-radius:10px; font-size:14px; font-weight:600; }
    .footer { padding:20px 32px; text-align:center; }
    .footer p { margin:0; color:#9ca3af; font-size:12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>TaskFlow</h1>
        <span>Task Management System</span>
      </div>
      <div class="body">${body}</div>
    </div>
    <div class="footer">
      <p>You're receiving this because you connected this email to TaskFlow.<br/>
      To stop receiving notifications, update your preferences in your profile.</p>
    </div>
  </div>
</body>
</html>`
}

// ─── Send Functions ──────────────────────────────────────────────────────────

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const verifyUrl = `${APP_URL}/api/users/verify-email?token=${token}`
  const html = baseLayout("Verify your TaskFlow email", `
    <p>Hi <strong>${name}</strong>,</p>
    <p>Click the button below to verify your email and start receiving TaskFlow notifications.</p>
    <a href="${verifyUrl}" class="btn">Verify Email →</a>
    <p style="margin-top:20px;font-size:12px;color:#6b7280;">This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
  `)

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Verify your TaskFlow email",
    html,
  })
}

export async function sendTaskAssignedEmail(opts: {
  to: string
  recipientName: string
  taskTitle: string
  taskId: string
  priority: string
  dueDate: string
  assignedBy: string
}) {
  const priorityClass = opts.priority?.toLowerCase() === "high" ? "badge-high"
    : opts.priority?.toLowerCase() === "medium" ? "badge-medium" : "badge-low"
  const taskUrl = `${APP_URL}/dashboard`
  const html = baseLayout(`New task assigned: ${opts.taskTitle}`, `
    <p>Hi <strong>${opts.recipientName}</strong>,</p>
    <p><strong>${opts.assignedBy}</strong> assigned you a new task.</p>
    <div class="task-box">
      <div class="label">Task</div>
      <div class="value">${opts.taskTitle}</div>
      <div style="margin-top:12px;display:flex;gap:16px;">
        <div><div class="label">Priority</div><span class="badge ${priorityClass}">${opts.priority}</span></div>
        <div><div class="label">Due Date</div><div class="value" style="font-size:13px;">${opts.dueDate}</div></div>
      </div>
    </div>
    <a href="${taskUrl}" class="btn">View Task →</a>
  `)

  return resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject: `New task assigned: "${opts.taskTitle}"`,
    html,
  })
}

export async function sendDeadlineReminderEmail(opts: {
  to: string
  recipientName: string
  taskTitle: string
  dueDate: string
  status: string
}) {
  const taskUrl = `${APP_URL}/dashboard`
  const html = baseLayout(`Task due tomorrow: ${opts.taskTitle}`, `
    <p>Hi <strong>${opts.recipientName}</strong>,</p>
    <p>This is a reminder that the following task is due <strong>tomorrow</strong>.</p>
    <div class="task-box">
      <div class="label">Task</div>
      <div class="value">${opts.taskTitle}</div>
      <div style="margin-top:12px;display:flex;gap:16px;">
        <div><div class="label">Status</div><div class="value" style="font-size:13px;">${opts.status}</div></div>
        <div><div class="label">Due</div><div class="value" style="font-size:13px;">${opts.dueDate}</div></div>
      </div>
    </div>
    <a href="${taskUrl}" class="btn">View Task →</a>
  `)

  return resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject: `⏰ Task due tomorrow: "${opts.taskTitle}"`,
    html,
  })
}

export async function sendExtensionReviewedEmail(opts: {
  to: string
  recipientName: string
  taskTitle: string
  approved: boolean
  remark?: string
}) {
  const taskUrl = `${APP_URL}/dashboard`
  const status = opts.approved ? "✅ Approved" : "❌ Rejected"
  const statusColor = opts.approved ? "#16a34a" : "#dc2626"
  const html = baseLayout(`Extension ${opts.approved ? "Approved" : "Rejected"}: ${opts.taskTitle}`, `
    <p>Hi <strong>${opts.recipientName}</strong>,</p>
    <p>Your extension request has been reviewed.</p>
    <div class="task-box">
      <div class="label">Task</div>
      <div class="value">${opts.taskTitle}</div>
      <div style="margin-top:12px;">
        <div class="label">Decision</div>
        <div class="value" style="color:${statusColor};">${status}</div>
      </div>
      ${opts.remark ? `<div style="margin-top:12px;"><div class="label">Reviewer Remark</div><div class="value" style="font-size:13px;font-weight:400;">${opts.remark}</div></div>` : ""}
    </div>
    <a href="${taskUrl}" class="btn">View Task →</a>
  `)

  return resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject: `Extension ${opts.approved ? "Approved" : "Rejected"}: "${opts.taskTitle}"`,
    html,
  })
}

export async function sendNewDiscussionEmail(opts: {
  to: string
  recipientName: string
  taskTitle: string
  authorName: string
  messagePreview: string
}) {
  const taskUrl = `${APP_URL}/dashboard`
  const html = baseLayout(`New message in "${opts.taskTitle}"`, `
    <p>Hi <strong>${opts.recipientName}</strong>,</p>
    <p><strong>${opts.authorName}</strong> posted a message in the discussion for <strong>"${opts.taskTitle}"</strong>.</p>
    <div class="task-box">
      <div class="label">Message</div>
      <div class="value" style="font-weight:400;font-style:italic;">"${opts.messagePreview.slice(0, 200)}${opts.messagePreview.length > 200 ? "..." : ""}"</div>
    </div>
    <a href="${taskUrl}" class="btn">View Discussion →</a>
  `)

  return resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject: `${opts.authorName} replied in "${opts.taskTitle}"`,
    html,
  })
}

export async function sendTaskCompletedEmail(opts: {
  to: string
  recipientName: string
  taskTitle: string
  completedBy: string
}) {
  const taskUrl = `${APP_URL}/dashboard`
  const html = baseLayout(`Task completed: ${opts.taskTitle}`, `
    <p>Hi <strong>${opts.recipientName}</strong>,</p>
    <p><strong>${opts.completedBy}</strong> marked a task as completed.</p>
    <div class="task-box">
      <div class="label">Task</div>
      <div class="value">${opts.taskTitle}</div>
      <div style="margin-top:12px;">
        <div class="label">Status</div>
        <div class="value" style="color:#16a34a;">✅ Completed</div>
      </div>
    </div>
    <a href="${taskUrl}" class="btn">View Task →</a>
  `)

  return resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject: `✅ Task completed: "${opts.taskTitle}"`,
    html,
  })
}
