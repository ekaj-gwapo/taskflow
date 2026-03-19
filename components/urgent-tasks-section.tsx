"use client"

import { useMemo } from "react"
import { AlertTriangle, Clock, ChevronRight } from "lucide-react"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { formatDate, formatDateTime, cn } from "@/lib/utils"
import type { Task } from "@/lib/store"

interface UrgentTasksSectionProps {
  tasks: Task[]
  onSelectTask: (task: Task) => void
}

export function UrgentTasksSection({ tasks, onSelectTask }: UrgentTasksSectionProps) {
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
    <div className="space-y-3 mb-8">
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

      <div className="grid gap-3">
        {urgentTasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onSelectTask(task)}
            className="flex items-center gap-4 p-3 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-all text-left group overflow-hidden relative"
          >
            {/* Red Dot Indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-foreground truncate">
                  {task.title}
                </span>
                <span className="h-2 w-2 rounded-full bg-destructive animate-ping shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium text-destructive">
                    Due {formatDateTime(task.dueDate)}
                  </span>
                </div>
                <span>•</span>
                <span>{task.assigneeName || "Unassigned"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:block">
                <PriorityBadge priority={task.priority} />
              </div>
              <ChevronRight className="h-4 w-4 text-destructive/40 group-hover:text-destructive group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        ))}
      </div>
      <div className="h-px bg-border/50 w-full mt-6" />
    </div>
  )
}
