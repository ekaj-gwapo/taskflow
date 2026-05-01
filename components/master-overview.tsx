"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Activity, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

export function MasterOverview() {
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalUsers: 0,
    activeUsers: 0,
    tasksCreated: 0
  })

  useEffect(() => {
    // Fetch real stats from an API in a real app
    // Mocking for now
    setStats({
      totalOrgs: 12,
      totalUsers: 48,
      activeUsers: 35,
      tasksCreated: 156
    })
  }, [])

  const cards = [
    { label: "Total Organizations", value: stats.totalOrgs, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Registered Users", value: stats.totalUsers, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Active Users (24h)", value: stats.activeUsers, icon: Activity, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Tasks Managed", value: stats.tasksCreated, icon: CheckCircle2, color: "text-orange-500", bg: "bg-orange-500/10" },
  ]

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-foreground">Platform Health Check</h1>
        <p className="text-muted-foreground text-lg">System-wide monitoring and real-time statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-full -mr-12 -mt-12 blur-3xl`} />
                <CardHeader className="pb-2">
                  <div className={`p-2 w-10 h-10 rounded-lg ${card.bg} ${card.color} mb-2 flex items-center justify-center`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{card.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-foreground">{card.value}</div>
                  <div className="mt-2 flex items-center gap-1 text-xs font-bold text-green-500">
                    <TrendingUp className="h-3 w-3" />
                    +12% from last week
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border bg-card/50 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent System Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary transition-colors">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">New Head Admin Registered</p>
                    <p className="text-xs text-muted-foreground">jake@acme.com joined the platform</p>
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">{i}h ago</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex flex-col items-center justify-center text-center p-8">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">System Healthy</h3>
              <p className="text-sm text-muted-foreground mt-2">No critical issues or security alerts detected in the last 24 hours.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
