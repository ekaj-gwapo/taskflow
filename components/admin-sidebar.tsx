"use client"

import { useState } from "react"
import Image from "next/image"
import { useTaskContext } from "@/lib/task-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, ChevronRight, ChevronDown, ClipboardList, ArrowLeft, User, Mail, Phone, MapPin, Save, X, Shield, Search, Clipboard, Share2, Trash2, Filter, FileText, Activity, LayoutDashboard, CalendarClock, Archive } from "lucide-react"
import { ProfileDialog } from "@/components/profile-dialog"
import { cn } from "@/lib/utils"

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
}

export function AdminSidebar({
  selectedEmployeeId,
  onSelectEmployee,
}: AdminSidebarProps) {
  const { allEmployees, tasks, currentUser, login, seenTaskIds } = useTaskContext()
  const [activeTab, setActiveTab] = useState<"employees" | "profile">("employees")
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    location: currentUser?.location || "",
  })
  const [tempProfileData, setTempProfileData] = useState(profileData)
  const [isEmployeesExpanded, setIsEmployeesExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const handleEditProfile = () => {
    setTempProfileData(profileData)
    setIsEditingProfile(true)
  }

  const handleSaveProfile = async () => {
    if (!currentUser) return
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tempProfileData),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setProfileData(tempProfileData)
        setIsEditingProfile(false)
        login(currentUser.role, currentUser.id, updatedUser.user)
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setTempProfileData(prev => ({ ...prev, [field]: value }))
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
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase())
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

  const pendingExtensionsCount = tasks.reduce((count, t) => {
    // Only count if current user is the assigner (creator or delegator) OR is a SuperAdmin
    const isAssigner = currentUser?.id === t.createdById || currentUser?.id === t.delegatedById
    const isSuperAdmin = currentUser?.role?.toUpperCase() === "SUPERADMIN"
    
    if (isAssigner || isSuperAdmin) {
      return count + (t.extensionRequests?.filter(r => r.status === "PENDING").length || 0)
    }
    return count
  }, 0)

  return (
    <aside className="w-80 shrink-0 border-r border-border bg-card flex flex-col h-full shadow-lg">
      {/* Sidebar Header - Logos Row */}
      <div className="p-4 border-b border-border bg-emerald-50/30">
        <div className="flex justify-between items-center px-1">
          <FlippingLogo front="/logos/logo4.png" back="/logos/logo-back1.jpg" alt="Logo 4" />
          <FlippingLogo front="/logos/logo3.jpg" back="/logos/logo-back2.jpg" alt="Logo 3" />
          <FlippingLogo front="/logos/logo1.jpg" back="/logos/logo-back3.jpg" alt="Logo 1" />
          <FlippingLogo front="/logos/logo2.png" back="/logos/logo-back4.jpg" alt="Logo 2" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-3 border-b border-border bg-background/50">
        <button
          onClick={() => setActiveTab("employees")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "employees"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
        >
          <Users className="h-4 w-4" />
          <span>Employees</span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "profile"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col min-h-full">
          {activeTab === "employees" && (
            <div className="p-3 space-y-1">
              {/* ALWAYS VISIBLE SYSTEM BUTTONS */}
              {currentUser?.role?.toUpperCase() === "SUPERADMIN" && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-primary hover:text-primary hover:bg-primary/10 mb-1"
                  onClick={() => window.location.href = "/dashboard"}
                >
                  <Shield className="h-4 w-4" />
                  User Management
                </Button>
              )}

              {(currentUser?.role?.toUpperCase() === "ADMIN" || currentUser?.role?.toUpperCase() === "HEAD_ADMIN") && (
                <button
                  onClick={() => onSelectEmployee(null)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-1",
                    selectedEmployeeId === null
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20 scale-[1.02]"
                      : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-border bg-background"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border",
                    selectedEmployeeId === null
                      ? "bg-white/20 border-white/30 text-white"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  )}>
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <span className={cn(
                    "flex-1 text-sm font-semibold",
                    selectedEmployeeId === null ? "text-white" : "text-foreground"
                  )}>
                    Dashboard
                  </span>
                  <ChevronRight className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    selectedEmployeeId === null ? "text-white/70" : "text-muted-foreground"
                  )} />
                </button>
              )}

              {currentUser?.role?.toUpperCase() === "ADMIN" && (
                <button
                  onClick={() => onSelectEmployee('my-tasks')}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-1",
                    selectedEmployeeId === 'my-tasks'
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20 scale-[1.02]"
                      : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-border bg-background"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border",
                    selectedEmployeeId === 'my-tasks'
                      ? "bg-white/20 border-white/30 text-white"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  )}>
                    <Clipboard className="h-4 w-4" />
                  </div>
                  <span className={cn(
                    "flex-1 text-sm font-semibold",
                    selectedEmployeeId === 'my-tasks' ? "text-white" : "text-foreground"
                  )}>
                    My Tasks
                  </span>
                  {hasUnseenTasks && (
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background animate-pulse shadow-sm" />
                  )}
                  <ChevronRight className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    selectedEmployeeId === 'my-tasks' ? "text-white/70" : "text-muted-foreground"
                  )} />
                </button>
              )}

              {(currentUser?.role?.toUpperCase() === "ADMIN" || currentUser?.role?.toUpperCase() === "HEAD_ADMIN" || currentUser?.role?.toUpperCase() === "SUPERADMIN") && (
                <button
                  onClick={() => onSelectEmployee('archived-tasks')}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-4",
                    selectedEmployeeId === 'archived-tasks'
                      ? "bg-amber-600 text-white border-amber-600 shadow-amber-500/20 scale-[1.02]"
                      : "text-muted-foreground hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 border-border bg-background"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border",
                    selectedEmployeeId === 'archived-tasks'
                      ? "bg-white/20 border-white/30 text-white"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}>
                    <Archive className="h-4 w-4" />
                  </div>
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
                </button>
              )}

              {/* Pending Extension Requests Badge */}
              {pendingExtensionsCount > 0 && (
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 border border-amber-200 bg-amber-50/50 mb-1 animate-in fade-in duration-300">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 border border-amber-200 text-amber-600">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs font-semibold text-amber-800">
                    Pending Extensions
                  </span>
                  <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse shadow-sm">
                    {pendingExtensionsCount}
                  </span>
                </div>
              )}

              <div className="h-px bg-border/50 my-2" />

              {/* LISTS - ALWAYS VISIBLE */}
              <button
                onClick={() => onSelectEmployee('team-projects')}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-2",
                  selectedEmployeeId === 'team-projects'
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
                    : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-border bg-background"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border",
                  selectedEmployeeId === 'team-projects'
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                )}>
                  <Users className="h-4 w-4" />
                </div>
                <span className={cn(
                  "flex-1 text-sm font-semibold",
                  selectedEmployeeId === 'team-projects' ? "text-white" : "text-foreground"
                )}>
                  Team Projects
                </span>
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  selectedEmployeeId === 'team-projects' ? "text-white/70" : "text-muted-foreground"
                )} />
              </button>

              <button
                onClick={() => onSelectEmployee('activity-log')}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-2",
                  selectedEmployeeId === 'activity-log'
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
                    : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-border bg-background"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border",
                  selectedEmployeeId === 'activity-log'
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                )}>
                  <Activity className="h-4 w-4" />
                </div>
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
              </button>

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
                {isEmployeesExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                )}
              </button>

              {isEmployeesExpanded && (
                <div className="animate-in slide-in-from-top-1 duration-200 space-y-1">
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

                  {filteredEmployees.map((employee) => {
                    const stats = getEmployeeTaskStats(employee.id)
                    const empInitials = employee.name.split(" ").map(n => n[0]).join("").toUpperCase()
                    const isActive = selectedEmployeeId === employee.id

                    return (
                      <button
                        key={employee.id}
                        onClick={() => onSelectEmployee(employee.id)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all border group",
                          isActive
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20 scale-[1.01]"
                            : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-transparent"
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
                              isActive ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-600"
                            )}>
                              {empInitials}
                            </AvatarFallback>
                          )}
                        </Avatar>
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
                                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
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
                          isActive ? "text-white/70 translate-x-0.5" : "text-muted-foreground/30"
                        )} />
                      </button>
                    )
                  })}
                </div>
              )}
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
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{currentUser?.role?.toUpperCase() === "SUPERADMIN" ? "Super Admin" : currentUser?.role?.toUpperCase() === "HEAD_ADMIN" ? "Provincial Treasurer" : currentUser?.role?.toUpperCase() === "ADMIN" ? "Acting Assistant Provincial Treasurer" : "Casual Employee"}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Personal Details</h4>
                  {!isEditingProfile ? (
                    <button 
                      onClick={handleEditProfile}
                      className="text-[11px] font-bold text-primary hover:underline transition-all"
                    >
                      EDIT
                    </button>
                  ) : (
                    <div className="flex gap-3">
                       <button 
                        onClick={() => setIsEditingProfile(false)}
                        className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
                      >
                        CANCEL
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        SAVE
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <ProfileItem icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={profileData.email} isEditing={isEditingProfile} onChange={(v) => handleInputChange('email', v)} />
                  <ProfileItem icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={profileData.phone} isEditing={isEditingProfile} onChange={(v) => handleInputChange('phone', v)} placeholder="Add phone..." />
                  <ProfileItem icon={<MapPin className="h-3.5 w-3.5" />} label="Location" value={profileData.location} isEditing={isEditingProfile} onChange={(v) => handleInputChange('location', v)} placeholder="Add location..." />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-background/50">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all group"
          onClick={() => {
            localStorage.removeItem("token")
            window.location.href = "/"
          }}
        >
          <X className="h-4 w-4 group-hover:rotate-90 transition-transform" />
          <span className="font-semibold">Logout</span>
        </Button>
      </div>
      <ProfileDialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
    </aside>
  )
}

function ProfileItem({ icon, label, value, isEditing, onChange, placeholder }: { icon: React.ReactNode; label: string; value: string; isEditing: boolean; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="p-3 rounded-lg bg-secondary/20 border border-border/50 flex items-center gap-3 transition-colors hover:bg-secondary/40">
      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{label}</p>
        {isEditing ? (
          <input 
            className="text-xs font-medium bg-transparent border-none p-0 focus:ring-0 w-full text-foreground"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoFocus={label === 'Email'}
          />
        ) : (
          <p className="text-xs font-medium text-foreground truncate">{value || placeholder || "Not set"}</p>
        )}
      </div>
    </div>
  )
}
