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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, FileText, ChevronRight, Trash2, Filter } from "lucide-react"
import { WeeklyReportPanel } from "@/components/weekly-report-panel"
import { TopCompletersChart } from "@/components/top-completers-chart"
import { WorkloadDistribution } from "@/components/workload-distribution"
import { RecentlyCompletedTasks } from "@/components/recently-completed-tasks"
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
        <div className="w-24 flex justify-center">
          <PriorityBadge priority={task.priority} />
        </div>

        {/* STATUS */}
        <div className="w-32 flex justify-center">
          <StatusBadge status={task.status} />
        </div>

        {/* ASSIGNEE */}
        <div className="w-40 flex items-center gap-2">
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
        <div className="w-24 text-right text-xs whitespace-nowrap">
          {formatDate(task.dueDate)}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 ml-4 w-16">
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
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

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
        (selectedEmployeeId === null || t.assigneeId === selectedEmployeeId) &&
        matchesStatus &&
        (filterPriority === "all" || priority === filterPriority) &&
        (
          searchQuery === "" ||
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.assigneeName || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    })
  }, [tasks, filterStatus, filterPriority, searchQuery, selectedEmployeeId])

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden relative">
      <div className="hidden lg:block w-80 shrink-0 border-r border-border overflow-y-auto">
        <AdminSidebar
          selectedEmployeeId={selectedEmployeeId}
          onSelectEmployee={(id) => {
            setSelectedEmployeeId(id)
            setSelectedTask(null)
          }}
        />
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-6">
        <StatsCards tasks={selectedEmployeeId ? tasks.filter(t => t.assigneeId === selectedEmployeeId) : tasks} />

        {!selectedEmployeeId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="flex flex-col gap-6 w-full">
              <WorkloadDistribution />
              <RecentlyCompletedTasks />
            </div>
            <div className="w-full">
              <TopCompletersChart />
            </div>
          </div>
        )}

        {/* SEARCH & FILTER */}
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          <div className="w-full flex flex-col sm:flex-row gap-3 items-center flex-1">
            <div className="relative w-full sm:w-80 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background border-border text-foreground"
                placeholder="Search tasks or Assignee"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-full sm:w-[160px] bg-background border-border whitespace-nowrap">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[160px] bg-background border-border whitespace-nowrap">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="All Statuses" />
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

          <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
            <button
              onClick={() => setShowReport(!showReport)}
              className="flex items-center justify-center p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground shrink-0 border border-border bg-background"
              title="Weekly Report"
            >
              <FileText className="h-4 w-4" />
            </button>
            <CreateTaskDialog />
          </div>
        </div>

        {/* TABLE */}
        <div className="border rounded-lg flex flex-col bg-card min-h-[500px]">
          {/* HEADER */}
          <div className="flex flex-col w-full h-full">
            <div className="flex items-center px-4 py-2.5 border-b bg-muted shrink-0">
              <span className="flex-1 text-xs uppercase text-muted-foreground font-semibold">Task</span>

              <div className="hidden md:flex items-center gap-6">
                <span className="w-24 text-center text-xs text-muted-foreground font-semibold">Priority</span>
                <span className="w-32 text-center text-xs text-muted-foreground font-semibold">Status</span>
                <span className="w-40 text-xs text-muted-foreground font-semibold">Assignee</span>
                <span className="w-24 text-right text-xs text-muted-foreground font-semibold">Due Date</span>
              </div>

              <span className="w-16" />
            </div>

            {/* ROWS */}
            <div className="flex flex-col flex-1">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
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
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium text-foreground">No tasks found</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Try adjusting your filters or search query to find what you're looking for.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {liveSelectedTask && (
        <div className="w-[380px] shrink-0 border-l border-border overflow-y-auto bg-background shadow-xl lg:shadow-none absolute lg:relative right-0 h-full z-10">
          <TaskDetailPanel
            task={liveSelectedTask}
            onClose={() => setSelectedTask(null)}
            showDeleteButton={true}
            showStatusControl={true}
          />
        </div>
      )}

      {showReport && (
        <div className="w-[380px] shrink-0 border-l border-border overflow-y-auto bg-background shadow-xl lg:shadow-none absolute lg:relative right-0 h-full z-10">
          <WeeklyReportPanel onClose={() => setShowReport(false)} />
        </div>
      )}
    </div>
  )
}