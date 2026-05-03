"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useTaskContext } from "@/lib/task-context"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { TaskDetailPanel } from "@/components/task-detail-panel"
import { UserManagement } from "@/components/user-management"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AppHeader } from "@/components/app-header"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Users, ChevronRight, ChevronDown, ClipboardList, ArrowLeft, User, Mail, Phone, MapPin, Save, X, Shield, Search, Clipboard, Share2, Trash2, Filter, FileText, Activity } from "lucide-react"
import { OfficeAccomplishmentReport } from "@/components/office-accomplishment-report"
import { TopCompletersChart } from "@/components/top-completers-chart"
import { WorkloadDistribution } from "@/components/workload-distribution"
import { Button } from "@/components/ui/button"
import { RecentlyCompletedTasks } from "@/components/recently-completed-tasks"
import { UrgentTasksSection } from "@/components/urgent-tasks-section"
import { ActivityLogView } from "@/components/activity-log-view"
import { SmartBriefing } from "@/components/smart-briefing"
import { EmployeeWeeklyPerformance } from "@/components/employee-weekly-performance"
import { EmployeeProfileReport } from "@/components/employee-profile-report"
import { OrgAnalytics } from "@/components/org-analytics"
import { formatDate, formatDateTime, calculateTaskProgress, cn } from "@/lib/utils"
import type { Task } from "@/lib/store"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

function TaskRow({
  task,
  onSelect,
  isSelected,
  onDelete,
  isDelegatedView,
  currentUserRole,
  currentUserId,
  taskCreatorId,
  isNew,
}: {
  task: Task
  onSelect: () => void
  isSelected: boolean
  onDelete: () => void
  isDelegatedView?: boolean
  currentUserRole?: string
  currentUserId?: string
  taskCreatorId?: string
  isNew?: boolean
}) {
  const isOverdue =
    task.status !== "completed" && new Date(task.dueDate) < new Date()

  const displayAssignees = task.assignees && task.assignees.length > 0 ? task.assignees : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ x: 4 }}
      onClick={onSelect}
      className={cn(
        "w-full flex items-center px-4 py-3 text-left cursor-pointer border-b border-border border-l-4 border-l-transparent hover:border-l-primary hover:bg-muted/80 transition-colors",
        isSelected ? "bg-accent/70 border-l-primary" : ""
      )}
    >
      {/* TASK */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {task.title}
          </span>
          {task.delegatedById && (
            <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              <Share2 className="h-2.5 w-2.5" />
              Delegated
            </span>
          )}
          {isNew && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded animate-pulse">
              NEW
            </span>
          )}
          {isOverdue && (
            <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
              Overdue
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {task.description}
        </p>

        {/* Task Progress Mini-bar */}
        <div className="mt-2.5 max-w-[200px] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-primary/80 uppercase tracking-tighter">
            <span>Progress</span>
            <span>{calculateTaskProgress(task)}%</span>
          </div>
          <Progress value={calculateTaskProgress(task)} className="h-1.5 bg-secondary border border-border/50" />
        </div>
      </div>

      {/* ✅ FIXED COLUMNS */}
      <div className="hidden md:flex items-center shrink-0 gap-6">
        {/* PRIORITY */}
        <div className="w-24 flex justify-center">
          <PriorityBadge priority={task.priority} />
        </div>

        {/* STATUS */}
        <div className="w-32 flex justify-center">
          <StatusBadge status={task.status} />
        </div>

        {/* ASSIGNEES */}
        <div className="w-40 flex items-center gap-1.5 pl-1">
          {displayAssignees.length > 0 ? (
            <div className="flex items-center">
              <div className="flex -space-x-2 overflow-hidden items-center">
                {displayAssignees.slice(0, 3).map((a) => (
                  <Avatar key={a.id} className="inline-block h-6 w-6 shrink-0 rounded-full ring-2 ring-background border border-border/50">
                    {a.avatar ? (
                      <AvatarImage src={a.avatar} />
                    ) : (
                      <AvatarFallback className="text-[9px] bg-secondary text-foreground font-medium">
                        {a.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ))}
                {displayAssignees.length > 3 && (
                  <div className="flex items-center justify-center h-6 w-6 shrink-0 rounded-full ring-2 ring-background bg-secondary text-[10px] font-medium text-foreground z-10 border border-border/50">
                    +{displayAssignees.length - 3}
                  </div>
                )}
              </div>
              {displayAssignees.length === 1 && (
                <span className="text-xs truncate ml-2 text-foreground font-medium">{displayAssignees[0].name}</span>
              )}
              {displayAssignees.length > 1 && (
                <span className="text-[11px] truncate ml-2 text-muted-foreground font-medium">{displayAssignees.length} members</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground ml-1">Unassigned</span>
          )}
        </div>

        {/* DUE DATE OR DELEGATED AT */}
        <div className="w-24 text-right text-xs whitespace-nowrap text-muted-foreground">
          {isDelegatedView && task.delegatedAt ? (
            <div className="flex flex-col items-end">
              <span className="font-medium text-foreground">{formatDate(task.delegatedAt)}</span>
              <span className="text-[10px] opacity-70">
                {new Date(task.delegatedAt).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          ) : (
            formatDate(task.dueDate)
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 ml-4 w-12">
        {(currentUserRole === "SUPERADMIN" || currentUserRole === "HEAD_ADMIN" || taskCreatorId === currentUserId) && task.status === "todo" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                title="Delete Task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the task "{task.title}" and all its associated action required items and notes. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Task
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </motion.div>
  )
}

function TeamProjectCard({
  task,
  onSelect,
  isSelected,
  isNew
}: {
  task: Task;
  onSelect: () => void;
  isSelected: boolean;
  isNew?: boolean
}) {
  const isOverdue = task.status !== "completed" && new Date(task.dueDate) < new Date()
  const displayAssignees = task.assignees && task.assignees.length > 0 ? task.assignees : []

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
      className={cn(
        "cursor-pointer flex flex-col min-h-[160px] rounded-[2rem] border-2",
        isOverdue ? "border-destructive/50 shadow-[0_0_15px_-5px_rgba(239,68,68,0.2)]" :
          task.status === "completed" ? "border-emerald-500/50 shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]" :
            task.status === "in-progress" ? "border-orange-500/50 shadow-[0_0_15px_-5px_rgba(249,115,22,0.2)]" :
              "border-muted-foreground/20",
        isSelected ? "ring-4 ring-primary/20 border-primary" : ""
      )}
      onClick={onSelect}
    >
      <Card className="h-full border-0 bg-transparent shadow-none">
        <CardHeader className="pb-3 pt-4 px-4 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 pr-2">
              <h3 className="text-base font-semibold text-foreground line-clamp-1">{task.title}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                {isNew && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded animate-pulse">NEW</span>
                )}
                {isOverdue && (
                  <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded font-medium">Overdue</span>
                )}
              </div>
            </div>
            <PriorityBadge priority={task.priority} />
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 flex flex-col flex-1">
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
            {task.description || "No description provided."}
          </p>

          {/* Card Progress Bar */}
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
              <span>Action Required Progress</span>
              <span>{calculateTaskProgress(task)}%</span>
            </div>
            <Progress value={calculateTaskProgress(task)} className="h-1 bg-secondary" />
          </div>

          <div className="flex items-center justify-between mt-auto shrink-0 pt-2 border-t border-border/50">
            <StatusBadge status={task.status} />

            <div className="flex -space-x-2 overflow-hidden items-center ml-2">
              {displayAssignees.slice(0, 4).map((a) => (
                <Avatar key={a.id} className="inline-block h-7 w-7 shrink-0 rounded-full ring-2 ring-background border border-border/50">
                  {a.avatar ? (
                    <AvatarImage src={a.avatar} />
                  ) : (
                    <AvatarFallback className="text-[10px] bg-secondary text-foreground font-medium">
                      {a.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  )}
                </Avatar>
              ))}
              {displayAssignees.length > 4 && (
                <div className="flex items-center justify-center h-7 w-7 shrink-0 rounded-full ring-2 ring-background bg-secondary text-[10px] font-medium text-foreground z-10 border border-border/50">
                  +{displayAssignees.length - 4}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function AdminDashboard({
  isProfileOpen,
  setIsProfileOpen
}: {
  isProfileOpen?: boolean;
  setIsProfileOpen?: (open: boolean) => void
} = {}) {
  const { tasks, archivedTasks, fetchArchivedTasks, allEmployees, currentUser, deleteTask, updateTaskAssignees, seenTaskIds, markAsSeen, seenCompletedTaskIds, markCompletedAsSeen, selectedTaskId, selectTask } = useTaskContext()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCharts, setShowCharts] = useState(true)
  const [visibleCharts, setVisibleCharts] = useState({
    workload: true,
    performance: true,
    recent: true,
    leaderboard: true
  })
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Independent filters for Team Projects
  const [teamFilterStatus, setTeamFilterStatus] = useState<string>("all")
  const [teamFilterPriority, setTeamFilterPriority] = useState<string>("all")
  const [teamSearchQuery, setTeamSearchQuery] = useState("")

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [myTaskTab, setMyTaskTab] = useState<"assigned" | "delegated">("assigned")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Auto-hide the main analytics section if all individual charts are hidden
  useEffect(() => {
    const anyVisible = Object.values(visibleCharts).some(v => v)
    if (!anyVisible && showCharts) {
      setShowCharts(false)
    }
  }, [visibleCharts, showCharts])

  const [currentPage, setCurrentPage] = useState(1)
  const tasksPerPage = 10

  // Sync selectedTask with selectedTaskId
  useEffect(() => {
    if (selectedTaskId) {
      const task = [...tasks, ...archivedTasks].find(t => t.id === selectedTaskId)
      if (task) setSelectedTask(task)
    } else {
      setSelectedTask(null)
    }
  }, [selectedTaskId, tasks, archivedTasks])

  // Track the newest completed task to trigger notifications
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());

  // Real-time notification effect
  useMemo(() => {
    const newlyCompleted = tasks.filter(t =>
      t.status === "completed" &&
      t.completedAt &&
      new Date(t.completedAt).getTime() > lastCheckTime
    );

    if (newlyCompleted.length > 0) {
      newlyCompleted.forEach(task => {
        toast.success(`🎉 Task Completed: ${task.title}`, {
          description: `By ${task.assigneeName}`
        });

        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
          }
        } catch (e) {
          console.error("Audio playback failed", e);
        }
      });

      const newestTime = Math.max(...newlyCompleted.map(t => new Date(t.completedAt!).getTime()));
      setLastCheckTime(newestTime);
    }
  }, [tasks]);

  useEffect(() => {
    if (selectedEmployeeId === 'archived-tasks') {
      fetchArchivedTasks();
    }
  }, [selectedEmployeeId, fetchArchivedTasks]);

  const liveSelectedTask = useMemo(() => {
    if (!selectedTask) return null;
    const allRelevantTasks = selectedEmployeeId === 'archived-tasks' ? archivedTasks : tasks;
    return allRelevantTasks.find(t => t.id === selectedTask.id) || null;
  }, [tasks, archivedTasks, selectedTask, selectedEmployeeId])

  const matchesHierarchy = useCallback((t: Task) => {
    if (selectedEmployeeId === null || selectedEmployeeId === 'activity-log') return true // Dashboard view
    if (selectedEmployeeId === 'team-projects') {
      if (currentUser?.role?.toUpperCase() === 'CREATOR') return true
      return (t.assignees && t.assignees.length > 1)
    }
    if (selectedEmployeeId === 'my-tasks') {
      if (myTaskTab === 'assigned') {
        return (t.assignees?.some(a => a.id === currentUser?.id) || t.assigneeId === currentUser?.id)
      } else {
        return t.delegatedById === currentUser?.id
      }
    }
    if (selectedEmployeeId === 'archived-tasks') return true // Show all archived tasks
    return (t.assignees?.some(a => a.id === selectedEmployeeId) || t.assigneeId === selectedEmployeeId)
  }, [selectedEmployeeId, myTaskTab, currentUser])

  const filteredTasks = useMemo(() => {
    const isTeamView = selectedEmployeeId === 'team-projects'
    const isArchivedView = selectedEmployeeId === 'archived-tasks'
    const currentStatus = isTeamView ? teamFilterStatus : filterStatus
    const currentPriority = isTeamView ? teamFilterPriority : filterPriority
    const currentSearch = isTeamView ? teamSearchQuery : searchQuery
    const currentTasksPool = isArchivedView ? archivedTasks : tasks

    const result = currentTasksPool.filter((t) => {
      const status = t.status?.toLowerCase()
      const priority = t.priority?.toLowerCase()

      let matchesStatus = false
      if (currentStatus === "all") {
        matchesStatus = true
      } else if (currentStatus === "overdue") {
        matchesStatus = t.status !== "completed" && new Date(t.dueDate) < new Date()
      } else {
        matchesStatus = status === currentStatus
      }

      return (
        matchesHierarchy(t) &&
        matchesStatus &&
        (currentPriority === "all" || priority === currentPriority) &&
        (
          currentSearch === "" ||
          t.title?.toLowerCase().includes(currentSearch.toLowerCase()) ||
          (t.assignees?.some(a => a.name?.toLowerCase().includes(currentSearch.toLowerCase())) ||
            (t.assigneeName || "").toLowerCase().includes(currentSearch.toLowerCase()))
        )
      )
    })

    return result;
  }, [tasks, filterStatus, filterPriority, searchQuery, teamFilterStatus, teamFilterPriority, teamSearchQuery, selectedEmployeeId, myTaskTab, currentUser])

  useEffect(() => {
    setCurrentPage(1)
  }, [filteredTasks])

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * tasksPerPage
    return filteredTasks.slice(startIndex, startIndex + tasksPerPage)
  }, [filteredTasks, currentPage])

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage)

  const selectedEmployee = selectedEmployeeId
    ? allEmployees.find((e) => e.id === selectedEmployeeId) ?? null
    : null

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <AppHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      
      <div className="flex flex-1 w-full min-h-0 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-50 lg:hidden"
              >
                <AdminSidebar
                  isProfileOpen={isProfileOpen}
                  setIsProfileOpen={setIsProfileOpen}
                  selectedEmployeeId={selectedEmployeeId}
                  onSelectEmployee={(id) => {
                    setSelectedEmployeeId(id)
                    setSelectedTask(null)
                    selectTask(null)
                    setIsMobileMenuOpen(false)
                  }}
                  onSelectTask={(task) => {
                    selectTask(task.id);
                    markAsSeen(task.id);
                    markCompletedAsSeen(task.id);
                    setIsMobileMenuOpen(false);
                  }}
                  isMobile
                  onCloseMobile={() => setIsMobileMenuOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className={cn(
          "hidden lg:block shrink-0 border-r border-border transition-all duration-300",
          isSidebarCollapsed ? "w-20" : "w-80"
        )}>
          <AdminSidebar
            isProfileOpen={isProfileOpen}
            setIsProfileOpen={setIsProfileOpen}
            selectedEmployeeId={selectedEmployeeId}
            onSelectEmployee={(id) => {
              setSelectedEmployeeId(id)
              setSelectedTask(null)
              selectTask(null)
            }}
            onSelectTask={(task) => {
              selectTask(task.id);
              markAsSeen(task.id);
              markCompletedAsSeen(task.id);
            }}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        <motion.div layout className="flex-1 min-w-0 overflow-y-auto p-6 pr-4 lg:pr-5 space-y-6">
          {selectedEmployeeId !== 'user-management' && selectedEmployeeId !== 'profile' && (
            <>
              <motion.div layout>
                <SmartBriefing />
              </motion.div>

              {selectedEmployeeId === "my-tasks" && myTaskTab === "assigned" && (
                <motion.div layout>
                  <UrgentTasksSection
                    tasks={tasks.filter(t => t.assignees?.some(a => a.id === currentUser?.id) || t.assigneeId === currentUser?.id)}
                    onSelectTask={(task) => {
                      selectTask(task.id);
                      markAsSeen(task.id);
                      markCompletedAsSeen(task.id);
                    }}
                  />
                </motion.div>
              )}
            </>
          )}

          <AnimatePresence mode="wait">
            {!selectedEmployeeId && showCharts && (
              <motion.div
                key="charts-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="space-y-6 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <AnimatePresence mode="popLayout">
                    {visibleCharts.workload && (
                      <motion.div
                        key="workload"
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <WorkloadDistribution onHide={() => setVisibleCharts(prev => ({ ...prev, workload: false }))} />
                      </motion.div>
                    )}
                    {visibleCharts.performance && (
                      <motion.div
                        key="performance"
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <EmployeeWeeklyPerformance onHide={() => setVisibleCharts(prev => ({ ...prev, performance: false }))} />
                      </motion.div>
                    )}
                    {visibleCharts.recent && (
                      <motion.div
                        key="recent"
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <RecentlyCompletedTasks
                          onSelectTask={(task) => selectTask(task.id)}
                          onHide={() => setVisibleCharts(prev => ({ ...prev, recent: false }))}
                        />
                      </motion.div>
                    )}
                    {visibleCharts.leaderboard && (
                      <motion.div
                        key="leaderboard"
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <TopCompletersChart onHide={() => setVisibleCharts(prev => ({ ...prev, leaderboard: false }))} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SEARCH, FILTER & TABLE AREA WITH DETAIL PANEL */}
          <motion.div
            layout
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex gap-6 items-start"
          >
            <div className="flex-1 min-w-0 space-y-6">
              {/* SEARCH & FILTER */}
              <AnimatePresence mode="wait">
                {!['activity-log', 'profile', 'user-management'].includes(selectedEmployeeId as string) &&
                  !(currentUser?.role === 'creator' && !selectedEmployeeId) && (
                    <motion.div
                      key="search-filter-section"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="sticky -top-6 z-30 bg-background/80 backdrop-blur-xl pb-4 pt-7 -mx-6 px-6 border-b border-border/50"
                    >
                      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center py-2">
                        <div className="w-full flex flex-col sm:flex-row gap-3 items-center flex-1 min-w-0">
                          <div className="relative w-full sm:w-auto sm:flex-1 min-w-[150px] max-w-sm shrink">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              value={selectedEmployeeId === 'team-projects' ? teamSearchQuery : searchQuery}
                              onChange={(e) => selectedEmployeeId === 'team-projects' ? setTeamSearchQuery(e.target.value) : setSearchQuery(e.target.value)}
                              className="pl-9 bg-background border-border text-foreground w-full"
                              placeholder="Search tasks or Assignee"
                            />
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap">
                            <Select
                              value={selectedEmployeeId === 'team-projects' ? teamFilterPriority : filterPriority}
                              onValueChange={selectedEmployeeId === 'team-projects' ? setTeamFilterPriority : setFilterPriority}
                            >
                              <SelectTrigger className="w-full sm:w-[160px] bg-background border-border whitespace-nowrap">
                                <Filter className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                                <SelectValue placeholder="Priority" />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border">
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select
                              value={selectedEmployeeId === 'team-projects' ? teamFilterStatus : filterStatus}
                              onValueChange={selectedEmployeeId === 'team-projects' ? setTeamFilterStatus : setFilterStatus}
                            >
                              <SelectTrigger className="w-full sm:w-[160px] bg-background border-border whitespace-nowrap">
                                <Filter className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border">
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-2 lg:mt-0 flex-wrap justify-end">
                          <button
                            onClick={() => {
                              if (!showCharts) {
                                setVisibleCharts({
                                  workload: true,
                                  performance: true,
                                  recent: true,
                                  leaderboard: true
                                });
                              }
                              setShowCharts(!showCharts);
                            }}
                            className={cn(
                              "flex items-center justify-center p-2 rounded-md transition-colors shrink-0 border border-border bg-background",
                              showCharts ? "text-primary border-primary/30 bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            )}
                            title={showCharts ? "Hide Analytics" : "Show Analytics"}
                          >
                            <Activity className="h-4 w-4" />
                          </button>
                          {(currentUser?.role?.toUpperCase() === 'SUPERADMIN' || currentUser?.role?.toUpperCase() === 'HEAD_ADMIN') && (
                            <OfficeAccomplishmentReport />
                          )}
                          <CreateTaskDialog />
                        </div>
                      </div>
                    </motion.div>
                  )}
              </AnimatePresence>

              <AnimatePresence>
                {selectedEmployeeId === 'my-tasks' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <Tabs value={myTaskTab} onValueChange={(v) => setMyTaskTab(v as any)} className="w-full">
                      <TabsList className="bg-secondary/50 border border-border p-1">
                        <TabsTrigger value="assigned" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          Assigned to Me
                        </TabsTrigger>
                        <TabsTrigger value="delegated" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          Delegated by Me
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* TABLE OR GRID */}
              <AnimatePresence mode="wait">
                {selectedEmployeeId === 'user-management' ? (
                  <motion.div
                    key="user-management"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <UserManagement />
                  </motion.div>
                ) : selectedEmployeeId === 'activity-log' ? (
                  <motion.div
                    key="activity-log"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ActivityLogView />
                  </motion.div>
                ) : selectedEmployeeId === 'profile' ? (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <EmployeeProfileReport onEditProfile={() => setIsProfileOpen?.(true)} />
                  </motion.div>
                ) : (selectedEmployeeId === 'team-projects' && currentUser?.role?.toLowerCase() !== 'creator') ? (
                  <motion.div
                    key="team-projects"
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-4 min-h-[600px]"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                      <AnimatePresence>
                        {paginatedTasks.length > 0 ? (
                          paginatedTasks.map(task => (
                            <TeamProjectCard
                              key={task.id}
                              task={task}
                              onSelect={() => {
                                selectTask(selectedTaskId === task.id ? null : task.id);
                                markAsSeen(task.id);
                              }}
                              isSelected={selectedTask?.id === task.id}
                              isNew={!seenTaskIds.has(task.id)}
                            />
                          ))
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full flex flex-col items-center justify-center p-8 text-center min-h-[300px] border border-border rounded-lg bg-card"
                          >
                            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-lg font-medium text-foreground">No team projects found</p>
                            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                              Team projects are collaborative tasks involving 2 or more assignees.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-2 py-3 mt-auto border-t border-border/50 pt-4">
                        <span className="text-xs text-muted-foreground">
                          Showing {(currentPage - 1) * tasksPerPage + 1} - {Math.min(currentPage * tasksPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-xs font-medium px-2">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : currentUser?.role === 'creator' && !selectedEmployeeId ? (
                  <motion.div
                    key="creator-overview-info"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-[2rem] bg-card/20"
                  >
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Activity className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Organization Oversight</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md">
                      You are in the oversight dashboard. Use the charts above to monitor performance.
                      To manage individual tasks, go to the <strong>All Tasks</strong> section in the sidebar.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`task-list-${selectedEmployeeId}-${selectedEmployeeId === 'my-tasks' ? myTaskTab : 'default'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-[2rem] flex flex-col bg-card/40 backdrop-blur-xl border border-border/50 shadow-2xl min-h-[600px] overflow-hidden"
                  >
                    {/* Header / Search Area */}
                    <div className="flex flex-col w-full flex-1">
                      <div className="flex items-center px-4 py-2.5 border-b bg-muted shrink-0">
                        <span className="flex-1 text-xs uppercase text-muted-foreground font-semibold">Task</span>

                        <div className="hidden md:flex items-center gap-6">
                          <span className="w-24 text-center text-xs text-muted-foreground font-semibold">Priority</span>
                          <span className="w-32 text-center text-xs text-muted-foreground font-semibold">Status</span>
                          <span className="w-40 text-xs text-muted-foreground font-semibold">
                            {selectedEmployeeId === 'my-tasks' && myTaskTab === 'delegated' ? 'Delegated To' : 'Assignee'}
                          </span>
                          <span className="w-24 text-right text-xs text-muted-foreground font-semibold">
                            {selectedEmployeeId === 'my-tasks' && myTaskTab === 'delegated' ? 'Delegated At' : 'Due Date'}
                          </span>
                        </div>

                        <span className="w-12" />
                      </div>

                      {/* ROWS */}
                      <div className="flex flex-col flex-1">
                        <AnimatePresence>
                          {paginatedTasks.length > 0 ? (
                            paginatedTasks.map((task) => (
                              <TaskRow
                                key={task.id}
                                task={task}
                                onSelect={() => {
                                  selectTask(selectedTaskId === task.id ? null : task.id);
                                  markAsSeen(task.id);
                                  markCompletedAsSeen(task.id);
                                }}
                                isSelected={selectedTask?.id === task.id}
                                isDelegatedView={selectedEmployeeId === 'my-tasks' && myTaskTab === 'delegated'}
                                currentUserRole={currentUser?.role?.toUpperCase()}
                                currentUserId={currentUser?.id}
                                taskCreatorId={task.createdBy?.id}
                                isNew={selectedEmployeeId === 'my-tasks' && myTaskTab === 'assigned' && !seenTaskIds.has(task.id)}
                                onDelete={() => {
                                  deleteTask(task.id);
                                  if (selectedTask?.id === task.id) setSelectedTask(null);
                                  toast.success("Task deleted successfully");
                                }}
                              />
                            ))
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]"
                            >
                              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                              <p className="text-lg font-medium text-foreground">No tasks found</p>
                              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                Try adjusting your filters or search query to find what you're looking for.
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 shrink-0 mt-auto">
                          <span className="text-xs text-muted-foreground">
                            Showing {(currentPage - 1) * tasksPerPage + 1} - {Math.min(currentPage * tasksPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3"
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                            <span className="text-xs font-medium px-2">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3"
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* DETAIL PANEL - Moved here to align with the list and not push charts */}
            <AnimatePresence>
              {liveSelectedTask && (
                <>
                  {/* Backdrop for mobile */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { setSelectedTask(null); selectTask(null); }}
                    className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-10 lg:hidden"
                  />
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full sm:w-[400px] lg:w-[380px] shrink-0 fixed lg:sticky top-[5.8rem] right-0 lg:right-auto self-start h-[calc(100vh-12rem)] lg:h-[calc(100vh-12rem)] z-20 filter drop-shadow-2xl lg:drop-shadow-none p-4 sm:p-0"
                  >
                    <TaskDetailPanel
                      task={liveSelectedTask}
                      onClose={() => {
                        setSelectedTask(null);
                        selectTask(null);
                      }}
                      showDeleteButton={
                        currentUser?.role?.toUpperCase() === "SUPERADMIN" ||
                        currentUser?.role?.toUpperCase() === "HEAD_ADMIN" ||
                        liveSelectedTask.createdBy?.id === currentUser?.id
                      }
                      showStatusControl={true}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}