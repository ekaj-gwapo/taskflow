import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/dashboard?email_error=missing_token", request.url))
    }

    const user = await db.getOne(
      `SELECT id, "emailVerifyExpiry" FROM users WHERE "emailVerifyToken" = ?`,
      [token]
    )

    if (!user) {
      return NextResponse.redirect(new URL("/dashboard?email_error=invalid_token", request.url))
    }

    // Check expiry
    if (user.emailVerifyExpiry && new Date(user.emailVerifyExpiry) < new Date()) {
      return NextResponse.redirect(new URL("/dashboard?email_error=expired_token", request.url))
    }

    // Mark as verified
    await db.execute(
      `UPDATE users SET "emailVerified" = TRUE, "emailVerifyToken" = NULL, "emailVerifyExpiry" = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [user.id]
    )

    return NextResponse.redirect(new URL("/dashboard?email_verified=1", request.url))

  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.redirect(new URL("/dashboard?email_error=server_error", request.url))
  }
}
