"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, Plus, Trash2, Send, Paperclip, FileIcon, FileText, Loader2, ExternalLink, X } from "lucide-react"
import type { ActionStep, UserRole } from "@/lib/store"
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

interface ActionStepsSectionProps {
  steps: ActionStep[]
  onAddStep: (stepTitle: string) => void
  onUpdateStepStatus: (stepId: string, completed: boolean) => void
  onDeleteStep: (stepId: string) => void
  onAddStepNote: (stepId: string, content: string, attachmentUrl?: string, attachmentName?: string, attachmentType?: string) => void
  onUpdateStepActed?: (stepId: string, isActed: boolean) => void
  userRole?: UserRole
  taskStatus?: string
}

export function ActionStepsSection({
  steps,
  onAddStep,
  onUpdateStepStatus,
  onDeleteStep,
  onAddStepNote,
  onUpdateStepActed,
  userRole = "employee",
  taskStatus,
}: ActionStepsSectionProps) {
  const [newStepTitle, setNewStepTitle] = useState("")
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [stepNoteInputs, setStepNoteInputs] = useState<Record<string, string>>({})
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({})
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({})

  const handleToggleExpand = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const handleAddStep = () => {
    if (!newStepTitle.trim()) return
    onAddStep(newStepTitle.trim())
    setNewStepTitle("")
  }

  const handleAddNote = async (stepId: string) => {
    const content = stepNoteInputs[stepId] || ""
    const selectedFile = selectedFiles[stepId]

    if (!content.trim() && !selectedFile) return

    setIsUploading((prev) => ({ ...prev, [stepId]: true }))
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

      onAddStepNote(stepId, content.trim(), attachmentUrl, attachmentName, attachmentType)
      setStepNoteInputs((prev) => ({ ...prev, [stepId]: "" }))
      setSelectedFiles((prev) => {
        const next = { ...prev }
        delete next[stepId]
        return next
      })
    } catch (error) {
      console.error("Failed to add step note with attachment:", error)
    } finally {
      setIsUploading((prev) => ({ ...prev, [stepId]: false }))
    }
  }

  const handleFileChange = (stepId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFiles((prev) => ({ ...prev, [stepId]: e.target.files![0] }))
    }
  }

  const completedCount = steps.filter((s) => s.completed).length
  const totalCount = steps.length

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Action Required</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount} of {totalCount} completed
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* Add new step - Only for admins/superadmins, and not if task is completed */}
      {(userRole === "admin" || userRole === "superadmin") && taskStatus !== "completed" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            placeholder="Add a new action step..."
            className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddStep()
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleAddStep}
            disabled={!newStepTitle.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 w-9 p-0 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Steps list */}
      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No action required yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="border border-border rounded-lg overflow-hidden bg-secondary/30">
              {/* Step header */}
              <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                {userRole === "employee" && (
                  <Checkbox
                    checked={step.completed}
                    onCheckedChange={(checked) => onUpdateStepStatus(step.id, checked === true)}
                    className="h-4 w-4"
                    disabled={taskStatus !== "in-progress"}
                  />
                )}
                {userRole !== "employee" && (
                  <div
                    className={`h-4 w-4 rounded border border-border flex items-center justify-center ${step.completed ? "bg-primary" : "bg-secondary"
                      }`}
                  >
                    {step.completed && <span className="text-white text-xs">✓</span>}
                  </div>
                )}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Step {index + 1}</span>
                      {step.isActed && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] shadow-sm border border-[hsl(var(--success))]/20 whitespace-nowrap">
                          ✓ ACTED
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm leading-snug ${step.completed
                          ? "text-muted-foreground line-through"
                          : "text-foreground font-medium"
                        }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {userRole === "employee" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={step.completed || taskStatus !== "in-progress"}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStepActed?.(step.id, !step.isActed);
                      }}
                      className={`h-7 px-3 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all shrink-0 ${step.isActed
                          ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:text-primary'
                          : 'bg-background border-border/50 text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border'
                        }`}
                    >
                      {step.isActed ? 'Retract' : 'Mark Acted'}
                    </Button>
                  )}
                  <button
                    onClick={() => handleToggleExpand(step.id)}
                    className="text-muted-foreground hover:text-foreground p-1 shrink-0 transition-colors"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expandedSteps.has(step.id) ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                </div>
                {(userRole === "admin" || userRole === "superadmin") && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Action Step?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the step "{step.title}"? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteStep(step.id);
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {/* Step details (notes) */}
              {expandedSteps.has(step.id) && (
                <div className="border-t border-border px-3 py-3 bg-background/50 space-y-3">
                  {/* Existing notes */}
                  {step.notes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Notes ({step.notes.length})
                      </p>
                      <div className="flex flex-col gap-2">
                        {step.notes.map((note) => {
                          const initials = (note.authorName || (note as any).authorname || "User")
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                          return (
                            <div key={note.id} className="flex gap-2">
                              <Avatar className="h-5 w-5 shrink-0 mt-0.5">
                                <AvatarFallback className="bg-primary text-primary-foreground text-[8px]">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-foreground">
                                    {note.authorName || (note as any).authorname || "Anonymous"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
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
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                  {note.content}
                                </p>
                                {note.attachmentUrl && (
                                  <div className="mt-2 pt-2 border-t border-border/20">
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
                                          className="max-w-[150px] max-h-[100px] object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                          <ExternalLink className="h-4 w-4 text-white" />
                                        </div>
                                      </a>
                                    ) : (
                                      <a
                                        href={note.attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 p-2 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 hover:bg-background/80 transition-all group/file max-w-[200px]"
                                      >
                                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover/file:bg-primary group-hover/file:text-white transition-colors">
                                          <FileText className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[10px] font-bold text-foreground truncate">{note.attachmentName}</p>
                                          <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest leading-none mt-0.5">
                                            {note.attachmentType?.split("/")[1] || "FILE"}
                                          </p>
                                        </div>
                                        <ExternalLink className="h-3 w-3 text-muted-foreground group-hover/file:text-primary transition-colors shrink-0" />
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add note input - Only for assignees (mapped to "employee" role in panel) */}
                  {userRole === "employee" && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Add Note
                      </p>
                      {selectedFiles[step.id] && (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20 mb-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="p-1 rounded-md bg-primary/10 text-primary">
                              {selectedFiles[step.id]?.type.startsWith("image/") ? <Paperclip className="h-3 w-3" /> : <FileIcon className="h-3 w-3" />}
                            </div>
                            <span className="text-[10px] font-bold text-foreground truncate max-w-[150px]">{selectedFiles[step.id]?.name}</span>
                          </div>
                          <button
                            onClick={() => setSelectedFiles(prev => {
                              const next = { ...prev }
                              delete next[step.id]
                              return next
                            })}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="file"
                          id={`file-${step.id}`}
                          className="hidden"
                          onChange={(e) => handleFileChange(step.id, e)}
                          accept="image/*,application/pdf"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => document.getElementById(`file-${step.id}`)?.click()}
                          className="h-8 w-8 shrink-0 rounded-lg bg-secondary/50 border-border/50 hover:border-primary/30"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <textarea
                          value={stepNoteInputs[step.id] || ""}
                          onChange={(e) =>
                            setStepNoteInputs((prev) => ({
                              ...prev,
                              [step.id]: e.target.value,
                            }))
                          }
                          placeholder="Add a progress detail for this step..."
                          rows={2}
                          className="flex-1 px-2.5 py-2 bg-secondary border border-border rounded text-xs text-foreground placeholder:text-muted-foreground resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault()
                              handleAddNote(step.id)
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddNote(step.id)}
                          disabled={(!stepNoteInputs[step.id]?.trim() && !selectedFiles[step.id]) || isUploading[step.id]}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 self-end h-8 w-8 p-0 shrink-0"
                        >
                          {isUploading[step.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Press Ctrl+Enter to send
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
