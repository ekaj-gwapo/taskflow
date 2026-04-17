"use client"

import { useState } from "react"
import Image from "next/image"
import { useTaskContext } from "@/lib/task-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClipboardList, User, Mail, Phone, MapPin, Save, X, LayoutDashboard, Search, ChevronRight, Shield, Clipboard, Users, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProfileDialog } from "@/components/profile-dialog"

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
  const { currentUser, tasks, login, seenTaskIds } = useTaskContext()
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
  })
  const [tempProfileData, setTempProfileData] = useState(profileData)

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
        body: JSON.stringify(tempProfileData),
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

      <ScrollArea className="flex-1">
        <div className="flex flex-col min-h-full">
          {activeTab === "tasks" && (
            <div className="p-3 space-y-2 animate-in slide-in-from-left-1 duration-200">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-2 mt-2">Task Categories</p>
              
              <button
                onClick={() => onSelectCategory("individual")}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm mb-1",
                  selectedCategory === "individual"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-border bg-background"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border",
                  selectedCategory === "individual"
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
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
                  {hasUnseenIndividualTasks && (
                    <span className="inline-block h-2 w-2 rounded-full bg-destructive border border-background animate-pulse ml-2" />
                  )}
                  <span className={cn(
                    "text-[10px] font-medium",
                    selectedCategory === "individual" ? "text-white/70" : "text-muted-foreground"
                  )}>
                    Tasks assigned specifically to you
                  </span>
                </div>
                <div className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  selectedCategory === "individual" ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-600"
                )}>
                  {individualTasks.length}
                </div>
              </button>

              <button
                onClick={() => onSelectCategory("team")}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm",
                  selectedCategory === "team"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-border bg-background"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border",
                  selectedCategory === "team"
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
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
                <div className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  selectedCategory === "team" ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-600"
                )}>
                  {teamTasks.length}
                </div>
              </button>

              <button
                onClick={() => onSelectCategory("activity-log")}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all border shadow-sm",
                  selectedCategory === "activity-log"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-border bg-background"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border",
                  selectedCategory === "activity-log"
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
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
                  <ProfileItem icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={isEditingProfile ? tempProfileData.email : profileData.email} isEditing={isEditingProfile} onChange={(v) => handleInputChange('email', v)} />
                  <ProfileItem icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={isEditingProfile ? tempProfileData.phone : profileData.phone} isEditing={isEditingProfile} onChange={(v) => handleInputChange('phone', v)} placeholder="Not set" />
                  <ProfileItem icon={<MapPin className="h-3.5 w-3.5" />} label="Location" value={isEditingProfile ? tempProfileData.location : profileData.location} isEditing={isEditingProfile} onChange={(v) => handleInputChange('location', v)} placeholder="Not set" />
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
