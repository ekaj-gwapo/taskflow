import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
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
      INSERT INTO step_notes (id, content, stepId, authorId, authorName, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [noteId, content, (await params).stepId, auth.user!.id, auth.user!.name, new Date().toISOString(), new Date().toISOString()]);

    const stepNote = await db.getOne("SELECT * FROM step_notes WHERE id = ?", [noteId]);

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
