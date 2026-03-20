"use client"

import { useMemo } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

const RANK_COLORS = [
  "hsl(45, 93%, 47%)",
  "hsl(0, 0%, 70%)",
  "hsl(25, 77%, 48%)",
  "hsl(217, 92%, 60%)",
  "hsl(217, 72%, 50%)",
]

const RANK_ICONS = [Trophy, Medal, Award]

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { name: string; score: number; completed: number; total: number } }>
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-foreground">{data.name}</p>
      <p className="text-xs font-bold text-primary mt-1">{data.score} Points</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {data.completed} of {data.total} tasks completed
      </p>
    </div>
  )
}

export function TopCompletersChart() {
  const { tasks, allEmployees } = useTaskContext()

  const leaderboard = useMemo(() => {
    const stats = allEmployees.map((emp) => {
      const empTasks = tasks.filter((t) => t.assignees?.some(a => a.id === emp.id) || t.assigneeId === emp.id)
      const completedTasks = empTasks.filter((t) => t.status === "completed")
      const completed = completedTasks.length

      let score = 0;
      completedTasks.forEach(t => {
        const assignment = t.assignees?.find(a => a.id === emp.id)
        if (assignment && typeof assignment.points === 'number') {
          score += assignment.points;
        } else {
          // fallback for older tasks without an assignment record
          if (t.priority === "high") score += 5;
          else if (t.priority === "medium") score += 3;
          else score += 2;
        }
      });

      return {
        id: emp.id,
        name: emp.name,
        initials: emp.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
        completed,
        score,
        total: empTasks.length,
        rate: empTasks.length > 0 ? Math.round((completed / empTasks.length) * 100) : 0,
      }
    })
    return stats.sort((a, b) => b.score - a.score || b.completed - a.completed).slice(0, 10)
  }, [tasks, allEmployees])

  const maxScore = Math.max(...leaderboard.map((e) => e.score), 1)

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[hsl(45,93%,47%)]" />
          <CardTitle className="text-sm font-semibold text-foreground">
            Top Performers (Leaderboard)
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Chart */}
        <div className="h-40 mb-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={leaderboard.slice(0, 5)}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(240, 4%, 16%)"
                vertical={false}
              />
              <XAxis
                dataKey="initials"
                tick={{ fontSize: 11, fill: "hsl(240, 5%, 55%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "hsl(240, 5%, 55%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {leaderboard.slice(0, 5).map((_, index) => (
                  <Cell key={index} fill={RANK_COLORS[index] ?? RANK_COLORS[4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ranked List */}
        <div className="flex flex-col gap-2">
          {leaderboard.slice(0, 8).map((person, index) => {
            const RankIcon = RANK_ICONS[index]
            return (
              <div
                key={person.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 bg-secondary/50"
              >
                {/* Rank */}
                <div className="flex h-6 w-6 items-center justify-center shrink-0">
                  {RankIcon ? (
                    <RankIcon
                      className="h-4 w-4"
                      style={{ color: RANK_COLORS[index] }}
                    />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                  )}
                </div>

                {/* Avatar + Name */}
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback
                    className="text-[10px] font-medium"
                    style={{
                      backgroundColor:
                        index === 0
                          ? "hsl(45, 93%, 47%)"
                          : "hsl(240, 4%, 14%)",
                      color: index === 0 ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 95%)",
                    }}
                  >
                    {person.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {person.name}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      {person.score}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-none">
                      pts
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="w-16 hidden sm:block">
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((person.score / maxScore) * 100, 100)}%`,
                          backgroundColor: RANK_COLORS[index] ?? RANK_COLORS[4],
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                      {person.completed} tasks
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
