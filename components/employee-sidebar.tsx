"use client"

import { useState } from "react"
import Image from "next/image"
import { useTaskContext } from "@/lib/task-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileDialog } from "@/components/profile-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClipboardList, User, Mail, Phone, MapPin, Save, X } from "lucide-react"
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

interface EmployeeSidebarProps {
  selectedCategory: "individual" | "team" | "profile"
  onSelectCategory: (category: "individual" | "team" | "profile") => void
}

export function EmployeeSidebar({
  selectedCategory,
  onSelectCategory,
}: EmployeeSidebarProps) {
  const { currentUser, tasks, login } = useTaskContext()
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
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
        // Update context
        login(data.user.role.toLowerCase() as any, data.user.id, data.user)
        setProfileData(tempProfileData)
        setIsEditingProfile(false)
      } else {
        console.error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setTempProfileData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const initials = currentUser?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <aside className="w-80 shrink-0 border-r border-border bg-card flex flex-col h-full">
      {/* Sidebar Header */}
      {/* Sidebar Header - Logos Row */}
      <div className="p-4 border-b border-border bg-emerald-50/30">
        <div className="flex justify-between items-center px-1 mb-4">
          <FlippingLogo front="/logos/logo4.png" back="/logos/logo-back1.jpg" alt="Logo 4" />
          <FlippingLogo front="/logos/logo3.jpg" back="/logos/logo-back2.jpg" alt="Logo 3" />
          <FlippingLogo front="/logos/logo1.jpg" back="/logos/logo-back3.jpg" alt="Logo 1" />
          <FlippingLogo front="/logos/logo2.png" back="/logos/logo-back4.jpg" alt="Logo 2" />
        </div>
        {currentUser && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
            <Avatar className="h-10 w-10 shrink-0">
              {currentUser?.avatar ? (
                <AvatarImage src={currentUser.avatar} />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-6">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">Tasks</p>
          <div className="space-y-1">
            <button
              onClick={() => onSelectCategory("individual")}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                selectedCategory === "individual"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4" />
                <span>Individual Tasks</span>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                selectedCategory === "individual" ? "bg-white/20" : "bg-secondary text-muted-foreground"
              )}>
                {individualTasks.length}
              </span>
            </button>

            <button
              onClick={() => onSelectCategory("team")}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all border border-transparent",
                selectedCategory === "team"
                  ? "bg-[hsl(var(--chart-2))] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-[hsl(var(--chart-2))]/20"
              )}
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList className="h-4 w-4" />
                <span>Team Tasks</span>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                selectedCategory === "team" ? "bg-white/20" : "bg-secondary text-muted-foreground"
              )}>
                {teamTasks.length}
              </span>
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">Settings</p>
          <button
            onClick={() => onSelectCategory("profile")}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              selectedCategory === "profile"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <User className="h-4 w-4" />
            <span>Profile Settings</span>
          </button>
        </div>
      </div>

      {/* Profile Detail View (If selected in sidebar) */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {selectedCategory === "profile" && (
            <div className="space-y-4">
              {!isEditingProfile ? (
                /* ... (rest of profile code is same, just conditionally rendered) ... */
                <div className="space-y-4">
                  <div className="text-center mb-6 relative group inline-block mx-auto w-full">
                    <Avatar 
                      className="h-16 w-16 mx-auto mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setIsProfileDialogOpen(true)}
                    >
                      {currentUser?.avatar ? (
                        <AvatarImage src={currentUser.avatar} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl font-medium">
                          {initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <p className="text-[10px] text-muted-foreground -mt-2 mb-2 cursor-pointer hover:underline" onClick={() => setIsProfileDialogOpen(true)}>Click to change photo</p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-border bg-secondary/30">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground font-medium">Name</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">{profileData.name}</p>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-secondary/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground font-medium">Email</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">{profileData.email}</p>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-secondary/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground font-medium">Phone</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">{profileData.phone || "Not set"}</p>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-secondary/30">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground font-medium">Location</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">{profileData.location || "Not set"}</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleEditProfile}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium block mb-1">
                        Name
                      </label>
                      <Input
                        value={tempProfileData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="text-sm"
                        placeholder="Enter name"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground font-medium block mb-1">
                        Email
                      </label>
                      <Input
                        value={tempProfileData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="text-sm"
                        placeholder="Enter email"
                      />
                    </div>

                    <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase">Phone Number</label>
                    <input
                      type="text"
                      value={tempProfileData.phone}
                      disabled
                      className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-[9px] text-muted-foreground italic">Contact Admin to update</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase">Location</label>
                    <input
                      type="text"
                      value={tempProfileData.location}
                      disabled
                      className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-[9px] text-muted-foreground italic">Contact Admin to update</p>
                  </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      <ProfileDialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
    </aside>
  )
}
