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

    if (!content && !attachmentUrl) {
      return NextResponse.json(
        { error: "Content or attachment is required" },
        { status: 400 }
      )
    }

    const taskId = (await params).id?.toLowerCase()
    // Verify task exists and user has access
    const task: any = await db.getOne("SELECT * FROM tasks WHERE id = ?", [taskId]);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Permission check: admins/superadmins can add to any, employee only to their own
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

    const noteId = uuidv4();
    await db.execute(`
      INSERT INTO progress_notes (id, content, taskId, authorId, authorName, createdAt, updatedAt, attachmentUrl, attachmentName, attachmentType)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      noteId, 
      content, 
      taskId, 
      auth.user!.id, 
      auth.user!.name, 
      new Date().toISOString(), 
      new Date().toISOString(),
      attachmentUrl || null,
      attachmentName || null,
      attachmentType || null
    ]);

    const note: any = await db.getOne(`
      SELECT pn.*, u.avatarUrl as authorAvatar
      FROM progress_notes pn
      LEFT JOIN users u ON pn.authorId = u.id
      WHERE pn.id = ?
    `, [noteId]);

    await logActivity({
      action: "NOTE_ADDED",
      entityId: taskId,
      entityType: "TASK",
      userId: auth.user!.id,
      userName: auth.user!.name,
      details: { noteId, content: note.content }
    });

    const formattedNote = {
      ...note,
      authorId: note.authorId || note.authorid,
      authorName: note.authorName || note.authorname,
      authorAvatar: note.authorAvatar || note.authoravatar,
      attachmentUrl: note.attachmentUrl || note.attachmenturl,
      attachmentName: note.attachmentName || note.attachmentname,
      attachmentType: note.attachmentType || note.attachmenttype,
      createdAt: note.createdAt || note.createdat,
      updatedAt: note.updatedAt || note.updatedat
    };

    return NextResponse.json(
      { message: "Progress note created successfully", note: formattedNote },
      { status: 201 }
    )

  } catch (error: any) {
    console.error("Create progress note error:", error)
    return NextResponse.json(
      { error: "Failed to create progress note", details: error.message },
      { status: 500 }
    )
  }
}
