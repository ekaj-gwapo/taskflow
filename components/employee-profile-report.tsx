"use client"

import { useMemo } from "react"
import { useTaskContext } from "@/lib/task-context"
import { isDateInCurrentWeek, calculateTaskProgress, cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { 
  Trophy, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Target, 
  Zap, 
  Calendar,
  AlertCircle,
  PlusCircle,
  RefreshCw
} from "lucide-react"
import { useEffect, useState } from "react"
import { ActivityLog } from "@/lib/store"

export function EmployeeProfileReport() {
  const { tasks, currentUser } = useTaskContext()
  const [logs, setLogs] = useState<ActivityLog[]>([])

  useEffect(() => {
    const fetchLogs = async () => {
      if (currentUser?.role !== 'employee') {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("/api/activity-logs", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setLogs(data.logs || []);
          }
        } catch (err) {
          console.error("Failed to fetch logs for profile", err);
        }
      }
    };
    fetchLogs();
  }, [currentUser]);

  const stats = useMemo(() => {
    if (!currentUser) return null

    const userRole = currentUser.role?.toLowerCase()
    const isHeadAdmin = userRole === 'head_admin'
    const isManagement = userRole === 'admin' || userRole === 'head_admin' || userRole === 'superadmin'

    const relevantTasks = isManagement 
      ? tasks 
      : tasks.filter(t => t.assignees?.some(a => a.id === currentUser.id) || t.assigneeId === currentUser.id)

    const completed = relevantTasks.filter(t => t.status === "completed")
    const inProgress = relevantTasks.filter(t => t.status === "in-progress")
    const overdue = relevantTasks.filter(t => t.status !== "completed" && new Date(t.dueDate) < new Date())
    
    // Calculate On-Time Rate
    const onTimeCompleted = completed.filter(t => {
      if (!t.completedAt) return true // Should not happen for completed
      return new Date(t.completedAt) <= new Date(t.dueDate)
    })

    const onTimeRate = completed.length > 0 
      ? Math.round((onTimeCompleted.length / completed.length) * 100) 
      : 0

    // Calculate Completion Rate
    const completionRate = relevantTasks.length > 0 
      ? Math.round((completed.length / relevantTasks.length) * 100) 
      : 0

    // Calculate Total Points
    let totalPoints = 0
    completed.forEach(t => {
      const assignment = t.assignees?.find(a => a.id === currentUser.id)
      if (assignment?.points) {
        totalPoints += assignment.points
      }
    })

    // Weekly Accomplishment
    const completedThisWeek = completed.filter(t => isDateInCurrentWeek(t.completedAt))

    // Admin Specific Stats
    const isAdmin = userRole === 'admin' || userRole === 'head_admin' || userRole === 'superadmin'
    const createdTasksCount = tasks.filter(t => t.createdById === currentUser.id).length
    const reassignedTasksCount = logs.filter(l => 
      l.userId === currentUser.id && 
      (l.action === 'TASK_REASSIGNED' || l.action === 'TASK_DELEGATED' || l.action === 'TEAM_MEMBERS_EDITED' || l.action === 'ASSIGNEE_CHANGED')
    ).length

    return {
      total: relevantTasks.length,
      completed: completed.length,
      inProgress: inProgress.length,
      overdue: overdue.length,
      onTimeRate,
      completionRate,
      totalPoints,
      completedThisWeek: completedThisWeek.length,
      isAdmin,
      isHeadAdmin,
      createdTasksCount,
      reassignedTasksCount
    }
  }, [tasks, currentUser, logs])

  if (!stats) return null

  const metrics = [
    { 
      icon: <Target className="h-4 w-4 text-blue-500" />, 
      label: stats.isAdmin ? "Total Overseen" : "Total Assigned", 
      value: stats.total, 
      description: stats.isAdmin ? "Organizational tasks" : "Lifetime tasks", 
      color: "blue" 
    },
  ]

  // Only show individual performance metrics if not a head_admin 
  // AND either they are an employee OR they actually have personal progress/points
  const showIndividualStats = !stats.isHeadAdmin && (!stats.isAdmin || stats.totalPoints > 0 || stats.completed > 0)

  if (showIndividualStats) {
    metrics.push(
      { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: "Accomplished", value: stats.completed, description: "Completed tasks", color: "emerald" },
      { icon: <Zap className="h-4 w-4 text-amber-500" />, label: "Points Earned", value: stats.totalPoints, description: "Performance score", color: "amber" },
      { icon: <TrendingUp className="h-4 w-4 text-purple-500" />, label: "This Week", value: stats.completedThisWeek, description: "Recent success", color: "purple" }
    )
  }

  if (stats.isAdmin) {
    metrics.push(
      { icon: <PlusCircle className="h-4 w-4 text-sky-500" />, label: "Tasks Created", value: stats.createdTasksCount, description: "Total initialized", color: "blue" },
      { icon: <RefreshCw className="h-4 w-4 text-orange-500" />, label: "Reassigned", value: stats.reassignedTasksCount, description: "Tasks delegated", color: "amber" }
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <MetricCard {...m} />
          </motion.div>
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Meters */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden h-full">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Efficiency Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">Completion Rate</p>
                    <p className="text-[10px] text-muted-foreground">Percentage of assigned tasks finished</p>
                  </div>
                  <span className="text-lg font-black text-primary">{stats.completionRate}%</span>
                </div>
                <Progress value={stats.completionRate} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">On-Time Delivery</p>
                    <p className="text-[10px] text-muted-foreground">Tasks completed before the deadline</p>
                  </div>
                  <span className="text-lg font-black text-emerald-500">{stats.onTimeRate}%</span>
                </div>
                <Progress value={stats.onTimeRate} className="h-2" />
              </div>

              <div className="pt-4 grid grid-cols-2 gap-4 border-t border-border/50">
                <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/50 transition-colors hover:bg-muted/50">
                  <p className="text-2xl font-black text-foreground">{stats.inProgress}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Now</p>
                </div>
                <div className={cn(
                  "text-center p-3 rounded-xl border border-border/50 transition-colors",
                  stats.overdue > 0 ? "bg-destructive/10 border-destructive/20 hover:bg-destructive/20" : "bg-muted/30 hover:bg-muted/50"
                )}>
                  <p className={cn("text-2xl font-black", stats.overdue > 0 ? "text-destructive" : "text-foreground")}>
                    {stats.overdue}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Breakdown / Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden h-full">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Workload Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <StatusItem 
                  label="Completed" 
                  count={stats.completed} 
                  total={stats.total} 
                  color="bg-emerald-500" 
                />
                <StatusItem 
                  label="In Progress" 
                  count={stats.inProgress} 
                  total={stats.total} 
                  color="bg-amber-500" 
                />
                <StatusItem 
                  label="Overdue" 
                  count={stats.overdue} 
                  total={stats.total} 
                  color="bg-destructive" 
                />
                <StatusItem 
                  label="Total Portfolio" 
                  count={stats.total} 
                  total={stats.total} 
                  color="bg-blue-500" 
                />
              </div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20 relative overflow-hidden group cursor-default"
              >
                <div className="absolute -right-4 -bottom-4 opacity-10 transition-transform group-hover:scale-110">
                  <Trophy className="h-24 w-24" />
                </div>
                <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-1">Performance Insight</p>
                <p className="text-xs text-foreground leading-relaxed relative z-10">
                  {stats.onTimeRate >= 90 
                    ? "Outstanding! You maintain an excellent on-time completion record. Keep up the great work."
                    : stats.onTimeRate >= 70
                    ? "Good performance. Most of your tasks are delivered on time. Focus on overdue items to improve further."
                    : "Consider reviewing your active workload. Focusing on early updates can help boost your on-time delivery rate."}
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

function MetricCard({ icon, label, value, description, color }: { icon: React.ReactNode, label: string, value: number | string, description: string, color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    purple: "bg-purple-500/10 text-purple-600"
  }

  const colorClass = colorMap[color] || colorMap.blue

  return (
    <Card className="border-border bg-card/40 backdrop-blur-xl shadow-md group hover:shadow-xl transition-all">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn("p-2 rounded-lg", colorClass)}>
            {icon}
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-black text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusItem({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <div className="flex items-center gap-2 text-foreground">
          <div className={cn("h-1.5 w-1.5 rounded-full", color)} />
          {label}
        </div>
        <span className="text-muted-foreground">{count} tasks ({percentage}%)</span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", color)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
