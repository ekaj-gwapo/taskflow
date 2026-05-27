"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import confetti from "canvas-confetti"
import { useTaskContext } from "@/lib/task-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { ActionStepsSection } from "@/components/action-steps-section"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { X, Calendar, Clock, User, UserPlus, Send, MessageSquare, Trash2, Share2, Paperclip, FileIcon, FileText, Loader2, ExternalLink, Users, Check, ChevronDown, ChevronRight, CalendarClock, CheckCircle2, XCircle, Archive, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import type { Task, TaskStatus } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"
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

interface TaskDetailPanelProps {
  task: Task
  onClose: () => void
  showStatusControl?: boolean
  showNoteInput?: boolean
  showDeleteButton?: boolean
}

export function TaskDetailPanel({
  task,
  onClose,
  showStatusControl = false,
  showNoteInput = false,
  showDeleteButton = false,
}: TaskDetailPanelProps) {
  const { currentRole, currentUser, updateTaskStatus, updateTask, addProgressNote, addTaskComment, deleteTask, addActionStep, updateActionStepStatus, updateActionStepActed, editActionStep, deleteActionStep, addStepNote, canAccessTask, updateTaskAssignees, allEmployees, requestExtension, reviewExtension, toggleArchiveTask, targetSection, setTargetSection } = useTaskContext()
  const discussionRef = useRef<HTMLDivElement>(null)
  const extensionRef = useRef<HTMLDivElement>(null)
  const [noteContent, setNoteContent] = useState("")
  const [commentContent, setCommentContent] = useState("")
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [commentFile, setCommentFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isUpdatingAssignees, setIsUpdatingAssignees] = useState(false)
  const [activeTab, setActiveTab] = useState<"discussion" | "notes">("discussion")
  const [lastSeenComments, setLastSeenComments] = useState(0)
  const [lastSeenNotes, setLastSeenNotes] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const commentFileInputRef = useRef<HTMLInputElement>(null)


  // Extension request state
  const [showExtensionForm, setShowExtensionForm] = useState(false)
  const [extensionDate, setExtensionDate] = useState("")
  const [extensionReason, setExtensionReason] = useState("")
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false)
  const [extensionReviewRemark, setExtensionReviewRemark] = useState("")
  const [isReviewingExtension, setIsReviewingExtension] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [localDueDate, setLocalDueDate] = useState<string | null>(null)
  const [isSavingDueDate, setIsSavingDueDate] = useState(false)
  const [localAssigneeIds, setLocalAssigneeIds] = useState<string[]>(task.assignees?.map(a => a.id) || [])
  const [isAssigneePopoverOpen, setIsAssigneePopoverOpen] = useState(false)


  // Update local assignees when task data changes
  useEffect(() => {
    setLocalAssigneeIds(task.assignees?.map(a => a.id) || [])
  }, [task.assignees])

  const prevStatusRef = useRef<TaskStatus>(task.status)

  // Initialize last seen counts from localStorage
  useEffect(() => {
    if (currentUser?.id && task.id) {

      const savedComments = localStorage.getItem(`taskflow_comments_others_${task.id}_${currentUser.id}`)
      const savedNotes = localStorage.getItem(`taskflow_notes_others_${task.id}_${currentUser.id}`)
      if (savedComments) setLastSeenComments(parseInt(savedComments))
      if (savedNotes) setLastSeenNotes(parseInt(savedNotes))
    }
  }, [task.id, currentUser?.id])

  // Trigger confetti when status changes to completed
  useEffect(() => {
    if (task.status === "completed" && prevStatusRef.current !== "completed") {
      // 🎉 Celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#6ee7b7"]
      });
    }
    prevStatusRef.current = task.status;
  }, [task.status]);

  // Count only comments/notes from other users
  const othersCommentsCount = task.comments?.filter(c => c.authorId !== currentUser?.id).length || 0

  const othersNotesCount = task.progressNotes?.filter(n => n.authorId !== currentUser?.id).length || 0

  // Update last seen when active tab is selected
  useEffect(() => {
    if (activeTab === "discussion" && currentUser?.id && task.id) {
      setLastSeenComments(othersCommentsCount)
      localStorage.setItem(`taskflow_comments_others_${task.id}_${currentUser.id}`, othersCommentsCount.toString())
    }
  }, [activeTab, othersCommentsCount, task.id, currentUser?.id])

  useEffect(() => {
    if (activeTab === "notes" && currentUser?.id && task.id) {
      setLastSeenNotes(othersNotesCount)
      localStorage.setItem(`taskflow_notes_others_${task.id}_${currentUser.id}`, othersNotesCount.toString())
    }
  }, [activeTab, othersNotesCount, task.id, currentUser?.id])

  const hasNewComments = activeTab !== "discussion" && othersCommentsCount > lastSeenComments
  const hasNewNotes = activeTab !== "notes" && othersNotesCount > lastSeenNotes

  // Handle deep linking to sections
  useEffect(() => {
    if (!targetSection) return

    if (targetSection === "discussion") {
      setActiveTab("discussion")
      // Small timeout to allow tab switch or layout shift
      setTimeout(() => {
        discussionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 300)
    } else if (targetSection === "extensions") {
      // The extension section is part of the main meta area, but we can scroll to it
      setTimeout(() => {
        extensionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 400)
    }

    // Clear target section after handling
    setTargetSection(null)
  }, [targetSection, setTargetSection])

  const isAssignee = task.assigneeId === currentUser?.id || task.assignees?.some(a => a.id === currentUser?.id)
  const isStatusEditable = showStatusControl && (
    currentRole === "employee" ||
    currentRole === "superadmin" ||
    ((currentRole === "admin" || currentRole === "head_admin") && isAssignee)
  )

  // head_admin is excluded from employee-like behavior — they can view but not add progress/step notes
  const isEmployeeLike = currentRole === "employee" || (currentRole === "admin" && isAssignee)

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (newStatus === "completed") {
      const incompleteSteps = task.actionSteps?.filter(s => !s.completed) || []
      if (incompleteSteps.length > 0) {
        toast.error(`Cannot complete task: ${incompleteSteps.length} action required items are still incomplete.`)
        return
      }
    }
    updateTaskStatus(task.id, newStatus)
  }


  // Security check: employees can only view their assigned tasks
  const hasAccess = canAccessTask(task.id)

  if (!hasAccess && currentRole === "employee") {
    return (
      <div className="flex flex-col h-full bg-card border-l border-border items-center justify-center">
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground font-medium">Access Denied</p>
          <p className="text-xs text-muted-foreground mt-1">You can only view your assigned tasks.</p>
        </div>
      </div>
    )
  }

  const isOverdue =
    task.status !== "completed" && new Date(task.dueDate) < new Date()

  const handleAddNote = async () => {
    if (!noteContent.trim() && !selectedFile) return

    setIsUploading(true)
    try {
      let attachmentUrl = undefined
      let attachmentName = undefined
      let attachmentType = undefined

      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)

        const token = localStorage.getItem("token")
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
          body: formData,
        })

        if (!uploadRes.ok) throw new Error("Upload failed")

        const uploadData = await uploadRes.json()
        attachmentUrl = uploadData.url
        attachmentName = uploadData.name
        attachmentType = uploadData.type
      }

      await addProgressNote(task.id, noteContent.trim(), attachmentUrl, attachmentName, attachmentType)
      setNoteContent("")
      setSelectedFile(null)
    } catch (error) {
      console.error("Failed to add note with attachment:", error)
      toast.error("Failed to upload file or add note.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddComment = async () => {
    if (!commentContent.trim() && !commentFile) return
    setIsAddingComment(true)
    try {
      let attachmentUrl = undefined
      let attachmentName = undefined
      let attachmentType = undefined

      if (commentFile) {
        const formData = new FormData()
        formData.append("file", commentFile)

        const token = localStorage.getItem("token")
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
          body: formData,
        })

        if (!uploadRes.ok) throw new Error("Upload failed")

        const uploadData = await uploadRes.json()
        attachmentUrl = uploadData.url
        attachmentName = uploadData.name
        attachmentType = uploadData.type
      }

      await addTaskComment(task.id, commentContent.trim(), attachmentUrl, attachmentName, attachmentType)
      setCommentContent("")
      setCommentFile(null)
    } catch (error) {
      console.error("Failed to add comment:", error)
      toast.error("Failed to post comment.")
    } finally {
      setIsAddingComment(false)
    }
  }

  const handleCommentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCommentFile(e.target.files[0])
    }
  }



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDelete = async () => {
    const success = await deleteTask(task.id)
    if (success) {
      onClose()
    }
  }

  const handleAddActionStep = (stepTitle: string) => {
    addActionStep(task.id, stepTitle)
  }

  const handleUpdateActionStepStatus = (stepId: string, completed: boolean) => {
    updateActionStepStatus(task.id, stepId, completed)
  }

  const handleDeleteActionStep = (stepId: string) => {
    deleteActionStep(task.id, stepId)
  }

  const handleEditActionStep = (stepId: string, title: string) => {
    editActionStep(task.id, stepId, title)
  }

  const handleUpdateActionStepActed = (stepId: string, isActed: boolean) => {
    updateActionStepActed(task.id, stepId, isActed)
  }

  const handleAddStepNote = (stepId: string, content: string, attachmentUrl?: string, attachmentName?: string, attachmentType?: string) => {
    addStepNote(task.id, stepId, content, attachmentUrl, attachmentName, attachmentType)
  }

  const handleToggleAssignee = (employeeId: string) => {
    setLocalAssigneeIds(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId) 
        : [...prev, employeeId]
    )
  }

  const handleSaveAssignees = async () => {
    if (isUpdatingAssignees) return
    setIsUpdatingAssignees(true)
    try {
      await updateTaskAssignees(task.id, localAssigneeIds)
      setIsAssigneePopoverOpen(false)
    } catch (error) {
      console.error("Assignee update failed:", error)
      toast.error("Failed to update team members")
    } finally {
      setIsUpdatingAssignees(false)
    }
  }
    const priorityTheme = {
    high: {
      glow: "bg-red-500/10",
      border: "border-red-500/20",
      badge: "bg-red-500/10 text-red-500 border-red-500/20 dark:border-red-500/30",
      accent: "from-red-500/15 via-transparent to-transparent",
      text: "text-red-500",
      gradient: "from-red-500/10 via-red-500/5 to-transparent",
      iconBg: "bg-red-500/10 text-red-500",
    },
    medium: {
      glow: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      badge: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 dark:border-indigo-500/30",
      accent: "from-indigo-500/15 via-transparent to-transparent",
      text: "text-indigo-500",
      gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      iconBg: "bg-indigo-500/10 text-indigo-500",
    },
    low: {
      glow: "bg-emerald-500/5",
      border: "border-emerald-500/20",
      badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:border-emerald-500/30",
      accent: "from-emerald-500/15 via-transparent to-transparent",
      text: "text-emerald-500",
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-500/10 text-emerald-500",
    },
  }[task.priority as "high" | "medium" | "low"] || {
    glow: "bg-muted/10",
    border: "border-border/50",
    badge: "bg-muted/20 text-muted-foreground border-border/50",
    accent: "from-muted/10 via-transparent to-transparent",
    text: "text-muted-foreground",
    gradient: "from-muted/5 via-transparent to-transparent",
    iconBg: "bg-muted/10 text-muted-foreground",
  }

  return (
    <div className="relative flex flex-col h-full w-full bg-card overflow-hidden">
      {/* Absolute Decorative Glow Elements to bring the page to life */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none -mr-32 -mt-32 transition-all duration-700 bg-primary/20" />
      <div className={cn("absolute top-1/4 left-0 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none -ml-40 transition-all duration-700", priorityTheme.glow)} />

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-border/40 backdrop-blur-md bg-background/50">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none select-none transition-all duration-500", priorityTheme.gradient)} />
        
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className={cn("text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-md", priorityTheme.badge)}>
                {task.priority} Priority
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border bg-background/80 border-border/60 text-muted-foreground shadow-sm">
                ID: {task.id.slice(0, 8)}
              </span>
              {task.archived && (
                <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border bg-amber-500/10 border-amber-500/20 text-amber-600 shadow-sm animate-pulse">
                  Archived
                </span>
              )}
            </div>
            
            <h2 className="text-2xl font-black tracking-tight text-foreground leading-tight">
              {task.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed border-l-2 border-primary/20 pl-3 italic bg-primary/5 py-1.5 pr-2 rounded-r-lg">
              {task.description || "No description provided."}
            </p>
            
            {task.createdBy && (
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 bg-secondary/40 px-2.5 py-1 rounded-lg border border-border/40">
                  <span className="text-muted-foreground/70">Created by</span>
                  <span className="font-semibold text-foreground">{task.createdBy.name}</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-secondary/80 text-muted-foreground border border-border/60">
                    {task.createdBy.role}
                  </span>
                </span>
                {task.delegatedBy && task.delegatedBy.id !== task.createdBy.id && (
                  <span className="flex items-center gap-1.5 bg-secondary/40 px-2.5 py-1 rounded-lg border border-border/40">
                    <span className="text-muted-foreground/70">Delegated by</span>
                    <span className="font-semibold text-foreground">{task.delegatedBy.name}</span>
                  </span>
                )}
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 h-9 w-9 rounded-full bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all border border-border/40 hover:border-border/80 shadow-sm"
          >
            <X className="h-4.5 w-4.5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin">
        <div className="flex flex-col pb-6">
          {/* Meta Information Cards Grid */}
          <div className="p-6 border-b border-border/40 bg-card/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Status Details */}
              <div className="relative group overflow-hidden bg-background/50 hover:bg-background/70 border border-border/50 hover:border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[105px]">
                <div className="flex items-start justify-between w-full">
                  <div className="flex flex-col gap-1 flex-1 pr-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Task Status</span>
                    <div className="mt-1">
                      {isStatusEditable ? (
                        <Select
                          value={task.status}
                          onValueChange={(v) => handleStatusChange(v as TaskStatus)}
                        >
                          <SelectTrigger className="h-9 w-full bg-background border-border/60 shadow-sm text-xs px-3 gap-2 font-semibold hover:border-primary/40 transition-all focus:ring-primary/20 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border/50 shadow-xl backdrop-blur-xl rounded-xl">
                            {!(isEmployeeLike && task.status !== "todo") && (
                              <SelectItem value="todo">To Do</SelectItem>
                            )}
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex h-9 items-center">
                          <StatusBadge status={task.status} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-inner shrink-0">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  </div>
                </div>
              </div>

              {/* Card 2: Priority Details */}
              <div className="relative group overflow-hidden bg-background/50 hover:bg-background/70 border border-border/50 hover:border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[105px]">
                <div className="flex items-start justify-between w-full">
                  <div className="flex flex-col gap-1 flex-1 pr-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Task Priority</span>
                    <div className="mt-2.5">
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                  <div className={cn("p-2.5 rounded-xl shadow-inner transition-colors shrink-0", priorityTheme.iconBg)}>
                    <Clock className="h-4.5 w-4.5 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Card 3: Creation Details */}
              {task.createdAt && (
                <div className="relative group overflow-hidden bg-background/50 hover:bg-background/70 border border-border/50 hover:border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[105px]">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex flex-col gap-1 flex-1 pr-2">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Creation Date</span>
                      <span className="text-sm font-bold text-foreground mt-2 leading-none">
                        {new Date(task.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shadow-inner shrink-0">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Card 4: Due Date Details */}
              <div className={cn(
                "relative group overflow-hidden bg-background/50 hover:bg-background/70 border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[105px]",
                isOverdue && !localDueDate ? "border-red-500/30" : "border-border/50 hover:border-border"
              )}>
                <div className="flex items-start justify-between w-full">
                  <div className="flex flex-col gap-1 flex-1 pr-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                      Target Deadline
                      {isOverdue && task.dueDate && !localDueDate && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                      )}
                    </span>
                    <div className="mt-1">
                      {((currentRole === "superadmin" || (task.createdById === currentUser?.id && (currentRole === "admin" || currentRole === "head_admin"))) && task.status !== "completed") ? (
                        <div className="flex items-center gap-2">
                          <div className="relative group/input">
                            <div className={cn(
                              "text-sm font-bold transition-all duration-300 flex items-center",
                              isOverdue && !localDueDate ? "text-destructive" : "text-foreground"
                            )}>
                              <span>
                              {localDueDate 
                                ? new Date(localDueDate).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })
                                : task.dueDate 
                                ? new Date(task.dueDate).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })
                                : "Set Due Date"}
                              {isOverdue && task.dueDate && !localDueDate && " (Overdue)"}
                              </span>
                            </div>
                            <input
                              type="datetime-local"
                              value={localDueDate ? localDueDate.substring(0, 16) : task.dueDate ? (task.dueDate.includes("T") ? task.dueDate.substring(0, 16) : new Date(task.dueDate).toISOString().substring(0, 16)) : ""}
                              onChange={(e) => {
                                const newDate = e.target.value;
                                if (newDate) {
                                  setLocalDueDate(new Date(newDate).toISOString());
                                } else {
                                  setLocalDueDate(null);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </div>
                          {localDueDate && localDueDate !== task.dueDate && (
                            <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200 ml-2 shrink-0 z-20">
                              <Button 
                                size="icon" 
                                variant="outline"
                                className="h-7 w-7 rounded-full bg-background border-border shadow-sm text-[hsl(var(--success))]"
                                disabled={isSavingDueDate}
                                onClick={async () => {
                                  setIsSavingDueDate(true);
                                  try {
                                    await updateTask(task.id, { dueDate: localDueDate });
                                    setLocalDueDate(null);
                                    toast.success("Due date updated");
                                  } catch (e) {
                                    toast.error("Failed to update due date");
                                  } finally {
                                    setIsSavingDueDate(false);
                                  }
                                }}
                              >
                                {isSavingDueDate ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                className="h-7 w-7 rounded-full text-muted-foreground hover:bg-secondary"
                                disabled={isSavingDueDate}
                                onClick={() => setLocalDueDate(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className={cn(
                          "text-sm font-bold mt-2 block",
                          isOverdue ? "text-destructive" : "text-foreground"
                        )}>
                          {task.dueDate 
                            ? new Date(task.dueDate).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : "Due N/A"}
                          {isOverdue && task.dueDate && " (Overdue)"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-xl shadow-inner shrink-0",
                    isOverdue && !localDueDate ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    <CalendarClock className="h-4.5 w-4.5" />
                  </div>
                </div>
              </div>

            </div>

            {/* Historical markers (Completed / Delegated At) nested beautifully inside the Meta block */}
            {(task.completedAt || task.delegatedAt) && (
              <div className="grid grid-cols-1 gap-3 mt-4">
                {task.delegatedAt && (
                  <div className="flex items-center justify-between bg-blue-500/5 hover:bg-blue-500/8 border border-blue-500/10 px-4 py-3 rounded-2xl shadow-sm transition-all duration-300">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-blue-500" /> Delegated At
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {new Date(task.delegatedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {task.completedAt && (
                  <div className="flex items-center justify-between bg-emerald-500/5 hover:bg-emerald-500/8 border border-emerald-500/10 px-4 py-3 rounded-2xl shadow-sm transition-all duration-300 border-l-4 border-l-emerald-500">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Completed At
                    </span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {new Date(task.completedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Assignees Component block with luxurious styled design */}
          <div className="mx-6 mt-6 bg-background/40 hover:bg-background/60 border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Team Members Assigned
              </span>
              {(currentRole === "admin" || currentRole === "superadmin" || currentRole === "head_admin") && task.status !== "completed" && (
                <Popover open={isAssigneePopoverOpen} onOpenChange={setIsAssigneePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px] hover:bg-primary hover:text-primary-foreground text-foreground font-bold px-3.5 gap-2 rounded-xl transition-all border-border/50 shadow-sm"
                      disabled={isUpdatingAssignees}
                    >
                      {isUpdatingAssignees ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                      <span className="uppercase tracking-wider">
                        {isUpdatingAssignees ? "Updating..." : "Manage Team"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0 border-border/50 shadow-xl overflow-hidden rounded-xl" align="end">
                    <div className="bg-popover flex flex-col max-h-[400px]">
                      <div className="p-3.5 border-b border-border/50 bg-muted/30">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          Manage Team
                        </h4>
                      </div>
                      <Command className="bg-transparent">
                        <CommandInput placeholder="Search employees..." className="h-10 border-none focus:ring-0 text-xs" />
                        <CommandList 
                          className="max-h-[250px] overflow-y-auto overscroll-contain p-1.5"
                          onWheel={(e) => e.stopPropagation()}
                          onTouchMove={(e) => e.stopPropagation()}
                        >
                          <CommandEmpty>No employee found.</CommandEmpty>
                          <CommandGroup>
                            {allEmployees.filter(emp => {
                              const isManagement = ["admin", "head_admin", "creator", "superadmin"].includes(currentUser?.role?.toLowerCase() || "");
                              const isAlreadyAssignee = localAssigneeIds.includes(currentUser?.id || "");
                              if (emp.id === currentUser?.id) {
                                  return isManagement || isAlreadyAssignee;
                              }
                              return true;
                            }).map((emp) => {
                              const isSelected = localAssigneeIds.includes(emp.id)
                              return (
                                <CommandItem
                                  key={emp.id}
                                  onSelect={() => handleToggleAssignee(emp.id)}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-secondary data-[selected=true]:bg-secondary/80"
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleToggleAssignee(emp.id)}
                                    className="h-4 w-4 rounded-md border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-foreground leading-none">{emp.name}</span>
                                    <span className="text-[9px] text-muted-foreground mt-1.5 capitalize leading-none font-medium">{emp.role}</span>
                                  </div>
                                  {isSelected && <Check className="h-4 w-4 text-primary ml-auto" />}
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      <div className="p-3.5 border-t border-border/50 bg-muted/20 flex flex-col gap-3">
                         <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                              {localAssigneeIds.length} Selected
                            </span>
                         </div>
                         <Button 
                            className="w-full h-9 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md"
                            disabled={isUpdatingAssignees || localAssigneeIds.length === 0}
                            onClick={handleSaveAssignees}
                         >
                            {isUpdatingAssignees ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Changes"}
                         </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {task.assignees && task.assignees.length > 0 ? (
                task.assignees.map(a => (
                  <div key={a.id} className="group flex items-center justify-between bg-background/50 hover:bg-background/80 border border-border/50 hover:border-primary/20 px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-full border border-border shadow-sm group-hover:scale-105 transition-transform duration-300">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold uppercase">{a.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs text-foreground font-bold flex items-center gap-2">
                          {a.name}
                          {task.createdBy?.id === a.id && (
                            <span className="text-[8px] uppercase tracking-wider font-extrabold bg-primary/15 text-primary px-2 py-0.5 rounded-full border border-primary/25 shadow-sm">
                              Creator
                            </span>
                          )}
                        </span>
                        <span className="text-[9px] text-muted-foreground mt-0.5 capitalize font-semibold tracking-wider">
                          {a.role || "Member"}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-[9px] font-extrabold bg-primary/5 text-primary border border-primary/10 shadow-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                      {a.points} Points
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-secondary/15 border border-dashed border-border/60 rounded-2xl">
                  <User className="h-6 w-6 text-muted-foreground/40 mb-2.5" />
                  <span className="text-xs text-muted-foreground font-bold">{task.assigneeName || "No team member assigned."}</span>
                </div>
              )}
            </div>
          </div>

          {/* Deadline Extension Section Wrapper */}
          {(() => {
            const extensionRequestsAll = task.extensionRequests || []
            const resolvedRequests = extensionRequestsAll.filter(r => r.status !== "PENDING")

            if (task.status === "completed" && resolvedRequests.length > 0) {
              return (
                <div className="mx-6 mt-4 p-5 bg-background/30 rounded-2xl border border-border/50 space-y-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4" />
                    Extension Request History
                  </span>
                  {resolvedRequests.map((r) => (
                    <div key={r.id} className={`rounded-xl border p-3.5 text-xs space-y-2 backdrop-blur-sm shadow-sm transition-all hover:shadow ${r.status === "APPROVED"
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-950 dark:text-emerald-100"
                        : "border-red-500/20 bg-red-500/5 text-red-950 dark:text-red-100"
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold">
                          {r.status === "APPROVED" ? (
                            <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /><span className="text-emerald-600 font-extrabold uppercase tracking-wide">Approved</span></>
                          ) : (
                            <><XCircle className="h-3.5 w-3.5 text-red-500" /><span className="text-red-500 font-extrabold uppercase tracking-wide">Rejected</span></>
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
                        </span>
                      </div>
                      <p className="text-muted-foreground font-semibold">
                        <span className="font-extrabold text-foreground">{r.requestedByName}</span> → {new Date(r.proposedDueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <p className="italic text-muted-foreground/80 pl-2 border-l border-border/50">
                        <span className="font-semibold not-italic">Reason:</span> &ldquo;{r.reason}&rdquo;
                      </p>
                      {r.reviewerRemark && (
                        <div className="mt-2.5 p-3 rounded-xl bg-background/70 border border-border/40 shadow-inner">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <MessageSquare className="h-3 w-3 text-primary" />
                            Creator Remarks
                          </p>
                          <p className="text-foreground font-bold italic leading-relaxed">
                            &ldquo;{r.reviewerRemark}&rdquo;
                          </p>
                          {r.reviewedByName && (
                            <p className="text-[9px] text-muted-foreground mt-1.5 text-right font-bold">
                              — {r.reviewedByName}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            }

            if (task.status === "completed") return null

            const extensionRequests = task.extensionRequests || []
            const pendingRequest = extensionRequests.find(r => r.status === "PENDING")
            const totalRequests = extensionRequests.length

            const canRequestRole = currentRole === "employee" || currentRole === "admin"
            const isAssigner = currentUser?.id === task.createdById || currentUser?.id === task.delegatedById
            const isTaskAssignee = task.assignees?.some(a => a.id === currentUser?.id) || task.assigneeId === currentUser?.id

            const canRequest = !pendingRequest && totalRequests < 2 && canRequestRole && !isAssigner && isTaskAssignee
            const canReview = (currentUser?.id === task.createdById || currentRole === "superadmin") && currentUser?.id !== pendingRequest?.requestedById

            return (
              <div ref={extensionRef} className="mx-6 mt-4 space-y-3 scroll-mt-10">
                {/* Pending Request Banner */}
                {pendingRequest && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4.5 shadow-md animate-in fade-in duration-300 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 shadow-inner">
                        <CalendarClock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Extension Pending Approval</span>
                        {pendingRequest.createdAt && (
                          <span className="text-[9px] text-amber-600/70 dark:text-amber-400/70 font-semibold">
                            Requested {new Date(pendingRequest.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 ml-8 pb-1">
                      <p className="text-xs text-foreground/90 font-medium">
                        <span className="font-bold text-amber-600 dark:text-amber-400">{pendingRequest.requestedByName}</span> proposed extension to{" "}
                        <span className="font-extrabold text-foreground bg-background/50 px-2 py-0.5 rounded-md border border-amber-500/10">
                          {pendingRequest.proposedDueDate ? new Date(pendingRequest.proposedDueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "TBA"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground italic pl-2 border-l border-amber-500/20 bg-background/25 py-1 pr-2 rounded-r-md">&ldquo;{pendingRequest.reason}&rdquo;</p>
                    </div>

                    {/* Admin: Approve/Reject */}
                    {canReview && (
                      <div className="mt-4 ml-8 space-y-3.5 border-t border-amber-500/20 pt-3">
                        <textarea
                          value={extensionReviewRemark}
                          onChange={(e) => setExtensionReviewRemark(e.target.value)}
                          placeholder="Reviewer remarks (optional)..."
                          rows={2}
                          className="w-full text-xs rounded-xl border border-amber-500/20 bg-background/60 p-3 placeholder:text-muted-foreground/60 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 resize-none text-foreground shadow-inner focus:bg-background"
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={isReviewingExtension}
                            onClick={async () => {
                              setIsReviewingExtension(true)
                              try {
                                await reviewExtension(task.id, pendingRequest.id, "APPROVE", extensionReviewRemark)
                                setExtensionReviewRemark("")
                              } finally {
                                setIsReviewingExtension(false)
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                          >
                            {isReviewingExtension ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Approve
                          </button>
                          <button
                            disabled={isReviewingExtension}
                            onClick={async () => {
                              setIsReviewingExtension(true)
                              try {
                                await reviewExtension(task.id, pendingRequest.id, "REJECT", extensionReviewRemark)
                                setExtensionReviewRemark("")
                              } finally {
                                setIsReviewingExtension(false)
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50"
                          >
                            {isReviewingExtension ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Request Extension Trigger */}
                {canRequest && !showExtensionForm && (
                  <button
                    onClick={() => setShowExtensionForm(true)}
                    className="w-full flex items-center justify-center gap-2 text-xs font-extrabold py-3 rounded-xl border border-dashed border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/80 transition-all shadow-sm hover:scale-[1.01]"
                  >
                    <CalendarClock className="h-4 w-4" />
                    Request Deadline Extension {totalRequests > 0 && `(${2 - totalRequests} left)`}
                  </button>
                )}

                {totalRequests >= 2 && !pendingRequest && (
                  <p className="text-[10px] text-center text-muted-foreground/60 italic font-medium py-1">Maximum extension requests reached (2/2)</p>
                )}

                {showExtensionForm && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4.5 space-y-3.5 animate-in slide-in-from-top-2 duration-200 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                        <CalendarClock className="h-4 w-4" />
                        Request Deadline Extension
                      </span>
                      <button onClick={() => { setShowExtensionForm(false); setExtensionDate(""); setExtensionReason("") }} className="text-muted-foreground hover:text-foreground transition-colors p-1 bg-secondary/35 rounded-full">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">New Proposed Date</label>
                      <input
                        type="date"
                        value={extensionDate}
                        min={new Date(new Date(task.dueDate).getTime() + 86400000).toISOString().split("T")[0]}
                        onChange={(e) => setExtensionDate(e.target.value)}
                        className="w-full text-xs rounded-xl border border-border bg-background/50 p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-foreground font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Reason for Extension</label>
                      <textarea
                        value={extensionReason}
                        onChange={(e) => setExtensionReason(e.target.value)}
                        placeholder="Explain detailly why you need more time to complete this task..."
                        rows={3}
                        className="w-full text-xs rounded-xl border border-border bg-background/50 p-3 placeholder:text-muted-foreground/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 resize-none text-foreground font-medium"
                      />
                    </div>
                    <button
                      disabled={!extensionDate || !extensionReason.trim() || isSubmittingExtension}
                      onClick={async () => {
                        setIsSubmittingExtension(true)
                        try {
                          await requestExtension(task.id, extensionDate, extensionReason)
                          setShowExtensionForm(false)
                          setExtensionDate("")
                          setExtensionReason("")
                        } finally {
                          setIsSubmittingExtension(false)
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 text-xs font-black py-3 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-md disabled:opacity-50"
                    >
                      {isSubmittingExtension ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Submit Extension Request
                    </button>
                  </div>
                )}

                {/* Combined Extension History details */}
                {resolvedRequests.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Extension History
                    </span>
                    {resolvedRequests.map((r) => (
                      <div key={r.id} className={`rounded-xl border p-3.5 text-xs space-y-1.5 backdrop-blur-sm ${r.status === "APPROVED"
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-950 dark:text-emerald-100"
                          : "border-red-500/20 bg-red-500/5 text-red-950 dark:text-red-100"
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-bold">
                            {r.status === "APPROVED" ? (
                              <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /><span className="text-emerald-600 font-extrabold uppercase">Approved</span></>
                            ) : (
                              <><XCircle className="h-3.5 w-3.5 text-red-500" /><span className="text-red-600 font-extrabold uppercase">Rejected</span></>
                            )}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
                          </span>
                        </div>
                        <p className="text-muted-foreground font-medium">
                          <span className="font-bold text-foreground">{r.requestedByName}</span> proposed → {new Date(r.proposedDueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                        <p className="italic text-muted-foreground/80 pl-2 border-l border-border/40">&ldquo;{r.reason}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Glassmorphic Actions Layer (Archive / Delete Task) at the bottom */}
          {(currentRole === "admin" || currentRole === "superadmin" || currentRole === "head_admin" || showDeleteButton) && (
          <div className="mx-6 mt-6 p-5 rounded-2xl border border-border/40 bg-background/25 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Administrative Actions
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Delete Button */}
              {showDeleteButton && task.status === "todo" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-300 flex items-center justify-center py-5 rounded-xl shadow-sm hover:shadow-md"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Task
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-border/50 shadow-2xl backdrop-blur-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the task and all its associated data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold"
                      >
                        Delete Task
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Archive / Unarchive Button */}
              {(currentRole === "admin" || currentRole === "superadmin" || currentRole === "head_admin") && (() => {
                const hasEmployeeAssignees = task.assignees?.some(a => a.role === "employee") || 
                  (task.assignee?.role === "employee" && task.assigneeId !== currentUser?.id)
                const isTeamTask = (task.assignees && task.assignees.length > 1) || hasEmployeeAssignees
                
                const canArchive = !task.archived 
                  ? (
                      currentRole === "superadmin" 
                        ? true 
                        : currentRole === "head_admin" 
                          ? task.status === "completed" 
                          : (!isTeamTask || task.status === "completed")
                    )
                  : true

                return (
                  <div className="space-y-1.5 w-full flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isArchiving || !canArchive}
                      onClick={async () => {
                        setIsArchiving(true)
                        try {
                          await toggleArchiveTask(task.id, !task.archived)
                        } finally {
                          setIsArchiving(false)
                        }
                      }}
                      className={cn(
                        "w-full transition-all duration-300 flex items-center justify-center py-5 rounded-xl shadow-sm hover:shadow-md",
                        !task.archived
                          ? canArchive
                            ? "text-amber-600 border-amber-200/50 bg-amber-50/30 hover:bg-amber-600 hover:text-white"
                            : "text-muted-foreground border-border/30 bg-muted/20 cursor-not-allowed opacity-50"
                          : "text-emerald-600 border-emerald-200/50 bg-emerald-50/30 hover:bg-emerald-600 hover:text-white"
                      )}
                    >
                      {isArchiving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : !task.archived ? (
                        <Archive className="h-4 w-4 mr-2" />
                      ) : (
                        <RefreshCcw className="h-4 w-4 mr-2" />
                      )}
                      {!task.archived ? "Archive Task" : "Restore Task"}
                    </Button>
                    {!task.archived && !canArchive && (
                      <p className="text-[9px] text-center text-muted-foreground/70 italic px-2">
                        {currentRole === "head_admin" 
                          ? "Only completed tasks can be archived by Head Admins."
                          : "Cannot archive — active task with team members assigned."}
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
          )}
        </div>

        {/* Action Required Section */}
        {(task.actionSteps && task.actionSteps.length > 0) || (currentRole === "admin" || currentRole === "superadmin" || currentUser?.id === task.createdById) ? (
          <div className="px-6 py-5 border-t border-b border-border/40 bg-background/30">
            <ActionStepsSection
              steps={task.actionSteps || []}
              onAddStep={handleAddActionStep}
              onUpdateStepStatus={handleUpdateActionStepStatus}
              onUpdateStepActed={handleUpdateActionStepActed}
              onDeleteStep={handleDeleteActionStep}
              onEditStep={handleEditActionStep}
              onAddStepNote={handleAddStepNote}
              userRole={isEmployeeLike ? "employee" : currentRole || undefined}
              taskStatus={task.status}
              isCreator={currentUser?.id === task.createdById}
            />
          </div>
        ) : null}

        {/* Discussion & Progress Notes Combined Tabs */}
        <div ref={discussionRef} className="flex flex-col bg-background/30 rounded-xl mt-6 mb-6 border border-border/40 shadow-sm mx-6 overflow-hidden">
            {/* Tabs Trigger Header */}
            <div className="flex border-b border-border/30 bg-muted/20">
              <button
                type="button"
                onClick={() => setActiveTab("discussion")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2",
                  activeTab === "discussion"
                    ? "border-primary text-primary bg-background/50"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Discussion</span>
                <span className={cn(
                  "px-1.5 py-0.5 text-[9px] rounded-full font-bold ml-1.5",
                  activeTab === "discussion" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {task.comments?.length || 0}
                </span>
                {hasNewComments && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)] ml-1" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2",
                  activeTab === "notes"
                    ? "border-primary text-primary bg-background/50"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Progress Notes</span>
                <span className={cn(
                  "px-1.5 py-0.5 text-[9px] rounded-full font-bold ml-1.5",
                  activeTab === "notes" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {task.progressNotes?.length || 0}
                </span>
                {hasNewNotes && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)] ml-1" />
                )}
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 animate-in fade-in duration-200">
              {activeTab === "discussion" ? (
                <div>
                  {!task.comments || task.comments.length === 0 ? (
                    <div className="py-2 text-center bg-secondary/10 rounded-lg border border-dashed border-border/50 mb-4">
                      <p className="text-xs text-muted-foreground/70 font-medium p-4">No comments yet. Start the discussion!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 mb-4 max-h-[300px] overflow-y-auto pr-2">
                      {task.comments.map((comment) => {
                        const initials = (comment.authorName || "User").split(" ").map((n: string) => n[0]).join("")
                        const isMine = comment.authorId === currentUser?.id
                        return (
                            <div key={comment.id} className={cn("flex gap-3 group", isMine ? "flex-row-reverse" : "flex-row")}>
                              <Avatar className="h-8 w-8 shrink-0 border border-border/50 shadow-sm mt-1">
                                {comment.authorAvatar && <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />}
                                <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className={cn("flex flex-col flex-1 min-w-0 max-w-[85%]", isMine ? "items-end" : "items-start")}>
                                <div className={cn("flex items-center gap-2 mb-0.5", isMine ? "flex-row-reverse" : "flex-row")}>
                                  <span className="text-xs font-bold text-foreground">
                                    {isMine ? "You" : comment.authorName}
                                  </span>
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    {(() => {
                                      const dateVal = comment.createdAt || (comment as any).createdat;
                                      try {
                                        return dateVal ? formatDistanceToNow(new Date(dateVal), { addSuffix: true }) : "recently";
                                      } catch (e) {
                                        return "recently";
                                      }
                                    })()}
                                  </span>
                                </div>
                                <div className={cn(
                                  "text-sm leading-relaxed p-3 border shadow-sm",
                                  isMine 
                                    ? "bg-primary text-primary-foreground border-primary rounded-2xl rounded-tr-sm" 
                                    : "bg-secondary/40 text-foreground border-border/30 rounded-2xl rounded-tl-sm"
                                )}>
                                  {comment.content}
                                  {comment.attachmentUrl && (
                                    <div className={cn("mt-2 pt-2 border-t", isMine ? "border-primary-foreground/20" : "border-border/20")}>
                                      {comment.attachmentType?.startsWith("image/") ? (
                                        <a
                                          href={comment.attachmentUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={cn("relative inline-block group/img overflow-hidden rounded-lg border transition-all", isMine ? "border-primary-foreground/30 hover:border-primary-foreground/60" : "border-border/50 hover:border-primary/50")}
                                        >
                                          <img
                                            src={comment.attachmentUrl}
                                            alt={comment.attachmentName}
                                            className="max-w-full h-auto max-h-[200px] object-contain rounded-md"
                                          />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                            <ExternalLink className="h-4 w-4 text-white" />
                                          </div>
                                        </a>
                                      ) : (
                                        <a
                                          href={comment.attachmentUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={cn("flex items-center gap-2.5 p-2 rounded-xl transition-all group/file max-w-full border", isMine ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20" : "bg-background/50 border-border/50 hover:border-primary/30 hover:bg-background/80")}
                                        >
                                          <div className={cn("p-1.5 rounded-lg transition-colors", isMine ? "bg-primary-foreground/20 text-primary-foreground group-hover/file:bg-primary-foreground group-hover/file:text-primary" : "bg-primary/10 text-primary group-hover/file:bg-primary group-hover/file:text-white")}>
                                            <FileText className="h-3.5 w-3.5" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className={cn("text-[10px] font-bold truncate", isMine ? "text-primary-foreground" : "text-foreground")}>{comment.attachmentName}</p>
                                            <p className={cn("text-[8px] uppercase font-black tracking-widest leading-none mt-0.5", isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                              {comment.attachmentType?.split("/")[1] || "FILE"}
                                            </p>
                                          </div>
                                          <ExternalLink className={cn("h-3 w-3 transition-colors shrink-0", isMine ? "text-primary-foreground/70 group-hover/file:text-primary-foreground" : "text-muted-foreground group-hover/file:text-primary")} />
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex flex-col flex-1 gap-2 pt-4 mt-1 border-t border-border/40">
                    <div className="flex gap-3 relative">
                      <input
                        type="file"
                        ref={commentFileInputRef}
                        className="hidden"
                        onChange={handleCommentFileChange}
                        accept="image/*,application/pdf"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => commentFileInputRef.current?.click()}
                        className={cn(
                          "h-10 w-10 shrink-0 rounded-xl border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-all",
                          commentFile && "border-primary/50 bg-primary/10 text-primary"
                        )}
                        title="Attach file or image"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Textarea
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Discuss this task with your team..."
                        rows={1}
                        className="bg-secondary/20 border-border/50 focus:border-primary/50 text-foreground text-sm placeholder:text-muted-foreground/60 resize-none flex-1 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] transition-all focus:bg-background h-10 py-2"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            handleAddComment()
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        onClick={handleAddComment}
                        disabled={(!commentContent.trim() && !commentFile) || isAddingComment}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-10 w-10 shrink-0 rounded-xl transition-all duration-300 disabled:opacity-50"
                        title="Post Comment (Ctrl+Enter)"
                      >
                        {isAddingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                        <span className="sr-only">Post comment</span>
                      </Button>
                    </div>

                    {commentFile && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-bottom-1">
                        <div className="flex items-center gap-2 min-w-0">
                          {commentFile.type.startsWith("image/") ? (
                            <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center overflow-hidden">
                              <img
                                src={URL.createObjectURL(commentFile)}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                              <FileIcon className="h-3 w-3 text-primary" />
                            </div>
                          )}
                          <span className="text-[10px] font-medium text-foreground truncate max-w-[150px]">
                            {commentFile.name}
                          </span>
                        </div>
                        <button
                          onClick={() => setCommentFile(null)}
                          className="p-1 hover:bg-primary/10 rounded-full transition-colors"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {task.progressNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 bg-secondary/20 rounded-xl border border-dashed border-border/60 mb-4">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground text-center font-medium">
                        No progress notes yet.
                      </p>
                      <p className="text-xs text-muted-foreground/70 text-center mt-1">
                        Notes added will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 pb-4 mb-2 max-h-[300px] overflow-y-auto pr-2">
                      {task.progressNotes.map((note) => {
                        const initials = (note.authorName || (note as any).authorname || "User")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                        return (
                          <div key={note.id} className="flex gap-3.5 group">
                            <Avatar className="h-8 w-8 shrink-0 mt-0.5 border border-border/50 shadow-sm group-hover:border-primary/30 transition-colors">
                              {note.authorAvatar && <AvatarImage src={note.authorAvatar} alt={note.authorName} />}
                              <AvatarFallback className="bg-primary/5 text-primary text-[11px] font-bold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 bg-secondary/20 p-3.5 rounded-2xl rounded-tl-sm border border-border/40 shadow-sm group-hover:shadow-md transition-all duration-300">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-sm font-bold text-foreground">
                                  {note.authorName || (note as any).authorname || "Anonymous"}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border/50">
                                  {(() => {
                                    const dateVal = note.createdAt || (note as any).createdat;
                                    try {
                                      return dateVal ? formatDistanceToNow(new Date(dateVal), { addSuffix: true }) : "recently";
                                    } catch (e) {
                                      return "recently";
                                    }
                                  })()}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed">
                                {note.content}
                              </p>
                              {note.attachmentUrl && (
                                <div className="mt-3 pt-3 border-t border-border/40">
                                  {note.attachmentType?.startsWith("image/") ? (
                                    <a
                                      href={note.attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="relative inline-block group/img overflow-hidden rounded-lg border border-border/50 hover:border-primary/50 transition-all"
                                    >
                                      <img
                                        src={note.attachmentUrl}
                                        alt={note.attachmentName}
                                        className="max-w-[200px] max-h-[150px] object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                        <ExternalLink className="h-5 w-5 text-white" />
                                      </div>
                                    </a>
                                  ) : (
                                    <a
                                      href={note.attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-2.5 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 hover:bg-background/80 transition-all group/file"
                                    >
                                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover/file:bg-primary group-hover/file:text-white transition-colors">
                                        <FileText className="h-4 w-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate">{note.attachmentName}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                                          {note.attachmentType?.split("/")[1] || "FILE"}
                                        </p>
                                      </div>
                                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover/file:text-primary transition-colors mr-1" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Note Input — moved inside to bottom */}
                  {task.status === "in-progress" && isAssignee && (showNoteInput || currentRole === "admin") && (
                    <div className="flex flex-col gap-2 pt-4 mt-1 border-t border-border/40">
                      <div className="flex gap-3 relative">
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*,application/pdf"
                        />

                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "h-10 w-10 shrink-0 rounded-xl border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-all",
                            selectedFile && "border-primary/50 bg-primary/10 text-primary"
                          )}
                          title="Attach file or image"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Type your progress note here..."
                          rows={1}
                          className="bg-secondary/20 border-border/50 focus:border-primary/50 text-foreground text-sm placeholder:text-muted-foreground/60 resize-none flex-1 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] transition-all focus:bg-background h-10 py-2"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                              handleAddNote()
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          onClick={handleAddNote}
                          disabled={(!noteContent.trim() && !selectedFile) || isUploading}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-10 w-10 shrink-0 rounded-xl transition-all duration-300 disabled:opacity-50"
                          title="Post Note (Ctrl+Enter)"
                        >
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                          <span className="sr-only">Post note</span>
                        </Button>
                      </div>

                      {selectedFile && (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-bottom-1">
                          <div className="flex items-center gap-2 min-w-0">
                            {selectedFile.type.startsWith("image/") ? (
                              <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center overflow-hidden">
                                <img
                                  src={URL.createObjectURL(selectedFile)}
                                  alt="Preview"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                                <FileIcon className="h-3 w-3 text-primary" />
                              </div>
                            )}
                            <span className="text-[10px] font-medium text-foreground truncate max-w-[150px]">
                              {selectedFile.name}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="p-1 hover:bg-primary/10 rounded-full transition-colors"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                      
                      <p className="text-[9px] font-medium text-muted-foreground flex items-center gap-1 opacity-60">
                        <kbd className="px-1 py-0.5 bg-secondary rounded border border-border/50">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-secondary rounded border border-border/50">Enter</kbd> to post
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  )
}
