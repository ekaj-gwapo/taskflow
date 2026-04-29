import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"
import { logActivity } from "@/lib/activity"
import { notifyExtensionReviewed } from "@/lib/notify"
import { v4 as uuidv4 } from "uuid"

// PUT — Approve or reject an extension request (fixed duplicate declaration)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const taskId = (await params).id?.toLowerCase()
    const requestId = (await params).requestId
    const user = auth.user!
    const role = user.role.toUpperCase()

    // Only admin roles can approve/reject
    if (role !== "ADMIN" && role !== "HEAD_ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Only admins can review extension requests" },
        { status: 403 }
      )
    }

    const { action, remark } = await request.json()

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be APPROVE or REJECT" },
        { status: 400 }
      )
    }

    // Find the extension request and task details
    const extRequest: any = await db.getOne(
      `SELECT er.*, 
              t.createdById as "createdById", t.createdbyid, 
              t.delegatedById as "delegatedById", t.delegatedbyid, 
              t.title as "taskTitle", t.title
       FROM extension_requests er 
       JOIN tasks t ON er.taskId = t.id 
       WHERE er.id = ? AND er.taskId = ?`,
      [requestId, taskId]
    )

    if (!extRequest) {
      return NextResponse.json(
        { error: "Extension request not found" },
        { status: 404 }
      )
    }

    // AUTH CHECK: Only the original creator (createdById) OR a SuperAdmin can review
    // A user CANNOT review their own extension request
    const creatorId = extRequest.createdById || extRequest.createdbyid;
    const requestedById = extRequest.requestedById || extRequest.requestedbyid;
    
    const isCreator = user.id === creatorId;
    const isSuperAdmin = role === "SUPERADMIN";
    const isRequester = user.id === requestedById;

    if ((!isCreator && !isSuperAdmin) || isRequester) {
      return NextResponse.json(
        { error: isRequester ? "You cannot review your own extension request" : "Only the original task creator can review the extension request" },
        { status: 403 }
      )
    }

    if (extRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been reviewed" },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED"

    // Update the extension request
    await db.execute(`
      UPDATE extension_requests 
      SET status = ?, reviewedById = ?, reviewedByName = ?, reviewerRemark = ?, reviewedAt = ?
      WHERE id = ?
    `, [newStatus, user.id, user.name, remark?.trim() || null, now, requestId])

    const proposedDueDate = extRequest.proposedDueDate || extRequest.proposedduedate;

    // If approved, update the task's due date
    if (action === "APPROVE" && proposedDueDate) {
      await db.execute(
        "UPDATE tasks SET dueDate = ?, updatedAt = ? WHERE id = ?",
        [proposedDueDate, now, taskId]
      )
    }

    const taskTitle = extRequest.taskTitle || extRequest.tasktitle || extRequest.title || "Task";
    const requestedByName = extRequest.requestedByName || extRequest.requestedbyname || "Someone";
    const currentDueDate = extRequest.currentDueDate || extRequest.currentduedate;

    await logActivity({
      action: action === "APPROVE" ? "EXTENSION_APPROVED" : "EXTENSION_REJECTED",
      entityId: taskId,
      entityType: "TASK",
      userId: user.id,
      userName: user.name,
      details: {
        requestId,
        taskTitle,
        requestedBy: requestedByName,
        currentDueDate,
        proposedDueDate,
        remark: remark?.trim() || null,
      },
    })

    // Create Notification for the requester
    const notificationId = uuidv4()
    const notificationTitle = action === "APPROVE" ? "Extension Approved" : "Extension Rejected"
    const notificationMessage = action === "APPROVE" 
      ? `Your extension request for "${taskTitle}" has been approved.` 
      : `Your extension request for "${taskTitle}" has been rejected.`
    
    await db.execute(
      "INSERT INTO notifications (id, userId, type, title, message, link, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        notificationId, 
        requestedById, 
        action === "APPROVE" ? "EXTENSION_APPROVED" : "EXTENSION_REJECTED",
        notificationTitle,
        notificationMessage,
        `/tasks/${taskId}`,
        now
      ]
    )

    // Send email notification to requester
    notifyExtensionReviewed({
      requesterId: requestedById,
      taskTitle: taskTitle,
      approved: action === "APPROVE",
      remark: remark?.trim()
    });

    const updated: any = await db.getOne("SELECT * FROM extension_requests WHERE id = ?", [requestId])
    const formattedUpdated = {
      ...updated,
      requestedById: updated.requestedById || updated.requestedbyid,
      requestedByName: updated.requestedByName || updated.requestedbyname,
      currentDueDate: updated.currentDueDate || updated.currentduedate,
      proposedDueDate: updated.proposedDueDate || updated.proposedduedate,
      reviewedById: updated.reviewedById || updated.reviewedbyid,
      reviewedByName: updated.reviewedByName || updated.reviewedbyname,
      reviewerRemark: updated.reviewerRemark || updated.reviewerremark,
      reviewedAt: updated.reviewedAt || updated.reviewedat,
      createdAt: updated.createdAt || updated.createdat
    }


    return NextResponse.json({ extensionRequest: formattedUpdated }, { status: 200 })
  } catch (error) {
    console.error("Review extension request error:", error)
    return NextResponse.json(
      { error: "Failed to review extension request" },
      { status: 500 }
    )
  }
}
