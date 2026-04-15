import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const user = await db.getOne(`
      SELECT id, name, email, phone, location, role, createdAt 
      FROM users 
      WHERE id = ?
    `, [id]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Users can only update their own profile
    const role = auth.user!.role?.toUpperCase()
    if (auth.user!.id !== id && role !== "ADMIN" && role !== "SUPERADMIN") {
      console.log(`[API] Access denied for user ${auth.user!.id} attempting to update ${id}`)
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const { name, email, phone, location } = await request.json()
    console.log(`[API] Updating user ${id}:`, { name, email, phone, location })

    if (role === "EMPLOYEE") {
      await db.execute(`
        UPDATE users 
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone),
            location = COALESCE(?, location),
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [name, email, phone, location, id]);
    } else {
      await db.execute(`
        UPDATE users 
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone),
            location = COALESCE(?, location),
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [name, email, phone, location, id]);
    }

    const user = await db.getOne(`
      SELECT id, name, email, phone, location, role 
      FROM users 
      WHERE id = ?
    `, [id]);

    return NextResponse.json(
      { message: "User profile updated successfully", user },
      { status: 200 }
    )
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}
