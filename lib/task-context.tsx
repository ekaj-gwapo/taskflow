"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import {
  type User,
  type UserRole,
  type Task,
  type TaskStatus,
  type TaskPriority,
  type ProgressNote,
  type ActionStep,
  type WeeklyReport,
  initialReports,
} from "./store"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface TaskContextType {
  // Auth
  currentUser: User | null
  currentRole: UserRole | null
  isLoadingSession: boolean
  login: (role: UserRole, userId?: string, userData?: any) => void
  logout: () => void

  // Tasks
  tasks: Task[]
  createTask: (task: Omit<Task, "id" | "createdAt" | "completedAt" | "progressNotes" | "assignee" | "assigneeId" | "assigneeName" | "assignees"> & { assigneeIds: string[] }, actionSteps?: string[]) => void
  updateTaskStatus: (taskId: string, status: TaskStatus) => void
  updateTaskAssignees: (taskId: string, assigneeIds: string[]) => void
  deleteTask: (taskId: string) => void
  addProgressNote: (taskId: string, content: string) => void

  // Action Steps
  addActionStep: (taskId: string, stepTitle: string) => void
  updateActionStepStatus: (taskId: string, stepId: string, completed: boolean) => void
  deleteActionStep: (taskId: string, stepId: string) => void
  addStepNote: (taskId: string, stepId: string, content: string) => void

  // Reports
  reports: WeeklyReport[]
  createReport: (summary: string) => void

  // Employees
  allEmployees: User[]
  refreshUsers: () => Promise<void>

  // Access Control & Employee Action Tracking
  getEmployeeVisibleTasks: () => Task[]
  canAccessTask: (taskId: string) => boolean
  getEmployeeActionSummary: () => {
    totalStepsCompleted: number
    totalStepsIncomplete: number
    completionPercentage: number
    taskBreakdown: Array<{ taskId: string; title: string; completedSteps: number; totalSteps: number }>
  }

  // Task Visibility/New status
  seenTaskIds: Set<string>
  markAsSeen: (taskId: string) => void
  seenCompletedTaskIds: Set<string>
  markCompletedAsSeen: (taskId: string) => void
}

const TaskContext = createContext<TaskContextType | null>(null)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [allEmployees, setAllEmployees] = useState<User[]>([])
  const [seenTaskIds, setSeenTaskIds] = useState<Set<string>>(new Set())
  const [seenCompletedTaskIds, setSeenCompletedTaskIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const login = useCallback((role: UserRole, userId?: string, userData?: any) => {
    if (userData) {
      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role.toLowerCase() as UserRole,
        phone: userData.phone || userData.phone_number, // Handle different field names if any
        location: userData.location,
        avatar: userData.avatar || userData.avatarUrl,
      }
      setCurrentUser(user)
      setCurrentRole(userData.role.toLowerCase() as UserRole)
      // Save token or handle session if needed
    }
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    setCurrentRole(null)
    setSeenTaskIds(new Set())
    setSeenCompletedTaskIds(new Set())
    localStorage.removeItem("token")
  }, [])

  // Seen tasks tracking
  useEffect(() => {
    if (!currentUser) return;
    const key = `taskflow_seen_${currentUser.id}`;
    const completedKey = `taskflow_seen_completed_${currentUser.id}`;
    
    // Load general seen tasks
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setSeenTaskIds(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error("Failed to parse seen tasks", e);
      }
    } else {
      setSeenTaskIds(new Set());
    }

    // Load completed seen tasks
    const savedCompleted = localStorage.getItem(completedKey);
    if (savedCompleted) {
      try {
        setSeenCompletedTaskIds(new Set(JSON.parse(savedCompleted)));
      } catch (e) {
        console.error("Failed to parse completed seen tasks", e);
      }
    } else {
      setSeenCompletedTaskIds(new Set());
    }
  }, [currentUser]);

  const markAsSeen = useCallback((taskId: string) => {
    if (!currentUser || seenTaskIds.has(taskId)) return;
    
    setSeenTaskIds(prev => {
      const next = new Set(prev);
      next.add(taskId);
      const key = `taskflow_seen_${currentUser.id}`;
      localStorage.setItem(key, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [currentUser, seenTaskIds]);

  const markCompletedAsSeen = useCallback((taskId: string) => {
    if (!currentUser || seenCompletedTaskIds.has(taskId)) return;
    
    setSeenCompletedTaskIds(prev => {
      const next = new Set(prev);
      next.add(taskId);
      const key = `taskflow_seen_completed_${currentUser.id}`;
      localStorage.setItem(key, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [currentUser, seenCompletedTaskIds]);

  const createTask = useCallback(
    async (taskData: Omit<Task, "id" | "createdAt" | "completedAt" | "progressNotes" | "assignee" | "assigneeId" | "assigneeName" | "assignees"> & { assigneeIds: string[] }, actionSteps?: string[]) => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...taskData,
            actionSteps,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to create task")
        }

        const data = await response.json()
        setTasks((prev) => [data.task, ...prev])
      } catch (error) {
        console.error("Create task error:", error)
      }
    },
    []
  )

  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
           console.error("Update task status error: No token found")
           toast({
             title: "Authentication Error",
             description: "Please log in again.",
             variant: "destructive",
           })
           return
        }
        
const url = `/api/tasks/${taskId}`
      console.debug("Updating task status", { taskId, status, url })
      const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Update task status error:", errorData.error || response.statusText)
          toast({
            title: "Update Failed",
            description: errorData.error || "Failed to update task status.",
            variant: "destructive",
          })
          throw new Error(errorData.error || "Failed to update task status")
        }

        const data = await response.json()
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? data.task : t))
        )
        toast({
          title: "Task Updated",
          description: "Task status updated successfully.",
        })
      } catch (error) {
        console.error("Update task status error:", error)
        if (!toast) return // already toasted
      }
    },
    [toast]
  )

  const updateTaskAssignees = useCallback(
    async (taskId: string, assigneeIds: string[]) => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return
        
        const url = `/api/tasks/${taskId}`
        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ assigneeIds }),
        })

        if (!response.ok) {
           const errorData = await response.json()
           throw new Error(errorData.error || "Failed to update task assignees")
        }

        const data = await response.json()
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? data.task : t))
        )
        toast({
          title: "Assignees Updated",
          description: "Task assignees updated successfully.",
        })
      } catch (error) {
        console.error("Update task assignees error:", error)
        toast({
          title: "Update Failed",
          description: "Failed to update task assignees.",
          variant: "destructive",
        })
      }
    },
    [toast]
  )

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete task")
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } catch (error) {
      console.error("Delete task error:", error)
    }
  }, [])

  const addProgressNote = useCallback(
    async (taskId: string, content: string) => {
      if (!currentUser) return
      try {
        const token = localStorage.getItem("token")
const url = `/api/tasks/${taskId}/progress-notes`
      console.debug("Adding progress note", { taskId, url, content })
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error("Add progress note error:", errorData?.error || response.statusText)
        toast({
          title: "Failed to add note",
          description: errorData?.error || "Unable to save progress note.",
          variant: "destructive",
        })
        throw new Error(errorData?.error || "Failed to add progress note")
        }

        const data = await response.json()
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, progressNotes: [...(t.progressNotes || []), data.note] }
              : t
          )
        )
      } catch (error) {
        console.error("Add progress note error:", error)
      }
    },
    [currentUser]
  )

  const addActionStep = useCallback(async (taskId: string, stepTitle: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/tasks/${taskId}/action-steps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: stepTitle }),
      })

      if (!response.ok) {
        throw new Error("Failed to add action step")
      }

      const data = await response.json()
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                actionSteps: [...(t.actionSteps || []), data.actionStep],
              }
            : t
        )
      )
    } catch (error) {
      console.error("Add action step error:", error)
    }
  }, [])

  const updateActionStepStatus = useCallback(
    async (taskId: string, stepId: string, completed: boolean) => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`/api/tasks/${taskId}/action-steps/${stepId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ completed }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Update action step status error:", errorData.error || response.statusText)
          toast({
            title: "Update Failed",
            description: errorData.error || "Failed to update action step.",
            variant: "destructive",
          })
          throw new Error(errorData.error || "Failed to update action step")
        }

        const data = await response.json()
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  actionSteps: (t.actionSteps || []).map((step) =>
                    step.id === stepId ? data.actionStep : step
                  ),
                }
              : t
          )
        )
        toast({
          title: "Action Step Updated",
          description: "Action step status updated successfully.",
        })
      } catch (error) {
        console.error("Update action step status error:", error)
        if (!toast) return // already toasted
      }
    },
    [toast]
  )

  const deleteActionStep = useCallback(
    async (taskId: string, stepId: string) => {
      // Only admin can delete action steps
      if (currentRole !== "admin") {
        console.warn("[v0] Only admin can delete action steps")
        return
      }

      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`/api/tasks/${taskId}/action-steps/${stepId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to delete action step")
        }

        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  actionSteps: (t.actionSteps || []).filter((step) => step.id !== stepId),
                }
              : t
          )
        )
      } catch (error) {
        console.error("Delete action step error:", error)
      }
    },
    [currentRole]
  )

  const addStepNote = useCallback(
    async (taskId: string, stepId: string, content: string) => {
      if (!currentUser) return
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`/api/tasks/${taskId}/action-steps/${stepId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        })

        if (!response.ok) {
          throw new Error("Failed to add step note")
        }

        const data = await response.json()
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  actionSteps: (t.actionSteps || []).map((step) =>
                    step.id === stepId
                      ? {
                          ...step,
                          notes: [...(step.notes || []), data.note],
                        }
                      : step
                  ),
                }
              : t
          )
        )
      } catch (error) {
        console.error("Add step note error:", error)
      }
    },
    [currentUser]
  )

  const createReport = useCallback(
    (summary: string) => {
      const now = new Date()
      const weekStart = new Date(now.getTime() - 7 * 86400000)
      const completedCount = tasks.filter((t) => t.status === "completed").length
      const inProgressCount = tasks.filter((t) => t.status === "in-progress").length
      const todoCount = tasks.filter((t) => t.status === "todo").length
      const overdueCount = tasks.filter(
        (t) => t.status !== "completed" && new Date(t.dueDate) < now
      ).length

      const report: WeeklyReport = {
        id: `report-${Date.now()}`,
        weekStart: weekStart.toISOString().split("T")[0],
        weekEnd: now.toISOString().split("T")[0],
        createdAt: now.toISOString().split("T")[0],
        summary,
        completedCount,
        inProgressCount,
        overdueCount,
        todoCount,
      }
      setReports((prev) => [report, ...prev])
    },
    [tasks]
  )

  // Access Control: Get only tasks visible to current employee
  const getEmployeeVisibleTasks = useCallback(() => {
    if (currentRole === "admin" || currentRole === "superadmin" || currentRole === "head_admin") {
      return []
    }
    if (currentRole === "employee" && currentUser) {
      return tasks.filter((t) => t.assignees?.some(a => a.id === currentUser.id) || t.assigneeId === currentUser.id)
    }
    return []
  }, [tasks, currentRole, currentUser])

  // Access Control: Check if current user can access a specific task
  const canAccessTask = useCallback(
    (taskId: string) => {
      if (currentRole === "admin" || currentRole === "superadmin" || currentRole === "head_admin") {
        return true
      }
      if (currentRole === "employee" && currentUser) {
        const task = tasks.find((t) => t.id === taskId)
        return task ? !!(task.assignees?.some(a => a.id === currentUser.id) || task.assigneeId === currentUser.id) : false
      }
      return false
    },
    [tasks, currentRole, currentUser]
  )

  // Get employee action summary: count completed/incomplete action steps
  const getEmployeeActionSummary = useCallback(() => {
    if (currentRole !== "employee" || !currentUser) {
      return {
        totalStepsCompleted: 0,
        totalStepsIncomplete: 0,
        completionPercentage: 0,
        taskBreakdown: [],
      }
    }

    const employeeTasks = tasks.filter((t) => t.assignees?.some(a => a.id === currentUser.id) || t.assigneeId === currentUser.id)
    let totalStepsCompleted = 0
    let totalStepsIncomplete = 0
    const taskBreakdown: Array<{ taskId: string; title: string; completedSteps: number; totalSteps: number }> = []

    employeeTasks.forEach((task) => {
      if (task.actionSteps && task.actionSteps.length > 0) {
        const completed = task.actionSteps.filter((step) => step.completed).length
        const total = task.actionSteps.length
        totalStepsCompleted += completed
        totalStepsIncomplete += total - completed
        taskBreakdown.push({
          taskId: task.id,
          title: task.title,
          completedSteps: completed,
          totalSteps: total,
        })
      }
    })

    const totalSteps = totalStepsCompleted + totalStepsIncomplete
    const completionPercentage = totalSteps > 0 ? Math.round((totalStepsCompleted / totalSteps) * 100) : 0

    return {
      totalStepsCompleted,
      totalStepsIncomplete,
      completionPercentage,
      taskBreakdown,
    }
  }, [tasks, currentRole, currentUser])

  // Session restoration
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsLoadingSession(false)
        return
      }

      try {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          setCurrentUser(data.user)
          setCurrentRole(data.user.role.toLowerCase() as UserRole)
        } else {
          // Token expired or invalid
          localStorage.removeItem("token")
        }
      } catch (error) {
        console.error("Session restoration error:", error)
      } finally {
        setIsLoadingSession(false)
      }
    }

    restoreSession()
  }, [])

  const refreshUsers = useCallback(async () => {
    if (!currentUser || (currentRole !== 'admin' && currentRole !== 'superadmin' && currentRole !== 'head_admin')) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const usersRes = await fetch('/api/users', { headers });
      if (usersRes.ok) {
        const data = await usersRes.json();
        if (currentRole === 'superadmin') {
          setAllEmployees(data.users.filter((u: any) => u.role.toLowerCase() !== 'superadmin'));
        } else if (currentRole === 'head_admin') {
          setAllEmployees(data.users.filter((u: any) => u.role.toLowerCase() === 'employee' || u.role.toLowerCase() === 'admin'));
        } else {
          setAllEmployees(data.users.filter((u: any) => u.role.toLowerCase() === 'employee'));
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [currentUser, currentRole]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Tasks (Only if not already fetched or to refresh)
        const tasksRes = await fetch('/api/tasks', { headers });
        if (tasksRes.ok) {
          const data = await tasksRes.json();
          setTasks(data.tasks || []);
        }

        // Fetch Employees
        await refreshUsers();
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [currentUser, currentRole, refreshUsers]);

  return (
    <TaskContext.Provider
      value={{
        currentUser,
        currentRole,
        isLoadingSession,
        login,
        logout,
        tasks,
        createTask,
        updateTaskStatus,
        updateTaskAssignees,
        deleteTask,
        addProgressNote,
        addActionStep,
        updateActionStepStatus,
        deleteActionStep,
        addStepNote,
        reports,
        createReport,
        allEmployees,
        refreshUsers,
        getEmployeeVisibleTasks,
        canAccessTask,
        getEmployeeActionSummary,
        seenTaskIds,
        markAsSeen,
        seenCompletedTaskIds,
        markCompletedAsSeen,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext() {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error("useTaskContext must be used within a TaskProvider")
  }
  return context
}
