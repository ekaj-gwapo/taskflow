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
      // Employees only see activity logs for:
      // 1. Tasks they are assigned to, created, or are part of the team
      // 2. Their own user profile updates
      // 3. Actions they performed themselves
      const query = `
        SELECT al.*, t.title as taskTitle
        FROM activity_logs al
        LEFT JOIN tasks t ON t.id::text = al.entityid
        WHERE 
          -- Task-related logs they are involved in
          (al.entitytype = 'TASK' AND (
            t.assigneeid = $1::uuid 
            OR t.createdbyid = $2::uuid
            OR EXISTS (
              SELECT 1 FROM task_assignments ta 
              WHERE ta.taskid = t.id AND ta.userid = $3::uuid
            )
          ))
          OR
          -- Their own user profile logs
          (al.entitytype = 'USER' AND al.entityid = $4::text)
          OR
          -- Any action they performed themselves
          (al.userid = $5::uuid)
        ORDER BY al.createdat DESC
        LIMIT 100
      `;
      logs = await db.getAll(query, [auth.user!.id, auth.user!.id, auth.user!.id, auth.user!.id, auth.user!.id]) as any[];
    } else {
      // Admins see all logs
      const query = `
        SELECT al.*, t.title as taskTitle
        FROM activity_logs al
        LEFT JOIN tasks t ON t.id::text = al.entityid
        ORDER BY al.createdat DESC
        LIMIT 200
      `;
      logs = await db.getAll(query) as any[];
    }

    console.log(`[API] Fetched ${logs.length} raw logs`);

    // Parse the details JSON string for easier frontend consumption
    const formattedLogs = logs.map(log => {
      // Handle potential case-sensitivity issues from different DB adapters
      const normalizedLog = {
        ...log,
        entityId: log.entityId || log.entityid,
        entityType: log.entityType || log.entitytype,
        userId: log.userId || log.userid,
        userName: log.userName || log.username || 'System',
        createdAt: log.createdAt || log.createdat,
        taskTitle: log.taskTitle || log.tasktitle,
        details: log.details || log.details_json // some adapters use different names
      };

      try {
        if (typeof normalizedLog.details === 'string') {
          normalizedLog.details = JSON.parse(normalizedLog.details);
        }
      } catch (e) {
        console.error(`[API] Failed to parse activity log details for ID ${log.id}:`, e);
        normalizedLog.details = null;
      }

      return normalizedLog;
    });

    console.log(`[API] Returning ${formattedLogs.length} formatted logs`);

    return NextResponse.json({ logs: formattedLogs }, { status: 200 })
  } catch (error) {
    console.error("Get activity logs error:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    )
  }
}
