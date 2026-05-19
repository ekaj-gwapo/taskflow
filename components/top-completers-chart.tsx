"use client"

import { useMemo, useState } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { LockedOverlay } from "@/components/ui/locked-overlay"
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
  isRevealed,
}: {
  active?: boolean
  payload?: Array<{ payload: { name: string; score: number; completed: number; total: number } }>
  isRevealed: boolean
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-foreground">{isRevealed ? data.name : "Top Performer"}</p>
      <p className="text-xs font-bold text-primary mt-1">{data.score} Points</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {data.completed} of {data.total} tasks completed
      </p>
    </div>
  )
}

export function TopCompletersChart({ onHide }: { onHide?: () => void }) {
  const { tasks, allEmployees, currentUser } = useTaskContext()
  const [isRevealed, setIsRevealed] = useState(false)
  const isHeadAdmin = currentUser?.role?.toLowerCase() === "head_admin"
  const isAdmin = currentUser?.role?.toLowerCase() === "admin"
  const isCreator = currentUser?.role?.toLowerCase() === "creator"
  const isAdminOrAbove = isHeadAdmin || isAdmin || isCreator
  // Only Head Admin and Superadmin can reveal names — Admins cannot
  const canRevealNames = currentUser?.role?.toLowerCase() === "head_admin" || currentUser?.role?.toLowerCase() === "superadmin" || currentUser?.role?.toLowerCase() === "creator"

  const leaderboard = useMemo(() => {
    const stats = allEmployees
      .filter((emp) => !((isHeadAdmin || isAdmin || isCreator) && emp.id === currentUser?.id))
      .map((emp) => {
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
          if (t.priority === "high") score += 10;
          else if (t.priority === "medium") score += 7;
          else score += 4;
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
    return stats
      .sort((a, b) => b.score - a.score || b.completed - a.completed)
      .slice(0, 10)
      .map((item, idx) => ({ ...item, rankLabel: `#${idx + 1}` }))
  }, [tasks, allEmployees])

  const maxScore = Math.max(...leaderboard.map((e) => e.score), 1)

  return (
    <Card className="relative border-border bg-card/40 backdrop-blur-xl shadow-xl h-[400px] flex flex-col overflow-hidden">
      {(currentUser?.plan !== "PRO" && currentUser?.plan !== "ENTERPRISE") && (
        <LockedOverlay 
          title="Team Leaderboard" 
          description="Identify your top performers with point-based rankings and productivity scores."
        />
      )}
      <CardHeader className="pb-3 shrink-0 border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Top Performers
              </CardTitle>
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Leaderboard rankings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canRevealNames && (
              <button
                onClick={() => setIsRevealed(!isRevealed)}
                className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline bg-primary/5 px-2 py-1 rounded"
              >
                {isRevealed ? "Hide Names" : "Reveal Names"}
              </button>
            )}
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
        <div className="p-4">
          {/* Chart */}
          <div className="h-32 mb-4">
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
                  dataKey={isRevealed ? "initials" : "rankLabel"}
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
                <Tooltip content={<CustomTooltip isRevealed={isRevealed} />} cursor={false} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {leaderboard.slice(0, 5).map((_, index) => (
                    <Cell key={index} fill={RANK_COLORS[index] ?? RANK_COLORS[4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ranked List */}
          {leaderboard.length > 0 ? (
            <div className="flex flex-col gap-2">
              {leaderboard.slice(0, 10).map((person, index) => {
                const RankIcon = RANK_ICONS[index]
                return (
                  <div
                    key={person.id}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 bg-secondary/50 border border-border/50"
                  >
                    {/* Rank */}
                    <div className="flex h-5 w-5 items-center justify-center shrink-0">
                      {RankIcon ? (
                        <RankIcon
                          className="h-3.5 w-3.5"
                          style={{ color: RANK_COLORS[index] }}
                        />
                      ) : (
                        <span className="text-[10px] font-black text-muted-foreground">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    {/* Avatar + Name */}
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback
                        className="text-[9px] font-black"
                        style={{
                          backgroundColor:
                            index === 0
                              ? "hsl(45, 93%, 47%)"
                              : "hsl(240, 4%, 14%)",
                          color: index === 0 ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 95%)",
                        }}
                      >
                        {isRevealed ? person.initials : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs font-bold transition-all duration-300",
                        isRevealed ? "text-foreground" : "text-transparent bg-muted/40 rounded blur-[4px] select-none"
                      )}>
                        {person.name}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-black text-foreground">
                          {person.score}
                        </p>
                        <p className="text-[9px] text-muted-foreground leading-none">
                          pts
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-[320px] flex flex-col items-center justify-center text-center p-6">
              <div className="p-3 rounded-full bg-amber-500/10 mb-3">
                <Trophy className="h-6 w-6 text-amber-500/30" />
              </div>
              <p className="text-xs font-black text-foreground uppercase tracking-tight">No Rankings Yet</p>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[160px] font-medium">Rankings will be calculated once tasks are completed.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
