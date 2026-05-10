"use client"

import { useMemo } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Activity, AlertCircle, ChevronDown } from "lucide-react"
import { LockedOverlay } from "@/components/ui/locked-overlay"

export function WorkloadDistribution({ onHide }: { onHide?: () => void }) {
  const { tasks, allEmployees, currentUser } = useTaskContext()
  const isHeadAdmin = currentUser?.role?.toLowerCase() === "head_admin"
  const isAdmin = currentUser?.role?.toLowerCase() === "admin"
  const isCreator = currentUser?.role?.toLowerCase() === "creator"

  const workloadData = useMemo(() => {
    const stats = allEmployees
      .filter((emp) => !((isHeadAdmin || isAdmin || isCreator) && emp.id === currentUser?.id))
      .map((emp) => {
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
    <Card className="relative border-border bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden h-full flex flex-col max-h-[400px]">
      {(currentUser?.plan === "FREE" || !currentUser?.plan || currentUser?.plan === "STARTER") && (
        <LockedOverlay 
          title="Workload Insights" 
          description="Identify team bottlenecks and optimize task distribution across your entire organization."
        />
      )}
      <CardHeader className="pb-3 bg-muted/30 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Workload Distribution
              </CardTitle>
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Active task load per employee</p>
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
        {/* Ranked List */}
        <div className="flex flex-col gap-3">
          {workloadData.map((person) => {
            let bgClass = "bg-primary/5 border-border shadow-sm group-hover:bg-primary/10"
            let textClass = "text-foreground"
            let nameClass = "text-foreground"

            return (
              <div
                key={person.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors border ${bgClass}`}
              >
                
                {/* Avatar + Name */}
                <Avatar className="h-9 w-9 shrink-0 shadow-sm border border-border/50">
                  {person.avatar ? (
                    <AvatarImage src={person.avatar} />
                  ) : (
                    <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
                      {person.initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate font-semibold ${nameClass}`}>
                      {person.name}
                    </p>
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
                <div className="flex flex-col items-end justify-center shrink-0 pl-2">
                  <div className="text-right">
                    <p className={`text-lg font-bold leading-none ${textClass}`}>
                      {person.activeCount}
                    </p>
                    <p className="text-[10px] mt-1 font-medium text-muted-foreground uppercase tracking-wider">
                      active tasks
                    </p>
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
        </div>
      </CardContent>
    </Card>
  )
}
