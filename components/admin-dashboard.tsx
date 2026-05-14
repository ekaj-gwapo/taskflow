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
import { Skeleton } from "@/components/ui/skeleton"
import { Users, ChevronRight, ChevronDown, ClipboardList, ArrowLeft, User, Mail, Phone, MapPin, Save, X, Shield, Search, Clipboard, Share2, Trash2, Filter, FileText, Activity, AlertCircle, MessageSquare, Zap } from "lucide-react"
import { OfficeAccomplishmentReport } from "@/components/office-accomplishment-report"
import { TopCompletersChart } from "@/components/top-completers-chart"
import { WorkloadDistribution } from "@/components/workload-distribution"
import { Button } from "@/components/ui/button"
import { RecentlyCompletedTasks } from "@/components/recently-completed-tasks"
import { UrgentTasksSection } from "@/components/urgent-tasks-section"
import { ActivityLogView } from "@/components/activity-log-view"
import { TaskRow, TaskRowSkeleton, TeamProjectCard, TeamProjectCardSkeleton } from "@/components/task-items"
import { SmartBriefing } from "@/components/smart-briefing"
import { EmployeeWeeklyPerformance } from "@/components/employee-weekly-performance"
import { EmployeeProfileReport } from "@/components/employee-profile-report"
import { OrgAnalytics } from "@/components/org-analytics"
import { CreatorSupportRequests } from "@/components/creator-support-requests"
import { PricingModal } from "@/components/pricing-modal"
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


export function AdminDashboard({
  isProfileOpen,
  setIsProfileOpen
}: {
  isProfileOpen?: boolean;
  setIsProfileOpen?: (open: boolean) => void
} = {}) {
  const { tasks, archivedTasks, fetchArchivedTasks, allEmployees, currentUser, deleteTask, updateTaskAssignees, seenTaskIds, markAsSeen, seenCompletedTaskIds, markCompletedAsSeen, selectedTaskId, selectTask, isLoadingTasks } = useTaskContext()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  // Block dashboard if suspended
  if (currentUser?.isSuspended && selectedEmployeeId !== 'support' && selectedEmployeeId !== 'profile') {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden bg-background">
        <AppHeader onMenuClick={() => {}} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-card border-2 border-destructive/20 rounded-[3rem] p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-destructive" />
             <div className="mx-auto h-24 w-24 rounded-3xl bg-destructive/10 flex items-center justify-center border-2 border-destructive/20 animate-pulse">
               <Shield className="h-12 w-12 text-destructive" />
             </div>
             <div className="space-y-4">
               <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Access Suspended</h1>
               <p className="text-xl text-muted-foreground font-medium">
                 Your 31-day free trial has expired or your organization has been suspended. 
               </p>
             </div>
             <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 text-left space-y-4">
               <h3 className="font-bold text-lg flex items-center gap-2">
                 <AlertCircle className="h-5 w-5 text-amber-500" />
                 What happens now?
               </h3>
               <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                 <li>Your team cannot access tasks or dashboard reports.</li>
                 <li>All data is securely preserved and will be restored once reactivated.</li>
                 <li>You can still contact the Master Admin through the Support Center.</li>
               </ul>
             </div>
             <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
               <Button 
                 size="lg" 
                 onClick={() => setSelectedEmployeeId('support')}
                 className="h-16 px-10 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg shadow-xl shadow-amber-600/20"
               >
                 <MessageSquare className="mr-2 h-6 w-6" />
                 Go to Support Center
               </Button>
               <Button 
                 variant="outline"
                 size="lg" 
                 onClick={() => window.location.href = '/auth/login'}
                 className="h-16 px-10 rounded-2xl font-bold text-lg border-2"
               >
                 Sign Out
               </Button>
             </div>
          </div>
        </div>
      </div>
    )
  }
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

  // Calculate trial remaining
  const trialDaysLeft = useMemo(() => {
    if (currentUser?.role !== 'creator' || !currentUser?.trialEndsAt) return null
    const end = new Date(currentUser.trialEndsAt)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }, [currentUser])

  // Calculate if over limit
  const isOverLimit = useMemo(() => {
    if (currentUser?.role !== 'creator' && currentUser?.role !== 'head_admin') return false
    
    let limit = 5;
    const plan = currentUser?.plan || 'FREE'
    if (plan === 'STARTER') limit = 10;
    else if (plan === 'PRO') limit = 25;
    else if (plan === 'ENTERPRISE') limit = 999999;
    
    const activeUsers = allEmployees.filter(e => e.isActive !== false).length
    return activeUsers > limit
  }, [currentUser, allEmployees])

  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <AppHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

      {/* Trial Banner */}
      {trialDaysLeft !== null && trialDaysLeft <= 7 && trialDaysLeft > 0 && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-b border-orange-500/20 px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between relative overflow-hidden gap-4"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-amber-500" />
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-200 tracking-tight">
                Trial Expiring Soon
              </p>
              <p className="text-xs font-medium text-orange-800/80 dark:text-orange-200/80 mt-0.5">
                Your free trial for <span className="font-bold text-orange-900 dark:text-orange-100">{currentUser?.organizationName}</span> ends in <span className="font-bold text-orange-900 dark:text-orange-100">{trialDaysLeft} days</span>. Don't lose access to your workspace.
              </p>
            </div>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold shadow-md shadow-orange-500/20 border-0 shrink-0 w-full sm:w-auto rounded-xl transition-all hover:scale-105 active:scale-95"
            onClick={() => setSelectedEmployeeId('support')}
          >
            Upgrade Workspace
          </Button>
        </motion.div>
      )}

      {/* Over Limit Banner */}
      {isOverLimit && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="bg-gradient-to-r from-red-500/10 via-destructive/5 to-transparent border-b border-destructive/20 px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between relative overflow-hidden gap-4"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center shrink-0">
              <div className="p-1.5 rounded-lg bg-destructive/10">
                <Users className="h-4 w-4 text-destructive" />
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-destructive tracking-tight uppercase">
                User Limit Exceeded
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                Your organization is currently over its <span className="font-bold text-foreground">{currentUser?.plan || 'Free'} Plan</span> limit. Some management features are restricted until you upgrade or remove members.
              </p>
            </div>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            className="font-bold shadow-lg shadow-destructive/20 shrink-0 w-full sm:w-auto rounded-xl transition-all hover:scale-105 active:scale-95"
            onClick={() => setIsPricingModalOpen(true)}
          >
            <Zap className="mr-2 h-4 w-4" />
            Upgrade to Restore
          </Button>
        </motion.div>
      )}

      <PricingModal 
        open={isPricingModalOpen} 
        onOpenChange={setIsPricingModalOpen} 
        currentPlan={currentUser?.plan} 
      />
      
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
              {/* Welcome Panel - Only shown on the main Dashboard/Overview view */}
              {!selectedEmployeeId && (
                <motion.div layout>
                  <SmartBriefing />
                </motion.div>
              )}

              {selectedEmployeeId === "my-tasks" && myTaskTab === "assigned" && (
                <motion.div layout>
                  <UrgentTasksSection
                    tasks={tasks.filter(t => t.assignees?.some(a => a.id === currentUser?.id) || t.assigneeId === currentUser?.id)}
                    onSelectTask={(task) => {
                      selectTask(task.id);
                      markAsSeen(task.id);
                      markCompletedAsSeen(task.id);
                    }}
                    isLoadingTasks={isLoadingTasks}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
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
            className="flex gap-4 items-start"
          >
            <div className="flex-1 min-w-0 space-y-4">
              {/* SEARCH & FILTER */}
              <AnimatePresence mode="wait">
                {!['activity-log', 'profile', 'user-management', 'support'].includes(selectedEmployeeId as string) &&
                  !(currentUser?.role === 'creator' && !selectedEmployeeId) && (
                    <motion.div
                      key="search-filter-section"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="sticky -top-4 z-30 bg-background/80 backdrop-blur-xl pb-3 pt-5 -mx-4 px-4 border-b border-border/50"
                    >
                      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center py-2">
                        <div className="w-full flex flex-col sm:flex-row gap-4 items-center flex-1 min-w-0">
                          <div className="relative w-full sm:w-auto sm:flex-1 min-w-[150px] max-w-sm shrink">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              value={selectedEmployeeId === 'team-projects' ? teamSearchQuery : searchQuery}
                              onChange={(e) => selectedEmployeeId === 'team-projects' ? setTeamSearchQuery(e.target.value) : setSearchQuery(e.target.value)}
                              className="pl-9 bg-background border-border text-foreground w-full h-10 rounded-xl"
                              placeholder="Search tasks or Assignee"
                            />
                          </div>

                          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-nowrap overflow-x-auto no-scrollbar">
                            <Select
                              value={selectedEmployeeId === 'team-projects' ? teamFilterPriority : filterPriority}
                              onValueChange={selectedEmployeeId === 'team-projects' ? setTeamFilterPriority : setFilterPriority}
                            >
                              <SelectTrigger className="w-[140px] sm:w-[150px] bg-background border-border whitespace-nowrap h-10 rounded-xl">
                                <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
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
                              <SelectTrigger className="w-[140px] sm:w-[150px] bg-background border-border whitespace-nowrap h-10 rounded-xl">
                                <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
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

                        <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0 mt-3 lg:mt-0 flex-nowrap justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-border/30">
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
                              "flex items-center justify-center h-10 w-10 rounded-xl transition-all shrink-0 border shadow-sm",
                              showCharts 
                                ? "text-primary border-primary/30 bg-primary/10 shadow-primary/10" 
                                : "text-muted-foreground border-border bg-background hover:text-foreground hover:bg-secondary hover:border-border"
                            )}
                            title={showCharts ? "Hide Analytics" : "Show Analytics"}
                          >
                            <Activity className="h-4 w-4" />
                          </button>
                          {(currentUser?.role?.toUpperCase() === 'SUPERADMIN' || currentUser?.role?.toUpperCase() === 'HEAD_ADMIN') && (
                            <OfficeAccomplishmentReport />
                          )}
                          {currentUser?.role?.toUpperCase() !== 'CREATOR' && (
                            <CreateTaskDialog />
                          )}
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
                ) : selectedEmployeeId === 'support' ? (
                  <motion.div
                    key="support"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CreatorSupportRequests />
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
                        {isLoadingTasks ? (
                          [1, 2, 3, 4, 5, 6, 7, 8].map(i => <TeamProjectCardSkeleton key={i} />)
                        ) : paginatedTasks.length > 0 ? (
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
                          {isLoadingTasks ? (
                            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <TaskRowSkeleton key={i} />)
                          ) : paginatedTasks.length > 0 ? (
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