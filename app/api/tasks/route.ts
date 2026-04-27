import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/auth-utils"
import db from "@/lib/db"
import { logActivity } from "@/lib/activity"
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

    let tasks: any[]
    if (role === "ADMIN" || role === "SUPERADMIN" || role === "HEAD_ADMIN") {
      tasks = await db.getAll(`
        SELECT t.*, 
               u2.name as creatorName, u2.email as creatorEmail, u2.role as creatorRole, u2.avatarUrl as creatorAvatar,
               u3.name as delegatorName, u3.email as delegatorEmail, u3.role as delegatorRole, u3.avatarUrl as delegatorAvatar
        FROM tasks t
        LEFT JOIN users u2 ON t.createdById = u2.id
        LEFT JOIN users u3 ON t.delegatedById = u3.id
        WHERE t.archived = ?
        ORDER BY t.createdAt DESC
      `, [archivedValue]) as any[]
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
      const actionSteps = await db.getAll("SELECT * FROM action_steps WHERE taskId = ?", [t.id]) as any[]
      const actionStepsWithNotes = await Promise.all(actionSteps.map(async (as: any) => ({
        ...as,
        notes: await db.getAll("SELECT * FROM step_notes WHERE stepId = ?", [as.id]) as any[]
      })))
      const progressNotes = await db.getAll(`
        SELECT pn.*, u.avatarUrl as authorAvatar 
        FROM progress_notes pn 
        LEFT JOIN users u ON pn.authorId = u.id 
        WHERE pn.taskId = ?
      `, [t.id]) as any[]
      const comments = await db.getAll(`
        SELECT tc.*, u.avatarUrl as authorAvatar 
        FROM task_comments tc 
        LEFT JOIN users u ON tc.authorId = u.id 
        WHERE tc.taskId = ? 
        ORDER BY tc.createdAt ASC
      `, [t.id]) as any[]
      
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
        status: t.status ? t.status.toLowerCase().replace('_', '-') : 'todo',
        assignees: assigneesData,
        // Keep single assignee keys populated for backwards compatibility
        assigneeId: assigneesData[0]?.id || null,
        assigneeName: assigneesData[0]?.name || null,
        assignee: assigneesData[0] ? { ...assigneesData[0], role: assigneesData[0].role?.toLowerCase() } : null,
        createdBy: t.createdById ? { id: t.createdById, name: t.creatorName, email: t.creatorEmail, role: t.creatorRole, avatar: t.creatorAvatar } : null,
        delegatedBy: t.delegatedById ? { id: t.delegatedById, name: t.delegatorName, email: t.delegatorEmail, role: t.delegatorRole, avatar: t.delegatorAvatar } : null,
        delegatedAt: t.delegatedAt || null,
        actionSteps: actionStepsWithNotes,
        progressNotes,
        comments,
        extensionRequests,
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
      INSERT INTO tasks (id, title, description, priority, dueDate, assigneeId, createdById, delegatedById, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [taskId, title, description, taskPriority, new Date(dueDate).toISOString(), uIds[0] || null, auth.user!.id, null, "TODO", new Date().toISOString(), new Date().toISOString()])

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
    const actionStepsWithNotes = await Promise.all(actionStepsData.map(async (as: any) => ({
      ...as,
      notes: await db.getAll("SELECT * FROM step_notes WHERE stepId = ?", [as.id])
    })))

    const formattedTask = {
      ...task,
      status: task.status ? task.status.toLowerCase().replace('_', '-') : 'todo',
      assignees: assigneesData,
      assigneeId: assigneesData[0]?.id || null,
      assigneeName: assigneesData[0]?.name || null,
      assignee: assigneesData[0] ? { ...assigneesData[0], role: assigneesData[0].role?.toLowerCase() } : null,
      createdBy: task.createdById ? { id: task.createdById, name: task.creatorName, email: task.creatorEmail, role: task.creatorRole, avatar: task.creatorAvatar } : null,
      delegatedBy: task.delegatedById ? { id: task.delegatedById, name: task.delegatorName, email: task.delegatorEmail, role: task.delegatorRole, avatar: task.delegatorAvatar } : null,
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
