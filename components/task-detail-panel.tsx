"use client"

import { useState, useRef, useCallback } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { ActionStepsSection } from "@/components/action-steps-section"
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
import { X, Calendar, Clock, User, UserPlus, Send, MessageSquare, Trash2, Share2, Paperclip, FileIcon, FileText, Loader2, ExternalLink, Users, Check, ChevronDown, ChevronRight } from "lucide-react"
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
  const { currentRole, currentUser, updateTaskStatus, addProgressNote, addTaskComment, deleteTask, addActionStep, updateActionStepStatus, updateActionStepActed, deleteActionStep, addStepNote, canAccessTask, updateTaskAssignees, allEmployees } = useTaskContext()
  const [noteContent, setNoteContent] = useState("")
  const [commentContent, setCommentContent] = useState("")
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isUpdatingAssignees, setIsUpdatingAssignees] = useState(false)
  const [isDiscussionExpanded, setIsDiscussionExpanded] = useState(false)
  const [isProgressNotesExpanded, setIsProgressNotesExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAssignee = task.assigneeId === currentUser?.id || task.assignees?.some(a => a.id === currentUser?.id)
  const isStatusEditable = showStatusControl && (
    currentRole === "employee" || 
    currentRole === "superadmin" ||
    ((currentRole === "admin" || currentRole === "head_admin") && isAssignee)
  )

  const isEmployeeLike = currentRole === "employee" || ((currentRole === "admin" || currentRole === "head_admin") && isAssignee)

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
    if (!commentContent.trim()) return
    setIsAddingComment(true)
    try {
      await addTaskComment(task.id, commentContent.trim())
      setCommentContent("")
    } catch (error) {
      console.error("Failed to add comment:", error)
      toast.error("Failed to post comment.")
    } finally {
      setIsAddingComment(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDelete = () => {
    deleteTask(task.id)
    onClose()
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

  const handleToggleAssignee = async (employeeId: string) => {
    if (isUpdatingAssignees) return
    
    setIsUpdatingAssignees(true)
    try {
      const currentAssigneeIds = task.assignees?.map(a => a.id) || []
      const isCurrentlyAssigned = currentAssigneeIds.includes(employeeId)
      
      let newAssigneeIds: string[]
      if (isCurrentlyAssigned) {
        newAssigneeIds = currentAssigneeIds.filter(id => id !== employeeId)
      } else {
        newAssigneeIds = [...currentAssigneeIds, employeeId]
      }
      
      await updateTaskAssignees(task.id, newAssigneeIds)
    } catch (error) {
      console.error("Assignee update failed:", error)
      toast.error("Failed to update team members")
    } finally {
      setIsUpdatingAssignees(false)
    }
  }

  return (
    <div className="relative flex flex-col h-full rounded-l-3xl bg-card/95 backdrop-blur-xl border-l border-border/40 shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pointer-events-none z-0" />
      
      {/* Header */}
      <div className="relative z-10 border-b border-border/50 bg-background/40 backdrop-blur-md">
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
            <div className="text-xs text-muted-foreground flex flex-col gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border/50 shadow-sm backdrop-blur-sm">
              <span className="flex items-center gap-1.5 flex-wrap">
                <span className="text-muted-foreground/70">Created by</span> 
                <span className="font-semibold text-foreground">{task.createdBy.name}</span> 
                <span className="uppercase text-[9px] font-bold tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded-md border border-primary/20 shrink-0">{task.createdBy.role}</span>
              </span>
              {task.delegatedBy && (
                <span className="flex items-center gap-1.5 text-muted-foreground/80 flex-wrap">
                  <span className="text-primary/60 font-bold">↳</span> Delegated by <span className="font-semibold text-foreground">{task.delegatedBy.name}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 relative z-10">
        <div className="flex flex-col pb-4">
          {/* Meta */}
          <div className="p-6 border-b border-border/50 flex flex-col gap-7 bg-background/20 relative">
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
                {(currentRole === "admin" || currentRole === "superadmin" || currentRole === "head_admin") && task.status === "todo" && (
                  <Popover>
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
                              ? "Edit Team Members" 
                              : "Reassign"
                          )}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0 border-border/50 shadow-xl" align="end">
                      <Command className="bg-popover">
                        <CommandInput placeholder="Search employees..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No employee found.</CommandEmpty>
                          <CommandGroup className="p-1.5">
                            {allEmployees.map((emp) => {
                              const isAssigned = task.assignees?.some(a => a.id === emp.id)
                              return (
                                <CommandItem
                                  key={emp.id}
                                  onSelect={() => !isUpdatingAssignees && handleToggleAssignee(emp.id)}
                                  className={`flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${isUpdatingAssignees ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/5 data-[selected=true]:bg-primary/5"}`}
                                >
                                  <Checkbox 
                                    checked={isAssigned}
                                    onCheckedChange={() => !isUpdatingAssignees && handleToggleAssignee(emp.id)}
                                    disabled={isUpdatingAssignees}
                                    className="h-4 w-4 rounded-md border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-foreground leading-none">{emp.name}</span>
                                    <span className="text-[10px] text-muted-foreground mt-1 capitalize leading-none">{emp.role}</span>
                                  </div>
                                  {isAssigned && !isUpdatingAssignees && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                                  {isUpdatingAssignees && <Loader2 className="h-3.5 w-3.5 animate-spin ml-auto opacity-40" />}
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
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
                        <span className="text-sm text-foreground font-semibold tracking-tight">{a.name}</span>
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

            <div className="grid grid-cols-1 gap-2 pt-1">
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
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border transition-colors ${isOverdue ? "text-destructive bg-destructive/10 border-destructive/20" : "text-foreground bg-background border-border/50 group-hover:border-primary/30"}`}
                >
                  {task.dueDate.includes("T")
                    ? new Date(task.dueDate).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : task.dueDate}
                  {isOverdue && " (Overdue)"}
                </span>
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

            {showDeleteButton && task.status === "todo" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-300 flex items-center justify-center py-5 rounded-xl shadow-sm hover:shadow-md"
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
          </div>

          {/* Action Required Section */}
          {task.actionSteps && task.actionSteps.length > 0 ? (
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
              />
            </div>
          ) : null}

          {/* Discussion Thread */}
          <div className="flex flex-col bg-background/30 rounded-xl mb-6 border border-border/40 shadow-sm mx-6 overflow-hidden">
          <button 
            onClick={() => setIsDiscussionExpanded(!isDiscussionExpanded)}
            className="flex items-center justify-between w-full px-5 pt-4 pb-3 border-b border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors group/header"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[11px] font-bold text-foreground uppercase tracking-widest">
                Discussion <span className="text-muted-foreground ml-0.5">({task.comments?.length || 0})</span>
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
              <div className="flex gap-3 relative mb-5">
                <Textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Discuss this task with your team..."
                  rows={2}
                  className="bg-secondary/20 border-border/50 focus:border-primary/50 text-foreground text-sm placeholder:text-muted-foreground/60 resize-none flex-1 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] transition-all focus:bg-background h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleAddComment()
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={!commentContent.trim() || isAddingComment}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm self-end h-10 w-10 shrink-0 rounded-xl transition-all duration-300 disabled:opacity-50"
                  title="Post Comment (Ctrl+Enter)"
                >
                  {isAddingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                  <span className="sr-only">Post comment</span>
                </Button>
              </div>

              {!task.comments || task.comments.length === 0 ? (
                <div className="py-2 text-center bg-secondary/10 rounded-lg border border-dashed border-border/50">
                  <p className="text-xs text-muted-foreground/70 font-medium p-4">No comments yet. Start the discussion!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {task.comments.map((comment) => {
                    const initials = comment.authorName.split(" ").map((n) => n[0]).join("")
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
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="text-sm text-foreground/90 leading-relaxed bg-secondary/30 p-3 rounded-2xl rounded-tl-sm border border-border/30">
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

          {/* Progress Notes */}
          <div className="flex flex-col bg-background/20 rounded-b-xl border-t border-border/30">
            <button 
              onClick={() => setIsProgressNotesExpanded(!isProgressNotesExpanded)}
              className="flex items-center justify-between w-full px-6 pt-6 pb-3 hover:bg-muted/20 transition-colors group/pheader"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-secondary/50 border border-border/50">
                  <MessageSquare className="h-4 w-4 text-primary/70" />
                </div>
                <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-widest">
                  Progress Notes <span className="text-muted-foreground ml-0.5">({task.progressNotes.length})</span>
                </span>
              </div>
              {isProgressNotesExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover/pheader:text-foreground transition-colors" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/pheader:text-foreground transition-colors" />
              )}
            </button>

            {isProgressNotesExpanded && (
              <div className="px-6 animate-in fade-in slide-in-from-top-2 duration-200">
              {task.progressNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 mt-2 bg-secondary/20 rounded-xl border border-dashed border-border/60">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground text-center font-medium">
                    No progress notes yet.
                  </p>
                  <p className="text-xs text-muted-foreground/70 text-center mt-1">
                    Notes added will appear here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 pb-6 mt-2">
                  {task.progressNotes.map((note) => {
                    const initials = note.authorName
                      .split(" ")
                      .map((n) => n[0])
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
                            <span className="text-xs font-bold text-foreground">
                              {note.authorName}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border/50">
                              {formatDistanceToNow(new Date(note.createdAt), {
                                addSuffix: true,
                              })}
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
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Note Input */}
      {showNoteInput && task.status === "in-progress" && (
        <div className="p-5 border-t border-border/50 bg-background/60 backdrop-blur-md">
          {selectedFile && (
            <div className="mb-3 flex items-center justify-between p-2 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  {selectedFile.type.startsWith("image/") ? <Paperclip className="h-3.5 w-3.5" /> : <FileIcon className="h-3.5 w-3.5" />}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[11px] font-bold text-foreground truncate max-w-[200px]">{selectedFile.name}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                onClick={() => setSelectedFile(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
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
              className="bg-secondary/30 border-border/50 hover:border-primary/30 h-10 w-10 shrink-0 rounded-xl transition-all"
            >
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Attach file</span>
            </Button>
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Type your progress note here..."
              rows={2}
              className="bg-secondary/30 border-border/50 focus:border-primary/50 text-foreground text-sm placeholder:text-muted-foreground/70 resize-none flex-1 rounded-xl shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] transition-all focus:bg-background"
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
              className="bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 self-end h-10 w-10 shrink-0 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:bg-secondary"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send note</span>
            </Button>
          </div>
          <p className="text-[10px] font-medium text-muted-foreground mt-2.5 flex items-center gap-1.5 opacity-70">
            <kbd className="px-1.5 py-0.5 bg-secondary rounded border border-border/50 text-[9px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-secondary rounded border border-border/50 text-[9px]">Enter</kbd> to send
          </p>
        </div>
      )}
    </div>
  )
}
