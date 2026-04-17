import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"
import { logActivity } from "@/lib/activity"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { completed, isActed } = await request.json()

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

    const currentStep: any = await db.getOne("SELECT completed, isActed FROM action_steps WHERE id = ?", [(await params).stepId]);
    const newCompleted = completed !== undefined ? (completed ? 1 : 0) : currentStep.completed;
    let newIsActed = isActed !== undefined ? (isActed ? 1 : 0) : currentStep.isActed;

    // Automatically mark as acted if it's being marked completed
    if (newCompleted === 1) {
      newIsActed = 1;
    }

    await db.execute(`
      UPDATE action_steps 
      SET completed = ?, 
          isActed = ?,
          updatedAt = ?
      WHERE id = ?
    `, [newCompleted, newIsActed, new Date().toISOString(), (await params).stepId]);

    const step = await db.getOne("SELECT title FROM action_steps WHERE id = ?", [(await params).stepId]) as any;
    
    await logActivity({
      action: "STEP_UPDATED",
      entityId: taskId,
      entityType: "TASK",
      userId: auth.user!.id,
      userName: auth.user!.name,
      details: { 
        stepId: (await params).stepId, 
        title: step?.title,
        completed: !!newCompleted,
        isActed: !!newIsActed
      }
    });

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

    // Only administrators can delete action steps.
    // However, if an ADMIN or HEAD_ADMIN is assigned to the task, they act as a worker and cannot delete steps.
    const role = auth.user!.role?.toUpperCase();
    if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "HEAD_ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can delete action steps" },
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
          { error: "Assigned administrators cannot delete action steps" },
          { status: 403 }
        )
      }
    }

    const step = await db.getOne("SELECT title FROM action_steps WHERE id = ?", [(await params).stepId]) as any;

    await db.execute("DELETE FROM action_steps WHERE id = ?", [(await params).stepId]);

    await logActivity({
      action: "STEP_DELETED",
      entityId: taskId,
      entityType: "TASK",
      userId: auth.user!.id,
      userName: auth.user!.name,
      details: { stepId: (await params).stepId, title: step?.title }
    });

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
