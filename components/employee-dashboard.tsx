"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useTaskContext } from "@/lib/task-context"
import { TaskDetailPanel } from "@/components/task-detail-panel"
import { EmployeeSidebar } from "@/components/employee-sidebar"
import { AppHeader } from "@/components/app-header"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, Bell, ChevronRight, Search, Filter, Trash2, Activity, FileText, Users } from "lucide-react"
import { UrgentTasksSection } from "@/components/urgent-tasks-section"
import { ActivityLogView } from "@/components/activity-log-view"
import { SmartBriefing } from "@/components/smart-briefing"
import { EmployeeProfileReport } from "@/components/employee-profile-report"
import { cn, formatDate, formatDateTime, calculateTaskProgress } from "@/lib/utils"
import type { Task, User } from "@/lib/store"



function TaskRowSkeleton() {
  return (
    <div className="w-full flex items-center px-4 py-3 border-b border-border animate-pulse">
      <div className="flex-1 flex flex-col min-w-0">
        <Skeleton className="h-4 w-1/3 mb-2" />
        <Skeleton className="h-3 w-1/2" />
        <div className="mt-3 max-w-[200px] space-y-1.5">
          <Skeleton className="h-2 w-12" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>
      <div className="hidden md:flex items-center shrink-0 gap-4">
        <div className="w-24 flex justify-center"><Skeleton className="h-6 w-16 rounded-full" /></div>
        <div className="w-32 flex justify-center"><Skeleton className="h-6 w-20 rounded-full" /></div>
        <div className="w-40 flex items-center gap-1.5 pl-1">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-6 rounded-full" />) }
          </div>
          <Skeleton className="h-3 w-16 ml-2" />
        </div>
        <div className="w-24"><Skeleton className="h-3 w-16 ml-auto" /></div>
      </div>
      <div className="ml-4 w-12 flex justify-end">
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  )
}

function TaskRow({
  task,
  onSelect,
  isSelected,
  isNew,
  isPanelOpen,
}: {
  task: Task
  onSelect: () => void
  isSelected: boolean
  isNew?: boolean
  isPanelOpen: boolean
}) {
  const isOverdue =
    task.status?.toLowerCase() !== "completed" && new Date(task.dueDate) < new Date()

  const displayAssignees = task.assignees && task.assignees.length > 0 ? task.assignees : []

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "w-full flex items-center px-4 py-4 text-left cursor-pointer border-b border-border border-l-4 border-l-transparent hover:border-l-primary hover:bg-muted/30 transition-all duration-200 bg-white/50",
        isSelected ? "bg-accent/70 border-l-primary" : ""
      )}
    >
      {/* TASK */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate">
            {task.title}
          </span>
          {isNew && (
            <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded animate-pulse shadow-sm shadow-primary/20">
              NEW
            </span>
          )}
          {isOverdue && (
            <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
              Overdue
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {task.description || "No description provided."}
        </p>

        {/* Task Progress Mini-bar */}
        <div className="mt-2.5 max-w-[160px] space-y-1">
          <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>Progress</span>
            <span>{calculateTaskProgress(task)}%</span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${calculateTaskProgress(task)}%` }}
              className="h-full bg-neutral-600 transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* ✅ FIXED COLUMNS */}
      <div className={cn(
        "hidden md:flex items-center shrink-0 gap-4 lg:gap-6",
        isPanelOpen ? "md:gap-3 lg:gap-4" : ""
      )}>
        {/* PRIORITY */}
        <div className="w-20 lg:w-24 flex justify-center">
          <PriorityBadge priority={task.priority} />
        </div>

        {/* STATUS */}
        <div className={cn(
          "w-28 lg:w-32 flex justify-center",
          isPanelOpen ? "hidden xl:flex" : ""
        )}>
          <StatusBadge status={task.status} />
        </div>

        {/* ASSIGNEES */}
        <div className={cn(
          "w-32 lg:w-40 items-center gap-1.5 pl-1 hidden md:flex",
          isPanelOpen ? "hidden xl:flex" : ""
        )}>
          {displayAssignees.length > 0 ? (
            <div className="flex items-center">
              <div className="flex -space-x-2 overflow-hidden items-center">
                {displayAssignees.slice(0, 3).map((a) => (
                  <Avatar key={a.id} className="inline-block h-6 w-6 shrink-0 rounded-full ring-2 ring-background border border-border/50">
                    <AvatarFallback className="text-[9px] bg-secondary text-foreground font-medium">
                      {a.name[0]}
                    </AvatarFallback>
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

        {/* DUE DATE */}
        <div className="w-24 text-right text-xs whitespace-nowrap text-muted-foreground font-medium">
          {formatDate(task.dueDate)}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 ml-4 w-12">
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
                  <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded animate-pulse shadow-sm shadow-primary/20">NEW</span>
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
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
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
    return currentCategoryTasks.filter((t) => {
      const status = t.status?.toLowerCase()
      const priority = t.priority?.toLowerCase()
      
      let matchesStatus = false
      if (filterStatus === "all") {
        matchesStatus = true
      } else if (filterStatus === "overdue") {
        matchesStatus = t.status !== "completed" && new Date(t.dueDate) < new Date()
      } else {
        matchesStatus = status === filterStatus
      }

      return (
        matchesStatus &&
        (filterPriority === "all" || priority === filterPriority) &&
        (
          searchQuery === "" ||
          t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    })
  }, [currentCategoryTasks, filterStatus, filterPriority, searchQuery])

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
                  <div className="flex-1 min-w-0 space-y-4">
                    {/* SEARCH & FILTER */}
                    <AnimatePresence mode="wait">
                      {selectedCategory !== "profile" && (
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
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="pl-9 bg-background border-border text-foreground w-full h-10 rounded-xl"
                                  placeholder="Search tasks..."
                                />
                              </div>

                              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-nowrap overflow-x-auto no-scrollbar p-1 -m-1">
                                <Select value={filterPriority} onValueChange={setFilterPriority}>
                                  <SelectTrigger className="w-[140px] sm:w-[150px] bg-background border-border whitespace-nowrap h-10 rounded-xl">
                                    <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
                                    <SelectValue placeholder="Priority" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                  <SelectTrigger className="w-[140px] sm:w-[150px] bg-background border-border whitespace-nowrap h-10 rounded-xl">
                                    <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="todo">To Do</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* TABLE CARD */}
                    <div className="rounded-[2rem] flex flex-col bg-card/40 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden min-h-[500px]">
                      <Tabs value={filterStatus} onValueChange={setFilterStatus} className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto">
                          <TabsContent value={filterStatus} className="mt-0 p-0">
                          <AnimatePresence mode="popLayout">
                            <motion.div
                              key={selectedCategory}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="mt-0 flex flex-col min-h-[500px]"
                            >
                              {selectedCategory === "profile" ? (
                                <EmployeeProfileReport onEditProfile={() => setIsProfileOpen?.(true)} />
                              ) : selectedCategory === "team" ? (
                                <div className="flex flex-col gap-6 p-2 pt-6">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-1">
                                    <AnimatePresence mode="popLayout">
                                      {isLoadingTasks ? (
                                        [1, 2, 3, 4, 5, 6].map(i => <TeamProjectCardSkeleton key={i} />)
                                      ) : filteredTasks.length === 0 ? (
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/50">
                                          <Users className="h-12 w-12 text-muted-foreground/20 mb-4" />
                                          <p className="text-sm text-muted-foreground font-medium">No team projects found.</p>
                                        </div>
                                      ) : (
                                        paginatedTasks.map((task) => (
                                          <TeamProjectCard
                                            key={task.id}
                                            task={task}
                                            onSelect={() => {
                                              selectTask(selectedTaskId === task.id ? null : task.id);
                                              markAsSeen(task.id);
                                            }}
                                            isSelected={selectedTask?.id === task.id}
                                            isNew={!seenTaskIds.has(task.id) && task.createdById !== currentUser?.id}
                                          />
                                        ))
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  
                                  {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 shrink-0 mt-auto rounded-b-[2rem]">
                                      <span className="text-xs text-muted-foreground">
                                        Showing {(currentPage - 1) * tasksPerPage + 1} - {Math.min(currentPage * tasksPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 px-3 rounded-lg"
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
                                          className="h-8 px-3 rounded-lg"
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
                                <div className="flex flex-col w-full flex-1">
                                  {/* Table Header */}
                                  <div className="flex items-center px-4 py-3 border-b bg-muted/80 shrink-0">
                                    <span className="flex-1 text-[11px] uppercase text-muted-foreground font-bold tracking-widest">Task</span>
                                    <div className={cn(
                                      "hidden md:flex items-center gap-4 lg:gap-6",
                                      !!selectedTask ? "md:gap-3 lg:gap-4" : ""
                                    )}>
                                      <span className="w-20 lg:w-24 text-center text-[11px] text-muted-foreground font-bold tracking-widest">Priority</span>
                                      <span className={cn(
                                        "w-28 lg:w-32 text-center text-[11px] text-muted-foreground font-bold tracking-widest",
                                        !!selectedTask ? "hidden xl:block" : ""
                                      )}>Status</span>
                                      <span className={cn(
                                        "w-32 lg:w-40 text-[11px] text-muted-foreground font-bold tracking-widest hidden md:block",
                                        !!selectedTask ? "hidden xl:block" : ""
                                      )}>Assignee</span>
                                      <span className="w-24 text-right text-[11px] text-muted-foreground font-bold tracking-widest">Due Date</span>
                                    </div>
                                    <span className="w-12" />
                                  </div>

                                  <div className="flex flex-col flex-1">
                                    {isLoadingTasks ? (
                                      [1, 2, 3, 4, 5, 6, 7, 8].map(i => <TaskRowSkeleton key={i} />)
                                    ) : filteredTasks.length === 0 ? (
                                      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                                        <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
                                        <p className="text-sm text-muted-foreground">No tasks found matching your criteria.</p>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col">
                                        <AnimatePresence initial={false}>
                                          {paginatedTasks.map((task) => (
                                            <TaskRow
                                              key={task.id}
                                              task={task}
                                              onSelect={() => {
                                                selectTask(selectedTaskId === task.id ? null : task.id);
                                                markAsSeen(task.id);
                                              }}
                                              isSelected={selectedTask?.id === task.id}
                                              isNew={!seenTaskIds.has(task.id) && task.createdById !== currentUser?.id}
                                              isPanelOpen={!!selectedTask}
                                            />
                                          ))}
                                        </AnimatePresence>
                                      </div>
                                    )}
                                  </div>

                                  {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 shrink-0 mt-auto">
                                      <span className="text-xs text-muted-foreground">
                                        Showing {(currentPage - 1) * tasksPerPage + 1} - {Math.min(currentPage * tasksPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 px-3 rounded-lg"
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
                                          className="h-8 px-3 rounded-lg"
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
                  </div>

                  {/* Detail Panel — Modal Pop-up */}
                  <Dialog open={!!liveSelectedTask} onOpenChange={(open) => { if (!open) { setSelectedTask(null); selectTask(null); } }}>
                    <DialogContent className="max-w-[700px] w-[95vw] h-[90vh] p-0 border-0 overflow-hidden rounded-xl sm:rounded-2xl bg-card">
                      <DialogTitle className="sr-only">Task Details</DialogTitle>
                      {liveSelectedTask && (
                        <TaskDetailPanel
                          task={liveSelectedTask}
                          onClose={() => { setSelectedTask(null); selectTask(null); }}
                          showStatusControl
                          showNoteInput
                        />
                      )}
                    </DialogContent>
                  </Dialog>
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

