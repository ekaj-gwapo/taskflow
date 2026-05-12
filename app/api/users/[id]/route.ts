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
      SELECT u.id, u.name, u.email, u.phone, u.location, u.jobtitle AS "jobTitle", 
             u.jobdescription AS "jobDescription", u.role, u.theme, u.mode, 
             u.createdat AS "createdAt", u.orgid AS "orgId",
             o.name as "organizationName", o.logo_url as "organizationLogo"
      FROM users u
      LEFT JOIN organizations o ON u.orgid = o.id
      WHERE u.id = ?
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
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const { name, email, phone, location, jobTitle, jobDescription, theme, mode } = await request.json()

    // Get current data to check if we should log activity
    const currentUserData = await db.getOne(`
      SELECT name, email, phone, location, jobtitle AS "jobTitle", jobdescription AS "jobDescription" FROM users WHERE id = ?
    `, [id]);

    await db.execute(`
      UPDATE users 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          location = COALESCE(?, location),
          jobtitle = COALESCE(?, jobtitle),
          jobdescription = COALESCE(?, jobdescription),
          theme = COALESCE(?, theme),
          mode = COALESCE(?, mode),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, email, phone, location, jobTitle, jobDescription, theme, mode, id]);

    // Only log if core profile info changed (not just theme/mode)
    const profileInfoChanged = 
      (name && name !== currentUserData.name) || 
      (email && email !== currentUserData.email) ||
      (phone !== undefined && phone !== currentUserData.phone) ||
      (location !== undefined && location !== currentUserData.location) ||
      (jobTitle !== undefined && jobTitle !== currentUserData.jobTitle) ||
      (jobDescription !== undefined && jobDescription !== currentUserData.jobDescription);

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
      SELECT u.id, u.name, u.email, u.phone, u.location, u.jobtitle AS "jobTitle", 
             u.jobdescription AS "jobDescription", u.role, u.theme, u.mode, u.orgid AS "orgId",
             o.name as "organizationName", o.logo_url as "organizationLogo"
      FROM users u
      LEFT JOIN organizations o ON u.orgid = o.id
      WHERE u.id = ?
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const currentUser = auth.user!
    const role = currentUser.role?.toUpperCase()

    // Permission check: Only SUPERADMIN, MASTER_ADMIN, or CREATOR of the same org can delete
    if (role !== "SUPERADMIN" && role !== "MASTER_ADMIN" && role !== "CREATOR") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (currentUser.id === id) {
      return NextResponse.json({ error: "You cannot delete yourself" }, { status: 400 })
    }

    // Verify user exists and belongs to the same org (if not superadmin)
    const targetUser = await db.getOne("SELECT orgid FROM users WHERE id = ?", [id]);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (role !== "SUPERADMIN" && role !== "MASTER_ADMIN" && targetUser.orgid !== currentUser.orgId) {
      return NextResponse.json({ error: "Access denied. User belongs to another organization." }, { status: 403 })
    }

    // Clean up related data to avoid foreign key violations
    // 1. Remove assignments (though schema might have cascade, manual is safer)
    await db.execute("DELETE FROM task_assignments WHERE userId = ?", [id]);
    
    // 2. Clear references in tasks
    await db.execute("UPDATE tasks SET assigneeId = NULL WHERE assigneeId = ?", [id]);
    await db.execute("UPDATE tasks SET createdById = NULL WHERE createdById = ?", [id]);
    await db.execute("UPDATE tasks SET delegatedById = NULL WHERE delegatedById = ?", [id]);

    // 3. Clear references in comments and notes
    await db.execute("UPDATE task_comments SET authorId = NULL WHERE authorId = ?", [id]);
    await db.execute("UPDATE progress_notes SET authorId = NULL WHERE authorId = ?", [id]);

    // 4. Handle extension requests
    await db.execute("DELETE FROM extension_requests WHERE requestedById = ?", [id]);
    await db.execute("UPDATE extension_requests SET reviewedById = NULL WHERE reviewedById = ?", [id]);

    // 5. Clear notifications
    await db.execute("DELETE FROM notifications WHERE userId = ?", [id]);

    // Get user name for better logging before deletion
    const targetUserInfo = await db.getOne("SELECT name FROM users WHERE id = ?", [id]);
    const targetName = targetUserInfo?.name || "Unknown User";

    // 6. Finally delete the user
    await db.execute("DELETE FROM users WHERE id = ?", [id]);

    await logActivity({
      action: "USER_DELETED",
      entityId: id,
      entityType: "USER",
      userId: currentUser.id,
      userName: currentUser.name,
      details: { 
        deletedUserId: id, 
        name: targetName,
        action: "DELETED" 
      }
    });

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 })
  } catch (error: any) {
    console.error("Delete user error:", error)
    return NextResponse.json(
      { error: "Failed to delete user", details: error.message },
      { status: 500 }
    )
  }
}
