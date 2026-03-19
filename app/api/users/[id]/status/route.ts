import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-utils"
import db from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdmin(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { isActive } = await request.json()
    const { id } = await params

    if (typeof isActive !== "number") {
      return NextResponse.json(
        { error: "isActive must be a number (0 or 1)" },
        { status: 400 }
      )
    }

    await db.execute(
      "UPDATE users SET isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [isActive, id]
    )

    return NextResponse.json(
      { message: "User status updated successfully", isActive },
      { status: 200 }
    )
  } catch (error) {
    console.error("Update user status error:", error)
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    )
  }
}
