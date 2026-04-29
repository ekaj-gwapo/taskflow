import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"
import { sendVerificationEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    // Check if email is already taken by another user
    const existing = await db.getOne(
      `SELECT id FROM users WHERE email = ? AND id != ? AND "emailVerified" = TRUE`,
      [email, auth.user!.id]
    )
    if (existing) {
      return NextResponse.json({ error: "This email is already connected to another account" }, { status: 409 })
    }

    // Generate a secure verification token (expires in 24h)
    const token = crypto.randomBytes(32).toString("hex")
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await db.execute(
      `UPDATE users SET email = ?, "emailVerified" = FALSE, "emailVerifyToken" = ?, "emailVerifyExpiry" = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [email, token, expiry, auth.user!.id]
    )

    // Send verification email
    try {
      await sendVerificationEmail(email, auth.user!.name, token)
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr)
      // Don't fail the request — email service may be down temporarily
      return NextResponse.json({
        message: "Email saved but verification email could not be sent. Please try again.",
        emailSent: false,
      }, { status: 200 })
    }

    return NextResponse.json({
      message: "Verification email sent! Check your inbox.",
      emailSent: true,
    }, { status: 200 })

  } catch (error) {
    console.error("Connect email error:", error)
    return NextResponse.json({ error: "Failed to connect email" }, { status: 500 })
  }
}
