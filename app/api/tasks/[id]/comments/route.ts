import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"
import { logActivity } from "@/lib/activity"
import { v4 as uuidv4 } from "uuid"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    const taskId = (await params).id?.toLowerCase()
    
    // Verify task exists
    const task: any = await db.getOne("SELECT * FROM tasks WHERE LOWER(id) = ?", [taskId]);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Permission check: admins/superadmins can add to any, employee only if they are assigned. 
    // If the task represents a broad discussion, we could let any employee comment, 
    // but sticking to standard access: employees can only comment on tasks they have access to.
    const role = auth.user!.role?.toUpperCase()
    if (role === "EMPLOYEE") {
      const assignment = await db.getOne(
        "SELECT 1 FROM task_assignments WHERE taskId = ? AND userId = ?",
        [taskId, auth.user!.id]
      )

      if (!assignment && task.assigneeId?.toLowerCase() !== auth.user!.id.toLowerCase()) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        )
      }
    }

    const commentId = uuidv4();
    await db.execute(`
      INSERT INTO task_comments (id, content, taskId, authorId, authorName, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      commentId, 
      content, 
      taskId, 
      auth.user!.id, 
      auth.user!.name, 
      new Date().toISOString(), 
      new Date().toISOString()
    ]);

    const comment: any = await db.getOne(`
      SELECT tc.*, u.avatarUrl as authorAvatar
      FROM task_comments tc
      LEFT JOIN users u ON tc.authorId = u.id
      WHERE tc.id = ?
    `, [commentId]);

    await logActivity({
      action: "COMMENT_ADDED",
      entityId: taskId,
      entityType: "TASK",
      userId: auth.user!.id,
      userName: auth.user!.name,
      details: { commentId, content: comment.content }
    });

    return NextResponse.json(
      { message: "Comment added successfully", comment },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create comment error:", error)
    return NextResponse.json(
      { error: "Failed to add comment", details: error.message },
      { status: 500 }
    )
  }
}
