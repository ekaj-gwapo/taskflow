"use client"

import { useMemo } from "react"
import { useTaskContext } from "@/lib/task-context"
import { isDateInCurrentWeek, calculateTaskProgress, cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
  RefreshCw,
  Shield,
  Users,
  Activity,
  Mail,
  Phone,
  MapPin,
  User as UserIcon
} from "lucide-react"
import { useEffect, useState } from "react"
import { ActivityLog } from "@/lib/store"

export function EmployeeProfileReport({ onEditProfile }: { onEditProfile?: () => void } = {}) {
  const { tasks, currentUser, allEmployees } = useTaskContext()
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
    const isAdmin = userRole === 'admin'
    const isCreator = userRole === 'creator'
    const isManagement = isAdmin || isHeadAdmin || userRole === 'superadmin' || isCreator

    // For personal stats: tasks actually assigned TO this user
    const personalTasks = tasks.filter(t =>
      t.assignees?.some(a => a.id === currentUser.id) || t.assigneeId === currentUser.id
    )

    // For overview (Head Admin & Creator): all org tasks
    const relevantTasks = (isHeadAdmin || isCreator) ? tasks : personalTasks

    const completed = relevantTasks.filter(t => t.status === "completed")
    const inProgress = relevantTasks.filter(t => t.status === "in-progress")
    const overdue = relevantTasks.filter(t => t.status !== "completed" && new Date(t.dueDate) < new Date())
    
    // Calculate On-Time Rate
    const onTimeCompleted = completed.filter(t => {
      if (!t.completedAt) return true
      return new Date(t.completedAt) <= new Date(t.dueDate)
    })

    const onTimeRate = completed.length > 0 
      ? Math.round((onTimeCompleted.length / completed.length) * 100) 
      : 0

    // Calculate Completion Rate
    const completionRate = relevantTasks.length > 0 
      ? Math.round((completed.length / relevantTasks.length) * 100) 
      : 0

    // Calculate Total Points (personal — tasks assigned to them)
    let totalPoints = 0
    const personalCompleted = personalTasks.filter(t => t.status === "completed")
    personalCompleted.forEach(t => {
      const assignment = t.assignees?.find(a => a.id === currentUser.id)
      if (assignment?.points) {
        totalPoints += assignment.points
      }
    })

    // Weekly Accomplishment (personal)
    const completedThisWeek = personalCompleted.filter(t => isDateInCurrentWeek(t.completedAt))

    // Admin Specific Stats
    const createdTasksCount = tasks.filter(t => t.createdById === currentUser.id).length
    const delegatedTasksCount = tasks.filter(t => t.delegatedById === currentUser.id).length

    return {
      total: relevantTasks.length,
      personalTotal: personalTasks.length,
      personalCompleted: personalCompleted.length,
      completed: completed.length,
      inProgress: inProgress.length,
      overdue: overdue.length,
      onTimeRate,
      completionRate,
      totalPoints,
      completedThisWeek: completedThisWeek.length,
      delegatedTasksCount,
      isHeadAdmin,
      isAdmin,
      isCreator,
      isManagement,
      createdTasksCount
    }
  }, [tasks, currentUser, logs])

  if (!stats) return null

  // For Head Admin: show org overview metrics
  // For Admin: show personal task metrics (assigned to them) + management metrics
  // For Employee: show personal task metrics
  const isHeadAdmin = stats.isHeadAdmin
  const isAdmin = stats.isAdmin
  const isCreator = stats.isCreator

  const metrics = []

  if (isHeadAdmin || isCreator) {
    // Head Admin & Creator: org-wide overview
    metrics.push(
      { icon: <Target className="h-4 w-4 text-blue-500" />, label: isCreator ? "Total Org Tasks" : "Total Overseen", value: stats.total, description: "System volume", color: "blue" },
    )
  } else {
    // Admin and Employee: personal task stats
    metrics.push(
      { icon: <Target className="h-4 w-4 text-blue-500" />, label: "Total Assigned", value: stats.personalTotal, description: "Lifetime tasks", color: "blue" },
      { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: "Accomplished", value: stats.personalCompleted, description: "Completed tasks", color: "emerald" },
      { icon: <Zap className="h-4 w-4 text-amber-500" />, label: "Points Earned", value: stats.totalPoints, description: "Performance score", color: "amber" },
      { icon: <TrendingUp className="h-4 w-4 text-purple-500" />, label: "This Week", value: stats.completedThisWeek, description: "Recent success", color: "purple" }
    )
  }

  if (stats.isAdmin || stats.isHeadAdmin || stats.isCreator) {
    metrics.push(
      { icon: <PlusCircle className="h-4 w-4 text-sky-500" />, label: "Tasks Created", value: stats.createdTasksCount, description: "Total initialized", color: "blue" },
      { icon: <RefreshCw className="h-4 w-4 text-orange-500" />, label: "Delegated", value: stats.delegatedTasksCount, description: "Tasks Delegated", color: "amber" }
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* User Identity Header */}
      <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20 border border-border p-8 mb-8 shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <UserIcon className="h-48 w-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="h-32 w-32 rounded-[2.5rem] overflow-hidden border-4 border-background shadow-xl">
              <Avatar className="h-full w-full">
                {currentUser?.avatar ? (
                  <AvatarImage src={currentUser.avatar} alt={currentUser?.name} className="object-cover" />
                ) : (
                  <AvatarFallback className="text-4xl font-black bg-gradient-to-br from-primary to-emerald-600 text-white">
                    {currentUser?.name?.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
              <h1 className="text-3xl font-black text-foreground tracking-tight">{currentUser?.name}</h1>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 tracking-widest uppercase">
                {currentUser?.role === 'head_admin' ? 'HEAD ADMIN' : currentUser?.role?.replace('_', ' ')}
              </span>
            </div>
            
            <p className="text-sm font-medium text-muted-foreground mb-6">
              {currentUser?.jobTitle || "Organization Member"}
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary/70" />
                <span>{currentUser?.email}</span>
              </div>
              {currentUser?.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-emerald-500/70" />
                  <span>{currentUser.phone}</span>
                </div>
              )}
              {currentUser?.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-orange-500/70" />
                  <span>{currentUser.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action */}
          <div className="shrink-0 mt-6 md:mt-0">
            <Button 
              onClick={onEditProfile} 
              className="rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

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
      {stats.isCreator ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="border-border bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden h-full">
              <CardHeader className="pb-3 border-b border-border/50 bg-primary/5">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Organization Owner Hub
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 font-normal">
                  As the Creator, you have full administrative oversight and ownership of the TaskFlow organization.
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-background shadow-sm hover:shadow-md transition-all">
                    <Users className="h-5 w-5 text-blue-500 mb-2" />
                    <p className="text-2xl font-black text-foreground">{allEmployees.length}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Employees</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-background shadow-sm hover:shadow-md transition-all">
                    <Target className="h-5 w-5 text-indigo-500 mb-2" />
                    <p className="text-2xl font-black text-foreground">{stats.total}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">System Tasks</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-background shadow-sm hover:shadow-md transition-all">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-2" />
                    <p className="text-2xl font-black text-foreground">{stats.completionRate}%</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Avg Completion</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-background shadow-sm hover:shadow-md transition-all">
                    <Zap className="h-5 w-5 text-amber-500 mb-2" />
                    <p className="text-2xl font-black text-foreground">{stats.onTimeRate}%</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">On-Time Rate</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Shield className="h-16 w-16 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Operational Status
                  </p>
                  <p className="text-xs text-foreground/80 leading-relaxed max-w-[85%] relative z-10">
                    {stats.overdue > 0 
                      ? `There are currently ${stats.overdue} overdue tasks across the organization. Review the 'All Tasks' section to follow up with assigned teams and ensure timely project delivery.`
                      : "Your organization is running efficiently with no overdue tasks. All teams are on track. Excellent leadership and coordination!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-border bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden h-full flex flex-col">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-orange-500" />
                  Administrative Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col justify-center space-y-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600">
                      <PlusCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Tasks Initialized</p>
                      <p className="text-[10px] text-muted-foreground">Created by you</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-foreground">{stats.createdTasksCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                      <RefreshCw className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Delegated Tasks</p>
                      <p className="text-[10px] text-muted-foreground">Admin task updates</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-foreground">{stats.delegatedTasksCount}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : (
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
      )}
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
