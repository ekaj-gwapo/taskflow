"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useTaskContext } from "@/lib/task-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, ChevronRight, ChevronDown, ClipboardList, ArrowLeft, User, Mail, Phone, MapPin, Save, X, Shield, Search, Clipboard, Share2, Trash2, Filter, FileText, Activity, LayoutDashboard, CalendarClock, Archive, Palette, Check, Sun, Moon, LogOut, ExternalLink, Camera } from "lucide-react"
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
  const [activeTab, setActiveTab] = useState<"employees" | "profile">("employees")
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
      "shrink-0 border-r border-border bg-card flex flex-col h-full shadow-lg transition-all duration-300 relative",
      isCollapsed ? "w-20" : "w-80",
      isMobile ? "w-80 h-full fixed inset-y-0 left-0 z-50 overflow-hidden" : ""
    )}>
      {/* Sidebar Header - Modern & Sleek */}
      <div className={cn(
        "p-4 border-b border-border/40 relative overflow-hidden group flex items-center justify-between",
        isCollapsed ? "justify-center" : "p-8"
      )}>
        {/* Subtle background decoration */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
        
        <div className={cn("flex items-center gap-4 relative", isCollapsed ? "justify-center" : "")}>
          <div className={cn(
            "rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm overflow-hidden transition-transform group-hover:scale-105 duration-300",
            isCollapsed ? "h-10 w-10" : "h-12 w-12"
          )}>
            {currentUser?.organizationLogo ? (
              <img 
                src={currentUser.organizationLogo} 
                alt={currentUser.organizationName || "Logo"} 
                className="w-full h-full object-contain p-1.5"
              />
            ) : (
              <LayoutDashboard className="h-6 w-6 text-primary" />
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-black text-foreground tracking-tight leading-none mb-1.5">
                {currentUser?.organizationName || "TaskFlow"}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">
                  {currentUser?.role?.replace('_', ' ') || "Organization"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex h-8 w-8 rounded-lg border border-border/50 bg-background shadow-sm hover:bg-primary/10 hover:text-primary transition-all absolute top-8 -right-4 z-50",
            )}
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", isCollapsed ? "" : "rotate-180")} />
          </Button>
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

      {/* Tab Navigation */}
      {!isCollapsed && (
        <div className="flex gap-1 p-3 border-b border-border bg-background/50">
          <button
            onClick={() => onSelectEmployee(null)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedEmployeeId !== "profile"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
          >
            <Users className="h-4 w-4" />
            <span>Employees</span>
          </button>
          <button
            onClick={() => onSelectEmployee("profile")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedEmployeeId === "profile"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </button>
        </div>
      )}
      {isCollapsed && (
        <div className="flex flex-col gap-2 p-3 border-b border-border bg-background/50 items-center">
           <Button
            variant={selectedEmployeeId !== "profile" ? "default" : "ghost"}
            size="icon"
            onClick={() => onSelectEmployee(null)}
            className="h-10 w-10 rounded-xl"
           >
              <Users className="h-5 w-5" />
           </Button>
           <Button
            variant={selectedEmployeeId === "profile" ? "default" : "ghost"}
            size="icon"
            onClick={() => onSelectEmployee("profile")}
            className="h-10 w-10 rounded-xl"
           >
              <User className="h-5 w-5" />
           </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          { (selectedEmployeeId !== "profile" || isCollapsed) ? (
            <motion.div
              key="employees"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-3 space-y-1"
            >
              {/* ALWAYS VISIBLE SYSTEM BUTTONS */}
              {currentUser?.role?.toUpperCase() === "SUPERADMIN" && (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 text-primary hover:text-primary hover:bg-primary/10 mb-1",
                    isCollapsed ? "justify-center px-0" : ""
                  )}
                  onClick={() => window.location.href = "/dashboard"}
                  title={isCollapsed ? "User Management" : ""}
                >
                  <Shield className="h-4 w-4" />
                  {!isCollapsed && <span>User Management</span>}
                </Button>
              )}

              {(currentUser?.role?.toUpperCase() === "ADMIN" || currentUser?.role?.toUpperCase() === "HEAD_ADMIN" || currentUser?.role?.toUpperCase() === "CREATOR") && (
                <button
                  onClick={() => onSelectEmployee(null)}
                  title={isCollapsed ? "Dashboard" : ""}
                  className={cn(
                    "w-full flex items-center rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-1",
                    isCollapsed ? "justify-center px-0 gap-0" : "gap-3",
                    selectedEmployeeId === null
                      ? "bg-primary text-primary-foreground border-primary shadow-primary/20 scale-[1.02]"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border-border bg-background"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border shrink-0",
                    selectedEmployeeId === null
                      ? "bg-white/20 border-white/30 text-primary-foreground"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}>
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className={cn(
                        "flex-1 text-sm font-semibold",
                        selectedEmployeeId === null ? "text-primary-foreground" : "text-foreground"
                      )}>
                        Dashboard
                      </span>
                      <ChevronRight className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        selectedEmployeeId === null ? "text-primary-foreground/70" : "text-muted-foreground"
                      )} />
                    </>
                  )}
                </button>
              )}

              {currentUser?.role?.toUpperCase() === "CREATOR" && (
                <button
                  onClick={() => onSelectEmployee('user-management')}
                  title={isCollapsed ? "User Management" : ""}
                  className={cn(
                    "w-full flex items-center rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-1",
                    isCollapsed ? "justify-center px-0 gap-0" : "gap-3",
                    selectedEmployeeId === 'user-management'
                      ? "bg-primary text-primary-foreground border-primary shadow-primary/20 scale-[1.02]"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border-border bg-background"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border shrink-0",
                    selectedEmployeeId === 'user-management'
                      ? "bg-white/20 border-white/30 text-primary-foreground"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}>
                    <Shield className="h-4 w-4" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className={cn(
                        "flex-1 text-sm font-semibold",
                        selectedEmployeeId === 'user-management' ? "text-primary-foreground" : "text-foreground"
                      )}>
                        User Management
                      </span>
                      <ChevronRight className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        selectedEmployeeId === 'user-management' ? "text-primary-foreground/70" : "text-muted-foreground"
                      )} />
                    </>
                  )}
                </button>
              )}

              {(currentUser?.role?.toUpperCase() === "ADMIN") && (
                <button
                  onClick={() => onSelectEmployee('my-tasks')}
                  title={isCollapsed ? "My Tasks" : ""}
                  className={cn(
                    "w-full flex items-center rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-1",
                    isCollapsed ? "justify-center px-0 gap-0" : "gap-3",
                    selectedEmployeeId === 'my-tasks'
                      ? "bg-primary text-primary-foreground border-primary shadow-primary/20 scale-[1.02]"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border-border bg-background"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border shrink-0",
                    selectedEmployeeId === 'my-tasks'
                      ? "bg-white/20 border-white/30 text-primary-foreground"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}>
                    <Clipboard className="h-4 w-4" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className={cn(
                        "flex-1 text-sm font-semibold",
                        selectedEmployeeId === 'my-tasks' ? "text-primary-foreground" : "text-foreground"
                      )}>
                        My Tasks
                      </span>
                      {hasUnseenTasks && (
                        <span className="h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background animate-pulse shadow-sm" />
                      )}
                      <ChevronRight className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        selectedEmployeeId === 'my-tasks' ? "text-primary-foreground/70" : "text-muted-foreground"
                      )} />
                    </>
                  )}
                  {isCollapsed && hasUnseenTasks && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  )}
                </button>
              )}

              <div className="h-px bg-border/50 my-2" />

              <button
                onClick={() => onSelectEmployee('team-projects')}
                title={isCollapsed ? (currentUser?.role?.toUpperCase() === 'CREATOR' ? 'All Tasks' : 'Team Projects') : ""}
                className={cn(
                  "w-full flex items-center rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-2",
                  isCollapsed ? "justify-center px-0 gap-0" : "gap-3",
                  selectedEmployeeId === 'team-projects'
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border-border bg-background"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border shrink-0",
                  selectedEmployeeId === 'team-projects'
                    ? "bg-white/20 border-white/30 text-primary-foreground"
                    : "bg-primary/10 text-primary border-primary/20"
                )}>
                  <Users className="h-4 w-4" />
                </div>
                {!isCollapsed && (
                  <>
                    <span className={cn(
                      "flex-1 text-sm font-semibold",
                      selectedEmployeeId === 'team-projects' ? "text-white" : "text-foreground"
                    )}>
                      {currentUser?.role?.toUpperCase() === 'CREATOR' ? 'All Tasks' : 'Team Projects'}
                    </span>
                    <ChevronRight className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      selectedEmployeeId === 'team-projects' ? "text-white/70" : "text-muted-foreground"
                    )} />
                  </>
                )}
              </button>

              {(currentUser?.role?.toUpperCase() === "ADMIN" || currentUser?.role?.toUpperCase() === "HEAD_ADMIN" || currentUser?.role?.toUpperCase() === "SUPERADMIN" || currentUser?.role?.toUpperCase() === "CREATOR") && (
                <button
                  onClick={() => onSelectEmployee('archived-tasks')}
                  title={isCollapsed ? "Archived Tasks" : ""}
                  className={cn(
                    "w-full flex items-center rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-4",
                    isCollapsed ? "justify-center px-0 gap-0" : "gap-3",
                    selectedEmployeeId === 'archived-tasks'
                      ? "bg-primary text-primary-foreground border-primary shadow-primary/20 scale-[1.02]"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border-border bg-background"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border shrink-0",
                    selectedEmployeeId === 'archived-tasks'
                      ? "bg-white/20 border-white/30 text-primary-foreground"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}>
                    <Archive className="h-4 w-4" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className={cn(
                        "flex-1 text-sm font-semibold",
                        selectedEmployeeId === 'archived-tasks' ? "text-white" : "text-foreground"
                      )}>
                        Archived Tasks
                      </span>
                      <ChevronRight className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        selectedEmployeeId === 'archived-tasks' ? "text-white/70" : "text-muted-foreground"
                      )} />
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => onSelectEmployee('activity-log')}
                title={isCollapsed ? "Activity Log" : ""}
                className={cn(
                  "w-full flex items-center rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-2",
                  isCollapsed ? "justify-center px-0 gap-0" : "gap-3",
                  selectedEmployeeId === 'activity-log'
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border-border bg-background"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border shrink-0",
                  selectedEmployeeId === 'activity-log'
                    ? "bg-white/20 border-white/30 text-primary-foreground"
                    : "bg-primary/10 text-primary border-primary/20"
                )}>
                  <Activity className="h-4 w-4" />
                </div>
                {!isCollapsed && (
                  <>
                    <span className={cn(
                      "flex-1 text-sm font-semibold",
                      selectedEmployeeId === 'activity-log' ? "text-white" : "text-foreground"
                    )}>
                      Activity Log
                    </span>
                    <ChevronRight className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      selectedEmployeeId === 'activity-log' ? "text-white/70" : "text-muted-foreground"
                    )} />
                  </>
                )}
              </button>

              {(currentUser?.role?.toUpperCase() === "ADMIN" || currentUser?.role?.toUpperCase() === "HEAD_ADMIN" || currentUser?.role?.toUpperCase() === "SUPERADMIN" || currentUser?.role?.toUpperCase() === "CREATOR") && (
                <>
                  {!isCollapsed && (
                    <button
                      onClick={() => setIsEmployeesExpanded(!isEmployeesExpanded)}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all text-muted-foreground hover:bg-primary hover:text-white mb-1 group"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/5 text-primary group-hover:bg-white/20 group-hover:text-white transition-colors">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="flex-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-white">
                        Individual Employees
                      </span>
                      <motion.div
                        animate={{ rotate: isEmployeesExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      </motion.div>
                    </button>
                  )}

                  <AnimatePresence>
                    {isEmployeesExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden space-y-1"
                      >
                        {!isCollapsed && (
                          <div className="px-1 py-2">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                              <Input
                                placeholder="Search employees..."
                                className="pl-8 h-8 text-xs bg-secondary/30 border-transparent focus-visible:bg-background"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

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
                                "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all border group",
                                isActive
                                  ? "bg-primary text-primary-foreground border-primary shadow-primary/20 scale-[1.01]"
                                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 border-transparent"
                              )}
                            >
                              <Avatar className={cn(
                                "h-7 w-7 border transition-all",
                                isActive ? "border-white/30 scale-105" : "border-border/50"
                              )}>
                                {employee.avatar ? (
                                  <AvatarImage src={employee.avatar} />
                                ) : (
                                  <AvatarFallback className={cn(
                                    "text-[10px] font-bold",
                                    isActive ? "bg-white/20 text-primary-foreground" : "bg-primary/10 text-primary"
                                  )}>
                                    {empInitials}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              {!isCollapsed && (
                                <>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn(
                                      "text-xs font-semibold truncate",
                                      isActive ? "text-white" : "text-foreground"
                                    )}>
                                      {employee.name}
                                    </p>
                                    {!isActive && (
                                      <div className="flex items-center gap-2 mt-0.5">
                                        {stats.inProgress > 0 && (
                                          <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
                                            <span className="h-1 w-1 rounded-full bg-primary" />
                                            {stats.inProgress}
                                          </span>
                                        )}
                                        {stats.overdue > 0 && (
                                          <span className="flex items-center gap-1 text-[10px] text-destructive font-medium">
                                            <span className="h-1 w-1 rounded-full bg-destructive" />
                                            {stats.overdue}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight className={cn(
                                    "h-3 w-3 shrink-0 transition-transform",
                                    isActive ? "text-white translate-x-0.5" : "text-muted-foreground/30"
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
              {/* Refined Internal Profile View */}
              <div className="relative group p-1 rounded-[2rem] bg-gradient-to-br from-primary/10 to-emerald-500/5 mb-2">
                <div className="flex flex-col items-center text-center p-6 rounded-[1.9rem] bg-background/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl">
                  <div className="relative group/avatar mb-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative"
                    >
                      <Avatar className="h-20 w-20 border-4 border-background shadow-2xl transition-transform cursor-pointer" onClick={() => setIsProfileDialogOpen(true)}>
                        {currentUser?.avatar ? (
                          <AvatarImage src={currentUser.avatar} className="object-cover" />
                        ) : (
                          <AvatarFallback className="text-xl font-black bg-gradient-to-br from-primary to-emerald-500 text-white">
                            {initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white cursor-pointer transition-opacity"
                        onClick={() => setIsProfileDialogOpen(true)}
                      >
                        <Camera className="h-5 w-5" />
                      </motion.div>
                    </motion.div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-lg bg-emerald-500 border-2 border-background shadow-lg" title="Online" />
                  </div>
                  
                  <h3 className="text-lg font-black text-foreground tracking-tight">{profileData.name}</h3>
                  <div className="mt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">
                      {currentUser?.role?.replace('_', ' ').toUpperCase()}
                    </span>
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      <ProfileDialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
    </aside>
  )
}
