"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useTaskContext } from "@/lib/task-context"
import { TaskDetailPanel } from "@/components/task-detail-panel"
import { EmployeeSidebar } from "@/components/employee-sidebar"
import { AppHeader } from "@/components/app-header"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ChevronRight } from "lucide-react"
import { UrgentTasksSection } from "@/components/urgent-tasks-section"
import { ActivityLogView } from "@/components/activity-log-view"
import { TaskRow, TaskRowSkeleton, TeamProjectCard, TeamProjectCardSkeleton } from "@/components/task-items"
import { SmartBriefing } from "@/components/smart-briefing"
import { cn, formatDate, formatDateTime, calculateTaskProgress } from "@/lib/utils"
import { EmployeeProfileReport } from "@/components/employee-profile-report"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Task, User } from "@/lib/store"


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
                                        <TeamProjectCard
                                          key={task.id}
                                          task={task}
                                          onSelect={() => {
                                            selectTask(selectedTask?.id === task.id ? null : task.id);
                                            markAsSeen(task.id);
                                          }}
                                          isSelected={selectedTask?.id === task.id}
                                          isNew={!seenTaskIds.has(task.id)}
                                          showCreatedBy={true}
                                        />
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
                                  <div className="rounded-[2rem] flex flex-col bg-card/40 backdrop-blur-xl border border-border/50 shadow-2xl min-h-[500px] overflow-hidden">
                                    <div className="flex items-center px-4 py-2.5 border-b bg-muted/50 shrink-0">
                                      <span className="flex-1 text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Task</span>
                                      <div className="hidden md:flex items-center gap-6">
                                        <div className="w-24 text-center text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Priority</div>
                                        <div className="w-32 text-center text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Status</div>
                                        <div className="w-40 text-left pl-5 text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Assignees</div>
                                        <div className="w-24 text-right text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Due Date</div>
                                      </div>
                                      <div className="w-12" />
                                    </div>

                                    <div className="flex-1">
                                      {isLoadingTasks ? (
                                        [1, 2, 3, 4, 5].map(i => <TaskRowSkeleton key={i} />)
                                      ) : paginatedTasks.map((task) => (
                                        <TaskRow
                                          key={task.id}
                                          task={task}
                                          onSelect={() => {
                                            selectTask(selectedTaskId === task.id ? null : task.id);
                                            markAsSeen(task.id);
                                          }}
                                          isSelected={selectedTask?.id === task.id}
                                          isNew={!seenTaskIds.has(task.id)}
                                          showNoteReminder={true}
                                          myPoints={task.assignees?.find(a => a.id === currentUser?.id)?.points}
                                        />
                                      ))}
                                    </div>
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
