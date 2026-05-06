import db from "./db";
import { v4 as uuidv4 } from "uuid";

export type ActivityAction = 
  | "TASK_CREATED"
  | "TASK_DELETED"
  | "STATUS_UPDATED"
  | "ASSIGNEE_CHANGED"
  | "NOTE_ADDED"
  | "COMMENT_ADDED"
  | "STEP_ADDED"
  | "STEP_UPDATED"
  | "STEP_DELETED"
  | "STEP_NOTE_ADDED"
  | "PROFILE_UPDATED"
  | "AVATAR_UPDATED"
  | "PASSWORD_RESET"
  | "USER_STATUS_UPDATED"
  | "TASK_REASSIGNED"
  | "TEAM_MEMBERS_EDITED"
  | "TASK_DELEGATED"
  | "EXTENSION_REQUESTED"
  | "EXTENSION_APPROVED"
  | "EXTENSION_REJECTED"
  | "TASK_ARCHIVED"
  | "TASK_RESTORED"
  | "DUE_DATE_UPDATED"
  | "MEMBER_REMOVED"
  | "USER_CREATED"
  | "USER_DELETED"
  | "ORGANIZATION_CREATED"
  | "SUPPORT_REQUEST_SENT"
  | "SUPPORT_REQUEST_REPLIED";

export interface ActivityLogPayload {
  action: ActivityAction;
  entityId: string;
  entityType: string;
  userId: string;
  userName: string;
  details?: any;
}

export async function logActivity(payload: ActivityLogPayload) {
  try {
    const id = uuidv4();
    const detailsStr = payload.details ? JSON.stringify(payload.details) : null;
    
    await db.execute(`
      INSERT INTO activity_logs (id, action, entityId, entityType, userId, userName, details, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      payload.action,
      payload.entityId,
      payload.entityType,
      payload.userId,
      payload.userName,
      detailsStr,
      new Date().toISOString()
    ]);
  } catch (error) {
    console.error("Failed to insert activity log:", error);
    // Don't throw to prevent interrupting the main transaction/action
  }
}
