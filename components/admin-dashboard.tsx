"use client"

import { useState, useMemo } from "react"
import { useTaskContext } from "@/lib/task-context"
import { StatsCards } from "@/components/stats-cards"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { TaskDetailPanel } from "@/components/task-detail-panel"
import { AdminSidebar } from "@/components/admin-sidebar"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search, FileText, ChevronRight, Trash2 } from "lucide-react"
import { WeeklyReportPanel } from "@/components/weekly-report-panel"
import { TopCompletersChart } from "@/components/top-completers-chart"
import { formatDate, formatDateTime } from "@/lib/utils"
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
}: {
  task: Task
  onSelect: () => void
  isSelected: boolean
  onDelete: () => void
}) {
  const isOverdue =
    task.status !== "completed" && new Date(task.dueDate) < new Date()

  const initials = (task.assigneeName || "Unassigned")
    .split(" ")
    .map((n) => n[0])
    .join("")

  return (
    <div
      onClick={onSelect}
      className={`w-full flex items-center px-4 py-3 text-left cursor-pointer transition-colors hover:bg-accent/50 border-b border-border ${isSelected ? "bg-accent/70" : ""
        }`}
    >
      {/* TASK */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {task.title}
          </span>
          {isOverdue && (
            <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
              Overdue
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {task.description}
        </p>
      </div>

      {/* ✅ FIXED COLUMNS */}
      <div className="hidden md:flex items-center shrink-0 gap-6">
        {/* PRIORITY */}
        <div className="w-20 flex justify-center">
          <PriorityBadge priority={task.priority} />
        </div>

        {/* STATUS */}
        <div className="w-32 flex justify-center">
          <StatusBadge status={task.status} />
        </div>

        {/* ASSIGNEE */}
        <div className="w-36 flex items-center gap-2">
          <Avatar className="h-5 w-5 shrink-0">
            {task.assignee?.avatar ? (
              <AvatarImage src={task.assignee.avatar} />
            ) : (
              <AvatarFallback className="text-[9px]">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-xs truncate">
            {task.assigneeName || "Unassigned"}
          </span>
        </div>

        {/* DUE DATE */}
        <div className="w-28 text-right text-xs whitespace-nowrap">
          {formatDate(task.dueDate)}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button 
              onClick={(e) => e.stopPropagation()}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the task "{task.title}" and all its associated action steps and notes. This action cannot be undone.
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
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const { tasks, allEmployees, deleteTask } = useTaskContext()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  const liveSelectedTask = useMemo(() => {
    if (!selectedTask) return null;
    return tasks.find(t => t.id === selectedTask.id) || null;
  }, [tasks, selectedTask])

  const selectedEmployee = selectedEmployeeId
    ? allEmployees.find((e) => e.id === selectedEmployeeId) ?? null
    : null

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const status = t.status?.toLowerCase()
      return (
        (selectedEmployeeId === null || t.assigneeId === selectedEmployeeId) &&
        (filterStatus === "all" || status === filterStatus) &&
        (
          searchQuery === "" ||
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.assigneeName || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    })
  }, [tasks, filterStatus, searchQuery, selectedEmployeeId])

  return (
    <div className="flex flex-1 min-h-0">
      <div className="hidden lg:block w-80 border-r">
        <AdminSidebar
          selectedEmployeeId={selectedEmployeeId}
          onSelectEmployee={(id) => {
            setSelectedEmployeeId(id)
            setSelectedTask(null)
          }}
        />
      </div>

      <div className="flex-1 p-6 space-y-6">
        <StatsCards tasks={tasks} />
        {!selectedEmployeeId && <TopCompletersChart />}

        {/* SEARCH */}
        <div className="flex justify-between">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              placeholder="Search tasks..."
            />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowReport(!showReport)}>
              <FileText className="h-4 w-4" />
            </button>
            <CreateTaskDialog />
          </div>
        </div>

        {/* TABLE */}
        <div className="border rounded-lg overflow-hidden">
          {/* HEADER */}
          <div className="flex items-center px-4 py-2.5 border-b bg-muted">
            <span className="flex-1 text-xs uppercase">Task</span>

            <div className="hidden md:flex items-center gap-6">
              <span className="w-20 text-center text-xs">Priority</span>
              <span className="w-32 text-center text-xs">Status</span>
              <span className="w-36 text-xs">Assignee</span>
              <span className="w-28 text-right text-xs">Due Date</span>
            </div>

            <span className="w-4" />
          </div>

          {/* ROWS */}
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onSelect={() => setSelectedTask(task)}
              isSelected={selectedTask?.id === task.id}
              onDelete={() => {
                deleteTask(task.id);
                if (selectedTask?.id === task.id) setSelectedTask(null);
                toast.success("Task deleted successfully");
              }}
            />
          ))}
        </div>
      </div>

      {liveSelectedTask && (
        <div className="w-[380px] border-l">
          <TaskDetailPanel
            task={liveSelectedTask}
            onClose={() => setSelectedTask(null)}
            showDeleteButton={true}
            showStatusControl={true}
          />
        </div>
      )}

      {showReport && (
        <div className="w-[380px] border-l">
          <WeeklyReportPanel onClose={() => setShowReport(false)} />
        </div>
      )}
    </div>
  )
}