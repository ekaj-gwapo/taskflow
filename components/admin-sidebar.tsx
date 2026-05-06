"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useTaskContext } from "@/lib/task-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, ChevronRight, ChevronDown, ClipboardList, ArrowLeft, User, Mail, Phone, MapPin, Save, X, Shield, Search, Clipboard, Share2, Trash2, Filter, FileText, Activity, LayoutDashboard, CalendarClock, Archive, Palette, Check, Sun, Moon, LogOut, ExternalLink, Camera, Layers, MessageSquare, Send } from "lucide-react"
import { ProfileDialog } from "@/components/profile-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/store"

function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      dx: `${Math.random() * 120 - 60}px`,
      dy: `${Math.random() * 120 - 60}px`,
      color: ['bg-red-400', 'bg-blue-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-pink-400', 'bg-purple-400'][Math.floor(Math.random() * 6)],
      delay: `${Math.random() * 0.2}s`
    }))
  )

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-visible">
      {particles.map(p => (
        <div
          key={p.id}
          className={cn("confetti-particle", p.color)}
          style={{
            '--dx': p.dx,
            '--dy': p.dy,
            animationDelay: p.delay
          } as any}
        />
      ))}
    </div>
  )
}

function FlippingLogo({ front, back, alt }: { front: string; back: string; alt: string }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group w-14 h-14 [perspective:1000px] cursor-pointer relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && <Confetti key={Date.now()} />}
      <div className="relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-md hover:shadow-xl rounded-full">
        {/* Front Face */}
        <div className="absolute inset-0 w-full h-full rounded-full overflow-hidden [backface-visibility:hidden] bg-white border border-border flex items-center justify-center p-1">
          <Image src={front} alt={alt} width={56} height={56} className="object-contain w-full h-full" />
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 w-full h-full rounded-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white border border-border flex items-center justify-center overflow-hidden">
          <Image src={back} alt={`${alt} Back`} width={56} height={56} className="object-cover w-full h-full" />
        </div>
      </div>
    </div>
  )
}

interface AdminSidebarProps {
  selectedEmployeeId: string | null
  onSelectEmployee: (employeeId: string | null) => void
  onSelectTask: (task: Task) => void
  isProfileOpen?: boolean
  setIsProfileOpen?: (open: boolean) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isMobile?: boolean
  onCloseMobile?: () => void
}

export function AdminSidebar({
  selectedEmployeeId,
  onSelectEmployee,
  onSelectTask,
  isProfileOpen,
  setIsProfileOpen,
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const { allEmployees, tasks, currentUser, login, logout, seenTaskIds } = useTaskContext()
  const [activeTab, setActiveTab] = useState<"workspace" | "profile">("workspace")
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  useEffect(() => {
    if (isProfileOpen) {
      setIsProfileDialogOpen(true)
      setIsProfileOpen?.(false)
    }
  }, [isProfileOpen, setIsProfileOpen])
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    location: currentUser?.location || "",
    jobTitle: currentUser?.jobTitle || "",
  })
  const [theme, setTheme] = useState(currentUser?.theme || "emerald")
  const [mode, setMode] = useState<"light" | "dark">(currentUser?.mode || "light")
  const [isEmployeesExpanded, setIsEmployeesExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
 
  useEffect(() => {
    if (currentUser) {
      const newData = {
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        location: currentUser.location || "",
        jobTitle: currentUser.jobTitle || "",
      }
      setProfileData(newData)
      setTheme(currentUser.theme || "emerald")
      setMode(currentUser.mode || "light")
    }
  }, [currentUser])

  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [contactMessage, setContactMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  const handleContactAdmin = async () => {
    if (!contactMessage.trim()) {
      toast.error("Please enter a message")
      return
    }

    setIsSendingMessage(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/contact-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: contactMessage }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Message sent to Master Admin")
        setContactMessage("")
        setIsContactDialogOpen(false)
      } else {
        toast.error(data.error || "Failed to send message")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSendingMessage(false)
    }
  }



  const getEmployeeTaskStats = (employeeId: string) => {
    const employeeTasks = tasks.filter((t) => 
      t.assigneeId === employeeId || t.assignees?.some(a => a.id === employeeId)
    )
    const total = employeeTasks.length
    const inProgress = employeeTasks.filter((t) => t.status === "in-progress").length
    const completed = employeeTasks.filter((t) => t.status === "completed").length
    const overdue = employeeTasks.filter((t) => t.status !== "completed" && new Date(t.dueDate) < new Date()).length
    return { total, inProgress, completed, overdue }
  }

  const filteredEmployees = allEmployees.filter(e =>
    e.id !== currentUser?.id &&
    (e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const initials = currentUser?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "A"

  const hasUnseenTasks = tasks.some(t => 
    (t.assigneeId === currentUser?.id || t.assignees?.some(a => a.id === currentUser?.id)) && 
    !seenTaskIds.has(t.id) &&
    t.status !== 'completed'
  )

  const tasksWithPendingExtensions = useMemo(() => {
    return tasks.filter(t => {
      // Only show if current user is the assigner (creator or delegator) OR is a SuperAdmin
      const isAssigner = currentUser?.id === t.createdById || currentUser?.id === t.delegatedById
      const isSuperAdmin = currentUser?.role?.toUpperCase() === "SUPERADMIN"
      const hasPending = t.extensionRequests?.some(r => r.status === "PENDING")
      
      return (isAssigner || isSuperAdmin) && hasPending
    })
  }, [tasks, currentUser])

  const pendingExtensionsCount = tasksWithPendingExtensions.length

  return (
    <aside className={cn(
      "shrink-0 border-r border-border/50 bg-card/60 backdrop-blur-2xl flex flex-col h-full transition-all duration-500 ease-in-out relative z-40 shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)]",
      isCollapsed ? "w-24" : "w-80",
      isMobile ? "w-80 h-full fixed inset-y-0 left-0 z-50 overflow-hidden shadow-2xl" : ""
    )}>
      {/* Dynamic Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

      <div className={cn(
        "p-4 border-b border-border/40 relative group flex items-center justify-between",
        isCollapsed ? "justify-center" : ""
      )}>
        <div className={cn("flex items-center gap-3", isCollapsed ? "flex-col" : "")}>
          <div className={cn(
            "rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20",
            isCollapsed ? "h-8 w-8" : "h-10 w-10"
          )}>
            {currentUser?.organizationLogo ? (
              <img 
                src={currentUser.organizationLogo} 
                alt={currentUser.organizationName || "Logo"} 
                className="w-full h-full object-contain p-1.5"
              />
            ) : (
              <Shield className="h-5 w-5 text-primary" />
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate">
                {currentUser?.organizationName || "TaskFlow"}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {currentUser?.role?.replace('_', ' ') || "Member"}
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle - Premium Floating Look */}
        {!isMobile && (
          <motion.div
            initial={false}
            animate={{ x: isCollapsed ? 0 : 0 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className={cn(
                "hidden lg:flex h-7 w-7 rounded-full border border-border/50 bg-background/80 backdrop-blur-sm shadow-md hover:bg-primary/10 hover:text-primary transition-all absolute top-1/2 -right-3.5 -translate-y-1/2 z-50",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              )}
            >
              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-500", isCollapsed ? "" : "rotate-180")} />
            </Button>
          </motion.div>
        )}

        {/* Mobile Close Button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseMobile}
            className="lg:hidden h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Tab Navigation - Modern Segmented Control */}
      <div className="px-4 py-4 border-b border-border/30 bg-background/20 backdrop-blur-sm">
        <div className={cn(
          "relative flex bg-secondary/30 rounded-[1rem] p-1 border border-border/50",
          isCollapsed ? "flex-col gap-1" : "gap-1"
        )}>
          {/* Animated Background Slide */}
          {!isCollapsed && (
            <motion.div
              layoutId="tab-bg"
              className="absolute inset-y-1 bg-background rounded-[0.75rem] shadow-sm z-0"
              initial={false}
              animate={{
                left: selectedEmployeeId === "profile" ? "50%" : "4px",
                right: selectedEmployeeId === "profile" ? "4px" : "50%",
              }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
          )}

          <button
            onClick={() => onSelectEmployee(null)}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2.5 px-3 py-2 rounded-[0.75rem] text-xs font-bold transition-all z-10",
              isCollapsed ? "h-11 w-11 px-0" : "",
              selectedEmployeeId !== "profile"
                ? "text-primary drop-shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={isCollapsed ? "Workspace" : ""}
          >
            <Layers className={cn("h-4 w-4 transition-transform", selectedEmployeeId !== "profile" ? "scale-110" : "opacity-70")} />
            {!isCollapsed && <span className="uppercase tracking-widest">Workspace</span>}
          </button>

          <button
            onClick={() => onSelectEmployee("profile")}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2.5 px-3 py-2 rounded-[0.75rem] text-xs font-bold transition-all z-10",
              isCollapsed ? "h-11 w-11 px-0" : "",
              selectedEmployeeId === "profile"
                ? "text-primary drop-shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={isCollapsed ? "Profile" : ""}
          >
            <User className={cn("h-4 w-4 transition-transform", selectedEmployeeId === "profile" ? "scale-110" : "opacity-70")} />
            {!isCollapsed && <span className="uppercase tracking-widest">Profile</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          { (selectedEmployeeId !== "profile" || isCollapsed) ? (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-3 space-y-1"
            >
              {/* ALWAYS VISIBLE SYSTEM BUTTONS */}
              {currentUser?.role?.toUpperCase() === "SUPERADMIN" && (
                <button
                  onClick={() => window.location.href = "/dashboard"}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group/nav relative overflow-hidden",
                    isCollapsed ? "justify-center px-0" : "",
                    "text-primary font-bold hover:bg-primary/10"
                  )}
                >
                   <Shield className="h-5 w-5 transition-transform group-hover/nav:scale-110" />
                   {!isCollapsed && <span className="text-sm tracking-tight uppercase tracking-widest">User Management</span>}
                </button>
              )}

              {(currentUser?.role?.toUpperCase() === "ADMIN" || currentUser?.role?.toUpperCase() === "HEAD_ADMIN" || currentUser?.role?.toUpperCase() === "CREATOR") && (
                <button
                  onClick={() => onSelectEmployee(null)}
                  className={cn(
                    "w-full flex items-center rounded-2xl px-4 py-3.5 transition-all duration-300 group/nav relative overflow-hidden",
                    isCollapsed ? "justify-center px-0 h-14" : "gap-4",
                    selectedEmployeeId === null
                      ? "bg-primary shadow-[0_10px_25px_-5px_rgba(var(--primary),0.3)] text-primary-foreground border-primary"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1"
                  )}
                >
                  {/* Active Indicator Line */}
                  {selectedEmployeeId === null && !isCollapsed && (
                    <motion.div 
                      layoutId="nav-indicator"
                      className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full"
                    />
                  )}

                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border-2 shrink-0 transition-all duration-500 group-hover/nav:rotate-3",
                    selectedEmployeeId === null
                      ? "bg-white/20 border-white/30 text-white"
                      : "bg-primary/10 text-primary border-primary/20 group-hover/nav:bg-primary group-hover/nav:text-white"
                  )}>
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="text-sm font-black uppercase tracking-wider truncate w-full text-left">Dashboard</span>
                        <span className={cn(
                          "text-[9px] font-medium opacity-60 truncate w-full text-left",
                          selectedEmployeeId === null ? "text-white" : "text-muted-foreground"
                        )}>Overview & Reports</span>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 shrink-0 transition-transform group-hover/nav:translate-x-1",
                        selectedEmployeeId === null ? "text-white/60" : "text-muted-foreground/30"
                      )} />
                    </>
                  )}
                </button>
              )}

              {currentUser?.role?.toUpperCase() === "CREATOR" && (
                <button
                  onClick={() => onSelectEmployee('user-management')}
                  className={cn(
                    "w-full flex items-center rounded-2xl px-4 py-3.5 transition-all duration-300 group/nav relative overflow-hidden",
                    isCollapsed ? "justify-center px-0 h-14" : "gap-4",
                    selectedEmployeeId === 'user-management'
                      ? "bg-primary shadow-[0_10px_25px_-5px_rgba(var(--primary),0.3)] text-primary-foreground border-primary"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border-2 shrink-0 transition-all duration-500",
                    selectedEmployeeId === 'user-management'
                      ? "bg-white/20 border-white/30 text-white"
                      : "bg-primary/10 text-primary border-primary/20 group-hover/nav:bg-primary group-hover/nav:text-white"
                  )}>
                    <Shield className="h-5 w-5" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="text-sm font-black uppercase tracking-wider truncate w-full text-left">User Management</span>
                        <span className={cn(
                          "text-[9px] font-medium opacity-60 truncate w-full text-left",
                          selectedEmployeeId === 'user-management' ? "text-white" : "text-muted-foreground"
                        )}>Members & Permissions</span>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 shrink-0 transition-transform group-hover/nav:translate-x-1",
                        selectedEmployeeId === 'user-management' ? "text-white/60" : "text-muted-foreground/30"
                      )} />
                    </>
                  )}
                </button>
              )}

              {currentUser?.role?.toUpperCase() === "CREATOR" && (
                <button
                  onClick={() => onSelectEmployee('support')}
                  className={cn(
                    "w-full flex items-center rounded-2xl px-4 py-3.5 transition-all duration-300 group/nav relative overflow-hidden",
                    isCollapsed ? "justify-center px-0 h-14" : "gap-4",
                    selectedEmployeeId === 'support'
                      ? "bg-amber-600 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.3)] text-white border-amber-600"
                      : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:translate-x-1"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border-2 shrink-0 transition-all duration-500",
                    selectedEmployeeId === 'support'
                      ? "bg-white/20 border-white/30 text-white"
                      : "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 group-hover/nav:bg-amber-600 group-hover/nav:text-white"
                  )}>
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="text-sm font-black uppercase tracking-wider truncate w-full text-left">Support Center</span>
                        <span className={cn(
                          "text-[9px] font-medium opacity-60 truncate w-full text-left",
                          selectedEmployeeId === 'support' ? "text-white" : "text-muted-foreground"
                        )}>Message Master Admin</span>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 shrink-0 transition-transform group-hover/nav:translate-x-1",
                        selectedEmployeeId === 'support' ? "text-white/60" : "text-amber-400/50"
                      )} />
                    </>
                  )}
                </button>
              )}


              {(currentUser?.role?.toUpperCase() === "ADMIN") && (
                <button
                  onClick={() => onSelectEmployee('my-tasks')}
                  className={cn(
                    "w-full flex items-center rounded-2xl px-4 py-3.5 transition-all duration-300 group/nav relative overflow-hidden",
                    isCollapsed ? "justify-center px-0 h-14" : "gap-4",
                    selectedEmployeeId === 'my-tasks'
                      ? "bg-primary shadow-[0_10px_25px_-5px_rgba(var(--primary),0.3)] text-primary-foreground border-primary"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border-2 shrink-0 transition-all duration-500",
                    selectedEmployeeId === 'my-tasks'
                      ? "bg-white/20 border-white/30 text-white"
                      : "bg-primary/10 text-primary border-primary/20 group-hover/nav:bg-primary group-hover/nav:text-white"
                  )}>
                    <Clipboard className="h-5 w-5" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="text-sm font-black uppercase tracking-wider truncate w-full text-left">My Tasks</span>
                        <span className={cn(
                          "text-[9px] font-medium opacity-60 truncate w-full text-left",
                          selectedEmployeeId === 'my-tasks' ? "text-white" : "text-muted-foreground"
                        )}>Your individual tasks</span>
                      </div>
                      {hasUnseenTasks && (
                        <div className="flex items-center justify-center h-5 px-2 rounded-md bg-white/20 border border-white/30 backdrop-blur-sm shadow-sm animate-pulse shrink-0">
                          <span className="text-[9px] font-black text-white uppercase tracking-tighter">New</span>
                        </div>
                      )}
                      <ChevronRight className={cn(
                        "h-4 w-4 shrink-0 transition-transform group-hover/nav:translate-x-1",
                        selectedEmployeeId === 'my-tasks' ? "text-white/60" : "text-muted-foreground/30"
                      )} />
                    </>
                  )}
                  {isCollapsed && hasUnseenTasks && (
                    <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background animate-pulse" />
                  )}
                </button>
              )}

              <div className="h-px bg-border/50 my-2" />

              <div className="h-px bg-border/30 my-4 mx-4" />

              <button
                onClick={() => onSelectEmployee('team-projects')}
                className={cn(
                  "w-full flex items-center rounded-2xl px-4 py-3.5 transition-all duration-300 group/nav relative overflow-hidden",
                  isCollapsed ? "justify-center px-0 h-14" : "gap-4",
                  selectedEmployeeId === 'team-projects'
                    ? "bg-primary shadow-[0_10px_25px_-5px_rgba(var(--primary),0.3)] text-primary-foreground border-primary"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border-2 shrink-0 transition-all duration-500",
                  selectedEmployeeId === 'team-projects'
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-primary/10 text-primary border-primary/20 group-hover/nav:bg-primary group-hover/nav:text-white"
                )}>
                  <Users className="h-5 w-5" />
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex flex-col items-start flex-1">
                      <span className="text-sm font-black uppercase tracking-widest">
                        {currentUser?.role?.toUpperCase() === 'CREATOR' ? 'All Tasks' : 'Team Projects'}
                      </span>
                      <span className={cn(
                        "text-[9px] font-medium opacity-60",
                        selectedEmployeeId === 'team-projects' ? "text-white" : "text-muted-foreground"
                      )}>Collaborative Work</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform group-hover/nav:translate-x-1",
                      selectedEmployeeId === 'team-projects' ? "text-white/60" : "text-muted-foreground/30"
                    )} />
                  </>
                )}
              </button>

              {(currentUser?.role?.toUpperCase() === "ADMIN" || currentUser?.role?.toUpperCase() === "HEAD_ADMIN" || currentUser?.role?.toUpperCase() === "SUPERADMIN" || currentUser?.role?.toUpperCase() === "CREATOR") && (
                <button
                  onClick={() => onSelectEmployee('archived-tasks')}
                  className={cn(
                    "w-full flex items-center rounded-2xl px-4 py-3.5 transition-all duration-300 group/nav relative overflow-hidden",
                    isCollapsed ? "justify-center px-0 h-14" : "gap-4",
                    selectedEmployeeId === 'archived-tasks'
                      ? "bg-primary shadow-[0_10px_25px_-5px_rgba(var(--primary),0.3)] text-primary-foreground border-primary"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border-2 shrink-0 transition-all duration-500",
                    selectedEmployeeId === 'archived-tasks'
                      ? "bg-white/20 border-white/30 text-white"
                      : "bg-primary/10 text-primary border-primary/20 group-hover/nav:bg-primary group-hover/nav:text-white"
                  )}>
                    <Archive className="h-5 w-5" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="flex flex-col items-start flex-1">
                        <span className="text-sm font-black uppercase tracking-widest">Archived</span>
                        <span className={cn(
                          "text-[9px] font-medium opacity-60",
                          selectedEmployeeId === 'archived-tasks' ? "text-white" : "text-muted-foreground"
                        )}>Completed & Hidden</span>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform group-hover/nav:translate-x-1",
                        selectedEmployeeId === 'archived-tasks' ? "text-white/60" : "text-muted-foreground/30"
                      )} />
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => onSelectEmployee('activity-log')}
                className={cn(
                  "w-full flex items-center rounded-2xl px-4 py-3.5 transition-all duration-300 group/nav relative overflow-hidden",
                  isCollapsed ? "justify-center px-0 h-14" : "gap-4",
                  selectedEmployeeId === 'activity-log'
                    ? "bg-primary shadow-[0_10px_25px_-5px_rgba(var(--primary),0.3)] text-primary-foreground border-primary"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border-2 shrink-0 transition-all duration-500",
                  selectedEmployeeId === 'activity-log'
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-primary/10 text-primary border-primary/20 group-hover/nav:bg-primary group-hover/nav:text-white"
                )}>
                  <Activity className="h-5 w-5" />
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex flex-col items-start flex-1">
                      <span className="text-sm font-black uppercase tracking-widest">Logs</span>
                      <span className={cn(
                        "text-[9px] font-medium opacity-60",
                        selectedEmployeeId === 'activity-log' ? "text-white" : "text-muted-foreground"
                      )}>History of changes</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform group-hover/nav:translate-x-1",
                      selectedEmployeeId === 'activity-log' ? "text-white/60" : "text-muted-foreground/30"
                    )} />
                  </>
                )}
              </button>

              {currentUser?.role?.toUpperCase() === 'CREATOR' && (
                <button
                  onClick={() => onSelectEmployee('support')}
                  className={cn(
                    "w-full flex items-center rounded-2xl px-4 py-3.5 transition-all duration-300 group/nav relative overflow-hidden",
                    isCollapsed ? "justify-center px-0 h-14" : "gap-4",
                    selectedEmployeeId === 'support'
                      ? "bg-amber-500 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.3)] text-white border-amber-500"
                      : "text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600 hover:translate-x-1"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border-2 shrink-0 transition-all duration-500",
                    selectedEmployeeId === 'support'
                      ? "bg-white/20 border-white/30 text-white"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20 group-hover/nav:bg-amber-500 group-hover/nav:text-white"
                  )}>
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="flex flex-col items-start flex-1">
                        <span className="text-sm font-black uppercase tracking-widest">Support Center</span>
                        <span className={cn(
                          "text-[9px] font-medium opacity-60",
                          selectedEmployeeId === 'support' ? "text-white" : "text-muted-foreground"
                        )}>Contact Master Admin</span>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform group-hover/nav:translate-x-1",
                        selectedEmployeeId === 'support' ? "text-white/60" : "text-muted-foreground/30"
                      )} />
                    </>
                  )}
                </button>
              )}

              {(currentUser?.role?.toUpperCase() === "ADMIN" || currentUser?.role?.toUpperCase() === "HEAD_ADMIN" || currentUser?.role?.toUpperCase() === "SUPERADMIN" || currentUser?.role?.toUpperCase() === "CREATOR") && (
                <>
                  {!isCollapsed && (
                    <div className="px-4 py-4 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                          Team Members
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsEmployeesExpanded(!isEmployeesExpanded)}
                          className="p-1 rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", !isEmployeesExpanded && "-rotate-90")} />
                        </motion.button>
                      </div>

                      <AnimatePresence>
                        {isEmployeesExpanded && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="relative"
                          >
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                            <Input
                              placeholder="Find someone..."
                              className="pl-9 h-10 text-xs bg-secondary/30 border-transparent focus-visible:bg-background rounded-xl placeholder:text-muted-foreground/50 transition-all"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  <AnimatePresence>
                    {(isEmployeesExpanded || isCollapsed) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className={cn("space-y-1", isCollapsed ? "px-2" : "px-4")}
                      >
                        {filteredEmployees.map((employee) => {
                          const stats = getEmployeeTaskStats(employee.id)
                          const empInitials = employee.name.split(" ").map(n => n[0]).join("").toUpperCase()
                          const isActive = selectedEmployeeId === employee.id

                          return (
                            <motion.button
                              layout
                              key={employee.id}
                              onClick={() => onSelectEmployee(employee.id)}
                              className={cn(
                                "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all relative group/emp mb-1",
                                isCollapsed ? "justify-center px-0 h-12" : "",
                                isActive
                                  ? "bg-primary shadow-lg shadow-primary/10 text-primary-foreground scale-[1.02]"
                                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                              )}
                            >
                              <div className="relative shrink-0">
                                <Avatar className={cn(
                                  "h-8 w-8 border-2 transition-all duration-500",
                                  isActive ? "border-white/30" : "border-border/50 group-hover/emp:border-primary/50"
                                )}>
                                  {employee.avatar ? (
                                    <AvatarImage src={employee.avatar} className="object-cover" />
                                  ) : (
                                    <AvatarFallback className={cn(
                                      "text-[10px] font-black",
                                      isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                    )}>
                                      {empInitials}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                {stats.overdue > 0 && (
                                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive border-2 border-background shadow-sm animate-bounce" />
                                )}
                              </div>

                              {!isCollapsed && (
                                <>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn(
                                      "text-xs font-black tracking-tight truncate transition-colors",
                                      isActive ? "text-white" : "text-foreground"
                                    )}>
                                      {employee.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={cn(
                                        "text-[9px] font-bold uppercase tracking-wider",
                                        isActive ? "text-white/60" : "text-muted-foreground"
                                      )}>
                                        {stats.total} Tasks
                                      </span>
                                      <div className="flex items-center gap-1 ml-auto">
                                        {stats.inProgress > 0 && <div className="h-1 w-1 rounded-full bg-blue-400" title="In Progress" />}
                                        {stats.completed > 0 && <div className="h-1 w-1 rounded-full bg-emerald-400" title="Completed" />}
                                      </div>
                                    </div>
                                  </div>
                                  <ChevronRight className={cn(
                                    "h-3 w-3 shrink-0 transition-all group-hover/emp:translate-x-1",
                                    isActive ? "text-white/60" : "text-muted-foreground/20"
                                  )} />
                                </>
                              )}
                            </motion.button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="p-4 space-y-6"
            >
              {/* Premium Internal Profile View */}
              <div className="relative group p-1.5 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-emerald-500/10 to-transparent mb-4 shadow-xl">
                <div className="flex flex-col items-center text-center p-8 rounded-[2.3rem] bg-background/60 backdrop-blur-3xl border border-white/20 dark:border-white/5 shadow-inner relative overflow-hidden">
                  {/* Decorative mesh gradient */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary),0.15),transparent_50%)] pointer-events-none" />
                  
                  <div className="relative mb-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative z-10"
                    >
                      <div className="p-1 rounded-full bg-gradient-to-br from-primary via-emerald-400 to-primary-foreground shadow-2xl">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-inner cursor-pointer" onClick={() => setIsProfileDialogOpen(true)}>
                          {currentUser?.avatar ? (
                            <AvatarImage src={currentUser.avatar} className="object-cover" />
                          ) : (
                            <AvatarFallback className="text-2xl font-black bg-background text-primary">
                              {initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary text-white border-4 border-background shadow-lg flex items-center justify-center transition-transform"
                        onClick={() => setIsProfileDialogOpen(true)}
                      >
                        <Camera className="h-4 w-4" />
                      </motion.button>
                    </motion.div>
                  </div>
                  
                  <h3 className="text-xl font-black text-foreground tracking-tight mb-1 relative z-10">{profileData.name}</h3>
                  <div className="relative z-10 flex flex-col gap-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 backdrop-blur-md">
                      {currentUser?.role?.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-[11px] font-bold text-muted-foreground opacity-60 italic">{profileData.jobTitle || "Administrator"}</span>
                  </div>
                </div>
              </div>

              {/* Sidebar Settings Section */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 px-1">
                  <Palette className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sidebar Settings</span>
                </div>

                <div className="space-y-3 px-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Accent Color</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "emerald", color: "bg-[#10b981]", label: "Emerald" },
                      { id: "blue", color: "bg-[#3b82f6]", label: "Ocean" },
                      { id: "violet", color: "bg-[#8b5cf6]", label: "Royal" },
                      { id: "amber", color: "bg-[#f59e0b]", label: "Sunset" },
                      { id: "rose", color: "bg-[#f43f5e]", label: "Velvet" },
                      { id: "slate", color: "bg-[#64748b]", label: "Slate" },
                      { id: "indigo", color: "bg-[#6366f1]", label: "Indigo" },
                      { id: "teal", color: "bg-[#0d9488]", label: "Teal" },
                      { id: "orange", color: "bg-[#f97316]", label: "Orange" },
                      { id: "red", color: "bg-[#ef4444]", label: "Red" },
                      { id: "pink", color: "bg-[#ec4899]", label: "Pink" },
                      { id: "sky", color: "bg-[#0ea5e9]", label: "Sky" },
                      { id: "lime", color: "bg-[#84cc16]", label: "Lime" },
                      { id: "cyan", color: "bg-[#06b6d4]", label: "Cyan" },
                      { id: "fuchsia", color: "bg-[#d946ef]", label: "Fuchsia" },
                      { id: "purple", color: "bg-[#a855f7]", label: "Purple" },
                      { id: "yellow", color: "bg-[#eab308]", label: "Yellow" },
                      { id: "green", color: "bg-[#16a34a]", label: "Green" },
                      { id: "zinc", color: "bg-[#18181b]", label: "Zinc" },
                      { id: "stone", color: "bg-[#78716c]", label: "Stone" },
                      { id: "coffee", color: "bg-[#5d4037]", label: "Coffee" },
                      { id: "navy", color: "bg-[#0a192f]", label: "Navy" },
                      { id: "forest", color: "bg-[#064e3b]", label: "Forest" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id)
                          const token = localStorage.getItem("token")
                          fetch(`/api/users/${currentUser?.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ ...profileData, theme: t.id, mode })
                          }).then(res => res.json()).then(data => data.user && login(currentUser?.role!, currentUser?.id!, data.user))
                        }}
                        className={cn(
                          "group relative flex h-6 w-6 items-center justify-center rounded-full transition-all ring-offset-background",
                          theme === t.id ? "ring-2 ring-primary ring-offset-2" : "hover:scale-110"
                        )}
                        title={t.label}
                      >
                        <div className={cn("h-full w-full rounded-full border border-black/10 shadow-sm", t.color)} />
                        {theme === t.id && (
                          <Check className="absolute h-2.5 w-2.5 text-white drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 px-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Theme Mode</p>
                  <div className="flex gap-2">
                    <Button
                      variant={mode === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setMode("light")
                        const token = localStorage.getItem("token")
                        fetch(`/api/users/${currentUser?.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ ...profileData, theme, mode: "light" })
                        }).then(res => res.json()).then(data => data.user && login(currentUser?.role!, currentUser?.id!, data.user))
                      }}
                      className="flex-1 rounded-lg h-9 text-[11px]"
                    >
                      <Sun className="h-3.5 w-3.5 mr-1.5" />
                      Light
                    </Button>
                    <Button
                      variant={mode === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setMode("dark")
                        const token = localStorage.getItem("token")
                        fetch(`/api/users/${currentUser?.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ ...profileData, theme, mode: "dark" })
                        }).then(res => res.json()).then(data => data.user && login(currentUser?.role!, currentUser?.id!, data.user))
                      }}
                      className="flex-1 rounded-lg h-9 text-[11px]"
                    >
                      <Moon className="h-3.5 w-3.5 mr-1.5" />
                      Dark
                    </Button>
                  </div>
                </div>

                {currentUser?.role === 'head_admin' && (
                  <div className="pt-4 mt-2 border-t border-border/50">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-10 rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary transition-colors text-xs font-bold"
                      onClick={() => window.location.href = "mailto:support@taskflow.com?subject=Platform%20Support%20Request"}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Master Admin
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      <ProfileDialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
    </aside>
  )
}
