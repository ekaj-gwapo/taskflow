import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    await db.execute(
      `UPDATE users SET email = NULL, "emailVerified" = FALSE, "emailVerifyToken" = NULL, "emailVerifyExpiry" = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [auth.user!.id]
    )

    return NextResponse.json({
      message: "Email disconnected successfully",
    }, { status: 200 })

  } catch (error) {
    console.error("Disconnect email error:", error)
    return NextResponse.json({ error: "Failed to disconnect email" }, { status: 500 })
  }
}
