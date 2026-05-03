import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { logActivity } from "@/lib/activity"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
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

    // Verify task exists
    const task: any = await db.getOne("SELECT * FROM tasks WHERE id = ?", [(await params).id]);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Employee can only add notes to steps in their own tasks
    const role = auth.user!.role?.toUpperCase()
    if (role === "EMPLOYEE") {
      const assignment = await db.getOne(
        "SELECT 1 FROM task_assignments WHERE taskId = ? AND userId = ?",
        [(await params).id, auth.user!.id]
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
      INSERT INTO step_notes (id, content, stepId, authorName, createdAt, attachmentUrl, attachmentName, attachmentType)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      noteId, 
      content, 
      (await params).stepId, 
      auth.user!.name, 
      new Date().toISOString(), 
      attachmentUrl || null,
      attachmentName || null,
      attachmentType || null
    ]);


    await logActivity({
      action: "STEP_NOTE_ADDED",
      entityId: (await params).id,
      entityType: "TASK",
      userId: auth.user!.id,
      userName: auth.user!.name,
      details: { stepId: (await params).stepId, noteId, content }
    });

    const rawStepNote = await db.getOne("SELECT * FROM step_notes WHERE id = ?", [noteId]) as any;
    const stepNote = {
      ...rawStepNote,
      authorName: rawStepNote.authorName || rawStepNote.authorname,
      attachmentUrl: rawStepNote.attachmentUrl || rawStepNote.attachmenturl,
      attachmentName: rawStepNote.attachmentName || rawStepNote.attachmentname,
      attachmentType: rawStepNote.attachmentType || rawStepNote.attachmenttype,
      createdAt: rawStepNote.createdAt || rawStepNote.createdat
    };

    // Notify relevant users
    try {
      const taskId = (await params).id;
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
        const notificationTitle = `New Step Note on "${task.title}"`;
        const notificationMessage = `${auth.user!.name} added a note to a step: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`;
        
        for (const userId of notifyUserIds) {
          await db.execute(
            "INSERT INTO notifications (id, userId, type, title, message, link, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [uuidv4(), userId, "STEP_NOTE_ADDED", notificationTitle, notificationMessage, `/tasks/${taskId}`, now]
          );
        }
      }
    } catch (notifError) {
      console.error("Failed to create step note notifications:", notifError);
    }

    return NextResponse.json(
      { message: "Note created successfully", note: stepNote },
      { status: 201 }
    )

  } catch (error: any) {
    console.error("Create step note error:", error)
    return NextResponse.json(
      { error: "Failed to create note", details: error.message },
      { status: 500 }
    )
  }
}
