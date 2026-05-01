import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"
import { logActivity } from "@/lib/activity"
import { v4 as uuidv4 } from "uuid"

// POST — Create a new extension request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const taskId = (await params).id?.toLowerCase()
    const user = auth.user!
    const { proposedDueDate, reason } = await request.json()

    if (!proposedDueDate || !reason?.trim()) {
      return NextResponse.json(
        { error: "Proposed due date and reason are required" },
        { status: 400 }
      )
    }

    // Check task exists and is not completed
    const task: any = await db.getOne("SELECT * FROM tasks WHERE id = ?", [taskId])
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (task.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot request extension for a completed task" },
        { status: 400 }
      )
    }

    // ROLE RESTRICTION: Head Admin cannot request extensions
    if (user.role.toUpperCase() === "HEAD_ADMIN") {
      return NextResponse.json(
        { error: "Head Admins are not permitted to request extensions" },
        { status: 403 }
      )
    }

    const createdById = task.createdById || task.createdbyid;
    const delegatedById = task.delegatedById || task.delegatedbyid;
    const currentDueDate = task.dueDate || task.duedate;

    if (!currentDueDate) {
      return NextResponse.json(
        { error: "Task has no current due date. Cannot request extension." },
        { status: 400 }
      )
    }

    // ASSIGNER RESTRICTION: You cannot request an extension from yourself
    if (user.id === createdById || user.id === delegatedById) {
      return NextResponse.json(
        { error: "As the assigner of this task, you cannot request an extension from yourself" },
        { status: 403 }
      )
    }

    // Check user is assigned to this task OR is an admin
    const role = user.role.toUpperCase()
    const isAdmin = role === "ADMIN" || role === "HEAD_ADMIN" || role === "SUPERADMIN"
    
    if (!isAdmin) {
      const assignment: any = await db.getOne(
        "SELECT * FROM task_assignments WHERE taskId = ? AND userId = ?",
        [taskId, user.id]
      )
      if (!assignment) {
        return NextResponse.json(
          { error: "You are not assigned to this task" },
          { status: 403 }
        )
      }
    }

    // Check no existing PENDING request
    const pendingRequest: any = await db.getOne(
      "SELECT * FROM extension_requests WHERE taskId = ? AND status = 'PENDING'",
      [taskId]
    )
    if (pendingRequest) {
      return NextResponse.json(
        { error: "There is already a pending extension request for this task" },
        { status: 400 }
      )
    }

    // Check max 2 requests per task
    const allRequests: any[] = await db.getAll(
      "SELECT * FROM extension_requests WHERE taskId = ?",
      [taskId]
    ) as any[]
    if (allRequests.length >= 2) {
      return NextResponse.json(
        { error: "Maximum of 2 extension requests allowed per task" },
        { status: 400 }
      )
    }
    
    // Validate proposed date is after current due date
    if (currentDueDate && new Date(proposedDueDate) <= new Date(currentDueDate)) {
      return NextResponse.json(
        { error: "Proposed date must be after the current due date" },
        { status: 400 }
      )
    }

    const id = uuidv4()
    const now = new Date().toISOString()

    await db.execute(`
      INSERT INTO extension_requests (id, taskId, requestedById, requestedByName, currentDueDate, proposedDueDate, reason, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `, [id, taskId, user.id, user.name, currentDueDate || null, new Date(proposedDueDate).toISOString(), reason.trim(), now])

    await logActivity({
      action: "EXTENSION_REQUESTED",
      entityId: taskId,
      entityType: "TASK",
      userId: user.id,
      userName: user.name,
      details: {
        requestId: id,
        taskTitle: task.title,
        currentDueDate,
        proposedDueDate: new Date(proposedDueDate).toISOString(),
        reason: reason.trim(),
      },
    })

    const created: any = await db.getOne("SELECT * FROM extension_requests WHERE id = ?", [id])
    const formattedCreated = {
      ...created,
      requestedById: created.requestedById || created.requestedbyid,
      requestedByName: created.requestedByName || created.requestedbyname,
      currentDueDate: created.currentDueDate || created.currentduedate,
      proposedDueDate: created.proposedDueDate || created.proposedduedate,
      createdAt: created.createdAt || created.createdat
    }

    // Create Notifications only for the original Creator
    if (createdById && createdById !== user.id) {
      const notificationId = uuidv4();
      await db.execute(
        "INSERT INTO notifications (id, userId, type, title, message, link, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          notificationId,
          createdById,
          "EXTENSION_REQUESTED",
          "Extension Requested",
          `${user.name} requested an extension for "${task.title || task.taskTitle || "Task"}".`,
          `/tasks/${taskId}`,
          now
        ]
      );
    }

    return NextResponse.json({ extensionRequest: formattedCreated }, { status: 201 })
  } catch (error) {
    console.error("Create extension request error:", error)
    return NextResponse.json(
      { error: "Failed to create extension request" },
      { status: 500 }
    )
  }
}

// GET — Fetch all extension requests for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id: taskId } = await params
    const requests = (await db.getAll(
      "SELECT * FROM extension_requests WHERE taskId = ? ORDER BY createdAt DESC",
      [taskId]
    )) as any[]

    const formattedRequests = requests.map(r => ({
      ...r,
      requestedById: r.requestedById || r.requestedbyid,
      requestedByName: r.requestedByName || r.requestedbyname,
      currentDueDate: r.currentDueDate || r.currentduedate,
      proposedDueDate: r.proposedDueDate || r.proposedduedate,
      reviewedById: r.reviewedById || r.reviewedbyid,
      reviewedByName: r.reviewedByName || r.reviewedbyname,
      reviewerRemark: r.reviewerRemark || r.reviewerremark,
      reviewedAt: r.reviewedAt || r.reviewedat,
      createdAt: r.createdAt || r.createdat
    }))

    return NextResponse.json({ extensionRequests: formattedRequests }, { status: 200 })

  } catch (error) {
    console.error("Fetch extension requests error:", error)
    return NextResponse.json(
      { error: "Failed to fetch extension requests" },
      { status: 500 }
    )
  }
}
