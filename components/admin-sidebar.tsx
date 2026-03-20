"use client"

import { useState } from "react"
import Image from "next/image"
import { useTaskContext } from "@/lib/task-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, ChevronRight, ClipboardList, ArrowLeft, User, Mail, Phone, MapPin, Save, X, Shield, Search } from "lucide-react"
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
  const { allEmployees, tasks, currentUser, login } = useTaskContext()
  const [activeTab, setActiveTab] = useState<"employees" | "profile">("employees")
  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    location: currentUser?.location || "",
  })
  const [tempProfileData, setTempProfileData] = useState(profileData)

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
    .toUpperCase() || "A"

  const [searchQuery, setSearchQuery] = useState("")
  const filteredEmployees = allEmployees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getEmployeeTaskStats = (employeeId: string) => {
    const employeeTasks = tasks.filter((t) => t.assigneeId === employeeId)
    const total = employeeTasks.length
    const inProgress = employeeTasks.filter(
      (t) => t.status === "in-progress"
    ).length
    const completed = employeeTasks.filter(
      (t) => t.status === "completed"
    ).length
    const overdue = employeeTasks.filter(
      (t) => t.status !== "completed" && new Date(t.dueDate) < new Date()
    ).length
    return { total, inProgress, completed, overdue }
  }

  return (
    <aside className="w-80 shrink-0 border-r border-border bg-card flex flex-col h-full">
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
      <div className="flex gap-1 p-3 border-b border-border">
        <button
          onClick={() => setActiveTab("employees")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "employees"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Employees</span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "profile"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </button>
      </div>

      {currentUser?.role?.toLowerCase() === "superadmin" && (
        <div className="px-3 py-2 border-b border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => window.location.href = "/"}
          >
            <Shield className="h-4 w-4" />
            User Management
          </Button>
        </div>
      )}

      {/* Content - Scrollable */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Employees Tab */}
          {activeTab === "employees" && (
            <div className="flex flex-col gap-0.5">
              {/* Show Employee List */}
              {!viewingEmployeeId ? (
            <>
              <div className="px-3 pb-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    className="pl-8 bg-secondary/50 border-transparent focus-visible:bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Employee List */}
              {filteredEmployees.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No employees found
                </div>
              ) : (
                filteredEmployees.map((employee) => {
                const stats = getEmployeeTaskStats(employee.id)
                const initials = employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()

                return (
                  <button
                    key={employee.id}
                    onClick={() => {
                      setViewingEmployeeId(employee.id)
                      onSelectEmployee(employee.id)
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      {employee.avatar ? (
                        <AvatarImage src={employee.avatar} />
                      ) : (
                        <AvatarFallback
                          className="text-xs font-medium bg-secondary text-foreground"
                        >
                          {initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {employee.name}
                      </p>
                      {(stats.total - stats.completed >= 5 || stats.inProgress > 0 || stats.overdue > 0) && (
                        <div className="flex items-center gap-2 mt-1">
                          {(stats.total - stats.completed) >= 5 && (
                            <span className="flex items-center gap-1 text-[10px] text-destructive font-bold bg-destructive/10 px-1.5 py-0.5 rounded-full">
                              OVERLOADED
                            </span>
                          )}
                          {stats.inProgress > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-[hsl(var(--warning))] font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--warning))]" />
                              {stats.inProgress}
                            </span>
                          )}
                          {stats.overdue > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-destructive font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                              {stats.overdue}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                )
              }))}
            </>
          ) : (
            <>
              {/* Back button */}
              <button
                onClick={() => {
                  setViewingEmployeeId(null)
                  onSelectEmployee(null)
                }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors text-muted-foreground hover:bg-accent hover:text-foreground mb-3"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back to Employees</span>
              </button>

              {/* Divider */}
              <div className="h-px bg-border mx-2 my-2" />

              {/* Selected Employee Header */}
              {viewingEmployeeId && allEmployees.find(e => e.id === viewingEmployeeId) && (
                <div className="p-3 rounded-lg bg-secondary/30 mb-3">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const emp = allEmployees.find(e => e.id === viewingEmployeeId)
                      const initials = emp?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                      return (
                        <>
                          <Avatar className="h-8 w-8">
                            {emp?.avatar ? (
                              <AvatarImage src={emp.avatar} />
                            ) : (
                              <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                                {initials}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">{emp?.name}</p>
                            <p className="text-xs text-muted-foreground">{emp?.email}</p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Employee Tasks */}
              {viewingEmployeeId && (() => {
                const employeeTasks = tasks.filter(t => t.assigneeId === viewingEmployeeId)
                if (employeeTasks.length === 0) {
                  return (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p>No tasks assigned</p>
                    </div>
                  )
                }
                return (
                  <div className="space-y-2">
                    {employeeTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => onSelectEmployee(viewingEmployeeId)}
                        className="w-full flex flex-col items-start gap-1 p-2.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                      >
                        <p className="text-sm font-medium text-foreground truncate w-full">{task.title}</p>
                        <div className="flex items-center gap-2 w-full">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            task.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : task.status === "in-progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}>
                            {task.status === "completed" ? "Completed" : task.status === "in-progress" ? "In Progress" : "To Do"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })()}
            </>
          )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              {!isEditingProfile ? (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <Avatar className="h-16 w-16 mx-auto mb-3">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
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

                    <div>
                      <label className="text-xs text-muted-foreground font-medium block mb-1">
                        Phone
                      </label>
                      <Input
                        value={tempProfileData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="text-sm"
                        placeholder="Enter phone"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground font-medium block mb-1">
                        Location
                      </label>
                      <Input
                        value={tempProfileData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="text-sm"
                        placeholder="Enter location"
                      />
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
    </aside>
  )
}
