"use client"

import { useMemo } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, Clock } from "lucide-react"

export function RecentlyCompletedTasks() {
  const { tasks } = useTaskContext()
  
  const recentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === "completed" && t.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 3)
  }, [tasks])
  
  return (
    <Card className="border-border bg-card flex flex-col">
      <CardHeader className="pb-3 bg-secondary/30 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <CardTitle className="text-sm font-semibold text-foreground">
            Recently Completed
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-y-auto">
        {recentTasks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recentTasks.map(task => {
              const displayAssignees = task.assignees && task.assignees.length > 0 ? task.assignees : []
              return (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  {displayAssignees.length > 0 ? (
                    <div className="flex -space-x-3 overflow-hidden shrink-0 items-center">
                      {displayAssignees.slice(0, 3).map((a) => (
                        <Avatar key={a.id} className="h-8 w-8 shrink-0 border-2 border-background ring-1 ring-emerald-500/30">
                          {a.avatar ? (
                            <AvatarImage src={a.avatar} />
                          ) : (
                            <AvatarFallback className="text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              {a.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ))}
                      {displayAssignees.length > 3 && (
                        <div className="flex items-center justify-center h-8 w-8 shrink-0 rounded-full border-2 border-background ring-1 ring-emerald-500/30 bg-secondary text-[10px] font-medium text-foreground z-10">
                          +{displayAssignees.length - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Avatar className="h-8 w-8 shrink-0 border border-emerald-500/30">
                      <AvatarFallback className="text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        UN
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center h-8">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-medium">
                      {displayAssignees.length > 0 
                        ? displayAssignees.map(a => a.name).join(", ") 
                        : "Unassigned"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0 text-muted-foreground">
                    <span className="text-[10px] font-medium bg-secondary px-1.5 py-0.5 rounded-sm">
                      {new Date(task.completedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[9px] mt-1 opacity-70">
                      {new Date(task.completedAt!).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center">
            <CheckCircle2 className="h-8 w-8 opacity-20 mb-2" />
            <p>No recently completed tasks</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
