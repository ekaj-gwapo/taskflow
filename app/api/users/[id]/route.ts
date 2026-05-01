import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"
import { logActivity } from "@/lib/activity"

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
      SELECT id, name, email, phone, location, jobtitle AS "jobTitle", role, theme, mode, createdat AS "createdAt", orgid AS "orgId"
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

    const { name, email, phone, location, jobTitle, theme, mode } = await request.json()
    console.log(`[API] Updating user ${id}:`, { name, email, phone, location, jobTitle, theme, mode })

    // Get current data to check if we should log activity
    const currentUserData = await db.getOne(`
      SELECT name, email, phone, location, jobtitle AS "jobTitle" FROM users WHERE id = ?
    `, [id]);

    await db.execute(`
      UPDATE users 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          location = COALESCE(?, location),
          jobtitle = COALESCE(?, jobtitle),
          theme = COALESCE(?, theme),
          mode = COALESCE(?, mode),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, email, phone, location, jobTitle, theme, mode, id]);

    // Only log if core profile info changed (not just theme/mode)
    const profileInfoChanged = 
      (name && name !== currentUserData.name) || 
      (email && email !== currentUserData.email) ||
      (phone !== undefined && phone !== currentUserData.phone) ||
      (location !== undefined && location !== currentUserData.location) ||
      (jobTitle !== undefined && jobTitle !== currentUserData.jobTitle);

    if (profileInfoChanged) {
      await logActivity({
        action: "PROFILE_UPDATED",
        entityId: id,
        entityType: "USER",
        userId: auth.user!.id,
        userName: auth.user!.name,
        details: { updatedUserId: id, name, email }
      });
    }

    const user = await db.getOne(`
      SELECT id, name, email, phone, location, jobtitle AS "jobTitle", role, theme, mode, orgid AS "orgId"
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
