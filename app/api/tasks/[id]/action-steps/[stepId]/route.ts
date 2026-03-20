import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { completed } = await request.json()

    const taskId = (await params).id?.toLowerCase()
    // Verify task exists
    const task: any = await db.getOne("SELECT * FROM tasks WHERE LOWER(id) = ?", [taskId]);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Employee can only update steps for their own tasks
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

    await db.execute(`
      UPDATE action_steps 
      SET completed = ?, 
          updatedAt = ?
      WHERE id = ?
    `, [completed ? 1 : 0, new Date().toISOString(), (await params).stepId]);

    const actionStep = {
      ...(await db.getOne("SELECT * FROM action_steps WHERE id = ?", [(await params).stepId]) as any),
      notes: await db.getAll("SELECT * FROM step_notes WHERE stepId = ?", [(await params).stepId])
    };

    return NextResponse.json(
      { message: "Action step updated successfully", actionStep },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Update action step error:", error)
    return NextResponse.json(
      { error: "Failed to update action step", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const taskId = (await params).id?.toLowerCase()
    // Verify task exists
    const task: any = await db.getOne("SELECT * FROM tasks WHERE LOWER(id) = ?", [taskId]);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Only ADMIN or SUPERADMIN can delete steps
    const role = auth.user!.role?.toUpperCase();
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Only administrators can delete action steps" },
        { status: 403 }
      )
    }

    await db.execute("DELETE FROM action_steps WHERE id = ?", [(await params).stepId]);

    return NextResponse.json(
      { message: "Action step deleted successfully" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Delete action step error:", error)
    return NextResponse.json(
      { error: "Failed to delete action step", details: error.message },
      { status: 500 }
    )
  }
}
