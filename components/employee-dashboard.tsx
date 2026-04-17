"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useTaskContext } from "@/lib/task-context"
import { TaskDetailPanel } from "@/components/task-detail-panel"
import { EmployeeSidebar } from "@/components/employee-sidebar"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, Bell, ChevronRight } from "lucide-react"
import { UrgentTasksSection } from "@/components/urgent-tasks-section"
import { ActivityLogView } from "@/components/activity-log-view"
import { cn, formatDate, formatDateTime } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg border transition-colors ${isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-accent/50"
        }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">
                {task.title}
              </span>
              {isNew && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded animate-pulse">
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
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
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
        <NoteReminder task={task} />
      </div>
    </button>
  )
}

export function EmployeeDashboard() {
  const { tasks, currentUser, canAccessTask, seenTaskIds, markAsSeen } = useTaskContext()
  const [selectedCategory, setSelectedCategory] = useState<"individual" | "team" | "profile" | "activity-log">("individual")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")

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

  const myTasks = [...individualTasks, ...teamTasks]
  const todo = currentCategoryTasks.filter((t) => t.status?.toLowerCase() === "todo").length
  const inProgress = currentCategoryTasks.filter((t) => t.status?.toLowerCase() === "in-progress").length
  const completed = currentCategoryTasks.filter((t) => t.status?.toLowerCase() === "completed").length
  const overdue = currentCategoryTasks.filter(
    (t) => t.status?.toLowerCase() !== "completed" && new Date(t.dueDate) < new Date()
  ).length

  const stats = [
    { label: selectedCategory === "individual" ? "My Tasks" : "Team Tasks", value: currentCategoryTasks.length, icon: ClipboardList, iconBg: "bg-primary/10", iconColor: "text-primary" },
    { label: "In Progress", value: inProgress, icon: Clock, iconBg: "bg-[hsl(var(--warning))]/10", iconColor: "text-[hsl(var(--warning))]" },
    { label: "Completed", value: completed, icon: CheckCircle2, iconBg: "bg-[hsl(var(--success))]/10", iconColor: "text-[hsl(var(--success))]" },
    { label: "Overdue", value: overdue, icon: AlertTriangle, iconBg: "bg-destructive/10", iconColor: "text-destructive" },
  ]

  return (
    <div className="flex flex-1 min-h-0">
      {/* Sidebar with My Tasks and Profile */}
      <div className="hidden lg:block">
        <EmployeeSidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedCategory === "activity-log" ? (
          <div className="p-4 lg:p-6 w-full h-full">
            <ActivityLogView />
          </div>
        ) : (
          <div className="p-4 lg:p-6 flex flex-col gap-6">
            {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.iconBg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-foreground leading-none">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Urgent Tasks Section */}
          <UrgentTasksSection
            tasks={currentCategoryTasks}
            onSelectTask={(task) => setSelectedTask(task)}
          />

          {/* Task Filter Tabs */}
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <div className="flex items-center justify-between">
              <TabsList className="bg-secondary border border-border h-9">
                <TabsTrigger value="all" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                  All ({currentCategoryTasks.length})
                </TabsTrigger>
                <TabsTrigger value="todo" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                  To Do ({todo})
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                  In Progress ({inProgress})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                  Completed ({completed})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={filterStatus}>
              {selectedCategory === "profile" ? (
                <div className="py-12 text-center text-sm text-muted-foreground rounded-lg border border-border bg-card mt-4">
                  Viewing Profile Settings in sidebar.
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground rounded-lg border border-border bg-card mt-4">
                  No tasks in this category.
                </div>
              ) : selectedCategory === "team" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {filteredTasks.map((task) => (
                    <Card
                      key={task.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md border-t-4",
                        selectedTask?.id === task.id ? "ring-2 ring-primary border-primary" : "border-t-[hsl(var(--chart-2))]",
                        task.status === "completed" ? "opacity-75" : ""
                      )}
                      onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                    >
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-2">
                          <StatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} />
                        </div>
                        <h3 className="font-bold text-sm mb-1 line-clamp-1">{task.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1 mb-3">
                          {task.description}
                        </p>
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 mt-4">
                  {filteredTasks.map((task) => (
                    <EmployeeTaskCard
                      key={task.id}
                      task={task}
                      onSelect={() => {
                        setSelectedTask(selectedTask?.id === task.id ? null : task);
                        markAsSeen(task.id);
                      }}
                      isSelected={selectedTask?.id === task.id}
                      currentUser={currentUser}
                      isNew={selectedCategory === "individual" && !seenTaskIds.has(task.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedTask && (
        <div className="hidden lg:block w-[380px] shrink-0 filter drop-shadow-xl lg:drop-shadow-none">
          <TaskDetailPanel
            task={tasks.find((t) => t.id === selectedTask.id) || selectedTask}
            onClose={() => setSelectedTask(null)}
            showStatusControl
            showNoteInput
          />
        </div>
      )}
    </div>
  )
}
