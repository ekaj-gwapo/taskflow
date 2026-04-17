import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const role = auth.user!.role.toUpperCase()
    let logs: any[] = [];

    if (role === "EMPLOYEE") {
      // Employees only see activity logs for tasks they are assigned to
      // or tasks they created
      const query = `
        SELECT al.*, t.title as taskTitle
        FROM activity_logs al
        LEFT JOIN tasks t ON al.entityId = t.id
        WHERE al.entityType = 'TASK' AND (
          t.assigneeId = ? 
          OR t.createdById = ?
          OR EXISTS (
            SELECT 1 FROM task_assignments ta 
            WHERE ta.taskId = t.id AND ta.userId = ?
          )
        )
        ORDER BY al.createdAt DESC
        LIMIT 100
      `;
      logs = await db.getAll(query, [auth.user!.id, auth.user!.id, auth.user!.id]) as any[];
    } else {
      // Admins see all logs
      const query = `
        SELECT al.*, t.title as taskTitle
        FROM activity_logs al
        LEFT JOIN tasks t ON al.entityId = t.id
        WHERE al.entityType = 'TASK'
        ORDER BY al.createdAt DESC
        LIMIT 200
      `;
      logs = await db.getAll(query) as any[];
    }

    // Parse the details JSON string for easier frontend consumption
    const formattedLogs = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));

    return NextResponse.json({ logs: formattedLogs }, { status: 200 })
  } catch (error) {
    console.error("Get activity logs error:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    )
  }
}
