"use client"

import { useMemo } from "react"
import { AlertTriangle, Clock, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { formatDate, formatDateTime, cn, calculateTaskProgress } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import type { Task } from "@/lib/store"

interface UrgentTasksSectionProps {
  tasks: Task[]
  onSelectTask: (task: Task) => void
  isLoadingTasks?: boolean
}

export function UrgentTasksSection({ tasks, onSelectTask, isLoadingTasks }: UrgentTasksSectionProps) {
  const urgentTasks = useMemo(() => {
    const now = new Date().getTime()
    const oneDayInMs = 24 * 60 * 60 * 1000
    
    return tasks.filter(task => {
      if (task.status === "completed") return false
      const due = new Date(task.dueDate).getTime()
      const diff = due - now
      // Urgent if overdue OR due within 24 hours
      return diff < oneDayInMs
    })
  }, [tasks])

  if (urgentTasks.length === 0) return null

  return (
    <div className="space-y-3 mb-0">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
        </div>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Urgent Tasks
          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-destructive text-white text-[10px] animate-pulse">
            {urgentTasks.length}
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoadingTasks ? (
          [1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-card/50 animate-pulse">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            </div>
          ))
        ) : urgentTasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onSelectTask(task)}
            className="flex items-center gap-3 p-2.5 rounded-xl border border-destructive/10 bg-destructive/[0.02] hover:bg-destructive/[0.05] transition-all text-left group relative"
          >
            <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Clock className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground truncate">
                  {task.title}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse shrink-0" />
              </div>
              <p className="text-[10px] text-destructive font-semibold uppercase tracking-tighter">
                Overdue {formatDateTime(task.dueDate)}
              </p>
            </div>

            <ChevronRight className="h-3.5 w-3.5 text-destructive/30 group-hover:text-destructive transition-colors" />
          </button>
        ))}
      </div>
      <div className="h-px bg-border/50 w-full mt-2" />
    </div>
  )
}
