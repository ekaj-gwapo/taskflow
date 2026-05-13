import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/auth-utils"
import db from "@/lib/db"
import { logActivity, ActivityAction } from "@/lib/activity"
import { notifyTaskCompleted } from "@/lib/notify"
import { v4 as uuidv4 } from "uuid"

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

    const actionSteps = await db.getAll("SELECT * FROM action_steps WHERE taskId = ? ORDER BY createdAt ASC", [taskId])
    const actionStepsWithNotes = await Promise.all((actionSteps as any[]).map(async (as: any) => {
      const notes = await db.getAll("SELECT * FROM step_notes WHERE stepId = ?", [as.id]) as any[];
      return {
        ...as,
        isActed: as.isActed !== undefined ? as.isActed : as.isacted,
        completed: as.completed !== undefined ? as.completed : as.completed, 
        createdAt: as.createdAt || as.createdat,
        updatedAt: as.updatedAt || as.updatedat,
        notes: (notes || []).map(n => ({
          ...n,
          authorName: n.authorName || n.authorname,
          attachmentUrl: n.attachmentUrl || n.attachmenturl,
          attachmentName: n.attachmentName || n.attachmentname,
          attachmentType: n.attachmentType || n.attachmenttype,
          createdAt: n.createdAt || n.createdat
        }))
      };
    }))


    const progressNotesRaw = await db.getAll("SELECT * FROM progress_notes WHERE taskId = ?", [taskId])
    const progressNotes = (progressNotesRaw as any[]).map(n => ({
      ...n,
      authorId: n.authorId || n.authorid,
      authorName: n.authorName || n.authorname,
      attachmentUrl: n.attachmentUrl || n.attachmenturl,
      attachmentName: n.attachmentName || n.attachmentname,
      attachmentType: n.attachmentType || n.attachmenttype,
      createdAt: n.createdAt || n.createdat,
      updatedAt: n.updatedAt || n.updatedat
    }))


    const assigneesData = await db.getAll(`
      SELECT u.id, u.name, u.email, u.role, u.avatarUrl as avatar, ta.points
      FROM task_assignments ta
      JOIN users u ON ta.userId = u.id
      WHERE ta.taskId = ?
    `, [taskId]) as any[]

    return NextResponse.json({ 
      task: {
        ...task,
        status: task.status ? task.status.toLowerCase().replace('_', '-') : 'todo',
        assignees: assigneesData,
        assigneeId: assigneesData[0]?.id || null,
        assigneeName: assigneesData[0]?.name || null,
        assignee: assigneesData[0] ? { ...assigneesData[0], role: assigneesData[0].role?.toLowerCase() } : null,
        createdBy: (task.createdById || task.createdbyid) ? { 
          id: task.createdById || task.createdbyid, 
          name: task.creatorName || task.creatorname, 
          email: task.creatorEmail || task.creatoremail, 
          role: task.creatorRole || task.creatorrole,
          avatar: task.creatorAvatar || task.creatoravatar
        } : null,
        delegatedBy: (task.delegatedById || task.delegatedbyid) ? { 
          id: task.delegatedById || task.delegatedbyid, 
          name: task.delegatorName || task.delegatorname, 
          email: task.delegatorEmail || task.delegatoremail, 
          role: task.delegatorRole || task.delegatorrole, 
          avatar: task.delegatorAvatar || task.delegatoravatar 
        } : null,
        actionSteps: actionStepsWithNotes,
        progressNotes,
        createdAt: task.createdAt || task.createdat,
        updatedAt: task.updatedAt || task.updatedat,
        dueDate: task.dueDate || task.duedate || null,
        completedAt: task.completedAt || task.completedat || null,
        extensionRequests: (await db.getAll(
          "SELECT * FROM extension_requests WHERE taskId = ? ORDER BY createdAt DESC",
          [taskId]
        ) as any[]).map((er: any) => ({
          ...er,
          requestedById: er.requestedById || er.requestedbyid,
          requestedByName: er.requestedByName || er.requestedbyname,
          currentDueDate: er.currentDueDate || er.currentduedate,
          proposedDueDate: er.proposedDueDate || er.proposedduedate,
          reviewedById: er.reviewedById || er.reviewedbyid,
          reviewedByName: er.reviewedByName || er.reviewedbyname,
          reviewerRemark: er.reviewerRemark || er.reviewerremark,
          reviewedAt: er.reviewedAt || er.reviewedat,
          createdAt: er.createdAt || er.createdat
        })),
      } 
    }, { status: 200 })
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

    // Fetch task using the ID
    const existingTask: any = await db.getOne("SELECT * FROM tasks WHERE id = ?", [taskId])
    if (!existingTask) {
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
        
        const isAssignee = assignment || existingTask.assigneeid?.toLowerCase() === auth.user!.id.toLowerCase() || existingTask.assigneeId?.toLowerCase() === auth.user!.id.toLowerCase()

        if (!isAssignee) {
          return NextResponse.json({ error: "Only the assigned user can update the task status" }, { status: 403 })
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
      const isOnlySelf = assigneeIds.length === 1 && assigneeIds[0] === auth.user!.id;
      const isEmpty = assigneeIds.length === 0;
      
      if (isOnlySelf || isEmpty) {
        newDelegatedById = null;
        newDelegatedAt = null;
      } else {
        newDelegatedById = auth.user!.id;
        newDelegatedAt = new Date().toISOString();
      }
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
    if (assigneeIds !== undefined && Array.isArray(assigneeIds) && (role === "ADMIN" || role === "SUPERADMIN" || role === "HEAD_ADMIN")) {
      // Get current assignees BEFORE deleting them to compare for logging
      const currentAssigneeRows = (await db.getAll("SELECT userId FROM task_assignments WHERE taskId = ?", [realTaskId]) as any[]) || [];
      const currentAssigneeIds: string[] = currentAssigneeRows.map(r => String(r.userId || r.userid || "").toLowerCase()).filter(Boolean);
      const newAssigneeIds: string[] = assigneeIds.map((aId: any) => String(aId || "").toLowerCase()).filter(Boolean);
      
      const addedIds = newAssigneeIds.filter(aId => !currentAssigneeIds.includes(aId));
      const removedIds = currentAssigneeIds.filter(aId => !newAssigneeIds.includes(aId));

      if (addedIds.length > 0 || removedIds.length > 0) {
        // Fetch names for logging
        let addedNames: string[] = [];
        let removedNames: string[] = [];

        if (addedIds.length > 0) {
          const placeholders = addedIds.map(() => '?').join(',');
          const addedUsers = await db.getAll(`SELECT name FROM users WHERE id IN (${placeholders})`, addedIds) as any[];
          addedNames = addedUsers.map(u => u.name);
        }

        if (removedIds.length > 0) {
          const placeholders = removedIds.map(() => '?').join(',');
          const removedUsers = await db.getAll(`SELECT name FROM users WHERE id IN (${placeholders})`, removedIds) as any[];
          removedNames = removedUsers.map(u => u.name);
        }

        // Update assignments
        await db.execute("DELETE FROM task_assignments WHERE taskId = ?", [realTaskId]);
        for (const uId of newAssigneeIds) {
          await db.execute("INSERT INTO task_assignments (taskId, userId, points) VALUES (?, ?, ?) ON CONFLICT (taskId, userId) DO UPDATE SET points = EXCLUDED.points", [realTaskId, uId, 0]);
        }

        let action: ActivityAction = "ASSIGNEE_CHANGED";
        if (addedIds.length > 0 && removedIds.length > 0) {
          action = "TEAM_MEMBERS_EDITED";
        } else if (removedIds.length > 0) {
          action = "MEMBER_REMOVED";
        } else if (addedIds.length > 0) {
          action = "TEAM_MEMBERS_EDITED"; // Will display as "added" in the view
        } else if (role === "HEAD_ADMIN" || role === "SUPERADMIN") {
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
    
    await db.execute("UPDATE task_assignments SET points = ? WHERE taskId = ?", [finalPoints, realTaskId]);

    if (status && dbStatus !== existingTask.status) {
      await logActivity({
        action: "STATUS_UPDATED",
        entityId: realTaskId,
        entityType: "TASK",
        userId: auth.user!.id,
        userName: auth.user!.name,
        details: { from: existingTask.status, to: dbStatus }
      });

      // Notify task creator when an employee completes the task
      if (dbStatus === "COMPLETED" && existingTask.createdById && existingTask.createdById !== auth.user!.id) {
        notifyTaskCompleted({
          creatorId: existingTask.createdById,
          completedByName: auth.user!.name,
          taskTitle: existingTask.title,
          taskId: realTaskId,
        });
      }
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

    if (dueDate !== undefined) {
      const oldDueDate = existingTask.dueDate || existingTask.duedate;
      const newDueDate = new Date(dueDate).toISOString();
      
      if (oldDueDate !== newDueDate) {
        await logActivity({
          action: "DUE_DATE_UPDATED",
          entityId: realTaskId,
          entityType: "TASK",
          userId: auth.user!.id,
          userName: auth.user!.name,
          details: { 
            title: existingTask.title,
            from: oldDueDate,
            to: newDueDate
          }
        });

        // Notify all assignees about the due date adjustment
        const assignees = await db.getAll("SELECT userId FROM task_assignments WHERE taskId = ?", [realTaskId]) as any[];
        const now = new Date().toISOString();

        for (const assignee of assignees) {
          const assigneeId = assignee.userId || assignee.userid;
          // Don't notify the person who made the change
          if (assigneeId && assigneeId !== auth.user!.id) {
            await db.execute(
              "INSERT INTO notifications (id, userId, type, title, message, link, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [
                uuidv4(),
                assigneeId,
                "DUE_DATE_UPDATED",
                "Due Date Adjusted",
                `The due date for "${existingTask.title}" has been adjusted by ${auth.user!.name}.`,
                `/tasks/${realTaskId}`,
                now
              ]
            );
          }
        }
      }
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

    const actionSteps = await db.getAll("SELECT * FROM action_steps WHERE taskId = ? ORDER BY createdAt ASC", [realTaskId])
    const actionStepsWithNotes = await Promise.all((actionSteps as any[]).map(async (as: any) => {
      const notes = await db.getAll("SELECT * FROM step_notes WHERE stepId = ?", [as.id]) as any[];
      return {
        ...as,
        isActed: as.isActed !== undefined ? as.isActed : as.isacted,
        completed: as.completed !== undefined ? as.completed : as.completed,
        createdAt: as.createdAt || as.createdat,
        updatedAt: as.updatedAt || as.updatedat,
        notes: (notes || []).map(n => ({
          ...n,
          authorName: n.authorName || n.authorname,
          attachmentUrl: n.attachmentUrl || n.attachmenturl,
          attachmentName: n.attachmentName || n.attachmentname,
          attachmentType: n.attachmentType || n.attachmenttype,
          createdAt: n.createdAt || n.createdat
        }))
      };
    }))
    const progressNotesRaw = await db.getAll("SELECT * FROM progress_notes WHERE taskId = ?", [realTaskId])
    const progressNotes = (progressNotesRaw as any[]).map(n => ({
      ...n,
      authorId: n.authorId || n.authorid,
      authorName: n.authorName || n.authorname,
      attachmentUrl: n.attachmentUrl || n.attachmenturl,
      attachmentName: n.attachmentName || n.attachmentname,
      attachmentType: n.attachmentType || n.attachmenttype,
      createdAt: n.createdAt || n.createdat,
      updatedAt: n.updatedAt || n.updatedat
    }))

    const assigneesData = await db.getAll(`
      SELECT u.id, u.name, u.email, u.role, u.avatarUrl as avatar, ta.points
      FROM task_assignments ta
      JOIN users u ON ta.userId = u.id
      WHERE ta.taskId = ?
    `, [realTaskId]) as any[]

    const formattedTask = {
      ...task,
      id: task.id,
      status: task.status ? task.status.toLowerCase().replace('_', '-') : 'todo',
      assignees: assigneesData,
      assigneeId: task.assigneeId || task.assigneeid || assigneesData[0]?.id || null,
      assigneeName: task.assigneeName || task.assigneename || assigneesData[0]?.name || null,
      assignee: assigneesData[0] ? { ...assigneesData[0], role: assigneesData[0].role?.toLowerCase() } : null,
      createdById: task.createdById || task.createdbyid || null,
      createdBy: (task.createdById || task.createdbyid) ? { 
        id: task.createdById || task.createdbyid, 
        name: task.creatorName || task.creatorname, 
        email: task.creatorEmail || task.creatoremail, 
        role: task.creatorRole || task.creatorrole, 
        avatar: task.creatorAvatar || task.creatoravatar 
      } : null,
      delegatedById: task.delegatedById || task.delegatedbyid || null,
      delegatedBy: (task.delegatedById || task.delegatedbyid) ? { 
        id: task.delegatedById || task.delegatedbyid, 
        name: task.delegatorName || task.delegatorname, 
        email: task.delegatorEmail || task.delegatoremail, 
        role: task.delegatorRole || task.delegatorrole, 
        avatar: task.delegatorAvatar || task.delegatoravatar 
      } : null,
      createdAt: task.createdAt || task.createdat,
      updatedAt: task.updatedAt || task.updatedat,
      dueDate: task.dueDate || task.duedate || null,
      completedAt: task.completedAt || task.completedat || null,
      delegatedAt: task.delegatedAt || task.delegatedat || null,
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
    const existingTask: any = await db.getOne("SELECT status, title FROM tasks WHERE id = ?", [taskId])
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
    await db.execute("DELETE FROM task_assignments WHERE taskId = ?", [taskId])
    await db.execute("DELETE FROM task_comments WHERE taskId = ?", [taskId])
    await db.execute("DELETE FROM extension_requests WHERE taskId = ?", [taskId])
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
