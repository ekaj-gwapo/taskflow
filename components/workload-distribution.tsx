"use client"

import { useMemo } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Activity, AlertCircle } from "lucide-react"

export function WorkloadDistribution() {
  const { tasks, allEmployees } = useTaskContext()

  const workloadData = useMemo(() => {
    const stats = allEmployees.map((emp) => {
      const activeTasks = tasks.filter((t) => (t.assignees?.some(a => a.id === emp.id) || t.assigneeId === emp.id) && t.status !== "completed")
      
      const high = activeTasks.filter((t) => t.priority === "high").length
      const medium = activeTasks.filter((t) => t.priority === "medium").length
      const low = activeTasks.filter((t) => t.priority === "low").length
      
      // Calculate a workload score: High=10, Medium=7, Low=4
      const score = (high * 10) + (medium * 7) + (low * 4)
      
      return {
        id: emp.id,
        name: emp.name,
        avatar: emp.avatar,
        initials: emp.name.split(" ").map((n) => n[0]).join("").toUpperCase(),
        activeCount: activeTasks.length,
        high,
        medium,
        low,
        score
      }
    })
    
    // Sort by highest workload score, then by active count
    return stats.sort((a, b) => b.score - a.score || b.activeCount - a.activeCount)
  }, [tasks, allEmployees])

  const maxScore = Math.max(...workloadData.map((e) => e.score), 1)

  return (
    <Card className="border-border bg-card overflow-hidden h-full flex flex-col max-h-[400px]">
      <CardHeader className="pb-3 bg-secondary/30 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-600" />
          <CardTitle className="text-sm font-semibold text-foreground">
            Current Workload Distribution
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-y-auto">
        {/* Ranked List */}
        <div className="flex flex-col gap-3">
          {workloadData.map((person) => {
            const isOverloaded = person.activeCount >= 5
            const isModerate = person.activeCount >= 3 && person.activeCount < 5
            
            let bgClass = "bg-emerald-500/10 border-emerald-500/20"
            let textClass = "text-emerald-700"
            let nameClass = "text-foreground"
            
            if (isOverloaded) {
              bgClass = "bg-destructive/10 border-destructive/20"
              textClass = "text-destructive font-semibold"
              nameClass = "text-destructive font-semibold"
            } else if (isModerate) {
              bgClass = "bg-amber-500/10 border-amber-500/20"
              textClass = "text-amber-700 font-medium"
              nameClass = "text-foreground font-medium"
            }

            return (
              <div
                key={person.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors border ${bgClass}`}
              >
                
                {/* Avatar + Name */}
                <Avatar className={`h-9 w-9 shrink-0 shadow-sm border ${isOverloaded ? "border-destructive/30" : isModerate ? "border-amber-500/30" : "border-emerald-500/30"}`}>
                  {person.avatar ? (
                    <AvatarImage src={person.avatar} />
                  ) : (
                    <AvatarFallback className={`text-[11px] font-semibold ${isOverloaded ? "bg-destructive/10 text-destructive" : isModerate ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-900"}`}>
                      {person.initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${nameClass}`}>
                      {person.name}
                    </p>
                    {isOverloaded && (
                      <span className="shrink-0 text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Overloaded
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 mt-1 text-[11px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-400 border border-red-500/20" /> {person.high} High
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-yellow-400 border border-yellow-500/20" /> {person.medium} Med
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 border border-emerald-500/20" /> {person.low} Low
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                  <div className="text-right">
                    <p className={`text-[15px] leading-none ${textClass}`}>
                      {person.activeCount}<span className="text-xs font-normal opacity-70">/5</span>
                    </p>
                    <p className={`text-[10px] mt-0.5 font-medium ${isOverloaded ? "text-destructive/80" : isModerate ? "text-amber-700/80" : "text-emerald-700/80"}`}>
                      active tasks
                    </p>
                  </div>
                  
                  {/* Workload Score Bar */}
                  <div className="w-20 h-2 flex rounded-full overflow-hidden bg-secondary shadow-inner" title={`Active Tasks: ${person.activeCount}/5`}>
                    <div 
                      style={{ width: `${Math.min((person.activeCount / 5) * 100, 100)}%` }} 
                      className={`h-full ${isOverloaded ? "bg-destructive" : isModerate ? "bg-amber-500" : "bg-emerald-500"}`} 
                    />
                  </div>
                </div>
              </div>
            )
          })}
          {workloadData.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-emerald-100 mx-auto mb-2" />
              <p className="text-sm font-medium text-emerald-900 border border-emerald-100 bg-emerald-50/50 rounded-lg p-3 inline-block">
                No active tasks found.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
