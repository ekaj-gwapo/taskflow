import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/auth-utils"
import db from "@/lib/db"
import { logActivity } from "@/lib/activity"
import { notifyTaskAssigned } from "@/lib/notify"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const user = auth.user!
    const role = user.role.toUpperCase()

    const { searchParams } = new URL(request.url)
    const showArchived = searchParams.get("showArchived") === "true"
    const archivedValue = showArchived ? true : false

    const isMasterAdmin = user.role.toLowerCase() === "master_admin";
    const orgId = user.orgId;

    let tasks: any[]
    if (isMasterAdmin) {
      tasks = await db.getAll(`
        SELECT t.*, 
               u2.name as creatorName, u2.email as creatorEmail, u2.role as creatorRole, u2.avatarUrl as creatorAvatar,
               u3.name as delegatorName, u3.email as delegatorEmail, u3.role as delegatorRole, u3.avatarUrl as delegatorAvatar,
               o.name as organizationName
        FROM tasks t
        LEFT JOIN users u2 ON t.createdById = u2.id
        LEFT JOIN users u3 ON t.delegatedById = u3.id
        LEFT JOIN organizations o ON t.orgid = o.id
        WHERE t.archived = ?
        ORDER BY t.createdAt DESC
      `, [archivedValue]) as any[]
    } else if (role === "ADMIN" || role === "HEAD_ADMIN" || role === "CREATOR") {
      if (!orgId) return NextResponse.json({ tasks: [] });
      tasks = await db.getAll(`
        SELECT t.*, 
               u2.name as creatorName, u2.email as creatorEmail, u2.role as creatorRole, u2.avatarUrl as creatorAvatar,
               u3.name as delegatorName, u3.email as delegatorEmail, u3.role as delegatorRole, u3.avatarUrl as delegatorAvatar
        FROM tasks t
        LEFT JOIN users u2 ON t.createdById = u2.id
        LEFT JOIN users u3 ON t.delegatedById = u3.id
        WHERE t.archived = ? AND t.orgid = ?
        ORDER BY t.createdAt DESC
      `, [archivedValue, orgId]) as any[]
    } else {
      tasks = await db.getAll(`
        SELECT t.*, 
               u2.name as creatorName, u2.email as creatorEmail, u2.role as creatorRole, u2.avatarUrl as creatorAvatar,
               u3.name as delegatorName, u3.email as delegatorEmail, u3.role as delegatorRole, u3.avatarUrl as delegatorAvatar
        FROM tasks t
        JOIN task_assignments ta ON t.id = ta.taskId
        LEFT JOIN users u2 ON t.createdById = u2.id
        LEFT JOIN users u3 ON t.delegatedById = u3.id
        WHERE ta.userId = ? AND t.archived = ?
        ORDER BY t.createdAt DESC
      `, [user.id, archivedValue]) as any[]
    }

    // Format tasks to match expected structure
    const formattedTasks = await Promise.all(tasks.map(async (t) => {
      const actionSteps = await db.getAll("SELECT * FROM action_steps WHERE taskId = ? ORDER BY createdAt ASC", [t.id]) as any[]
      const actionStepsWithNotes = await Promise.all(actionSteps.map(async (as: any) => {
        const notes = await db.getAll("SELECT * FROM step_notes WHERE stepId = ?", [as.id]) as any[];
        return {
          ...as,
          isActed: as.isActed !== undefined ? as.isActed : as.isacted,
          completed: as.completed !== undefined ? as.completed : as.completed,
          createdAt: as.createdAt || as.createdat,
          updatedAt: as.updatedAt || as.updatedat,
          notes: notes.map(n => ({
            ...n,
            authorName: n.authorName || n.authorname,
            attachmentUrl: n.attachmentUrl || n.attachmenturl,
            attachmentName: n.attachmentName || n.attachmentname,
            attachmentType: n.attachmentType || n.attachmenttype,
            createdAt: n.createdAt || n.createdat
          }))
        };
      }))

      const progressNotesRaw = await db.getAll(`
        SELECT pn.*, u.avatarUrl as authorAvatar, pn.createdAt as "createdAt", pn.updatedAt as "updatedAt", pn.authorName as "authorName"
        FROM progress_notes pn 
        LEFT JOIN users u ON pn.authorId = u.id 
        WHERE pn.taskId = ?
      `, [t.id]) as any[]
      const progressNotes = progressNotesRaw.map(n => ({
        ...n,
        authorId: n.authorId || n.authorid,
        authorName: n.authorName || n.authorname,
        attachmentUrl: n.attachmentUrl || n.attachmenturl,
        attachmentName: n.attachmentName || n.attachmentname,
        attachmentType: n.attachmentType || n.attachmenttype,
        createdAt: n.createdAt || n.createdat,
        updatedAt: n.updatedAt || n.updatedat
      }))
      const commentsRaw = await db.getAll(`
        SELECT tc.*, u.avatarUrl as authorAvatar
        FROM task_comments tc 
        LEFT JOIN users u ON tc.authorId = u.id 
        WHERE tc.taskId = ? 
        ORDER BY tc.createdAt ASC
      `, [t.id]) as any[]
      const comments = commentsRaw.map(tc => ({
        ...tc,
        authorName: tc.authorName || tc.authorname,
        authorAvatar: tc.authorAvatar || tc.authoravatar,
        attachmentUrl: tc.attachmentUrl || tc.attachmenturl,
        attachmentName: tc.attachmentName || tc.attachmentname,
        attachmentType: tc.attachmentType || tc.attachmenttype,
        createdAt: tc.createdAt || tc.createdat,
        updatedAt: tc.updatedAt || tc.updatedat
      }))

      
      const assigneesData = await db.getAll(`
        SELECT u.id, u.name, u.email, u.role, u.avatarUrl as avatar, ta.points
        FROM task_assignments ta
        JOIN users u ON ta.userId = u.id
        WHERE ta.taskId = ?
      `, [t.id]) as any[]

      const extensionRequests = await db.getAll(
        "SELECT * FROM extension_requests WHERE taskId = ? ORDER BY createdAt DESC",
        [t.id]
      ) as any[]

      return {
        ...t,
        id: t.id,
        status: t.status ? t.status.toLowerCase().replace('_', '-') : 'todo',
        assignees: assigneesData,
        // Keep single assignee keys populated for backwards compatibility
        assigneeId: t.assigneeId || t.assigneeid || assigneesData[0]?.id || null,
        assigneeName: t.assigneeName || t.assigneename || assigneesData[0]?.name || null,
        assignee: assigneesData[0] ? { ...assigneesData[0], role: assigneesData[0].role?.toLowerCase() } : null,
        createdById: t.createdById || t.createdbyid || null,
        createdBy: (t.createdById || t.createdbyid) ? { 
          id: t.createdById || t.createdbyid, 
          name: t.creatorName || t.creatorname, 
          email: t.creatorEmail || t.creatoremail, 
          role: t.creatorRole || t.creatorrole, 
          avatar: t.creatorAvatar || t.creatoravatar 
        } : null,
        delegatedById: t.delegatedById || t.delegatedbyid || null,
        delegatedBy: (t.delegatedById || t.delegatedbyid) ? { 
          id: t.delegatedById || t.delegatedbyid, 
          name: t.delegatorName || t.delegatorname, 
          email: t.delegatorEmail || t.delegatoremail, 
          role: t.delegatorRole || t.delegatorrole, 
          avatar: t.delegatorAvatar || t.delegatoravatar 
        } : null,
        delegatedAt: t.delegatedAt || t.delegatedat || null,
        createdAt: t.createdAt || t.createdat,
        updatedAt: t.updatedAt || t.updatedat,
        dueDate: t.dueDate || t.duedate || null,
        completedAt: t.completedAt || t.completedat || null,
        actionSteps: actionStepsWithNotes,
        progressNotes,
        comments,
        extensionRequests: extensionRequests.map((er: any) => ({
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
    }))

    return NextResponse.json({ tasks: formattedTasks }, { status: 200 })
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    if (auth.user!.role.toLowerCase() === 'creator') {
      return NextResponse.json({ error: "Creators cannot create tasks directly. Please use an Admin or Head Admin account." }, { status: 403 })
    }

    const { title, description, priority, dueDate, assigneeId, assigneeIds, actionSteps } = await request.json()

    const uIds = assigneeIds || (assigneeId ? [assigneeId] : [])

    if (!title || uIds.length === 0 || !dueDate) {
      return NextResponse.json(
        { error: "Title, at least one assignee, and dueDate are required" },
        { status: 400 }
      )
    }

    const taskId = uuidv4()
    const taskPriority = priority || "MEDIUM"
    
    // Calculate points per assignee
    let points = 4; // LOW
    if (taskPriority.toUpperCase() === 'MEDIUM') points = 7;
    if (taskPriority.toUpperCase() === 'HIGH') points = 10;
    
    // Insert task
    await db.execute(`
      INSERT INTO tasks (id, title, description, priority, dueDate, assigneeId, createdById, delegatedById, status, orgid, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [taskId, title, description, taskPriority, new Date(dueDate).toISOString(), uIds[0] || null, auth.user!.id, null, "TODO", auth.user!.orgId || null, new Date().toISOString(), new Date().toISOString()])

    // Insert task assignees
    for (const uId of uIds) {
      await db.execute(`
        INSERT INTO task_assignments (taskId, userId, points) VALUES (?, ?, ?)
      `, [taskId, uId, points]);
    }

    // Insert action steps if provided
    if (actionSteps && actionSteps.length > 0) {
      for (const stepTitle of actionSteps) {
        const stepId = uuidv4()
        await db.execute(`
          INSERT INTO action_steps (id, title, taskId, completed, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [stepId, stepTitle, taskId, false, new Date().toISOString(), new Date().toISOString()])
      }
    }

    // Fetch the created task to return it
    const task: any = await db.getOne(`
      SELECT t.*, 
             u2.name as creatorName, u2.email as creatorEmail, u2.role as creatorRole, u2.avatarUrl as creatorAvatar,
             u3.name as delegatorName, u3.email as delegatorEmail, u3.role as delegatorRole, u3.avatarUrl as delegatorAvatar
      FROM tasks t
      LEFT JOIN users u2 ON t.createdById = u2.id
      LEFT JOIN users u3 ON t.delegatedById = u3.id
      WHERE t.id = ?
    `, [taskId])

    const assigneesData = await db.getAll(`
      SELECT u.id, u.name, u.email, u.role, u.avatarUrl as avatar, ta.points
      FROM task_assignments ta
      JOIN users u ON ta.userId = u.id
      WHERE ta.taskId = ?
    `, [taskId]) as any[]

    const actionStepsData = await db.getAll("SELECT * FROM action_steps WHERE taskId = ?", [taskId]) as any[]
    const actionStepsWithNotes = await Promise.all(actionStepsData.map(async (as: any) => {
      const notes = await db.getAll("SELECT * FROM step_notes WHERE stepId = ?", [as.id]) as any[];
      return {
        ...as,
        isActed: as.isActed !== undefined ? as.isActed : as.isacted,
        completed: as.completed !== undefined ? as.completed : as.completed,
        notes: notes.map(n => ({
          ...n,
          authorName: n.authorName || n.authorname,
          attachmentUrl: n.attachmentUrl || n.attachmenturl,
          attachmentName: n.attachmentName || n.attachmentname,
          attachmentType: n.attachmentType || n.attachmenttype,
          createdAt: n.createdAt || n.createdat
        }))
      };
    }))


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
      actionSteps: actionStepsWithNotes,
      progressNotes: [],
      comments: []
    }

    const assigneeNames = assigneesData.map(a => a.name).join(", ");
    await logActivity({
      action: "TASK_CREATED",
      entityId: taskId,
      entityType: "TASK",
      userId: auth.user!.id,
      userName: auth.user!.name,
      details: { 
        title: task.title,
        assignees: assigneeNames
      }
    });

    // Notify assignees (fails silently if email is not verified/configured)
    notifyTaskAssigned({
      assigneeIds: uIds,
      taskTitle: task.title,
      taskId: taskId,
      priority: taskPriority,
      dueDate: new Date(dueDate).toISOString(),
      assignedByName: auth.user!.name
    });

    return NextResponse.json(
      { message: "Task created successfully", task: formattedTask },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}
