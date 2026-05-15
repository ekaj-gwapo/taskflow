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
  const { currentRole, currentUser, updateTaskStatus, updateTask, addProgressNote, addTaskComment, deleteTask, addActionStep, updateActionStepStatus, updateActionStepActed, deleteActionStep, addStepNote, canAccessTask, updateTaskAssignees, allEmployees, requestExtension, reviewExtension, toggleArchiveTask, targetSection, setTargetSection } = useTaskContext()
  const discussionRef = useRef<HTMLDivElement>(null)
  const extensionRef = useRef<HTMLDivElement>(null)
  const [noteContent, setNoteContent] = useState("")
  const [commentContent, setCommentContent] = useState("")
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [commentFile, setCommentFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isUpdatingAssignees, setIsUpdatingAssignees] = useState(false)
  const [isDiscussionExpanded, setIsDiscussionExpanded] = useState(false)
  const [isProgressNotesExpanded, setIsProgressNotesExpanded] = useState(false)
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

  // Update last seen when sections are expanded
  useEffect(() => {
    if (isDiscussionExpanded && currentUser?.id && task.id) {
      setLastSeenComments(othersCommentsCount)
      localStorage.setItem(`taskflow_comments_others_${task.id}_${currentUser.id}`, othersCommentsCount.toString())
    }
  }, [isDiscussionExpanded, othersCommentsCount, task.id, currentUser?.id])

  useEffect(() => {
    if (isProgressNotesExpanded && currentUser?.id && task.id) {
      setLastSeenNotes(othersNotesCount)
      localStorage.setItem(`taskflow_notes_others_${task.id}_${currentUser.id}`, othersNotesCount.toString())
    }
  }, [isProgressNotesExpanded, othersNotesCount, task.id, currentUser?.id])

  const hasNewComments = !isDiscussionExpanded && othersCommentsCount > lastSeenComments
  const hasNewNotes = !isProgressNotesExpanded && othersNotesCount > lastSeenNotes

  // Handle deep linking to sections
  useEffect(() => {
    if (!targetSection) return

    if (targetSection === "discussion") {
      setIsDiscussionExpanded(true)
      // Small timeout to allow expansion animation to start or complete
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

  return (
    <div className="relative flex flex-col h-full rounded-l-3xl bg-card border-l border-border shadow-[0_0_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden">
      {/* Removed decorative top gradient to fix blur/overlap issues */}


      {/* Header */}
      <div className="relative z-10 border-b border-border/50 bg-card">
        <div className="flex items-start justify-between p-6">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              {task.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {task.description}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="shrink-0 h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm border-border/50 shadow-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {task.createdBy && (
          <div className="px-6 pb-6">
            <div className="text-xs text-muted-foreground flex flex-col gap-1.5 p-3 rounded-xl bg-secondary/40 border border-border/50 shadow-sm">
              <span className="flex items-center gap-1.5 flex-wrap">
                <span className="text-muted-foreground/70">Created by</span>
                <span className="font-semibold text-foreground">{task.createdBy.name}</span>
                <span className="uppercase text-[9px] font-bold tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded-md border border-primary/20 shrink-0">{task.createdBy.role}</span>
              </span>
              {task.delegatedBy && task.delegatedBy.id?.toLowerCase() !== task.createdBy.id?.toLowerCase() && (
                <span className="flex items-center gap-1.5 text-muted-foreground/80 flex-wrap">
                  <span className="text-primary/60 font-bold">↳</span> Delegated by <span className="font-semibold text-foreground">{task.delegatedBy.name}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="flex flex-col pb-4">
          {/* Meta */}
          <div className="p-6 border-b border-border/50 flex flex-col gap-4 bg-card relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-secondary/30 border border-border/50 shadow-sm hover:shadow-md hover:bg-secondary/40 transition-all duration-300">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                  Status
                </span>
                {isStatusEditable ? (
                  <Select
                    value={task.status}
                    onValueChange={(v) => handleStatusChange(v as TaskStatus)}
                  >
                    <SelectTrigger className="h-9 w-full bg-background border-border/50 shadow-sm text-xs px-3 gap-2 font-medium hover:border-primary/30 transition-colors focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border/50 shadow-lg backdrop-blur-xl">
                      {!(isEmployeeLike && task.status !== "todo") && (
                        <SelectItem value="todo">To Do</SelectItem>
                      )}
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex mt-0.5">
                    <StatusBadge status={task.status} />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-secondary/30 border border-border/50 shadow-sm hover:shadow-md hover:bg-secondary/40 transition-all duration-300">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500/60" />
                  Priority
                </span>
                <div className="flex mt-0.5">
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 mt-1">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  <div className="p-1 rounded-md bg-secondary/60 border border-border/50">
                    <Users className="h-3.5 w-3.5 text-foreground/80" />
                  </div>
                  Assignees
                </div>
                {(currentRole === "admin" || currentRole === "superadmin" || currentRole === "head_admin") && task.status !== "completed" && (
                  <Popover open={isAssigneePopoverOpen} onOpenChange={setIsAssigneePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary font-bold shadow-none w-max px-3 gap-1.5 rounded-full transition-colors"
                        disabled={isUpdatingAssignees}
                      >
                        {isUpdatingAssignees ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          (task.assignees && task.assignees.length > 1) ? <Users className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />
                        )}
                        <span className="truncate uppercase tracking-wider">
                          {isUpdatingAssignees ? "Updating..." : (
                            (task.assignees && task.assignees.length > 1)
                              ? "Manage Team"
                              : "Reassign / Add Team"
                          )}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0 border-border/50 shadow-xl overflow-hidden" align="end">
                      <div className="bg-popover flex flex-col max-h-[400px]">
                        <div className="p-2 border-b border-border/50 bg-muted/30">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">Manage Team</h4>
                        </div>
                        <Command className="bg-transparent">
                          <CommandInput placeholder="Search employees..." className="h-9 border-none focus:ring-0" />
                          <CommandList className="max-h-[250px]">
                            <CommandEmpty>No employee found.</CommandEmpty>
                            <CommandGroup className="p-1.5">
                              {allEmployees.filter(emp => {
                                // Show everyone except current user normally
                                // BUT if current user is Admin/Head Admin/Creator/Superadmin, show them too 
                                // OR if they are already an assignee, show them so they can be removed
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
                                    className={`flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors hover:bg-primary/5 data-[selected=true]:bg-primary/5`}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => handleToggleAssignee(emp.id)}
                                      className="h-4 w-4 rounded-md border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-semibold text-foreground leading-none">{emp.name}</span>
                                      <span className="text-[10px] text-muted-foreground mt-1 capitalize leading-none">{emp.role}</span>
                                    </div>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                        <div className="p-3 border-t border-border/50 bg-muted/20 flex flex-col gap-2">
                           <div className="flex items-center justify-between px-1">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {localAssigneeIds.length} members selected
                              </span>
                              {localAssigneeIds.length !== (task.assignees?.length || 0) && (
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              )}
                           </div>
                           <Button 
                              size="sm" 
                              className="w-full h-8 text-[11px] font-bold uppercase tracking-wider"
                              disabled={isUpdatingAssignees || localAssigneeIds.length === 0}
                              onClick={handleSaveAssignees}
                           >
                              {isUpdatingAssignees ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : "Save Changes"}
                           </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <div className="grid gap-2.5">
                {task.assignees && task.assignees.length > 0 ? (
                  task.assignees.map(a => (
                    <div key={a.id} className="flex items-center justify-between bg-gradient-to-r from-secondary/40 to-secondary/10 px-3.5 py-2.5 rounded-xl border border-border/50 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] group hover:from-secondary/60 hover:to-secondary/20 hover:border-primary/20 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7 border-2 border-background shadow-sm group-hover:scale-105 transition-transform duration-300">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary uppercase font-bold">{a.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground font-semibold tracking-tight flex items-center gap-2">
                          {a.name}
                          {task.createdBy?.id === a.id && (
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                              Creator
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold bg-primary/10 text-primary shadow-sm border border-primary/20 group-hover:bg-primary/20 transition-colors">
                        ✨ {a.points} Pts
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 bg-secondary/30 px-3.5 py-2.5 rounded-xl border border-border/50 shadow-sm">
                    <div className="p-1.5 rounded-full bg-background border border-border/50">
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <span className="text-xs text-foreground font-medium">{task.assigneeName || "Unassigned"}</span>
                  </div>
                )}
              </div>
            </div>

            <div ref={extensionRef} className="grid grid-cols-1 gap-2 pt-1">
              {task.createdAt && (
                <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/30 transition-colors group">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-background shadow-sm border border-border/50 group-hover:border-primary/20 transition-colors">
                      <Clock className="h-3.5 w-3.5 text-foreground/70 group-hover:text-primary transition-colors" />
                    </div>
                    Created At
                  </span>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-lg text-foreground bg-background border border-border/50 shadow-sm transition-colors group-hover:border-primary/30">
                    {new Date(task.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/30 transition-colors group">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-background shadow-sm border border-border/50 group-hover:border-primary/20 transition-colors">
                    <Calendar className="h-3.5 w-3.5 text-foreground/70 group-hover:text-primary transition-colors" />
                  </div>
                  Due Date
                </span>
                {((currentRole === "superadmin" || (task.createdById === currentUser?.id && (currentRole === "admin" || currentRole === "head_admin"))) && task.status !== "completed") ? (
                  <div className="flex items-center gap-2">
                    <div className="relative group/input">
                      <div className={cn(
                        "text-xs font-bold px-3 py-1.5 rounded-lg border shadow-sm transition-all duration-300 flex items-center gap-2",
                        isOverdue && !localDueDate ? "text-destructive bg-destructive/10 border-destructive/20" : "text-foreground bg-background border-border/50 group-hover:border-primary/30"
                      )}>
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
                        <Calendar className="h-3 w-3 opacity-40 group-hover/input:opacity-100 transition-opacity" />
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
                      <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                        <Button 
                          size="sm" 
                          variant="default"
                          className="h-7 px-2.5 text-[10px] uppercase font-bold tracking-wider"
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
                          {isSavingDueDate ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          disabled={isSavingDueDate}
                          onClick={() => setLocalDueDate(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                ) : (
                  <span
                    className={cn(
                      "text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border transition-colors",
                      isOverdue ? "text-destructive bg-destructive/10 border-destructive/20" : "text-foreground bg-background border-border/50 group-hover:border-primary/30"
                    )}
                  >
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
              {task.delegatedAt && (
                <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-500/5 transition-colors group">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-background shadow-sm border border-border/50 group-hover:border-blue-500/30 transition-colors">
                      <Share2 className="h-3.5 w-3.5 text-blue-500/70 group-hover:text-blue-500 transition-colors" />
                    </div>
                    Delegated At
                  </span>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-lg text-blue-600 bg-blue-50/50 border border-blue-200/50 shadow-sm">
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
                <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[hsl(var(--success))]/5 transition-colors group">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-background shadow-sm border border-border/50 group-hover:border-[hsl(var(--success))]/30 transition-colors">
                      <Calendar className="h-3.5 w-3.5 text-[hsl(var(--success))]/70 group-hover:text-[hsl(var(--success))] transition-colors" />
                    </div>
                    Completed At
                  </span>
                  <span className="text-xs text-[hsl(var(--success))] font-bold bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 px-3 py-1.5 rounded-lg shadow-sm">
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

            {/* Deadline Extension Section */}
            {(() => {
              // Always show extension history for all task statuses so requester can see approval/rejection
              const extensionRequestsAll = task.extensionRequests || []
              const resolvedRequests = extensionRequestsAll.filter(r => r.status !== "PENDING")

              // Only show the interactive portion (request/review) when task is not completed
              if (task.status === "completed" && resolvedRequests.length > 0) {
                return (
                  <div className="mt-4 space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Extension History</span>
                    {resolvedRequests.map((r) => (
                      <div key={r.id} className={`rounded-lg border p-3 text-xs space-y-1 backdrop-blur-sm ${r.status === "APPROVED"
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-red-500/30 bg-red-500/5"
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-bold">
                            {r.status === "APPROVED" ? (
                              <><CheckCircle2 className="h-3 w-3 text-emerald-600" /><span className="text-emerald-700">Approved</span></>
                            ) : (
                              <><XCircle className="h-3 w-3 text-red-500" /><span className="text-red-600">Rejected</span></>
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          <span className="font-semibold text-foreground">{r.requestedByName}</span> → {new Date(r.proposedDueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <p className="italic text-muted-foreground/80">
                          <span className="font-semibold not-italic">Reason:</span> &ldquo;{r.reason}&rdquo;
                        </p>
                        {r.reviewerRemark && (
                          <div className="mt-2 p-2.5 rounded-lg bg-background/60 border border-border/40 shadow-sm">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                              <MessageSquare className="h-2.5 w-2.5" />
                              Creator&apos;s Message
                            </p>
                            <p className="text-foreground font-semibold italic leading-relaxed">
                              &ldquo;{r.reviewerRemark}&rdquo;
                            </p>
                            {r.reviewedByName && (
                              <p className="text-[9px] text-muted-foreground mt-1 text-right font-medium">
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

              // New Restrictions logic:
              // 1. Only Employee and Admin can request (Head Admin is excluded)
              const canRequestRole = currentRole === "employee" || currentRole === "admin"
              // 2. You cannot request from yourself (if you are the creator or delegator)
              const isAssigner = currentUser?.id === task.createdById || currentUser?.id === task.delegatedById
              // 3. Only assigned users can request
              const isTaskAssignee = task.assignees?.some(a => a.id === currentUser?.id) || task.assigneeId === currentUser?.id

              const canRequest = !pendingRequest && totalRequests < 2 && canRequestRole && !isAssigner && isTaskAssignee

              // 3. Only the original creator (createdById) OR superadmin can review
              // 4. BUT, you cannot review your own request
              const canReview = (currentUser?.id === task.createdById || currentRole === "superadmin") && currentUser?.id !== pendingRequest?.requestedById

              return (
                <div ref={extensionRef} className="mt-4 space-y-3 scroll-mt-10">
                  {/* Pending Request Banner */}
                  {pendingRequest && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 shadow-sm animate-in fade-in duration-300 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 rounded-md bg-amber-500/20 border border-amber-500/30">
                          <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Extension Pending</span>
                          {pendingRequest.createdAt && (
                            <span className="text-[9px] text-amber-600/70 dark:text-amber-400/70 font-medium">
                              Requested {pendingRequest.createdAt ? new Date(pendingRequest.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : "Recently"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5 ml-8">
                        <p className="text-xs text-foreground/90">
                          <span className="font-bold text-amber-600 dark:text-amber-400">{pendingRequest.requestedByName}</span> requested to extend to{" "}
                          <span className="font-bold text-foreground">
                            {pendingRequest.proposedDueDate ? new Date(pendingRequest.proposedDueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "TBA"}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground italic">"{pendingRequest.reason}"</p>
                      </div>

                      {/* Admin: Approve/Reject (Restrict to Assigner/Superadmin) */}
                      {canReview && (
                        <div className="mt-3 ml-8 space-y-2">
                          <textarea
                            value={extensionReviewRemark}
                            onChange={(e) => setExtensionReviewRemark(e.target.value)}
                            placeholder="Remark (optional)..."
                            rows={2}
                            className="w-full text-xs rounded-lg border border-amber-500/30 bg-background/50 p-2 placeholder:text-muted-foreground/50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 resize-none text-foreground"
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
                              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                              {isReviewingExtension ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
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
                              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              {isReviewingExtension ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Request Extension Button / Form */}
                  {canRequest && !showExtensionForm && (
                    <button
                      onClick={() => setShowExtensionForm(true)}
                      className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl border border-dashed border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500 transition-all"
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      Request Deadline Extension {totalRequests > 0 && `(${2 - totalRequests} left)`}
                    </button>
                  )}

                  {totalRequests >= 2 && !pendingRequest && (
                    <p className="text-[10px] text-center text-muted-foreground/60 italic">Maximum extension requests reached (2/2)</p>
                  )}

                  {showExtensionForm && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3 animate-in slide-in-from-top-2 duration-200 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                          <CalendarClock className="h-3.5 w-3.5" />
                          Request Extension
                        </span>
                        <button onClick={() => { setShowExtensionForm(false); setExtensionDate(""); setExtensionReason("") }} className="text-muted-foreground hover:text-foreground transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">New Proposed Date</label>
                        <input
                          type="date"
                          value={extensionDate}
                          min={new Date(new Date(task.dueDate).getTime() + 86400000).toISOString().split("T")[0]}
                          onChange={(e) => setExtensionDate(e.target.value)}
                          className="w-full text-xs rounded-lg border border-border bg-background p-2 focus:border-primary focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Reason for Extension</label>
                        <textarea
                          value={extensionReason}
                          onChange={(e) => setExtensionReason(e.target.value)}
                          placeholder="Explain why you need more time..."
                          rows={3}
                          className="w-full text-xs rounded-lg border border-border bg-background p-2 placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
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
                        className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
                      >
                        {isSubmittingExtension ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        Submit Request
                      </button>
                    </div>
                  )}

                  {/* Extension History */}
                  {extensionRequests.filter(r => r.status !== "PENDING").length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Extension History</span>
                      {extensionRequests.filter(r => r.status !== "PENDING").map((r) => (
                        <div key={r.id} className={`rounded-lg border p-3 text-xs space-y-1 backdrop-blur-sm ${r.status === "APPROVED"
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-red-500/30 bg-red-500/5"
                          }`}>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-bold">
                              {r.status === "APPROVED" ? (
                                <><CheckCircle2 className="h-3 w-3 text-emerald-600" /><span className="text-emerald-700">Approved</span></>
                              ) : (
                                <><XCircle className="h-3 w-3 text-red-500" /><span className="text-red-600">Rejected</span></>
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
                            </span>
                          </div>
                          <p className="text-muted-foreground">
                            <span className="font-semibold text-foreground">{r.requestedByName}</span> → {new Date(r.proposedDueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          <p className="italic text-muted-foreground/80">
                            <span className="font-semibold not-italic">Reason:</span> "{r.reason}"
                          </p>
                          {r.reviewerRemark && (
                            <div className="mt-2 p-2.5 rounded-lg bg-background/60 border border-border/40 shadow-sm">
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <MessageSquare className="h-2.5 w-2.5" />
                                Creator's Message
                              </p>
                              <p className="text-foreground font-semibold italic leading-relaxed">
                                "{r.reviewerRemark}"
                              </p>
                              {r.reviewedByName && (
                                <p className="text-[9px] text-muted-foreground mt-1 text-right font-medium">
                                  — {r.reviewedByName}
                                </p>
                              )}
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

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
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                    >
                      Delete Task
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Archive / Unarchive Button (Visible to admins and superadmins) */}
            {(currentRole === "admin" || currentRole === "superadmin" || currentRole === "head_admin") && (() => {
              // Disable archiving if the task has employee assignees (team task)
              // Archiving would hide the task from those employees
              const hasEmployeeAssignees = task.assignees?.some(a => a.role === "employee") || 
                (task.assignee?.role === "employee" && task.assigneeId !== currentUser?.id)
              const isTeamTask = (task.assignees && task.assignees.length > 1) || hasEmployeeAssignees
              
              // Archiving Permissions:
              // 1. Superadmin: Can archive anything at any time.
              // 2. Head Admin: Can ONLY archive if the task is completed (as requested).
              // 3. Regular Admin: Can archive if it's not a team task OR if it's completed.
              const canArchive = !task.archived 
                ? (
                    currentRole === "superadmin" 
                      ? true 
                      : currentRole === "head_admin" 
                        ? task.status === "completed" 
                        : (!isTeamTask || task.status === "completed")
                  )
                : true // Always allow restore

              return (
                <div className="space-y-1.5">
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
                    <p className="text-[10px] text-center text-muted-foreground/70 italic px-4">
                      {currentRole === "head_admin" 
                        ? "Only completed tasks can be archived by Head Admins."
                        : "Cannot archive — this task is active and has team members assigned."}
                    </p>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Action Required Section */}
          {(task.actionSteps && task.actionSteps.length > 0) || (currentRole === "admin" || currentRole === "superadmin" || currentUser?.id === task.createdById) ? (
            <div className="px-6 py-5 border-b border-border/50 bg-background/30">
              <ActionStepsSection
                steps={task.actionSteps || []}
                onAddStep={handleAddActionStep}
                onUpdateStepStatus={handleUpdateActionStepStatus}
                onUpdateStepActed={handleUpdateActionStepActed}
                onDeleteStep={handleDeleteActionStep}
                onAddStepNote={handleAddStepNote}
                userRole={isEmployeeLike ? "employee" : currentRole || undefined}
                taskStatus={task.status}
                isCreator={currentUser?.id === task.createdById}
              />
            </div>
          ) : null}

          {/* Discussion Thread */}
          <div ref={discussionRef} className="flex flex-col bg-background/30 rounded-xl mt-6 mb-6 border border-border/40 shadow-sm mx-6 overflow-hidden">
            <button
              onClick={() => setIsDiscussionExpanded(!isDiscussionExpanded)}
              className="flex items-center justify-between w-full px-5 pt-4 pb-3 border-b border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors group/header"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[11px] font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                  Discussion <span className="text-muted-foreground ml-0.5">({task.comments?.length || 0})</span>
                  {hasNewComments && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  )}
                </span>
              </div>
              {isDiscussionExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover/header:text-foreground transition-colors" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/header:text-foreground transition-colors" />
              )}
            </button>

            {isDiscussionExpanded && (
              <div className="p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                {!task.comments || task.comments.length === 0 ? (
                  <div className="py-2 text-center bg-secondary/10 rounded-lg border border-dashed border-border/50 mb-4">
                    <p className="text-xs text-muted-foreground/70 font-medium p-4">No comments yet. Start the discussion!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 mb-4">
                    {task.comments.map((comment) => {
                      const initials = (comment.authorName || "User").split(" ").map((n: string) => n[0]).join("")
                      return (
                        <div key={comment.id} className="flex gap-3 group">
                          <Avatar className="h-8 w-8 shrink-0 border border-border/50 shadow-sm">
                            {comment.authorAvatar && <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />}
                            <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold text-foreground">
                                {comment.authorName}
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
                            <div className="text-sm text-foreground/90 leading-relaxed bg-secondary/30 p-3 rounded-2xl rounded-tl-sm border border-border/30">
                              {comment.content}
                              {comment.attachmentUrl && (
                                <div className="mt-2 pt-2 border-t border-border/20">
                                  {comment.attachmentType?.startsWith("image/") ? (
                                    <a
                                      href={comment.attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="relative inline-block group/img overflow-hidden rounded-lg border border-border/50 hover:border-primary/50 transition-all"
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
                                      className="flex items-center gap-2.5 p-2 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 hover:bg-background/80 transition-all group/file max-w-full"
                                    >
                                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover/file:bg-primary group-hover/file:text-white transition-colors">
                                        <FileText className="h-3.5 w-3.5" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-foreground truncate">{comment.attachmentName}</p>
                                        <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest leading-none mt-0.5">
                                          {comment.attachmentType?.split("/")[1] || "FILE"}
                                        </p>
                                      </div>
                                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover/file:text-primary transition-colors shrink-0" />
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
            )}
          </div>

          {/* Progress Notes */}
          <div className="flex flex-col bg-background/30 rounded-xl mt-2 mb-6 border border-border/40 shadow-sm mx-6 overflow-hidden">
            <button
              onClick={() => setIsProgressNotesExpanded(!isProgressNotesExpanded)}
              className="flex items-center justify-between w-full px-5 pt-4 pb-3 border-b border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors group/pheader"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[11px] font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                  Progress Notes <span className="text-muted-foreground ml-0.5">({task.progressNotes?.length || 0})</span>
                  {hasNewNotes && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  )}
                </span>
              </div>
              {isProgressNotesExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover/pheader:text-foreground transition-colors" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/pheader:text-foreground transition-colors" />
              )}
            </button>

            {isProgressNotesExpanded && (
              <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                {task.progressNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 mt-2 bg-secondary/20 rounded-xl border border-dashed border-border/60 mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground text-center font-medium">
                      No progress notes yet.
                    </p>
                    <p className="text-xs text-muted-foreground/70 text-center mt-1">
                      Notes added will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 pb-4 mt-2 mb-2">
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
