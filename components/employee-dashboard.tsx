"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useTaskContext } from "@/lib/task-context"
import { TaskDetailPanel } from "@/components/task-detail-panel"
import { EmployeeSidebar } from "@/components/employee-sidebar"
import { AppHeader } from "@/components/app-header"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, Bell, ChevronRight } from "lucide-react"
import { UrgentTasksSection } from "@/components/urgent-tasks-section"
import { ActivityLogView } from "@/components/activity-log-view"
import { SmartBriefing } from "@/components/smart-briefing"
import { cn, formatDate, formatDateTime, calculateTaskProgress } from "@/lib/utils"
import { EmployeeProfileReport } from "@/components/employee-profile-report"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Task, User } from "@/lib/store"

function NoteReminder({ task }: { task: Task }) {
  const [minutes, setMinutes] = useState(0)

  useEffect(() => {
    if (task.status?.toLowerCase() !== "in-progress") return

    const lastNote = task.progressNotes[task.progressNotes.length - 1]
    if (lastNote) {
      const diff = Date.now() - new Date(lastNote.createdAt).getTime()
      const mins = Math.floor(diff / 60000)
      setMinutes(mins)
    } else {
      setMinutes(30)
    }

    const interval = setInterval(() => {
      if (lastNote) {
        const diff = Date.now() - new Date(lastNote.createdAt).getTime()
        setMinutes(Math.floor(diff / 60000))
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [task.status, task.progressNotes])

  if (task.status?.toLowerCase() !== "in-progress") return null

  const isOverdue = minutes >= 30
  const progress = Math.min((minutes / 30) * 100, 100)

  return (
    <div className={`flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-md text-xs ${isOverdue
        ? "bg-destructive/10 text-destructive"
        : "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]"
      }`}>
      {isOverdue ? (
        <Bell className="h-3 w-3 animate-pulse" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      <span className="flex-1">
        {isOverdue
          ? "Progress note overdue! Please update now."
          : `Next note due in ${30 - minutes}m`}
      </span>
      <Progress
        value={progress}
        className="w-16 h-1.5 bg-secondary"
      />
    </div>
  )
}

function EmployeeTaskCard({
  task,
  onSelect,
  isSelected,
  currentUser,
  isNew,
}: {
  task: Task
  onSelect: () => void
  isSelected: boolean
  currentUser: User | null
  isNew?: boolean
}) {
  const isOverdue =
    task.status?.toLowerCase() !== "completed" && new Date(task.dueDate) < new Date()

  const myAssigneeData = task.assignees?.find(a => a.id === currentUser?.id)
  const myPoints = myAssigneeData ? myAssigneeData.points : 0

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-[1.5rem] border border-border/50 transition-all glass-card",
        isSelected
          ? "border-primary bg-primary/5"
          : "hover:bg-muted/80 hover:border-border hover:shadow-md"
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">
                {task.title}
              </span>
              {isNew && (
                <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded animate-pulse shadow-sm shadow-primary/20">
                  NEW
                </span>
              )}
              {isOverdue && (
                <span className="shrink-0 text-[10px] font-medium text-destructive bg-destructive/10 rounded px-1.5 py-0.5">
                  Overdue
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
            {task.createdBy && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground font-medium bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
                  Created by <span className="text-foreground">{task.createdBy.name}</span>
                </span>
                {task.delegatedBy && task.delegatedBy.id?.toLowerCase() !== task.createdBy.id?.toLowerCase() && (
                  <span className="text-[10px] text-primary/80 font-medium bg-primary/5 px-1.5 py-0.5 rounded border border-primary/20">
                    ↳ Delegated by <span className="text-foreground">{task.delegatedBy.name}</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 ml-2" />

        </div>
        <div className="flex items-center gap-2 mt-3">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {myPoints > 0 && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-[hsl(var(--chart-2))]/15 text-[hsl(var(--chart-2))] shadow-sm border border-[hsl(var(--chart-2))]/20">
              ✨ {myPoints} Pts
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            Due {formatDateTime(task.dueDate)}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
            <span>Action Progress</span>
            <span>{calculateTaskProgress(task)}%</span>
          </div>
          <Progress 
            value={calculateTaskProgress(task)} 
            className="h-1 bg-secondary"
          />
        </div>

        <NoteReminder task={task} />
      </div>
    </motion.button>
  )
}

function EmployeeTaskCardSkeleton() {
  return (
    <div className="w-full rounded-[1.5rem] border border-border/50 p-4 space-y-4 animate-pulse glass-card">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-3 w-24 ml-auto mt-2" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-2 w-20" />
          <Skeleton className="h-2 w-8" />
        </div>
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
    </div>
  )
}

export function EmployeeDashboard({ 
  isProfileOpen, 
  setIsProfileOpen 
}: { 
  isProfileOpen?: boolean; 
  setIsProfileOpen?: (open: boolean) => void 
} = {}) {
  const { tasks, currentUser, canAccessTask, seenTaskIds, markAsSeen, selectedTaskId, selectTask, isLoadingTasks } = useTaskContext()
  const [selectedCategory, setSelectedCategory] = useState<"individual" | "team" | "profile" | "activity-log">("individual")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Sync selectedTask with selectedTaskId
  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId)
      if (task) setSelectedTask(task)
    } else {
      setSelectedTask(null)
    }
  }, [selectedTaskId, tasks])

  const individualTasks = useMemo(() => {
    return tasks.filter((t) =>
    ((t.assignees?.length === 1 && t.assignees[0].id === currentUser?.id) ||
      (t.assigneeId === currentUser?.id && (!t.assignees || t.assignees.length <= 1)))
    )
  }, [tasks, currentUser])

  const teamTasks = useMemo(() => {
    return tasks.filter((t) =>
      (t.assignees && t.assignees.length > 1 && t.assignees.some(a => a.id === currentUser?.id))
    )
  }, [tasks, currentUser])

  const currentCategoryTasks = selectedCategory === "individual" ? individualTasks : teamTasks


  // Ensure selected task is accessible
  useEffect(() => {
    if (selectedTask && !canAccessTask(selectedTask.id)) {
      setSelectedTask(null)
    }
  }, [selectedTask, canAccessTask])

  const filteredTasks = useMemo(() => {
    if (filterStatus === "all") return currentCategoryTasks
    return currentCategoryTasks.filter((t) => t.status?.toLowerCase() === filterStatus)
  }, [currentCategoryTasks, filterStatus])

  const [currentPage, setCurrentPage] = useState(1)
  const tasksPerPage = 10

  useEffect(() => {
    setCurrentPage(1)
  }, [filteredTasks])

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * tasksPerPage
    return filteredTasks.slice(startIndex, startIndex + tasksPerPage)
  }, [filteredTasks, currentPage])

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage)
  
  const todo = currentCategoryTasks.filter((t) => t.status?.toLowerCase() === "todo").length
  const inProgress = currentCategoryTasks.filter((t) => t.status?.toLowerCase() === "in-progress").length
  const completed = currentCategoryTasks.filter((t) => t.status?.toLowerCase() === "completed").length

  const liveSelectedTask = tasks.find((t) => t.id === selectedTaskId) || selectedTask

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
                <EmployeeSidebar
                  isProfileOpen={isProfileOpen}
                  setIsProfileOpen={setIsProfileOpen}
                  selectedCategory={selectedCategory}
                  onSelectCategory={(category) => {
                    setSelectedCategory(category)
                    setSelectedTask(null)
                    selectTask(null)
                    setIsMobileMenuOpen(false)
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
          <EmployeeSidebar
            isProfileOpen={isProfileOpen}
            setIsProfileOpen={setIsProfileOpen}
            selectedCategory={selectedCategory}
            onSelectCategory={(category) => {
              setSelectedCategory(category)
              setSelectedTask(null)
              selectTask(null)
            }}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        <motion.div layout className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {isLoadingTasks && tasks.length === 0 ? (
            <div className="p-4 lg:p-6 space-y-6 animate-in fade-in duration-500">
              <Skeleton className="h-40 w-full rounded-[2rem]" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
              </div>
              <Skeleton className="h-96 w-full rounded-[2rem]" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {selectedCategory === "activity-log" ? (
                <motion.div
                  key="activity-log"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 lg:p-6 lg:pr-5 w-full h-full"
                >
                  <ActivityLogView />
                </motion.div>
              ) : (
                <motion.div
                  key="main-content"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 lg:p-6 lg:pr-5 flex flex-col gap-6"
                >
                {/* Welcome Panel - Only shown on main Dashboard (Individual or Team views) */}
                {(selectedCategory === "individual" || selectedCategory === "team") && (
                  <SmartBriefing />
                )}

                {/* Urgent Tasks Section */}
                {selectedCategory !== "profile" && (
                  <UrgentTasksSection
                    tasks={currentCategoryTasks}
                    onSelectTask={(task) => {
                      selectTask(selectedTaskId === task.id ? null : task.id);
                      markAsSeen(task.id);
                    }}
                    isLoadingTasks={isLoadingTasks}
                  />
                )}

                {/* Task Filter Tabs + Detail Panel side by side */}
                <div className="flex gap-6 items-start">
                  <div className="flex-1 min-w-0 rounded-[2rem] flex flex-col bg-card/40 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden min-h-[400px]">
                    <Tabs value={filterStatus} onValueChange={setFilterStatus} className="flex flex-col h-full">
                      {selectedCategory !== "profile" && (
                        <div className="sticky top-0 z-30 flex items-center px-5 py-3 border-b border-border/50 bg-background/80 backdrop-blur-xl shrink-0">
                          <TabsList className="bg-transparent border-0 h-auto p-0 gap-1">
                            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-3 py-1.5">
                              All ({currentCategoryTasks.length})
                            </TabsTrigger>
                            <TabsTrigger value="todo" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-3 py-1.5">
                              To Do ({todo})
                            </TabsTrigger>
                            <TabsTrigger value="in-progress" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-3 py-1.5">
                              In Progress ({inProgress})
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-3 py-1.5">
                              Completed ({completed})
                            </TabsTrigger>
                          </TabsList>
                        </div>
                      )}

                      <div className="flex-1 overflow-y-auto">
                        <TabsContent value={filterStatus} className="mt-0 p-4">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={selectedCategory + filterStatus}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.2 }}
                              className="mt-0 flex flex-col min-h-[500px]"
                            >
                              {selectedCategory === "profile" ? (
                                <EmployeeProfileReport onEditProfile={() => setIsProfileOpen?.(true)} />
                              ) : filteredTasks.length === 0 ? (
                                <div className="py-12 text-center text-sm text-muted-foreground rounded-lg border border-border bg-card mt-4">
                                  No tasks in this category.
                                </div>
                              ) : selectedCategory === "team" ? (
                                <div className="flex flex-col gap-4 mt-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <AnimatePresence mode="popLayout">
                                      {isLoadingTasks ? (
                                        [1, 2, 3, 4, 5, 6].map(i => <TeamProjectCardSkeleton key={i} />)
                                      ) : paginatedTasks.map((task) => (
                                        <motion.div
                                          layout
                                          initial={{ opacity: 0, scale: 0.9 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.9 }}
                                          whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                                          key={task.id}
                                          className={cn(
                                            "flex flex-col p-5 rounded-[2rem] border-2 cursor-pointer",
                                            (task.status !== "completed" && new Date(task.dueDate) < new Date()) ? "border-destructive/50 shadow-[0_0_15px_-5px_rgba(239,68,68,0.2)]" :
                                            task.status === "completed" ? "border-emerald-500/50 shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]" :
                                            task.status === "in-progress" ? "border-orange-500/50 shadow-[0_0_15px_-5px_rgba(249,115,22,0.2)]" :
                                            "border-muted-foreground/20",
                                            selectedTask?.id === task.id ? "ring-4 ring-primary/20 border-primary" : "",
                                            task.status === "completed" ? "opacity-90" : ""
                                          )}
                                          onClick={() => {
                                            selectTask(selectedTask?.id === task.id ? null : task.id);
                                            markAsSeen(task.id);
                                          }}
                                        >
                                          <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col gap-1.5">
                                              <StatusBadge status={task.status} />
                                              {!seenTaskIds.has(task.id) && (
                                                <span className="w-max text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded animate-pulse">
                                                  NEW
                                                </span>
                                              )}
                                            </div>
                                            <PriorityBadge priority={task.priority} />
                                          </div>
                                          <h3 className="font-bold text-sm mb-1 line-clamp-1">{task.title}</h3>
                                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">
                                            {task.description || "No description provided."}
                                          </p>
                                          
                                          {task.createdBy && (
                                            <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                                              <span className="text-[10px] text-muted-foreground font-medium bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
                                                Created by <span className="text-foreground">{task.createdBy.name}</span>
                                              </span>
                                              {task.delegatedBy && task.delegatedBy.id !== task.createdBy.id && (
                                                <span className="text-[10px] text-primary/80 font-medium bg-primary/5 px-1.5 py-0.5 rounded border border-primary/20">
                                                  ↳ Delegated by <span className="text-foreground">{task.delegatedBy.name}</span>
                                                </span>
                                              )}
                                            </div>
                                          )}
                                          
                                          {/* Team Progress Bar */}
                                          <div className="mb-4 space-y-1.5">
                                            <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                                              <span>Progress</span>
                                              <span>{calculateTaskProgress(task)}%</span>
                                            </div>
                                            <Progress 
                                              value={calculateTaskProgress(task)} 
                                              className="h-1 bg-secondary"
                                            />
                                          </div>

                                          <div className="flex items-center justify-between mt-auto">
                                            <div className="flex -space-x-2 overflow-hidden">
                                              {task.assignees?.map((a) => (
                                                <Avatar key={a.id} className="h-6 w-6 border-2 border-background">
                                                  <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                                                    {a.name[0]}
                                                  </AvatarFallback>
                                                </Avatar>
                                              ))}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                              Due {formatDate(task.dueDate)}
                                            </span>
                                          </div>
                                        </motion.div>
                                      ))}
                                    </AnimatePresence>
                                  </div>
                                  {totalPages > 1 && (
                                    <div className="flex items-center justify-between py-4 mt-auto border-t border-border/50 pt-4">
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
                              ) : (
                                <div className="flex flex-col gap-4 mt-4">
                                  <div className="grid gap-3">
                                    {isLoadingTasks ? (
                                      [1, 2, 3, 4, 5].map(i => <EmployeeTaskCardSkeleton key={i} />)
                                    ) : paginatedTasks.map((task) => (
                                      <EmployeeTaskCard
                                        key={task.id}
                                        task={task}
                                        onSelect={() => {
                                          selectTask(selectedTaskId === task.id ? null : task.id);
                                          markAsSeen(task.id);
                                        }}
                                        isSelected={selectedTask?.id === task.id}
                                        currentUser={currentUser}
                                        isNew={!seenTaskIds.has(task.id)}
                                      />
                                    ))}
                                  </div>
                                  {totalPages > 1 && (
                                    <div className="flex items-center justify-between py-4 mt-auto border-t border-border/50 pt-4">
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
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>

                  {/* Detail Panel — responsive container */}
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
                            onClose={() => { setSelectedTask(null); selectTask(null); }}
                            showStatusControl
                            showNoteInput
                          />
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
      </div>
    </div>
  )
}

function TeamProjectCardSkeleton() {
  return (
    <div className="flex flex-col p-5 rounded-[2rem] border-2 border-border/20 space-y-4 animate-pulse bg-card/40">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="space-y-2 pt-2">
        <div className="flex justify-between">
          <Skeleton className="h-2 w-16" />
          <Skeleton className="h-2 w-8" />
        </div>
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-border/50">
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-6 rounded-full" />)}
        </div>
        <Skeleton className="h-2 w-16" />
      </div>
    </div>
  )
}
