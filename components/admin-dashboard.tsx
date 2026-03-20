"use client"

import { useState, useMemo } from "react"
import { useTaskContext } from "@/lib/task-context"
import { StatsCards } from "@/components/stats-cards"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { TaskDetailPanel } from "@/components/task-detail-panel"
import { AdminSidebar } from "@/components/admin-sidebar"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
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
import { Search, FileText, ChevronRight, Trash2, Filter, Users } from "lucide-react"
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

  const displayAssignees = task.assignees && task.assignees.length > 0 ? task.assignees : []

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

function TeamProjectCard({ task, onSelect, isSelected }: { task: Task; onSelect: () => void; isSelected: boolean }) {
  const isOverdue = task.status !== "completed" && new Date(task.dueDate) < new Date()
  const displayAssignees = task.assignees && task.assignees.length > 0 ? task.assignees : []
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md border-border flex flex-col min-h-[160px] ${isSelected ? "ring-2 ring-[hsl(var(--chart-2))] border-transparent" : "hover:border-[hsl(var(--chart-2))]/50"}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3 pt-4 px-4 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 pr-2">
            <h3 className="text-base font-semibold text-foreground line-clamp-1">{task.title}</h3>
            {isOverdue && (
              <span className="inline-block mt-1 text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded font-medium">Overdue</span>
            )}
          </div>
          <PriorityBadge priority={task.priority} />
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-4 flex flex-col flex-1">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
          {task.description || "No description provided."}
        </p>
        
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
  )
}

export function AdminDashboard() {
  const { tasks, allEmployees, deleteTask } = useTaskContext()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Independent filters for Team Projects
  const [teamFilterStatus, setTeamFilterStatus] = useState<string>("all")
  const [teamFilterPriority, setTeamFilterPriority] = useState<string>("all")
  const [teamSearchQuery, setTeamSearchQuery] = useState("")
  
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
    const isTeamView = selectedEmployeeId === 'team-projects'
    const currentStatus = isTeamView ? teamFilterStatus : filterStatus
    const currentPriority = isTeamView ? teamFilterPriority : filterPriority
    const currentSearch = isTeamView ? teamSearchQuery : searchQuery

    return tasks.filter((t) => {
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
        (selectedEmployeeId === null || 
          (selectedEmployeeId === 'team-projects' ? (t.assignees && t.assignees.length > 1) : 
           (t.assignees?.some(a => a.id === selectedEmployeeId) || t.assigneeId === selectedEmployeeId))
        ) &&
        matchesStatus &&
        (currentPriority === "all" || priority === currentPriority) &&
        (
          currentSearch === "" ||
          t.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
          (t.assignees?.some(a => a.name.toLowerCase().includes(currentSearch.toLowerCase())) || 
           (t.assigneeName || "").toLowerCase().includes(currentSearch.toLowerCase()))
        )
      )
    })
  }, [tasks, filterStatus, filterPriority, searchQuery, teamFilterStatus, teamFilterPriority, teamSearchQuery, selectedEmployeeId])

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
        <StatsCards tasks={selectedEmployeeId === 'team-projects' ? tasks.filter(t => t.assignees && t.assignees.length > 1) : selectedEmployeeId ? tasks.filter(t => t.assignees?.some(a => a.id === selectedEmployeeId) || t.assigneeId === selectedEmployeeId) : tasks} />

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
                value={selectedEmployeeId === 'team-projects' ? teamSearchQuery : searchQuery}
                onChange={(e) => selectedEmployeeId === 'team-projects' ? setTeamSearchQuery(e.target.value) : setSearchQuery(e.target.value)}
                className="pl-9 bg-background border-border text-foreground"
                placeholder="Search tasks or Assignee"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
              <Select 
                value={selectedEmployeeId === 'team-projects' ? teamFilterPriority : filterPriority} 
                onValueChange={selectedEmployeeId === 'team-projects' ? setTeamFilterPriority : setFilterPriority}
              >
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

              <Select 
                value={selectedEmployeeId === 'team-projects' ? teamFilterStatus : filterStatus} 
                onValueChange={selectedEmployeeId === 'team-projects' ? setTeamFilterStatus : setFilterStatus}
              >
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

        {/* TABLE OR GRID */}
        {selectedEmployeeId === 'team-projects' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <TeamProjectCard
                  key={task.id}
                  task={task}
                  onSelect={() => setSelectedTask(task)}
                  isSelected={selectedTask?.id === task.id}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-8 text-center min-h-[300px] border border-border rounded-lg bg-card">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-foreground">No team projects found</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Team projects are collaborative tasks involving 2 or more assignees.
                </p>
              </div>
            )}
          </div>
        ) : (
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
        )}
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