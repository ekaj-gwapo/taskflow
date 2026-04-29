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

    const { content, attachmentUrl, attachmentName, attachmentType } = await request.json()
    const taskId = (await params).id?.toLowerCase()

    console.log(`[COMMENTS_API] Adding comment to task ${taskId} by user ${auth.user!.id} (${auth.user!.role})`);

    if (!content && !attachmentUrl) {
      return NextResponse.json({ error: "Content or attachment is required" }, { status: 400 })
    }

    // Verify task exists
    const task: any = await db.getOne("SELECT * FROM tasks WHERE id = ?", [taskId]);

    if (!task) {
      console.warn(`[COMMENTS_API] Task not found: ${taskId}`);
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Permission check: admins/superadmins can add to any, employee only if they are assigned. 
    const role = auth.user!.role?.toUpperCase()
    if (role === "EMPLOYEE") {
      const assignment = await db.getOne(
        "SELECT 1 FROM task_assignments WHERE taskId = ? AND userId = ?",
        [taskId, auth.user!.id]
      )

      if (!assignment && task.assigneeId?.toLowerCase() !== auth.user!.id.toLowerCase()) {
        console.warn(`[COMMENTS_API] Access denied for user ${auth.user!.id} on task ${taskId}. Not assigned.`);
        return NextResponse.json(
          { error: "Access denied. You must be assigned to this task to add comments." },
          { status: 403 }
        )
      }
    }

    const commentId = uuidv4();
    await db.execute(`
      INSERT INTO task_comments (id, content, taskId, authorId, authorName, createdAt, updatedAt, attachmentUrl, attachmentName, attachmentType)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      commentId, 
      content || "", 
      taskId, 
      auth.user!.id, 
      auth.user!.name, 
      new Date().toISOString(), 
      new Date().toISOString(),
      attachmentUrl || null,
      attachmentName || null,
      attachmentType || null
    ]);

    const rawComment: any = await db.getOne(`
      SELECT tc.*, u.avatarUrl as authorAvatar
      FROM task_comments tc
      LEFT JOIN users u ON tc.authorId = u.id
      WHERE tc.id = ?
    `, [commentId]);

    const comment = {
      ...rawComment,
      authorName: rawComment.authorName || rawComment.authorname,
      authorAvatar: rawComment.authorAvatar || rawComment.authoravatar,
      attachmentUrl: rawComment.attachmentUrl || rawComment.attachmenturl,
      attachmentName: rawComment.attachmentName || rawComment.attachmentname,
      attachmentType: rawComment.attachmentType || rawComment.attachmenttype,
      createdAt: rawComment.createdAt || rawComment.createdat,
      updatedAt: rawComment.updatedAt || rawComment.updatedat
    };


    await logActivity({
      action: "COMMENT_ADDED",
      entityId: taskId,
      entityType: "TASK",
      userId: auth.user!.id,
      userName: auth.user!.name,
      details: { commentId, content: comment.content }
    });

    // Notify relevant users
    try {
      // 1. Get all assignees
      const assignments = await db.getAll("SELECT userId FROM task_assignments WHERE taskId = ?", [taskId]);
      const assigneeIds = assignments.map(a => a.userId || a.userid);
      
      const createdById = task.createdById || task.createdbyid;
      const delegatedById = task.delegatedById || task.delegatedbyid;
      const assigneeId = task.assigneeId || task.assigneeid;

      if (assigneeId) assigneeIds.push(assigneeId);
      
      // 2. Add creator and delegator
      if (createdById) assigneeIds.push(createdById);
      if (delegatedById) assigneeIds.push(delegatedById);
      
      // 3. Remove duplicates, nulls, and the author
      const notifyUserIds = Array.from(new Set(assigneeIds.filter(id => id && id !== auth.user!.id)));
      
      if (notifyUserIds.length > 0) {
        const now = new Date().toISOString();
        const notificationTitle = `New Comment on "${task.title}"`;
        const notificationMessage = `${auth.user!.name} commented: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`;
        
        for (const userId of notifyUserIds) {
          await db.execute(
            "INSERT INTO notifications (id, userId, type, title, message, link, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [uuidv4(), userId, "COMMENT_ADDED", notificationTitle, notificationMessage, `/tasks/${taskId}`, now]
          );
        }
      }
    } catch (notifError) {
      console.error("Failed to create comment notifications:", notifError);
    }

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
