"use client"

import { useMemo, useState } from "react"
import { useTaskContext } from "@/lib/task-context"
import { isDateInCurrentWeek, calculateTaskProgress, cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  ClipboardList, 
  ChevronRight, 
  ChevronDown,
  LayoutDashboard,
  CalendarDays
} from "lucide-react"
import { LockedOverlay } from "@/components/ui/locked-overlay"
import { Progress } from "@/components/ui/progress"

export function EmployeeWeeklyPerformance({ onHide }: { onHide?: () => void }) {
  const { tasks, allEmployees, currentUser } = useTaskContext()
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const isHeadAdmin = currentUser?.role?.toLowerCase() === "head_admin"
  const isAdmin = currentUser?.role?.toLowerCase() === "admin"
  const isCreator = currentUser?.role?.toLowerCase() === "creator"

  const weeklyData = useMemo(() => {
    return allEmployees
      .filter((emp) => !((isHeadAdmin || isAdmin || isCreator) && emp.id === currentUser?.id))
      .map(emp => {
      const empTasks = tasks.filter(t => 
        t.assignees?.some(a => a.id === emp.id) || t.assigneeId === emp.id
      )
      
      const assignedThisWeek = empTasks.filter(t => isDateInCurrentWeek(t.createdAt))
      const completedThisWeek = empTasks.filter(t => t.status === "completed" && isDateInCurrentWeek(t.completedAt))
      const inProgress = empTasks.filter(t => t.status === "in-progress")
      
      return {
        employee: emp,
        assignedCount: assignedThisWeek.length,
        completedCount: completedThisWeek.length,
        inProgressCount: inProgress.length,
        assignedTasks: assignedThisWeek,
        completedTasks: completedThisWeek,
        completionRate: assignedThisWeek.length > 0 
          ? Math.round((completedThisWeek.length / assignedThisWeek.length) * 100) 
          : 0
      }
    }).sort((a, b) => b.completedCount - a.completedCount)
  }, [tasks, allEmployees])

  return (
    <Card className="relative border-border bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden h-[400px] flex flex-col">
      {(currentUser?.plan === "FREE" || !currentUser?.plan || currentUser?.plan === "STARTER") && (
        <LockedOverlay 
          title="Team Productivity" 
          description="Track weekly performance trends, completion rates, and individual employee efficiency."
        />
      )}
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/30 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground">Weekly Performance Report</CardTitle>
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Metrics for current week</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-background/50 border-primary/20 text-primary px-1.5 py-0 text-[9px] font-bold">
              THIS WEEK
            </Badge>
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
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        <div className="divide-y divide-border/50">
          {weeklyData.map((data) => {
            const isExpanded = expandedEmployee === data.employee.id
            return (
              <div key={data.employee.id} className={cn(
                "transition-all duration-200",
                isExpanded ? "bg-accent/30" : "hover:bg-accent/10"
              )}>
                {/* Summary Row */}
                <div 
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedEmployee(isExpanded ? null : data.employee.id)}
                >
                  <Avatar className="h-8 w-8 border-2 border-background shadow-sm shrink-0">
                    <AvatarImage src={data.employee.avatar} />
                    <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">
                      {data.employee.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-foreground truncate">{data.employee.name}</h4>
                      <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">
                        {data.employee.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <ClipboardList className="h-2.5 w-2.5 text-blue-500" />
                        <span className="text-[10px] font-bold text-foreground">{data.assignedCount}</span>
                        <span className="text-[9px] text-muted-foreground font-medium">Assigned</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-foreground">{data.completedCount}</span>
                        <span className="text-[9px] text-muted-foreground font-medium">Completed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5 text-amber-500" />
                        <span className="text-[10px] font-bold text-foreground">{data.inProgressCount}</span>
                        <span className="text-[9px] text-muted-foreground font-medium">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-1 mr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Rate</span>
                      <span className="text-[10px] font-bold text-foreground">{data.completionRate}%</span>
                    </div>
                    <Progress value={data.completionRate} className="h-1 w-14 bg-secondary" />
                  </div>

                  <div className="p-1 rounded-full bg-muted/50 text-muted-foreground">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 rounded-xl bg-background/50 border border-border/50">
                      {/* Assigned Tasks */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-border/30">
                          <h5 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                            <ClipboardList className="h-3 w-3" />
                            Assigned This Week
                          </h5>
                          <span className="text-[10px] font-bold text-muted-foreground">{data.assignedTasks.length}</span>
                        </div>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                          {data.assignedTasks.length > 0 ? (
                            data.assignedTasks.map(t => (
                              <div key={t.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-blue-50/30 border border-blue-100/30 group hover:bg-blue-50/50 transition-colors">
                                <span className="text-xs font-medium text-foreground truncate">{t.title}</span>
                                <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none shrink-0">
                                  {t.status}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic py-2">No new assignments this week.</p>
                          )}
                        </div>
                      </div>

                      {/* Completed Tasks */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-border/30">
                          <h5 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3" />
                            Accomplished This Week
                          </h5>
                          <span className="text-[10px] font-bold text-muted-foreground">{data.completedTasks.length}</span>
                        </div>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                          {data.completedTasks.length > 0 ? (
                            data.completedTasks.map(t => (
                              <div key={t.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-50/30 border border-emerald-100/30 group hover:bg-emerald-50/50 transition-colors">
                                <span className="text-xs font-medium text-foreground truncate">{t.title}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
                                  <span className="text-[9px] font-bold text-emerald-600">DONE</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic py-2">No tasks completed yet this week.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {weeklyData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[320px] text-center p-6">
              <div className="p-3 rounded-full bg-muted/50 mb-3">
                <LayoutDashboard className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-xs font-black text-foreground uppercase tracking-tight">No Performance Data</p>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[180px] font-medium">Data will appear here once tasks are assigned to employees.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
