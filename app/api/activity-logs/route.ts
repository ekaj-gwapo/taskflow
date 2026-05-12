import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import db from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const user = auth.user!
    const role = user.role.toUpperCase()
    const orgId = user.orgId
    const isMasterAdmin = user.role.toLowerCase() === "master_admin"
    const isCreator = user.role.toLowerCase() === "creator"
    const isAdminOrHead = role === "ADMIN" || role === "HEAD_ADMIN"

    let logs: any[] = [];

    if (isMasterAdmin) {
      // Master Admin sees all logs across all organizations
      const query = `
        SELECT al.*, t.title as taskTitle, u.name as currentUserName
        FROM activity_logs al
        LEFT JOIN tasks t ON t.id::text = al.entityid
        LEFT JOIN users u ON al.userid = u.id
        ORDER BY al.createdat DESC
        LIMIT 300
      `;
      logs = await db.getAll(query) as any[];
    } else if (isCreator) {
      // Creator sees ALL actions in their organization
      const query = `
        SELECT al.*, t.title as taskTitle, u.name as currentUserName
        FROM activity_logs al
        LEFT JOIN tasks t ON t.id::text = al.entityid
        LEFT JOIN users u ON al.userid = u.id
        WHERE u.orgid = ?::uuid
        ORDER BY al.createdat DESC
        LIMIT 200
      `;
      logs = await db.getAll(query, [orgId]) as any[];
    } else if (isAdminOrHead) {
      // Admins and Head Admins see actions in their organization, EXCLUDING creator actions
      const query = `
        SELECT al.*, t.title as taskTitle, u.name as currentUserName
        FROM activity_logs al
        LEFT JOIN tasks t ON t.id::text = al.entityid
        LEFT JOIN users u ON al.userid = u.id
        WHERE u.orgid = ?::uuid AND LOWER(u.role) != 'creator'
        ORDER BY al.createdat DESC
        LIMIT 200
      `;
      logs = await db.getAll(query, [orgId]) as any[];
    } else if (role === "EMPLOYEE") {
      // Employees see their relevant actions, EXCLUDING creator actions
      const query = `
        SELECT al.*, t.title as taskTitle, u.name as currentUserName
        FROM activity_logs al
        LEFT JOIN tasks t ON t.id::text = al.entityid
        LEFT JOIN users u ON al.userid = u.id
        WHERE 
          u.orgid = ?::uuid AND LOWER(u.role) != 'creator' AND (
            -- Task-related logs they are involved in
            (al.entitytype = 'TASK' AND (
              t.assigneeid = ?::uuid 
              OR t.createdbyid = ?::uuid
              OR EXISTS (
                SELECT 1 FROM task_assignments ta 
                WHERE ta.taskid = t.id AND ta.userid = ?::uuid
              )
            ))
            OR
            -- Their own user profile logs
            (al.entitytype = 'USER' AND al.entityid = ?::text)
            OR
            -- Any action they performed themselves
            (al.userid = ?::uuid)
          )
        ORDER BY al.createdat DESC
        LIMIT 100
      `;
      logs = await db.getAll(query, [orgId, user.id, user.id, user.id, user.id, user.id]) as any[];
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
        userName: log.currentUserName || log.currentusername || log.userName || log.username || 'System',
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
