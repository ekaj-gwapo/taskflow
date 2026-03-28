import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"
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

    const { title } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    // Verify task exists and user can access it
    const taskId = (await params).id?.toLowerCase()
    const task: any = await db.getOne("SELECT * FROM tasks WHERE LOWER(id) = ?", [taskId]);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Only ADMIN or SUPERADMIN can add steps.
    // However, if an ADMIN or HEAD_ADMIN is assigned to the task, they act as a worker and cannot add steps.
    const role = auth.user!.role?.toUpperCase();
    if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "HEAD_ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can add action steps" },
        { status: 403 }
      )
    }

    if (role === "ADMIN" || role === "HEAD_ADMIN") {
      const isAssignee = await db.getOne(
        "SELECT 1 FROM task_assignments WHERE taskId = ? AND userId = ?",
        [taskId, auth.user!.id]
      )
      if (isAssignee || task.assigneeId?.toLowerCase() === auth.user!.id.toLowerCase()) {
        return NextResponse.json(
          { error: "Assigned administrators cannot add new action steps" },
          { status: 403 }
        )
      }
    }

    const stepId = uuidv4();
    await db.execute(`
      INSERT INTO action_steps (id, title, taskId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `, [stepId, title, taskId, new Date().toISOString(), new Date().toISOString()]);

    const actionStep = {
      ...(await db.getOne("SELECT * FROM action_steps WHERE id = ?", [stepId]) as any),
      notes: []
    };

    return NextResponse.json(
      { message: "Action step created successfully", actionStep },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create action step error:", error)
    return NextResponse.json(
      { error: "Failed to create action step", details: error.message },
      { status: 500 }
    )
  }
}
