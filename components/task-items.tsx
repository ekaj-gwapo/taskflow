"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronRight, Share2, Trash2, Bell, Clock, Users } from "lucide-react"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn, formatDate, formatDateTime, calculateTaskProgress } from "@/lib/utils"
import type { Task } from "@/lib/store"

// --- Components from Employee Dashboard ---

export function NoteReminder({ task }: { task: Task }) {
  const [minutes, setMinutes] = useState(0)

  useEffect(() => {
    if (task.status?.toLowerCase() !== "in-progress") return

    const lastNote = task.progressNotes[task.progressNotes.length - 1]
    if (lastNote) {
      const diff = Date.now() - new Date(lastNote.createdAt).getTime()
      const mins = Math.floor(diff / 60000)
      setMinutes(mins)
    } else {
      setMinutes(30)
    }

    const interval = setInterval(() => {
      if (lastNote) {
        const diff = Date.now() - new Date(lastNote.createdAt).getTime()
        setMinutes(Math.floor(diff / 60000))
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [task.status, task.progressNotes])

  if (task.status?.toLowerCase() !== "in-progress") return null

  const isOverdue = minutes >= 30
  const progress = Math.min((minutes / 30) * 100, 100)

  return (
    <div className={`flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-md text-[10px] ${isOverdue
        ? "bg-destructive/10 text-destructive border border-destructive/20"
        : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
      }`}>
      {isOverdue ? (
        <Bell className="h-3 w-3 animate-pulse" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      <span className="flex-1 font-medium">
        {isOverdue
          ? "Progress note overdue! Please update now."
          : `Next note due in ${30 - minutes}m`}
      </span>
      <Progress
        value={progress}
        className="w-12 h-1 bg-secondary"
      />
    </div>
  )
}

// --- Shared Components ---

export function TaskRow({
  task,
  onSelect,
  isSelected,
  onDelete,
  isDelegatedView,
  currentUserRole,
  currentUserId,
  taskCreatorId,
  isNew,
  showNoteReminder,
  myPoints,
}: {
  task: Task
  onSelect: () => void
  isSelected: boolean
  onDelete?: () => void
  isDelegatedView?: boolean
  currentUserRole?: string
  currentUserId?: string
  taskCreatorId?: string
  isNew?: boolean
  showNoteReminder?: boolean
  myPoints?: number
}) {
  const isOverdue =
    task.status !== "completed" && new Date(task.dueDate) < new Date()

  const displayAssignees = task.assignees && task.assignees.length > 0 ? task.assignees : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ x: 4 }}
      onClick={onSelect}
      className={cn(
        "w-full flex items-center px-4 py-3 text-left cursor-pointer border-b border-border border-l-4 border-l-transparent hover:border-l-primary hover:bg-muted/80 transition-colors",
        isSelected ? "bg-accent/70 border-l-primary" : ""
      )}
    >
      {/* TASK */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold truncate text-foreground">
            {task.title}
          </span>
          {task.delegatedById && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase">
              <Share2 className="h-2 w-2" />
              Delegated
            </span>
          )}
          {isNew && (
            <span className="text-[9px] font-black text-white bg-primary px-1.5 py-0.5 rounded animate-pulse shadow-sm shadow-primary/20">
              NEW
            </span>
          )}
          {isOverdue && (
            <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded uppercase">
              Overdue
            </span>
          )}
          {myPoints !== undefined && myPoints > 0 && (
             <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold bg-emerald-500/15 text-emerald-600 shadow-sm border border-emerald-500/20">
               ✨ {myPoints} Pts
             </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {task.description || "No description provided."}
        </p>

        {/* Task Progress Mini-bar */}
        <div className="mt-2.5 max-w-[240px] space-y-1.5">
          <div className="flex items-center justify-between text-[9px] font-bold text-primary/80 uppercase tracking-tight">
            <span>Action Progress</span>
            <span>{calculateTaskProgress(task)}%</span>
          </div>
          <Progress value={calculateTaskProgress(task)} className="h-1 bg-secondary border border-border/30" />
        </div>

        {showNoteReminder && <NoteReminder task={task} />}
      </div>

      {/* ✅ FIXED COLUMNS */}
      <div className="hidden md:flex items-center shrink-0 gap-6">
        {/* PRIORITY */}
        <div className="w-24 flex justify-center">
          <PriorityBadge priority={task.priority} />
        </div>

        {/* STATUS */}
        <div className="w-32 flex justify-center">
          <StatusBadge status={task.status} />
        </div>

        {/* ASSIGNEES */}
        <div className="w-40 flex items-center gap-1.5 pl-1">
          {displayAssignees.length > 0 ? (
            <div className="flex items-center">
              <div className="flex -space-x-2 overflow-hidden items-center">
                {displayAssignees.slice(0, 3).map((a) => (
                  <Avatar key={a.id} className="inline-block h-6 w-6 shrink-0 rounded-full ring-2 ring-background border border-border/50">
                    {a.avatar ? (
                      <AvatarImage src={a.avatar} />
                    ) : (
                      <AvatarFallback className="text-[9px] bg-secondary text-foreground font-medium uppercase">
                        {a.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ))}
                {displayAssignees.length > 3 && (
                  <div className="flex items-center justify-center h-6 w-6 shrink-0 rounded-full ring-2 ring-background bg-secondary text-[9px] font-bold text-foreground z-10 border border-border/50">
                    +{displayAssignees.length - 3}
                  </div>
                )}
              </div>
              {displayAssignees.length === 1 && (
                <span className="text-[11px] truncate ml-2 text-foreground font-semibold">{displayAssignees[0].name}</span>
              )}
              {displayAssignees.length > 1 && (
                <span className="text-[10px] truncate ml-2 text-muted-foreground font-medium">{displayAssignees.length} members</span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground ml-1">Unassigned</span>
          )}
        </div>

        {/* DUE DATE OR DELEGATED AT */}
        <div className="w-24 text-right text-xs whitespace-nowrap text-muted-foreground">
          {isDelegatedView && task.delegatedAt ? (
            <div className="flex flex-col items-end">
              <span className="font-semibold text-foreground">{formatDate(task.delegatedAt)}</span>
              <span className="text-[9px] opacity-70 font-medium">
                {new Date(task.delegatedAt).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <span className="font-semibold text-foreground">{formatDate(task.dueDate)}</span>
              <span className="text-[9px] opacity-70 font-medium">
                {new Date(task.dueDate).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 ml-4 w-12">
        {onDelete && (currentUserRole === "SUPERADMIN" || currentUserRole === "HEAD_ADMIN" || taskCreatorId === currentUserId) && task.status === "todo" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                title="Delete Task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the task "{task.title}" and all its associated action items and notes. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Task
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      </div>
    </motion.div>
  )
}

export function TaskRowSkeleton() {
  return (
    <div className="w-full flex items-center px-4 py-3 border-b border-border animate-pulse">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
           <Skeleton className="h-4 w-1/3 rounded" />
           <Skeleton className="h-3 w-12 rounded-full" />
        </div>
        <Skeleton className="h-3 w-1/2 rounded" />
        <div className="mt-3 max-w-[200px] space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-2 w-10 rounded" />
            <Skeleton className="h-2 w-6 rounded" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>
      <div className="hidden md:flex items-center shrink-0 gap-6">
        <div className="w-24 flex justify-center"><Skeleton className="h-6 w-16 rounded-full" /></div>
        <div className="w-32 flex justify-center"><Skeleton className="h-6 w-20 rounded-full" /></div>
        <div className="w-40 flex items-center gap-1.5 pl-1">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-6 rounded-full border-2 border-background" />)}
          </div>
          <Skeleton className="h-3 w-16 ml-2" />
        </div>
        <div className="w-24 flex flex-col items-end gap-1">
           <Skeleton className="h-3 w-16" />
           <Skeleton className="h-2 w-10" />
        </div>
      </div>
      <div className="ml-4 w-12 flex justify-end">
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </div>
  )
}

export function TeamProjectCard({
  task,
  onSelect,
  isSelected,
  isNew,
  showCreatedBy,
}: {
  task: Task;
  onSelect: () => void;
  isSelected: boolean;
  isNew?: boolean;
  showCreatedBy?: boolean;
}) {
  const isOverdue = task.status !== "completed" && new Date(task.dueDate) < new Date()
  const displayAssignees = task.assignees && task.assignees.length > 0 ? task.assignees : []

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
      className={cn(
        "cursor-pointer flex flex-col min-h-[160px] rounded-[2rem] border-2 transition-all duration-300",
        isOverdue ? "border-destructive/50 bg-destructive/5 shadow-[0_0_15px_-5px_rgba(239,68,68,0.2)]" :
          task.status === "completed" ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]" :
            task.status === "in-progress" ? "border-orange-500/50 bg-orange-500/5 shadow-[0_0_15px_-5px_rgba(249,115,22,0.2)]" :
              "border-muted-foreground/20 bg-card/40",
        isSelected ? "ring-4 ring-primary/20 border-primary" : ""
      )}
      onClick={onSelect}
    >
      <Card className="h-full border-0 bg-transparent shadow-none">
        <CardHeader className="pb-3 pt-5 px-5 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 pr-2">
              <h3 className="text-sm font-bold text-foreground line-clamp-1">{task.title}</h3>
              <div className="flex items-center gap-1.5 mt-1.5">
                {isNew && (
                  <span className="text-[9px] font-black text-white bg-primary px-1.5 py-0.5 rounded animate-pulse shadow-sm shadow-primary/20 uppercase">NEW</span>
                )}
                {isOverdue && (
                  <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded uppercase">Overdue</span>
                )}
              </div>
            </div>
            <PriorityBadge priority={task.priority} />
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5 flex flex-col flex-1">
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1 font-medium leading-relaxed">
            {task.description || "No description provided."}
          </p>

          {showCreatedBy && task.createdBy && (
            <div className="flex items-center gap-1.5 mb-4 flex-wrap">
              <span className="text-[9px] text-muted-foreground font-bold bg-secondary/80 px-2 py-0.5 rounded border border-border/50 uppercase tracking-tight">
                Created by <span className="text-foreground">{task.createdBy.name}</span>
              </span>
              {task.delegatedBy && task.delegatedBy.id !== task.createdBy.id && (
                <span className="text-[9px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20 uppercase tracking-tight">
                  ↳ Delegated by <span className="text-foreground">{task.delegatedBy.name}</span>
                </span>
              )}
            </div>
          )}

          {/* Card Progress Bar */}
          <div className="mb-5 space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
              <span>Action Progress</span>
              <span>{calculateTaskProgress(task)}%</span>
            </div>
            <Progress value={calculateTaskProgress(task)} className="h-1 bg-secondary" />
          </div>

          <div className="flex items-center justify-between mt-auto shrink-0 pt-3 border-t border-border/30">
            <StatusBadge status={task.status} />

            <div className="flex items-center gap-2">
               <div className="flex -space-x-2 overflow-hidden items-center">
                 {displayAssignees.slice(0, 4).map((a) => (
                   <Avatar key={a.id} className="inline-block h-6 w-6 shrink-0 rounded-full ring-2 ring-background border border-border/50">
                     {a.avatar ? (
                       <AvatarImage src={a.avatar} />
                     ) : (
                       <AvatarFallback className="text-[8px] bg-secondary text-foreground font-bold uppercase">
                         {a.name.split(" ").map(n => n[0]).join("")}
                       </AvatarFallback>
                     )}
                   </Avatar>
                 ))}
                 {displayAssignees.length > 4 && (
                   <div className="flex items-center justify-center h-6 w-6 shrink-0 rounded-full ring-2 ring-background bg-secondary text-[8px] font-bold text-foreground z-10 border border-border/50">
                     +{displayAssignees.length - 4}
                   </div>
                 )}
               </div>
               <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter ml-1">
                 {formatDate(task.dueDate)}
               </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function TeamProjectCardSkeleton() {
  return (
    <div className="flex flex-col min-h-[160px] rounded-[2rem] border-2 border-border/20 p-5 space-y-4 animate-pulse bg-card/40">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-3 w-16 rounded-full" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-3/4 rounded" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
           <Skeleton className="h-2 w-16 rounded" />
           <Skeleton className="h-2 w-6 rounded" />
        </div>
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-border/30">
        <Skeleton className="h-6 w-20 rounded-full" />
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-6 rounded-full border-2 border-background" />)}
        </div>
      </div>
    </div>
  )
}
