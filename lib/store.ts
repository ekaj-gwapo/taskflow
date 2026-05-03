export type UserRole = "master_admin" | "superadmin" | "creator" | "head_admin" | "admin" | "employee"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  phone?: string
  location?: string
  theme?: string
  mode?: "light" | "dark"
  jobTitle?: string
  emailVerified?: boolean
  orgId?: string
  organizationName?: string
  organizationLogo?: string
  notifyOnAssign?: boolean
  notifyOnDeadline?: boolean
  notifyOnDiscussion?: boolean
  notifyOnExtension?: boolean
}

export type TaskStatus = "todo" | "in-progress" | "completed"
export type TaskPriority = "low" | "medium" | "high"

export interface TaskComment {
  id: string
  taskId: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  createdAt: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentType?: string
}


export interface ProgressNote {
  id: string
  taskId: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  createdAt: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentType?: string
}

export interface StepNote {
  id: string
  content: string
  createdAt: string
  authorName: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentType?: string
}

export interface ActionStep {
  id: string
  title: string
  completed: boolean
  isActed: boolean
  notes: StepNote[]
}

export interface ExtensionRequest {
  id: string
  taskId: string
  requestedById: string
  requestedByName: string
  currentDueDate: string
  proposedDueDate: string
  reason: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  reviewedById?: string
  reviewedByName?: string
  reviewerRemark?: string
  reviewedAt?: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: string
  assigneeName?: string
  assignee?: {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
  }
  assignees?: {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
    points: number
  }[]
  createdById?: string | null
  createdBy?: {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
  } | null
  delegatedById?: string | null
  delegatedBy?: {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
  } | null
  delegatedAt?: string | null
  archived: boolean
  createdAt: string
  dueDate: string
  completedAt: string | null
  progressNotes: ProgressNote[]
  comments?: TaskComment[]
  actionSteps?: ActionStep[]
  extensionRequests?: ExtensionRequest[]
}

export interface WeeklyReport {
  id: string
  weekStart: string
  weekEnd: string
  createdAt: string
  summary: string
  completedCount: number
  inProgressCount: number
  overdueCount: number
  todoCount: number
}

export interface ActivityLog {
  id: string
  action: "TASK_CREATED" | "TASK_DELETED" | "STATUS_UPDATED" | "ASSIGNEE_CHANGED" | "NOTE_ADDED" | "COMMENT_ADDED" | "STEP_ADDED" | "STEP_UPDATED" | "STEP_DELETED" | "STEP_NOTE_ADDED" | "PROFILE_UPDATED" | "AVATAR_UPDATED" | "PASSWORD_RESET" | "USER_STATUS_UPDATED" | "TASK_REASSIGNED" | "TEAM_MEMBERS_EDITED" | "TASK_DELEGATED" | "EXTENSION_REQUESTED" | "EXTENSION_APPROVED" | "EXTENSION_REJECTED" | "TASK_ARCHIVED" | "TASK_RESTORED" | "MEMBER_REMOVED" | "DUE_DATE_UPDATED"
  entityId: string
  entityType: string
  userId: string
  userName: string
  details?: any
  createdAt: string
  taskTitle?: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
}

// Mock data removed for pure SQLite implementation
export const employees: User[] = []
export const adminUser: User | null = null
export const initialTasks: Task[] = []
export const initialReports: WeeklyReport[] = []
