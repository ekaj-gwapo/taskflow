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
}

export function EmployeeSidebar({
  selectedCategory,
  onSelectCategory,
}: EmployeeSidebarProps) {
  const { currentUser, tasks, login, logout, seenTaskIds } = useTaskContext()
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
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
  const [tempProfileData, setTempProfileData] = useState(profileData)
 
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
      setTempProfileData(newData)
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
        body: JSON.stringify({ ...tempProfileData, theme, mode }),
      })

      if (response.ok) {
        const data = await response.json()
        login(data.user.role.toLowerCase() as any, data.user.id, data.user)
        setProfileData(tempProfileData)
        setIsEditingProfile(false)
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setTempProfileData(prev => ({ ...prev, [field]: value }))
  }

  const initials = currentUser?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  const hasUnseenIndividualTasks = individualTasks.some(t => !seenTaskIds.has(t.id) && t.status !== 'completed')
  const hasUnseenTeamTasks = teamTasks.some(t => !seenTaskIds.has(t.id) && t.status !== 'completed')

  return (
    <aside className="w-80 shrink-0 border-r border-border bg-card flex flex-col h-full shadow-lg">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-border bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <ClipboardList className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground tracking-tight">TaskFlow</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none">Employee Portal</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-3 border-b border-border bg-background/50">
        <button
          onClick={() => {
            setActiveTab("tasks")
            if (selectedCategory === "profile") {
              onSelectCategory("individual")
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "tasks"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
        >
          <div className="relative">
            <ClipboardList className="h-4 w-4" />
            {hasUnseenIndividualTasks && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive border border-background animate-pulse" />
            )}
          </div>
          <span>Tasks</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("profile")
            onSelectCategory("profile")
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "profile"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          {activeTab === "tasks" && (
            <div className="p-3 space-y-2 animate-in slide-in-from-left-1 duration-200">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-2 mt-2">Task Categories</p>
              
              <button
                onClick={() => onSelectCategory("individual")}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-1",
                  selectedCategory === "individual"
                    ? "bg-primary text-primary-foreground border-primary shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border-border bg-background"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border",
                  selectedCategory === "individual"
                    ? "bg-white/20 border-white/30 text-primary-foreground"
                    : "bg-primary/10 text-primary border-primary/20"
                )}>
                  <User className="h-4 w-4" />
                </div>
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
                </button>

              <button
                onClick={() => onSelectCategory("team")}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm",
                  selectedCategory === "team"
                    ? "bg-primary text-primary-foreground border-primary shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border-border bg-background"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border",
                  selectedCategory === "team"
                    ? "bg-white/20 border-white/30 text-primary-foreground"
                    : "bg-primary/10 text-primary border-primary/20"
                )}>
                  <Users className="h-4 w-4" />
                </div>
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
                </button>

              <button
                onClick={() => onSelectCategory("activity-log")}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm",
                  selectedCategory === "activity-log"
                    ? "bg-primary text-primary-foreground border-primary shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border-border bg-background"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border",
                  selectedCategory === "activity-log"
                    ? "bg-white/20 border-white/30 text-primary-foreground"
                    : "bg-primary/10 text-primary border-primary/20"
                )}>
                  <Activity className="h-4 w-4" />
                </div>
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
                    Your history and updates
                  </span>
                </div>
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
                        className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                      >
                        SAVE
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <ProfileItem icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={isEditingProfile ? tempProfileData.email : profileData.email} isEditing={isEditingProfile} onChange={(v) => handleInputChange('email', v)} />
                  <ProfileItem icon={<ClipboardList className="h-3.5 w-3.5" />} label="Position" value={isEditingProfile ? tempProfileData.jobTitle : profileData.jobTitle} isEditing={isEditingProfile} onChange={(v) => handleInputChange('jobTitle', v)} placeholder="Add job title..." />
                  <ProfileItem icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={isEditingProfile ? tempProfileData.phone : profileData.phone} isEditing={isEditingProfile} onChange={(v) => handleInputChange('phone', v)} placeholder="Not set" />
                  <ProfileItem icon={<MapPin className="h-3.5 w-3.5" />} label="Location" value={isEditingProfile ? tempProfileData.location : profileData.location} isEditing={isEditingProfile} onChange={(v) => handleInputChange('location', v)} placeholder="Not set" />
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
                          if (!isEditingProfile) {
                            const token = localStorage.getItem("token")
                            fetch(`/api/users/${currentUser?.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ ...profileData, theme: t.id, mode })
                            }).then(res => res.json()).then(data => data.user && login(currentUser?.role!.toLowerCase() as any, currentUser?.id!, data.user))
                          }
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
                        if (!isEditingProfile) {
                          const token = localStorage.getItem("token")
                          fetch(`/api/users/${currentUser?.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ ...profileData, theme, mode: "light" })
                          }).then(res => res.json()).then(data => data.user && login(currentUser?.role!.toLowerCase() as any, currentUser?.id!, data.user))
                        }
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
                        if (!isEditingProfile) {
                          const token = localStorage.getItem("token")
                          fetch(`/api/users/${currentUser?.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ ...profileData, theme, mode: "dark" })
                          }).then(res => res.json()).then(data => data.user && login(currentUser?.role!.toLowerCase() as any, currentUser?.id!, data.user))
                        }
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

      <div className="mt-auto border-t border-border/40 bg-muted/20">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="w-full flex items-center gap-3 px-6 py-4 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all group"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="text-xs font-bold uppercase tracking-wider">Logout</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border sm:max-w-[400px]">
            <AlertDialogHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
                <LogOut className="h-6 w-6" />
              </div>
              <AlertDialogTitle className="text-xl font-bold">End Session?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to log out? Any unsaved changes might be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-2">
              <AlertDialogCancel className="rounded-xl border-border hover:bg-accent flex-1">
                Stay
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={logout}
                className="rounded-xl bg-destructive text-white hover:bg-destructive/90 flex-1"
              >
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
