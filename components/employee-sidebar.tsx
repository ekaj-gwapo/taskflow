"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useTaskContext } from "@/lib/task-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClipboardList, User, Mail, Phone, MapPin, Save, X, LayoutDashboard, Search, ChevronRight, ChevronDown, Shield, Clipboard, Users, Activity, Palette, Check, Sun, Moon, LogOut, Layers, Camera, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProfileDialog } from "@/components/profile-dialog"
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

interface EmployeeSidebarProps {
  selectedCategory: "individual" | "team" | "profile" | "activity-log"
  onSelectCategory: (category: "individual" | "team" | "profile" | "activity-log") => void
  isProfileOpen?: boolean
  setIsProfileOpen?: (open: boolean) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isMobile?: boolean
  onCloseMobile?: () => void
}

export function EmployeeSidebar({
  selectedCategory,
  onSelectCategory,
  isProfileOpen,
  setIsProfileOpen,
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
}: EmployeeSidebarProps) {
  const { currentUser, tasks, login, logout, seenTaskIds } = useTaskContext()
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  useEffect(() => {
    if (isProfileOpen) {
      setIsProfileDialogOpen(true)
      setIsProfileOpen?.(false)
    }
  }, [isProfileOpen, setIsProfileOpen])
  const [activeTab, setActiveTab] = useState<"workspace" | "profile">(
    selectedCategory === "profile" ? "profile" : "workspace"
  )
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

  const { allEmployees } = useTaskContext()

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

  const individualTasks = tasks.filter((t) =>
    (t.assignees?.length === 1 && t.assignees[0].id === currentUser?.id) ||
    (t.assigneeId === currentUser?.id && (!t.assignees || t.assignees.length <= 1))
  )

  const teamTasks = tasks.filter((t) =>
    (t.assignees && t.assignees.length > 1 && t.assignees.some(a => a.id === currentUser?.id))
  )


  const initials = currentUser?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  const hasUnseenIndividualTasks = individualTasks.some(t => !seenTaskIds.has(t.id) && t.status !== 'completed')
  const hasUnseenTeamTasks = teamTasks.some(t => !seenTaskIds.has(t.id) && t.status !== 'completed')

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
                left: activeTab === "profile" ? "50%" : "4px",
                right: activeTab === "profile" ? "4px" : "50%",
              }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
          )}

          <button
            onClick={() => { setActiveTab("workspace"); onSelectCategory("individual"); }}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2.5 px-3 py-2 rounded-[0.75rem] text-xs font-bold transition-all z-10",
              isCollapsed ? "h-11 w-11 px-0" : "",
              activeTab === "workspace"
                ? "text-primary drop-shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={isCollapsed ? "Workspace" : ""}
          >
            <Layers className={cn("h-4 w-4 transition-transform", activeTab === "workspace" ? "scale-110" : "opacity-70")} />
            {!isCollapsed && <span className="uppercase tracking-widest">Workspace</span>}
          </button>

          <button
            onClick={() => { setActiveTab("profile"); onSelectCategory("profile"); }}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2.5 px-3 py-2 rounded-[0.75rem] text-xs font-bold transition-all z-10",
              isCollapsed ? "h-11 w-11 px-0" : "",
              activeTab === "profile"
                ? "text-primary drop-shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={isCollapsed ? "Profile" : ""}
          >
            <User className={cn("h-4 w-4 transition-transform", activeTab === "profile" ? "scale-110" : "opacity-70")} />
            {!isCollapsed && <span className="uppercase tracking-widest">Profile</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          {(activeTab === "workspace" || isCollapsed) && (
           <div className="p-3 space-y-2 animate-in slide-in-from-left-1 duration-200">
              {/* Main Navigation */}
              
              <button
                onClick={() => onSelectCategory("individual")}
                className={cn(
                  "w-full flex items-center rounded-2xl px-4 py-3.5 transition-all duration-300 group/nav relative overflow-hidden",
                  isCollapsed ? "justify-center px-0 h-14" : "gap-4",
                  selectedCategory === "individual"
                    ? "bg-primary shadow-[0_10px_25px_-5px_rgba(var(--primary),0.3)] text-primary-foreground border-primary"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border-2 shrink-0 transition-all duration-500",
                  selectedCategory === "individual"
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
                        selectedCategory === "individual" ? "text-white" : "text-muted-foreground"
                      )}>My Workspace Overview</span>
                    </div>
                    {hasUnseenIndividualTasks && (
                      <div className="flex items-center justify-center h-5 px-2 rounded-md bg-white/20 border border-white/30 backdrop-blur-sm shadow-sm animate-pulse shrink-0">
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter">New</span>
                      </div>
                    )}
                    <ChevronRight className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover/nav:translate-x-1",
                      selectedCategory === "individual" ? "text-white/60" : "text-muted-foreground/30"
                    )} />
                  </>
                )}
                {isCollapsed && hasUnseenIndividualTasks && (
                  <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background animate-pulse" />
                )}
              </button>

              <button
                onClick={() => onSelectCategory("team")}
                className={cn(
                  "w-full flex items-center rounded-2xl px-4 py-3.5 transition-all duration-300 group/nav relative overflow-hidden",
                  isCollapsed ? "justify-center px-0 h-14" : "gap-4",
                  selectedCategory === "team"
                    ? "bg-primary shadow-[0_10px_25px_-5px_rgba(var(--primary),0.3)] text-primary-foreground border-primary"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border-2 shrink-0 transition-all duration-500",
                  selectedCategory === "team"
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-primary/10 text-primary border-primary/20 group-hover/nav:bg-primary group-hover/nav:text-white"
                )}>
                  <Users className="h-5 w-5" />
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="text-sm font-black uppercase tracking-wider truncate w-full text-left">Team Projects</span>
                      <span className={cn(
                        "text-[9px] font-medium opacity-60 truncate w-full text-left",
                        selectedCategory === "team" ? "text-white" : "text-muted-foreground"
                      )}>Collaborative Work</span>
                    </div>
                    {hasUnseenTeamTasks && (
                      <div className="flex items-center justify-center h-5 px-2 rounded-md bg-white/20 border border-white/30 backdrop-blur-sm shadow-sm animate-pulse shrink-0">
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter">New</span>
                      </div>
                    )}
                    <ChevronRight className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover/nav:translate-x-1",
                      selectedCategory === "team" ? "text-white/60" : "text-muted-foreground/30"
                    )} />
                  </>
                )}
                {isCollapsed && hasUnseenTeamTasks && (
                  <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background animate-pulse" />
                )}
              </button>

              <button
                onClick={() => onSelectCategory("activity-log")}
                className={cn(
                  "w-full flex items-center rounded-2xl px-4 py-3.5 transition-all duration-300 group/nav relative overflow-hidden",
                  isCollapsed ? "justify-center px-0 h-14" : "gap-4",
                  selectedCategory === "activity-log"
                    ? "bg-primary shadow-[0_10px_25px_-5px_rgba(var(--primary),0.3)] text-primary-foreground border-primary"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border-2 shrink-0 transition-all duration-500",
                  selectedCategory === "activity-log"
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-primary/10 text-primary border-primary/20 group-hover/nav:bg-primary group-hover/nav:text-white"
                )}>
                  <Activity className="h-5 w-5" />
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="text-sm font-black uppercase tracking-wider truncate w-full text-left">Logs</span>
                      <span className={cn(
                        "text-[9px] font-medium opacity-60 truncate w-full text-left",
                        selectedCategory === "activity-log" ? "text-white" : "text-muted-foreground"
                      )}>History of changes</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover/nav:translate-x-1",
                      selectedCategory === "activity-log" ? "text-white/60" : "text-muted-foreground/30"
                    )} />
                  </>
                )}
              </button>

              <div className="h-px bg-border/30 my-4 mx-4" />

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
                      const isActive = false // Employees don't select other employees usually

                      return (
                        <motion.div
                          layout
                          key={employee.id}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all relative group/emp mb-1",
                            isCollapsed ? "justify-center px-0 h-12" : "",
                            "text-muted-foreground hover:bg-primary/5"
                          )}
                        >
                          <div className="relative shrink-0">
                            <Avatar className={cn(
                              "h-8 w-8 border-2 transition-all duration-500",
                              "border-border/50 group-hover/emp:border-primary/50"
                            )}>
                              {employee.avatar ? (
                                <AvatarImage src={employee.avatar} className="object-cover" />
                              ) : (
                                <AvatarFallback className={cn(
                                  "text-[10px] font-black",
                                  "bg-primary/10 text-primary"
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
                                  "text-foreground"
                                )}>
                                  {employee.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider",
                                    "text-muted-foreground"
                                  )}>
                                    {stats.total} Tasks
                                  </span>
                                  <div className="flex items-center gap-1 ml-auto">
                                    {stats.inProgress > 0 && <div className="h-1 w-1 rounded-full bg-blue-400" title="In Progress" />}
                                    {stats.completed > 0 && <div className="h-1 w-1 rounded-full bg-emerald-400" title="Completed" />}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === "profile" && !isCollapsed && (
            <div className="p-4 space-y-6 animate-in fade-in duration-300">
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
                    <span className="text-[11px] font-bold text-muted-foreground opacity-60 italic">{profileData.jobTitle || "Team Member"}</span>
                  </div>
                </div>
              </div>



              {/* Appearance Section */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 px-1">
                  <Palette className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Appearance</span>
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
                          }).then(res => res.json()).then(data => data.user && login(currentUser?.role!.toLowerCase() as any, currentUser?.id!, data.user))
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
                  <p className="text-[10px] text-muted-foreground font-medium">Color Mode</p>
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
                        }).then(res => res.json()).then(data => data.user && login(currentUser?.role!.toLowerCase() as any, currentUser?.id!, data.user))
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
                        }).then(res => res.json()).then(data => data.user && login(currentUser?.role!.toLowerCase() as any, currentUser?.id!, data.user))
                      }}
                      className="flex-1 rounded-lg h-9 text-[11px]"
                    >
                      <Moon className="h-3.5 w-3.5 mr-1.5" />
                      Dark
                    </Button>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-border/50">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-10 rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary transition-colors text-xs font-bold"
                    onClick={() => window.location.href = `mailto:admin@taskflow.com?subject=Support%20Request%20from%20${currentUser?.name}`}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Admin
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      <ProfileDialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
    </aside>
  )
}
