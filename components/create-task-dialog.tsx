"use client"

import { useState, useEffect } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, X, Users, User, Calendar } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TaskPriority } from "@/lib/store"
import { toast } from "sonner"


export function CreateTaskDialog() {
  const { createTask, allEmployees, tasks, currentUser } = useTaskContext()
  const selectableEmployees = allEmployees.filter(emp => emp.id !== currentUser?.id)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assignmentType, setAssignmentType] = useState<"individual" | "team">("individual")
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [dueDate, setDueDate] = useState("")
  const [actionSteps, setActionSteps] = useState<string[]>([])
  const [stepInput, setStepInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleAddStep = () => {
    if (!stepInput.trim()) return
    setActionSteps([...actionSteps, stepInput.trim()])
    setStepInput("")
  }

  const handleRemoveStep = (index: number) => {
    setActionSteps(actionSteps.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!title.trim() || assigneeIds.length === 0 || !dueDate) return

    setIsSubmitting(true)
    const success = await createTask({
      title: title.trim(),
      description: description.trim(),
      status: "todo",
      priority,
      assigneeIds,
      dueDate,
    }, actionSteps)
    setIsSubmitting(false)

    if (success) {
      toast.success("Task created successfully!")
      setTitle("")
      setDescription("")
      setAssignmentType("individual")
      setAssigneeIds([])
      setPriority("medium")
      setDueDate("")
      setActionSteps([])
      setStepInput("")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1.5" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Task</DialogTitle>
          <DialogDescription>
            Assign a task to a team member with a due date and optional action required items.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title" className="text-foreground text-sm">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description" className="text-foreground text-sm">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task..."
              rows={3}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>
          {assignmentType === "team" ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column: Assign To (Tall) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground text-sm flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    Assign To
                  </Label>
                  <RadioGroup
                    value={assignmentType}
                    onValueChange={(val) => {
                      const newType = val as "individual" | "team"
                      setAssignmentType(newType)
                      if (newType === "individual") {
                        // When switching to individual, keep only the first assignee if it exists, otherwise clear
                        setAssigneeIds(assigneeIds[0] ? [assigneeIds[0]] : [])
                      }
                    }}
                    className="flex gap-3"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="individual" id="team-indiv" className="h-3 w-3" />
                      <Label htmlFor="team-indiv" className="cursor-pointer text-xs font-medium text-muted-foreground m-0">Indiv</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="team" id="team-team" className="h-3 w-3" />
                      <Label htmlFor="team-team" className="cursor-pointer text-xs font-medium text-muted-foreground m-0">Team</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="flex flex-col gap-1 border border-border p-2 rounded-md h-[235px] overflow-y-auto bg-secondary/30 mt-1">
                  {selectableEmployees.map((emp) => {
                    return (
                      <label
                        key={emp.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm transition-colors cursor-pointer hover:bg-secondary/80"
                      >
                        <Checkbox
                          checked={assigneeIds.includes(emp.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAssigneeIds([...assigneeIds, emp.id])
                            } else {
                              setAssigneeIds(assigneeIds.filter(id => id !== emp.id))
                            }
                          }}
                        />
                        <span className="text-foreground font-medium">{emp.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Right Column: Stacked Inputs */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground text-sm">Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="due-date" className="text-foreground text-sm">Due Date</Label>
                  <div className="relative group">
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-secondary border-border text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-foreground text-sm">Date Created</Label>
                  <Input
                    type="text"
                    readOnly
                    value={isMounted ? new Date().toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }) : ""}
                    className="bg-secondary border-border text-muted-foreground cursor-default"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground text-sm flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      Assign To
                    </Label>
                    <RadioGroup
                      value={assignmentType}
                      onValueChange={(val) => {
                        const newType = val as "individual" | "team"
                        setAssignmentType(newType)
                        if (newType === "individual") {
                          setAssigneeIds(assigneeIds[0] ? [assigneeIds[0]] : [])
                        }
                      }}
                      className="flex gap-3"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="individual" id="indiv-individual" className="h-3 w-3" />
                        <Label htmlFor="indiv-individual" className="cursor-pointer text-xs font-medium text-muted-foreground m-0">Indiv</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="team" id="indiv-team" className="h-3 w-3" />
                        <Label htmlFor="indiv-team" className="cursor-pointer text-xs font-medium text-muted-foreground m-0">Team</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Select
                    value={assigneeIds[0] || ""}
                    onValueChange={(val) => setAssigneeIds([val])}
                  >
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="Select from employees..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {selectableEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground text-sm">Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="due-date" className="text-foreground text-sm">Due Date</Label>
                  <div className="relative group">
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-secondary border-border text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground text-sm">Date Created</Label>
                  <Input
                    type="text"
                    readOnly
                    value={isMounted ? new Date().toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }) : ""}
                    className="bg-secondary border-border text-muted-foreground cursor-default"
                  />
                </div>
              </div>
            </>
          )}

          {/* Action Required Section */}
          <div className="border-t border-border pt-4 mt-2">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Label className="text-foreground text-sm font-semibold block">Action Required (Optional)</Label>
                <p className="text-xs text-muted-foreground mt-1">Example: "Create and send a letter" → "Create the letter" + "Send the letter"</p>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <Input
                value={stepInput}
                onChange={(e) => setStepInput(e.target.value)}
                placeholder="Add an action required item (e.g., 'Create the letter')"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddStep()
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddStep}
                disabled={!stepInput.trim()}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {actionSteps.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Added steps (employees can add notes as they progress):</p>
                {actionSteps.map((step, index) => (
                  <div key={index} className="flex items-center justify-between bg-secondary p-2.5 rounded border border-border">
                    <span className="text-sm text-foreground">Step {index + 1}: {step}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStep(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6 p-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>


        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || assigneeIds.length === 0 || !assigneeIds[0] || !dueDate || isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
