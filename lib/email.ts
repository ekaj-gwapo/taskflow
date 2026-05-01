import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // This fixes the "self-signed certificate" error
    },
  })
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://taskflow-olive-omega.vercel.app"
const FROM_NAME = "TaskFlow"

/**
 * Generic email sender using Nodemailer
 */
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    return { success: true, id: info.messageId }
  } catch (error) {
    console.error(`NODEMAILER ERROR (TO: ${to}):`, error)
    throw error
  }
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${APP_URL}/api/auth/verify-signup?token=${token}`
  
  return sendEmail({
    to: email,
    subject: "Verify your email for TaskFlow",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; margin-top: 0;">Welcome to TaskFlow!</h2>
        <p>Hi ${name},</p>
        <p>Please click the button below to verify your email address and start receiving notifications.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link: <br/> ${verifyUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated message. Please do not reply.</p>
      </div>
    `
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
  const taskUrl = `${APP_URL}/dashboard?taskId=${opts.taskId}`
  
  return sendEmail({
    to: opts.to,
    subject: `New Task Assigned: ${opts.taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; margin-top: 0;">New Task Assigned</h2>
        <p>Hi ${opts.recipientName},</p>
        <p>You have been assigned a new task: <strong>${opts.taskTitle}</strong></p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Priority:</strong> ${opts.priority}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${opts.dueDate}</p>
          <p style="margin: 5px 0;"><strong>Assigned By:</strong> ${opts.assignedBy}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${taskUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Task Details</a>
        </div>
      </div>
    `
  })
}

export async function sendExtensionReviewedEmail(opts: {
  to: string
  recipientName: string
  taskTitle: string
  approved: boolean
  remark?: string
}) {
  const statusColor = opts.approved ? "#059669" : "#dc2626"
  const statusText = opts.approved ? "APPROVED" : "REJECTED"
  
  return sendEmail({
    to: opts.to,
    subject: `Extension Request ${statusText}: ${opts.taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: ${statusColor}; margin-top: 0;">Extension Request ${statusText}</h2>
        <p>Hi ${opts.recipientName},</p>
        <p>Your request for a deadline extension on <strong>${opts.taskTitle}</strong> has been ${statusText.toLowerCase()}.</p>
        ${opts.remark ? `<p><strong>Admin Remark:</strong> ${opts.remark}</p>` : ""}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard" style="background-color: ${statusColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
        </div>
      </div>
    `
  })
}

export async function sendNewDiscussionEmail(opts: {
  to: string
  recipientName: string
  taskTitle: string
  authorName: string
  messagePreview: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `New Comment on: ${opts.taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; margin-top: 0;">New Discussion Message</h2>
        <p>Hi ${opts.recipientName},</p>
        <p><strong>${opts.authorName}</strong> left a new comment on <strong>${opts.taskTitle}</strong>:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; font-style: italic; color: #475569; margin: 20px 0; border-left: 4px solid #059669;">
          "${opts.messagePreview}"
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reply to Comment</a>
        </div>
      </div>
    `
  })
}

export async function sendDeadlineReminderEmail(opts: {
  to: string
  recipientName: string
  taskTitle: string
  dueDate: string
  status: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `REMINDER: Task Due Tomorrow - ${opts.taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #ea580c; margin-top: 0;">Upcoming Deadline</h2>
        <p>Hi ${opts.recipientName},</p>
        <p>This is a reminder that your task is due tomorrow.</p>
        <div style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Task:</strong> ${opts.taskTitle}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${opts.dueDate}</p>
          <p style="margin: 5px 0;"><strong>Current Status:</strong> ${opts.status}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Complete Task Now</a>
        </div>
      </div>
    `
  })
}

export async function sendTaskCompletedEmail(opts: {
  to: string
  recipientName: string
  taskTitle: string
  completedBy: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `Task Completed: ${opts.taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; margin-top: 0;">Task Accomplished</h2>
        <p>Hi ${opts.recipientName},</p>
        <p>Good news! The task <strong>${opts.taskTitle}</strong> has been marked as completed by <strong>${opts.completedBy}</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View in Dashboard</a>
        </div>
      </div>
    `
  })
}
