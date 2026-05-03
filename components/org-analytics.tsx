"use client"

import { useMemo } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  BarChart3,
  CalendarDays,
  Users2
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts"

export function OrgAnalytics() {
  const { tasks, allEmployees } = useTaskContext()

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === "completed").length
    const inProgress = tasks.filter(t => t.status === "in-progress").length
    const todo = tasks.filter(t => t.status === "todo").length
    const overdue = tasks.filter(t => t.status !== "completed" && new Date(t.dueDate) < new Date()).length
    const pendingExtensions = tasks.reduce((acc, t) => acc + (t.extensionRequests?.filter(r => r.status === "PENDING").length || 0), 0)
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, inProgress, todo, overdue, completionRate, pendingExtensions }
  }, [tasks])

  const priorityData = useMemo(() => {
    const high = tasks.filter(t => t.priority === "high").length
    const medium = tasks.filter(t => t.priority === "medium").length
    const low = tasks.filter(t => t.priority === "low").length
    
    return [
      { name: "High", value: high, color: "hsl(var(--destructive))" },
      { name: "Medium", value: medium, color: "hsl(var(--warning, 38 92% 50%))" },
      { name: "Low", value: low, color: "hsl(var(--primary))" }
    ]
  }, [tasks])

  const statusData = useMemo(() => {
    return [
      { name: "Todo", value: stats.todo, color: "hsl(var(--muted-foreground))" },
      { name: "In Progress", value: stats.inProgress, color: "hsl(var(--primary))" },
      { name: "Completed", value: stats.completed, color: "hsl(var(--emerald-500, 142 71% 45%))" }
    ]
  }, [stats])

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Tasks" 
          value={stats.total} 
          icon={<ClipboardList className="h-4 w-4" />}
          trend={`${stats.inProgress} in progress`}
          color="primary"
        />
        <MetricCard 
          title="Completion Rate" 
          value={`${stats.completionRate}%`} 
          icon={<CheckCircle2 className="h-4 w-4" />}
          trend={`${stats.completed} tasks finished`}
          color="emerald"
        />
        <MetricCard 
          title="Overdue Tasks" 
          value={stats.overdue} 
          icon={<AlertTriangle className="h-4 w-4" />}
          trend="Requires immediate attention"
          color="destructive"
          isAlert={stats.overdue > 0}
        />
        <MetricCard 
          title="Pending Extensions" 
          value={stats.pendingExtensions} 
          icon={<Clock className="h-4 w-4" />}
          trend="Requests awaiting review"
          color="amber"
          isAlert={stats.pendingExtensions > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Distribution */}
        <Card className="lg:col-span-2 border-border bg-card/40 backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold">Priority Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 500 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Org Stats */}
        <Card className="border-border bg-card/40 backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold">Status Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Total Employees</span>
                  </div>
                  <span className="text-sm font-bold">{allEmployees.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Active Tasks</span>
                  </div>
                  <span className="text-sm font-bold">{stats.todo + stats.inProgress}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color, 
  isAlert 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend: string;
  color: string;
  isAlert?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    primary: "text-primary bg-primary/10 border-primary/20",
    emerald: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
    amber: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  }

  return (
    <Card className={`border-border bg-card/40 backdrop-blur-xl shadow-lg relative overflow-hidden transition-all hover:scale-[1.02] ${isAlert ? 'ring-2 ring-destructive/20' : ''}`}>
      {isAlert && (
        <div className="absolute top-0 right-0 h-16 w-16 -mr-8 -mt-8 bg-destructive/10 rounded-full blur-2xl" />
      )}
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-xl border ${colorClasses[color] || colorClasses.primary}`}>
            {icon}
          </div>
          {isAlert && <span className="flex h-2 w-2 rounded-full bg-destructive animate-ping" />}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-black tracking-tight text-foreground">{value}</h4>
          <p className="text-[10px] font-medium text-muted-foreground/80 mt-1">{trend}</p>
        </div>
      </CardContent>
    </Card>
  )
}
