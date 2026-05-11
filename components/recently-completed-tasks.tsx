"use client"

import { useMemo } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, Clock, ChevronDown } from "lucide-react"

interface RecentlyCompletedTasksProps {
  onSelectTask?: (task: any) => void
  onHide?: () => void
}

export function RecentlyCompletedTasks({ onSelectTask, onHide }: RecentlyCompletedTasksProps) {
  const { tasks, seenCompletedTaskIds, markCompletedAsSeen, currentUser } = useTaskContext()
  
  const recentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === "completed" && t.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 3)
  }, [tasks])
  
  return (
    <Card className="border-border bg-card/40 backdrop-blur-xl shadow-xl flex flex-col h-[400px] overflow-hidden">
      <CardHeader className="pb-3 bg-muted/30 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Recently Completed
              </CardTitle>
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Latest task activity</p>
            </div>
          </div>
          {onHide && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onHide();
              }}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground group"
              title="Hide Chart"
            >
              <ChevronDown className="h-4 w-4 transform transition-transform group-hover:rotate-180" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        <div className="p-4">
        {recentTasks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recentTasks.map(task => {
              const displayAssignees = task.assignees && task.assignees.length > 0 ? task.assignees : []
              const isUnseen = !seenCompletedTaskIds.has(task.id)
              
              return (
                <button 
                  key={task.id} 
                  onClick={() => {
                    if (onSelectTask) {
                      onSelectTask(task)
                    }
                    markCompletedAsSeen(task.id)
                  }}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-secondary/30 hover:bg-emerald-50/50 hover:border-emerald-200/50 transition-all text-left relative group"
                >
                  {isUnseen && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)] z-10" />
                  )}
                  
                  {displayAssignees.length > 0 ? (
                    <div className="flex -space-x-3 overflow-hidden shrink-0 items-center">
                      {displayAssignees.slice(0, 3).map((a) => (
                        <Avatar key={a.id} className="h-7 w-7 shrink-0 border-2 border-background ring-1 ring-emerald-500/30">
                          {a.avatar ? (
                            <AvatarImage src={a.avatar} />
                          ) : (
                            <AvatarFallback className="text-[9px] font-black bg-emerald-100 text-emerald-800">
                              {a.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ))}
                      {displayAssignees.length > 3 && (
                        <div className="flex items-center justify-center h-7 w-7 shrink-0 rounded-full border-2 border-background ring-1 ring-emerald-500/30 bg-secondary text-[9px] font-bold text-foreground z-10">
                          +{displayAssignees.length - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Avatar className="h-7 w-7 shrink-0 border border-emerald-500/30">
                      <AvatarFallback className="text-[9px] font-black bg-emerald-100 text-emerald-800">
                        UN
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className={cn(
                      "text-xs font-bold truncate transition-colors",
                      isUnseen ? "text-emerald-700" : "text-foreground"
                    )}>
                      {task.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate font-medium">
                      {displayAssignees.filter(a => {
                        const role = currentUser?.role?.toLowerCase()
                        const isAdminRole = role === "head_admin" || role === "admin"
                        return !(isAdminRole && a.id === currentUser?.id)
                      }).length > 0 
                        ? displayAssignees.filter(a => {
                            const role = currentUser?.role?.toLowerCase()
                            const isAdminRole = role === "head_admin" || role === "admin"
                            return !(isAdminRole && a.id === currentUser?.id)
                          }).map(a => a.name).join(", ") 
                        : "TaskFlow Member"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0 text-muted-foreground ml-auto">
                    <span className="text-[10px] font-bold bg-emerald-100/50 text-emerald-700 px-1.5 py-0.5 rounded-sm">
                      {new Date(task.completedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[9px] mt-1 opacity-70 font-medium">
                      {new Date(task.completedAt!).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="h-[320px] flex flex-col items-center justify-center text-center p-6">
            <div className="p-3 rounded-full bg-emerald-500/10 mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500/30" />
            </div>
            <p className="text-xs font-black text-foreground uppercase tracking-tight">No Recent Activity</p>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[160px] font-medium">Completed tasks will appear here as they are finished.</p>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  )
}

import { cn } from "@/lib/utils"
