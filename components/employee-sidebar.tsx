"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTaskContext } from "@/lib/task-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClipboardList, User, Mail, Phone, MapPin, Save, X, LayoutDashboard, Search, ChevronRight, Shield, Clipboard, Users, Activity, Palette, Check, Sun, Moon, LogOut } from "lucide-react"
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
  const [activeTab, setActiveTab] = useState<"tasks" | "profile">(
    selectedCategory === "profile" ? "profile" : "tasks"
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
      "shrink-0 border-r border-border bg-card flex flex-col h-full shadow-lg overflow-hidden transition-all duration-300 relative",
      isCollapsed ? "w-20" : "w-80",
      isMobile ? "w-80 h-full fixed inset-y-0 left-0 z-50" : ""
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
                  {currentUser?.role?.replace('_', ' ') || "Employee"}
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
              "hidden lg:flex h-8 w-8 rounded-lg border border-border/50 bg-background/50 hover:bg-primary/10 hover:text-primary transition-all",
              isCollapsed ? "absolute -right-0.5" : ""
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
            onClick={() => { setActiveTab("tasks"); onSelectCategory("individual"); }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "tasks"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Tasks</span>
          </button>
          <button
            onClick={() => { setActiveTab("profile"); onSelectCategory("profile"); }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "profile"
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
            variant={activeTab === "tasks" ? "default" : "ghost"}
            size="icon"
            onClick={() => { setActiveTab("tasks"); onSelectCategory("individual"); }}
            className="h-10 w-10 rounded-xl"
           >
              <ClipboardList className="h-5 w-5" />
           </Button>
           <Button
            variant={activeTab === "profile" ? "default" : "ghost"}
            size="icon"
            onClick={() => { setActiveTab("profile"); onSelectCategory("profile"); }}
            className="h-10 w-10 rounded-xl"
           >
              <User className="h-5 w-5" />
           </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          {activeTab === "tasks" && (
           <div className="p-3 space-y-2 animate-in slide-in-from-left-1 duration-200">
              {!isCollapsed && <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-2 mt-2">Task Categories</p>}
              
              <button
                onClick={() => onSelectCategory("individual")}
                title={isCollapsed ? "My Tasks" : ""}
                className={cn(
                  "w-full flex items-center rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-1",
                  isCollapsed ? "justify-center px-0 gap-0" : "gap-3",
                  selectedCategory === "individual"
                    ? "bg-primary text-primary-foreground border-primary shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border-border bg-background"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border shrink-0",
                  selectedCategory === "individual"
                    ? "bg-white/20 border-white/30 text-primary-foreground"
                    : "bg-primary/10 text-primary border-primary/20"
                )}>
                  <User className="h-4 w-4" />
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "block text-sm font-semibold",
                        selectedCategory === "individual" ? "text-white" : "text-foreground"
                      )}>
                        My Tasks
                      </span>
                        <span className={cn(
                          "text-[10px] font-medium",
                          selectedCategory === "individual" ? "text-white/70" : "text-muted-foreground"
                        )}>
                          Tasks assigned specifically to you
                        </span>
                      </div>
                      {hasUnseenIndividualTasks && (
                        <div className="text-[10px] font-bold px-2 py-1 rounded-full bg-destructive text-white animate-pulse shadow-sm min-w-[38px] text-center">
                          NEW
                        </div>
                      )}
                  </>
                )}
                {isCollapsed && hasUnseenIndividualTasks && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                )}
              </button>

              <button
                onClick={() => onSelectCategory("team")}
                title={isCollapsed ? "Team Tasks" : ""}
                className={cn(
                  "w-full flex items-center rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-1",
                  isCollapsed ? "justify-center px-0 gap-0" : "gap-3",
                  selectedCategory === "team"
                    ? "bg-primary text-primary-foreground border-primary shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border-border bg-background"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border shrink-0",
                  selectedCategory === "team"
                    ? "bg-white/20 border-white/30 text-primary-foreground"
                    : "bg-primary/10 text-primary border-primary/20"
                )}>
                  <Users className="h-4 w-4" />
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "block text-sm font-semibold",
                        selectedCategory === "team" ? "text-white" : "text-foreground"
                      )}>
                        Team Tasks
                      </span>
                        <span className={cn(
                          "text-[10px] font-medium",
                          selectedCategory === "team" ? "text-white/70" : "text-muted-foreground"
                        )}>
                          Collaborative projects and tasks
                        </span>
                      </div>
                      {hasUnseenTeamTasks && (
                        <div className="text-[10px] font-bold px-2 py-1 rounded-full bg-destructive text-white animate-pulse shadow-sm min-w-[38px] text-center">
                          NEW
                        </div>
                      )}
                  </>
                )}
                {isCollapsed && hasUnseenTeamTasks && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                )}
              </button>

              <button
                onClick={() => onSelectCategory("activity-log")}
                title={isCollapsed ? "Activity Log" : ""}
                className={cn(
                  "w-full flex items-center rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm",
                  isCollapsed ? "justify-center px-0 gap-0" : "gap-3",
                  selectedCategory === "activity-log"
                    ? "bg-primary text-primary-foreground border-primary shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border-border bg-background"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border shrink-0",
                  selectedCategory === "activity-log"
                    ? "bg-white/20 border-white/30 text-primary-foreground"
                    : "bg-primary/10 text-primary border-primary/20"
                )}>
                  <Activity className="h-4 w-4" />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "block text-sm font-semibold",
                      selectedCategory === "activity-log" ? "text-white" : "text-foreground"
                    )}>
                      Activity Log
                    </span>
                    <span className={cn(
                      "text-[10px] font-medium",
                      selectedCategory === "activity-log" ? "text-white/70" : "text-muted-foreground"
                    )}>
                      Recent actions and updates
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="p-4 space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-secondary/30 border border-border/50 shadow-inner">
                <div className="relative group">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-xl mb-4 transition-transform hover:scale-105 cursor-pointer" onClick={() => setIsProfileDialogOpen(true)}>
                    {currentUser?.avatar ? (
                      <AvatarImage src={currentUser.avatar} />
                    ) : (
                      <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary uppercase">
                        {initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <p className="text-[10px] text-muted-foreground -mt-2 mb-2 cursor-pointer hover:underline text-center" onClick={() => setIsProfileDialogOpen(true)}>Change photo</p>
                </div>
                <h3 className="text-lg font-bold text-foreground">{profileData.name}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {currentUser?.role?.toUpperCase() === "SUPERADMIN" ? "Super Admin" : currentUser?.role?.toUpperCase() === "HEAD_ADMIN" ? "Head Admin" : currentUser?.role?.toUpperCase() === "ADMIN" ? "Admin" : "Employee"}
                </p>
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
              </div>
            </div>
          )}
        </div>
      </div>


      <ProfileDialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
    </aside>
  )
}
