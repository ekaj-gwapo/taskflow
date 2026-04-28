import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/auth-utils"
import db from "@/lib/db"
import { logActivity, ActivityAction } from "@/lib/activity"

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
      WHERE t.id = ?
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
  const resolvedParams = await params;
  const taskId = resolvedParams.id;

  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { status, priority, assigneeIds, archived, dueDate } = await request.json()
    console.debug("PUT /api/tasks/:id", { id: taskId, body: { status, priority, assigneeIds, archived, dueDate }, user: auth.user })

    // Fetch task using case-insensitive search but keep track of the REAL ID from the database
    const existingTask: any = await db.getOne("SELECT * FROM tasks WHERE id = ?", [taskId])
    if (!existingTask) {
      console.warn("Task not found in DB", { id: taskId })
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const realTaskId = existingTask.id;
    const role = auth.user!.role.toUpperCase()

    // Permission check:
    if (role === "EMPLOYEE") {
      const assignment = await db.getOne(
        "SELECT 1 FROM task_assignments WHERE taskId = ? AND userId = ?",
        [realTaskId, auth.user!.id]
      )

      if (!assignment && existingTask.assigneeId?.toLowerCase() !== auth.user!.id.toLowerCase()) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
      
      // Employees can only update status
      if (priority !== undefined && priority !== existingTask.priority) {
        return NextResponse.json({ error: "Employees cannot update priority" }, { status: 403 })
      }

      if (archived !== undefined) {
        return NextResponse.json({ error: "Employees cannot archive tasks" }, { status: 403 })
      }

      if (dueDate !== undefined) {
        return NextResponse.json({ error: "Employees cannot update due date" }, { status: 403 })
      }
    } else if (role === "ADMIN" || role === "HEAD_ADMIN") {
      // ADMIN and HEAD_ADMIN can update priority and assignee.
      // They are allowed to update status ONLY if they are assigned to the task.
      if (status !== undefined) {
        const assignment = await db.getOne(
          "SELECT 1 FROM task_assignments WHERE taskId = ? AND userId = ?",
          [realTaskId, auth.user!.id]
        )
        
        if (!assignment && existingTask.assigneeId?.toLowerCase() !== auth.user!.id.toLowerCase()) {
          return NextResponse.json({ error: "Admins are restricted from updating status of tasks not assigned to them" }, { status: 403 })
        }
      }
    }
    // SUPERADMIN has no restrictions

    const dbStatus = status ? status.toUpperCase().replace('-', '_') : null
    let completedAt = null
    
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
      newDelegatedById = auth.user!.id;
      newDelegatedAt = new Date().toISOString();
      newAssigneeId = assigneeIds.length > 0 ? assigneeIds[0] : null;
    }

    await db.execute(`
      UPDATE tasks 
      SET status = COALESCE(?, status), 
          priority = COALESCE(?, priority),
          dueDate = COALESCE(?, dueDate),
          completedAt = COALESCE(?, completedAt),
          delegatedById = ?,
          delegatedAt = ?,
          assigneeId = ?,
          archived = COALESCE(?, archived),
          updatedAt = ?
      WHERE id = ?
    `, [
      dbStatus, 
      priority ? priority.toUpperCase() : null, 
      dueDate ? new Date(dueDate).toISOString() : null,
      completedAt, 
      newDelegatedById, 
      newDelegatedAt, 
      newAssigneeId, 
      archived !== undefined ? archived : null,
      new Date().toISOString(), 
      realTaskId
    ])

    // Handle task_assignments if updating assignees
    if (assigneeIds !== undefined && (role === "ADMIN" || role === "SUPERADMIN" || role === "HEAD_ADMIN")) {
      // Get current assignees BEFORE deleting them to compare for logging
      const currentAssigneeIds = (await db.getAll("SELECT userId FROM task_assignments WHERE taskId = ?", [realTaskId]) as any[]).map(r => r.userId);
      const newAssigneeIds = [...assigneeIds];
      
      const addedIds = newAssigneeIds.filter(id => !currentAssigneeIds.includes(id));
      const removedIds = currentAssigneeIds.filter(id => !newAssigneeIds.includes(id));

      if (addedIds.length > 0 || removedIds.length > 0) {
        // Fetch names for logging
        let addedNames: string[] = [];
        let removedNames: string[] = [];

        if (addedIds.length > 0) {
          const addedUsers = await db.getAll(`SELECT name FROM users WHERE id IN (${addedIds.map(() => '?').join(',')})`, addedIds) as any[];
          addedNames = addedUsers.map(u => u.name);
        }

        if (removedIds.length > 0) {
          const removedUsers = await db.getAll(`SELECT name FROM users WHERE id IN (${removedIds.map(() => '?').join(',')})`, removedIds) as any[];
          removedNames = removedUsers.map(u => u.name);
        }

        // Update assignments
        await db.execute("DELETE FROM task_assignments WHERE LOWER(taskId) = LOWER(?)", [realTaskId]);
        for (const uId of assigneeIds) {
          await db.execute("INSERT INTO task_assignments (taskId, userId, points) VALUES (?, ?, ?) ON CONFLICT (taskId, userId) DO UPDATE SET points = EXCLUDED.points", [realTaskId, uId, 0]);
        }

        let action: ActivityAction = "ASSIGNEE_CHANGED";
        if (role === "HEAD_ADMIN" || role === "SUPERADMIN") {
          action = "TASK_DELEGATED";
        } else if (newAssigneeIds.length === 1 && currentAssigneeIds.length === 0) {
          action = "TASK_REASSIGNED";
        } else {
          action = "TEAM_MEMBERS_EDITED";
        }

        await logActivity({
          action,
          entityId: realTaskId,
          entityType: "TASK",
          userId: auth.user!.id,
          userName: auth.user!.name,
          details: { 
            added: addedNames,
            removed: removedNames,
            title: existingTask.title
          }
        });
      }
    }

    // Recalculate points
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
      
      if (totalAllowed > 0 && timeTaken > 0) {
        if (timeTaken <= totalAllowed * 0.3) finalPoints += 3;
        else if (timeTaken <= totalAllowed * 0.5) finalPoints += 2;
      }
      
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
    
    await db.execute("UPDATE task_assignments SET points = ? WHERE LOWER(taskId) = LOWER(?)", [finalPoints, realTaskId]);

    if (status && dbStatus !== existingTask.status) {
      await logActivity({
        action: "STATUS_UPDATED",
        entityId: realTaskId,
        entityType: "TASK",
        userId: auth.user!.id,
        userName: auth.user!.name,
        details: { from: existingTask.status, to: dbStatus }
      });
    }

    if (archived !== undefined && archived !== !!existingTask.archived) {
      await logActivity({
        action: archived ? "TASK_ARCHIVED" : "TASK_RESTORED",
        entityId: realTaskId,
        entityType: "TASK",
        userId: auth.user!.id,
        userName: auth.user!.name,
        details: { title: existingTask.title }
      });
    }



    // Fetch updated task data
    const task: any = await db.getOne(`
      SELECT t.*, 
             u1.name as assigneeName, u1.email as assigneeEmail, u1.role as assigneeRole,
             u2.name as creatorName, u2.email as creatorEmail, u2.role as creatorRole,
             u3.name as delegatorName, u3.email as delegatorEmail, u3.role as delegatorRole, u3.avatarUrl as delegatorAvatar
      FROM tasks t
      LEFT JOIN users u1 ON t.assigneeId = u1.id
      LEFT JOIN users u2 ON t.createdById = u2.id
      LEFT JOIN users u3 ON t.delegatedById = u3.id
      WHERE t.id = ?
    `, [realTaskId])

    const actionSteps = await db.getAll("SELECT * FROM action_steps WHERE taskId = ?", [realTaskId])
    const actionStepsWithNotes = await Promise.all((actionSteps as any[]).map(async (as: any) => ({
      ...as,
      notes: await db.getAll("SELECT * FROM step_notes WHERE stepId = ?", [as.id])
    })))
    const progressNotes = await db.getAll("SELECT * FROM progress_notes WHERE taskId = ?", [realTaskId])

    const assigneesData = await db.getAll(`
      SELECT u.id, u.name, u.email, u.role, u.avatarUrl as avatar, ta.points
      FROM task_assignments ta
      JOIN users u ON ta.userId = u.id
      WHERE ta.taskId = ?
    `, [realTaskId]) as any[]

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
  } catch (error: any) {
    console.error("Update task error:", error)
    return NextResponse.json(
      { error: "Failed to update task", details: error.message },
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
    
    // Explicitly check if task is completed
    const existingTask: any = await db.getOne("SELECT status, title FROM tasks WHERE LOWER(id) = ?", [taskId])
    if (existingTask && existingTask.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Completed tasks cannot be deleted" },
        { status: 403 }
      )
    }

    // Explicitly delete related data in order to avoid foreign key issues
    // and ensure no orphaned records remain.
    await db.execute("DELETE FROM step_notes WHERE stepId IN (SELECT id FROM action_steps WHERE taskId = ?)", [taskId])
    await db.execute("DELETE FROM action_steps WHERE taskId = ?", [taskId])
    await db.execute("DELETE FROM progress_notes WHERE taskId = ?", [taskId])
    await db.execute("DELETE FROM tasks WHERE id = ?", [taskId])

    await logActivity({
      action: "TASK_DELETED",
      entityId: taskId,
      entityType: "TASK",
      userId: auth.user!.id,
      userName: auth.user!.name,
      details: { title: existingTask.title || "Unknown Task" }
    });

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
