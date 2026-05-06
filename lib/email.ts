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
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
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

export async function sendSupportReplyEmail(opts: {
  to: string
  recipientName: string
  originalMessage: string
  replyMessage: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `RE: Your Support Request - TaskFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; margin-top: 0;">Response to Your Support Request</h2>
        <p>Hi ${opts.recipientName},</p>
        <p>A Master Admin has replied to your request:</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <p style="margin: 5px 0;"><strong>Admin Reply:</strong></p>
          <p style="margin: 5px 0; white-space: pre-wrap;">${opts.replyMessage}</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #64748b; font-size: 12px;"><strong>Your original message:</strong></p>
        <p style="color: #64748b; font-size: 12px; font-style: italic; white-space: pre-wrap;">"${opts.originalMessage}"</p>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    `
  })
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

export async function sendVerificationCodeEmail(email: string, name: string, code: string) {
  return sendEmail({
    to: email,
    subject: "Your TaskFlow Verification Code",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; margin-top: 0;">Verification Code</h2>
        <p>Hi ${name},</p>
        <p>Use the following 6-digit code to verify your email address. This code will expire in 10 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f8fafc; color: #059669; padding: 20px; font-size: 32px; font-weight: 800; letter-spacing: 10px; border-radius: 12px; border: 2px dashed #059669; display: inline-block;">
            ${code}
          </div>
        </div>
        <p style="color: #64748b; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
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
  taskId: string
  approved: boolean
  remark?: string
}) {
  const statusColor = opts.approved ? "#059669" : "#dc2626"
  const statusText = opts.approved ? "APPROVED" : "REJECTED"
  const taskUrl = `${APP_URL}/dashboard?taskId=${opts.taskId}&section=extensions`
  
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
          <a href="${taskUrl}" style="background-color: ${statusColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Review Details</a>
        </div>
      </div>
    `
  })
}

export async function sendNewDiscussionEmail(opts: {
  to: string
  recipientName: string
  taskTitle: string
  taskId: string
  authorName: string
  messagePreview: string
}) {
  const taskUrl = `${APP_URL}/dashboard?taskId=${opts.taskId}&section=discussion`
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
          <a href="${taskUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reply to Comment</a>
        </div>
      </div>
    `
  })
}

export async function sendDeadlineReminderEmail(opts: {
  to: string
  recipientName: string
  taskTitle: string
  taskId: string
  dueDate: string
  status: string
}) {
  const taskUrl = `${APP_URL}/dashboard?taskId=${opts.taskId}`
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
          <a href="${taskUrl}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Complete Task Now</a>
        </div>
      </div>
    `
  })
}

export async function sendTaskCompletedEmail(opts: {
  to: string
  recipientName: string
  taskTitle: string
  taskId: string
  completedBy: string
}) {
  const taskUrl = `${APP_URL}/dashboard?taskId=${opts.taskId}&section=discussion`
  return sendEmail({
    to: opts.to,
    subject: `Task Completed: ${opts.taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; margin-top: 0;">Task Accomplished</h2>
        <p>Hi ${opts.recipientName},</p>
        <p>Good news! The task <strong>${opts.taskTitle}</strong> has been marked as completed by <strong>${opts.completedBy}</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${taskUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Accomplishment</a>
        </div>
      </div>
    `
  })
}

export async function sendExtensionRequestedEmail(opts: {
  to: string
  recipientName: string
  taskTitle: string
  requesterName: string
  proposedDate: string
  reason: string
  taskId: string
}) {
  const taskUrl = `${APP_URL}/dashboard?taskId=${opts.taskId}&section=extensions`
  
  return sendEmail({
    to: opts.to,
    subject: `Extension Requested: ${opts.taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; margin-top: 0;">Extension Requested</h2>
        <p>Hi ${opts.recipientName},</p>
        <p><strong>${opts.requesterName}</strong> has requested a deadline extension for the task: <strong>${opts.taskTitle}</strong></p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <p style="margin: 5px 0;"><strong>Proposed New Date:</strong> ${opts.proposedDate}</p>
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${opts.reason}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${taskUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Review Request</a>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center;">You can approve or reject this request from your dashboard.</p>
      </div>
    `
  })
}

export async function sendContactMasterAdminEmail(opts: {
  to: string
  recipientName: string
  creatorName: string
  creatorEmail: string
  organizationName: string
  message: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `New Concern/Request from Creator: ${opts.creatorName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; margin-top: 0;">Creator Concern/Request</h2>
        <p>Hi ${opts.recipientName},</p>
        <p>A creator has sent a message through the system:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <p style="margin: 5px 0;"><strong>From:</strong> ${opts.creatorName} (${opts.creatorEmail})</p>
          <p style="margin: 5px 0;"><strong>Organization:</strong> ${opts.organizationName}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
          <p style="margin: 5px 0;"><strong>Message:</strong></p>
          <p style="margin: 5px 0; white-space: pre-wrap;">${opts.message}</p>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center;">You can reply directly to the creator at ${opts.creatorEmail}</p>
      </div>
    `
  })
}

