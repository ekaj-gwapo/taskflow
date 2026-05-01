import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { code } = await request.json()

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Verification code is required" }, { status: 400 })
    }

    // Find user and check code
    const user = await db.getOne(
      `SELECT id, "emailVerifyToken", "emailVerifyExpiry", email FROM users WHERE id = ?`,
      [auth.user!.id]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.emailVerifyToken !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
    }

    const expiry = new Date(user.emailVerifyExpiry)
    const now = new Date()
    
    console.log("VERIFY CODE CHECK:", {
      db_expiry: user.emailVerifyExpiry,
      parsed_expiry: expiry.toISOString(),
      now: now.toISOString(),
      isExpired: expiry.getTime() < now.getTime()
    })

    if (expiry.getTime() < now.getTime()) {
      return NextResponse.json({ error: "This code has expired. Please request a new one." }, { status: 400 })
    }

    // Update user as verified
    await db.execute(
      `UPDATE users SET "emailVerified" = TRUE, "emailVerifyToken" = NULL, "emailVerifyExpiry" = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [auth.user!.id]
    )

    return NextResponse.json({
      message: "Email verified successfully",
      user: {
        ...auth.user,
        email: user.email,
        emailVerified: true
      }
    }, { status: 200 })

  } catch (error) {
    console.error("Verify code error:", error)
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 })
  }
}
