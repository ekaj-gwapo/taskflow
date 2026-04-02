import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/auth-utils"
import db from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

      const taskId = (await params).id?.toLowerCase()

    const task: any = await db.getOne(`
      SELECT t.*, 
             u1.name as assigneeName, u1.email as assigneeEmail, u1.role as assigneeRole,
             u2.name as creatorName, u2.email as creatorEmail, u2.role as creatorRole,
             u3.name as delegatorName, u3.email as delegatorEmail, u3.role as delegatorRole, u3.avatarUrl as delegatorAvatar
      FROM tasks t
      LEFT JOIN users u1 ON t.assigneeId = u1.id
      LEFT JOIN users u2 ON t.createdById = u2.id
      LEFT JOIN users u3 ON t.delegatedById = u3.id
      WHERE LOWER(t.id) = ?
    `, [taskId])

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check access: admin can view all, employee can only view their own
    if (auth.user!.role === "EMPLOYEE") {
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

    const actionSteps = await db.getAll("SELECT * FROM action_steps WHERE taskId = ?", [taskId])
    const actionStepsWithNotes = await Promise.all((actionSteps as any[]).map(async (as: any) => ({
      ...as,
      notes: await db.getAll("SELECT * FROM step_notes WHERE stepId = ?", [as.id])
    })))
    const progressNotes = await db.getAll("SELECT * FROM progress_notes WHERE taskId = ?", [taskId])

    const assigneesData = await db.getAll(`
      SELECT u.id, u.name, u.email, u.role, u.avatarUrl as avatar, ta.points
      FROM task_assignments ta
      JOIN users u ON ta.userId = u.id
      WHERE ta.taskId = ?
    `, [taskId]) as any[]

    const formattedTask = {
      ...task,
      status: task.status ? task.status.toLowerCase().replace('_', '-') : 'todo',
      assignees: assigneesData,
      assigneeId: assigneesData[0]?.id || null,
      assigneeName: assigneesData[0]?.name || null,
      assignee: assigneesData[0] ? { ...assigneesData[0], role: assigneesData[0].role?.toLowerCase() } : null,
      createdBy: task.createdById ? { id: task.createdById, name: task.creatorName, email: task.creatorEmail, role: task.creatorRole } : null,
      delegatedBy: task.delegatedById ? { id: task.delegatedById, name: task.delegatorName, email: task.delegatorEmail, role: task.delegatorRole, avatar: task.delegatorAvatar } : null,
      actionSteps: actionStepsWithNotes,
      progressNotes
    }

    return NextResponse.json({ task: formattedTask }, { status: 200 })
  } catch (error) {
    console.error("Get task error:", error)
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { status, priority, assigneeIds } = await request.json()
    console.debug("PUT /api/tasks/:id", { id: (await params).id, body: { status, priority, assigneeIds }, user: auth.user })

    const taskId = (await params).id?.toLowerCase()

    // Fetch task to check ownership
    const existingTask: any = await db.getOne("SELECT * FROM tasks WHERE LOWER(id) = ?", [taskId])
    if (!existingTask) {
      console.warn("Task not found in DB", { id: (await params).id })
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Permission check:
    // ADMIN/SUPERADMIN can update anything
    // EMPLOYEE can only update status if they are the assignee
    const role = auth.user!.role.toUpperCase()
    if (role === "EMPLOYEE") {
      const assignment = await db.getOne(
        "SELECT 1 FROM task_assignments WHERE taskId = ? AND userId = ?",
        [taskId, auth.user!.id]
      )

      if (!assignment && existingTask.assigneeId?.toLowerCase() !== auth.user!.id.toLowerCase()) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
      
      // Employees can only update status
      if (priority !== undefined && priority !== existingTask.priority) {
        return NextResponse.json({ error: "Employees cannot update priority" }, { status: 403 })
      }
    } else if (role === "ADMIN" || role === "HEAD_ADMIN") {
        // ADMIN and HEAD_ADMIN can update priority and assignee.
        // They are allowed to update status ONLY if they are assigned to the task.
        if (status !== undefined) {
            const assignment = await db.getOne(
                "SELECT 1 FROM task_assignments WHERE taskId = ? AND userId = ?",
                [taskId, auth.user!.id]
            )
            
            if (!assignment && existingTask.assigneeId?.toLowerCase() !== auth.user!.id.toLowerCase()) {
                return NextResponse.json({ error: "Admins are restricted from updating status of tasks not assigned to them" }, { status: 403 })
            }
        }
    }


    const dbStatus = status ? status.toUpperCase().replace('-', '_') : null
    let completedAt = null
    
    // Logic for completedAt:
    // 1. If moving to COMPLETED, set to now
    // 2. If moving FROM COMPLETED to something else, clear it (null)
    // 3. Otherwise, keep existing
    if (dbStatus === "COMPLETED") {
      completedAt = new Date().toISOString()
    } else if (dbStatus && existingTask.status === "COMPLETED") {
      completedAt = null
    } else {
      completedAt = existingTask.completedAt
    }

    let newDelegatedById = existingTask.delegatedById;
    let newDelegatedAt = existingTask.delegatedAt;
    let newAssigneeId = existingTask.assigneeId;
    if (assigneeIds !== undefined && (role === "ADMIN" || role === "SUPERADMIN" || role === "HEAD_ADMIN")) {
      if (role === "ADMIN") {
        newDelegatedById = auth.user!.id;
        newDelegatedAt = new Date().toISOString();
      } else if (role === "SUPERADMIN" || role === "HEAD_ADMIN") {
        newDelegatedById = null;
        newDelegatedAt = null;
      }
      newAssigneeId = assigneeIds.length > 0 ? assigneeIds[0] : null;
    }

    await db.execute(`
      UPDATE tasks 
      SET status = COALESCE(?, status), 
          priority = COALESCE(?, priority),
          completedAt = COALESCE(?, completedAt),
          delegatedById = ?,
          delegatedAt = ?,
          assigneeId = ?,
          updatedAt = ?
      WHERE LOWER(id) = ?
    `, [dbStatus, priority ? priority.toUpperCase() : null, completedAt, newDelegatedById, newDelegatedAt, newAssigneeId, new Date().toISOString(), (await params).id?.toLowerCase()])

    // Handle task_assignments if updating assignees
    if (assigneeIds !== undefined && (role === "ADMIN" || role === "SUPERADMIN" || role === "HEAD_ADMIN")) {
      await db.execute("DELETE FROM task_assignments WHERE LOWER(taskId) = ?", [(await params).id?.toLowerCase()]);
      
      for (const uId of assigneeIds) {
        await db.execute("INSERT INTO task_assignments (taskId, userId, points) VALUES (?, ?, ?)", [(await params).id?.toLowerCase(), uId, 0]);
      }
    }

    // Dynamic points logic: recalculate points for all task assignees based on completion status
    const currentPriorityForPoints = (priority || existingTask.priority || "MEDIUM").toUpperCase();
    let finalPoints = 4;
    if (currentPriorityForPoints === "MEDIUM") finalPoints = 7;
    if (currentPriorityForPoints === "HIGH") finalPoints = 10;
    
    const currentStatusForPoints = dbStatus || existingTask.status;
    const currentCompletedAtForPoints = completedAt || (currentStatusForPoints === "COMPLETED" ? existingTask.completedAt : null);
    
    if (currentStatusForPoints === "COMPLETED" && currentCompletedAtForPoints && existingTask.dueDate && existingTask.createdAt) {
      const createdAtMs = new Date(existingTask.createdAt).getTime();
      const dueDateMs = new Date(existingTask.dueDate).getTime();
      const completedMs = new Date(currentCompletedAtForPoints).getTime();
      const totalAllowed = dueDateMs - createdAtMs;
      const timeTaken = completedMs - createdAtMs;
      
      // Early completion logic
      if (totalAllowed > 0 && timeTaken > 0) {
        if (timeTaken <= totalAllowed * 0.3) {
          finalPoints += 3;
        } else if (timeTaken <= totalAllowed * 0.5) {
          finalPoints += 2;
        }
      }
      
      // Late penalty logic
      if (completedMs > dueDateMs) {
        const msPerDay = 1000 * 60 * 60 * 24;
        const lateDays = Math.ceil((completedMs - dueDateMs) / msPerDay);
        if (lateDays === 1) finalPoints -= 1;
        else if (lateDays >= 2 && lateDays <= 3) finalPoints -= 2;
        else if (lateDays >= 4 && lateDays <= 7) finalPoints -= 3;
        else if (lateDays > 7) finalPoints -= 5;
      }
      
      if (finalPoints > 12) finalPoints = 12;
      if (finalPoints < 0) finalPoints = 0;
    }
    
    // Update all current assignees with final calculated points
    await db.execute("UPDATE task_assignments SET points = ? WHERE LOWER(taskId) = ?", [finalPoints, (await params).id?.toLowerCase()]);

    // Fetch updated task
    const task: any = await db.getOne(`
      SELECT t.*, 
             u1.name as assigneeName, u1.email as assigneeEmail, u1.role as assigneeRole,
             u2.name as creatorName, u2.email as creatorEmail, u2.role as creatorRole,
             u3.name as delegatorName, u3.email as delegatorEmail, u3.role as delegatorRole, u3.avatarUrl as delegatorAvatar
      FROM tasks t
      LEFT JOIN users u1 ON t.assigneeId = u1.id
      LEFT JOIN users u2 ON t.createdById = u2.id
      LEFT JOIN users u3 ON t.delegatedById = u3.id
      WHERE LOWER(t.id) = ?
    `, [(await params).id?.toLowerCase()])

    const actionSteps = await db.getAll("SELECT * FROM action_steps WHERE taskId = ?", [taskId])
    const actionStepsWithNotes = await Promise.all((actionSteps as any[]).map(async (as: any) => ({
      ...as,
      notes: await db.getAll("SELECT * FROM step_notes WHERE stepId = ?", [as.id])
    })))
    const progressNotes = await db.getAll("SELECT * FROM progress_notes WHERE taskId = ?", [taskId])

    const assigneesData = await db.getAll(`
      SELECT u.id, u.name, u.email, u.role, u.avatarUrl as avatar, ta.points
      FROM task_assignments ta
      JOIN users u ON ta.userId = u.id
      WHERE ta.taskId = ?
    `, [taskId]) as any[]

    const formattedTask = {
      ...task,
      status: task.status ? task.status.toLowerCase().replace('_', '-') : 'todo',
      assignees: assigneesData,
      assigneeId: assigneesData[0]?.id || null,
      assigneeName: assigneesData[0]?.name || null,
      assignee: assigneesData[0] ? { ...assigneesData[0], role: assigneesData[0].role?.toLowerCase() } : null,
      createdBy: task.createdById ? { id: task.createdById, name: task.creatorName, email: task.creatorEmail, role: task.creatorRole } : null,
      delegatedBy: task.delegatedById ? { id: task.delegatedById, name: task.delegatorName, email: task.delegatorEmail, role: task.delegatorRole, avatar: task.delegatorAvatar } : null,
      actionSteps: actionStepsWithNotes,
      progressNotes
    }

    return NextResponse.json(
      { message: "Task updated successfully", task: formattedTask },
      { status: 200 }
    )
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdmin(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const taskId = (await params).id?.toLowerCase()
    
    // Explicitly delete related data in order to avoid foreign key issues
    // and ensure no orphaned records remain.
    await db.execute("DELETE FROM step_notes WHERE stepId IN (SELECT id FROM action_steps WHERE taskId = ?)", [taskId])
    await db.execute("DELETE FROM action_steps WHERE taskId = ?", [taskId])
    await db.execute("DELETE FROM progress_notes WHERE taskId = ?", [taskId])
    await db.execute("DELETE FROM tasks WHERE LOWER(id) = ?", [taskId])

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    )
  }
}
