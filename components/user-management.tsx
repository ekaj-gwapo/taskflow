"use client"

import { useState, useEffect } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { UserPlus, Users, Mail, Shield, Smartphone, Trash2, Loader2, Search, Power, KeyRound, MapPin, Zap, Crown, Building2, CheckCircle2, X, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  location?: string
  jobTitle?: string
  jobDescription?: string
  avatar?: string
  isActive?: boolean
}

function UserRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="py-5 px-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </td>
      <td className="py-5 px-4">
        <Skeleton className="h-6 w-24 rounded-lg" />
      </td>
      <td className="py-5 px-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2 w-24" />
        </div>
      </td>
      <td className="py-5 px-8 text-right">
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </td>
    </tr>
  )
}

export function UserManagement() {
  const { refreshUsers, currentUser } = useTaskContext()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    phone: "",
    location: "",
    jobTitle: "",
    jobDescription: ""
  })

  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [statusUpdateUser, setStatusUpdateUser] = useState<{ id: string, name: string, currentStatus: boolean } | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState<string | false>(false)

  const handleDeleteUser = async (id: string) => {
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      })
      if (res.ok) {
        toast.success("User deleted successfully")
        setDeleteUserId(null)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete user")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPasswordId) return
    try {
      setIsResetting(true)
      const res = await fetch(`/api/users/${resetPasswordId}/reset-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ newPassword })
      })
      if (res.ok) {
        toast.success("Password reset successfully")
        setResetPasswordId(null)
        setNewPassword("")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to reset password")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setIsResetting(false)
    }
  }

  const toggleUserStatus = async () => {
    if (!statusUpdateUser) return
    const { id, currentStatus, name } = statusUpdateUser
    try {
      setIsUpdatingStatus(true)
      const newStatus = !currentStatus
      const res = await fetch(`/api/users/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ isActive: newStatus })
      })
      if (res.ok) {
        toast.success(`${name} has been ${newStatus ? 'activated' : 'deactivated'} successfully`)
        setStatusUpdateUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update status")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      const token = localStorage.getItem("token")
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.users) {
        setUsers(data.users)
      } else {
        toast.error(data.error || "Failed to load users")
      }
    } catch (error) {
      console.error("Fetch users error:", error)
      toast.error("Failed to load users")
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsCreating(true)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newUser,
          orgId: currentUser?.orgId,
          autoVerify: true // Admins bypass email verification for users they add
        })
      })
      const data = await res.json()

      if (res.ok) {
        toast.success("User created successfully")
        setNewUser({ name: "", email: "", password: "", role: "EMPLOYEE", phone: "", location: "", jobTitle: "", jobDescription: "" })
        await fetchUsers(true)
        await refreshUsers()
      } else if (res.status === 403 && data.error?.includes("User limit")) {
        // Show the premium upgrade modal instead of a plain toast
        setShowUpgradeModal(true)
      } else {
        toast.error(data.error || "Failed to create user")
      }
    } catch (error) {
      console.error("Create user error:", error)
      toast.error("An error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpgradePlan = async (plan: string) => {
    setIsUpgrading(plan)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ plan })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to start checkout")
      if (data.url) window.location.href = data.url
      else throw new Error("No checkout URL returned")
    } catch (err: any) {
      toast.error(err.message)
      setIsUpgrading(false)
    }
  }

  const planLimits = {
    'FREE': 5,
    'FREE_TRIAL': 5,
    'STARTER': 10,
    'PRO': 25,
    'ENTERPRISE': 999999
  }
  
  const currentPlan = currentUser?.plan || 'FREE'
  const currentLimit = planLimits[currentPlan as keyof typeof planLimits] || 5
  const activeUserCount = users.filter(u => u.isActive !== false).length
  const isLimitReached = activeUserCount >= currentLimit

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Organization Team</h1>
          </div>
          <p className="text-muted-foreground font-medium ml-1">Manage your organization&apos;s administrators and employees with precision.</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-hover:bg-primary/10 transition-colors" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
          <Input
            placeholder="Search team members..."
            className="relative h-12 pl-12 rounded-2xl bg-background/50 backdrop-blur-sm border-border focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Create User Form */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-[5.8rem]">
          <Card className="relative overflow-hidden border-none shadow-2xl rounded-[2rem] bg-gradient-to-br from-card to-secondary/10">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12">
              <UserPlus className="h-32 w-32" />
            </div>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                  <UserPlus className="h-5 w-5" />
                </div>
                Add Team Member
              </CardTitle>
              <CardDescription className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">
                Invite a new administrator or employee
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-2">
              <form onSubmit={handleCreateUser} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground ml-1 uppercase tracking-wider">Full Name</label>
                  <Input
                    required
                    placeholder="Enter full name"
                    className="h-12 rounded-xl bg-secondary/30 border-none focus:bg-background transition-all font-medium"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground ml-1 uppercase tracking-wider">Username / Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      required
                      placeholder="username@org.com"
                      className="h-12 pl-12 rounded-xl bg-secondary/30 border-none focus:bg-background transition-all font-medium"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground ml-1 uppercase tracking-wider">Initial Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      required
                      type="password"
                      placeholder="••••••••"
                      className="h-12 pl-12 rounded-xl bg-secondary/30 border-none focus:bg-background transition-all font-medium"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground ml-1 uppercase tracking-wider">Role</label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger className="h-12 pl-4 rounded-xl bg-secondary/30 border-none text-sm font-medium focus:bg-background transition-all outline-none cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-muted-foreground/50" />
                        <SelectValue placeholder="Select role" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-popover/95 backdrop-blur-xl">
                      <SelectItem value="EMPLOYEE" className="rounded-lg">Employee</SelectItem>
                      <SelectItem value="ADMIN" className="rounded-lg">Admin</SelectItem>
                      {currentUser?.role?.toLowerCase() === "creator" && (
                        <SelectItem value="HEAD_ADMIN" className="rounded-lg">Head Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground ml-1 uppercase tracking-wider">Job Title</label>
                    <Input
                      placeholder="e.g. Manager"
                      className="h-12 rounded-xl bg-secondary/30 border-none focus:bg-background transition-all font-medium"
                      value={newUser.jobTitle}
                      onChange={(e) => setNewUser({ ...newUser, jobTitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground ml-1 uppercase tracking-wider">Job Desc.</label>
                    <Input
                      placeholder="Role description"
                      className="h-12 rounded-xl bg-secondary/30 border-none focus:bg-background transition-all font-medium"
                      value={newUser.jobDescription}
                      onChange={(e) => setNewUser({ ...newUser, jobDescription: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground ml-1 uppercase tracking-wider">Phone</label>
                    <Input
                      placeholder="+1..."
                      className="h-12 rounded-xl bg-secondary/30 border-none focus:bg-background transition-all font-medium"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground ml-1 uppercase tracking-wider">Location</label>
                    <Input
                      placeholder="City, State"
                      className="h-12 rounded-xl bg-secondary/30 border-none focus:bg-background transition-all font-medium"
                      value={newUser.location}
                      onChange={(e) => setNewUser({ ...newUser, location: e.target.value })}
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className={`w-full h-14 rounded-2xl font-black text-base shadow-xl transition-all mt-4 ${
                    isLimitReached 
                    ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none" 
                    : "bg-primary text-primary-foreground shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                  disabled={isCreating || isLimitReached}
                >
                  {isCreating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : isLimitReached ? (
                    <>
                      <Zap className="mr-2 h-5 w-5 text-amber-500" />
                      Plan Limit Reached
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Create User Account
                    </>
                  )}
                </Button>
                {isLimitReached && (
                  <p className="text-[10px] text-center text-amber-600 font-bold uppercase tracking-widest animate-pulse mt-2">
                    Upgrade to unlock more user slots
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* User List */}
        <div className="lg:col-span-8 h-full">
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-background/50 backdrop-blur-xl overflow-hidden flex flex-col h-full max-h-[calc(100vh-14rem)] min-h-[750px]">
            <CardHeader className="p-8 border-b border-border/50 bg-muted/20 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    User Directory
                  </CardTitle>
                  <CardDescription className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">
                    {filteredUsers.length} total team members registered
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
              {isLoading ? (
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/30 sticky top-0 z-10">
                        <th className="text-left py-6 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">User Profile</th>
                        <th className="text-left py-6 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">System Role</th>
                        <th className="text-left py-6 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Connectivity</th>
                        <th className="text-right py-6 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {[1, 2, 3, 4, 5, 6, 7].map(i => <UserRowSkeleton key={i} />)}
                    </tbody>
                  </table>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-32 text-center text-muted-foreground">
                  <div className="h-24 w-24 rounded-[2rem] bg-secondary/50 flex items-center justify-center mx-auto mb-6">
                    <Users className="h-12 w-12 opacity-20" />
                  </div>
                  <p className="text-lg font-black text-foreground">No users found</p>
                  <p className="text-sm font-medium mt-1">Try adjusting your search terms</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                        <th className="text-left py-6 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">User Profile</th>
                        <th className="text-left py-6 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">System Role</th>
                        <th className="text-left py-6 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Connectivity</th>
                        <th className="text-right py-6 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredUsers.map((user, idx) => (
                        <motion.tr 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={user.id} 
                          className={`hover:bg-primary/[0.02] transition-colors group ${user.isActive === false ? "bg-muted/10" : ""}`}
                        >
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Avatar className={`h-12 w-12 rounded-2xl shadow-lg transition-all group-hover:scale-105 ${user.isActive === false ? "grayscale opacity-50" : "ring-2 ring-background"}`}>
                                  {user.avatar ? (
                                    <AvatarImage src={user.avatar} className="object-cover" />
                                  ) : (
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-foreground text-primary-foreground font-black text-sm">
                                      {user.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                {user.isActive !== false && (
                                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />
                                )}
                              </div>
                              <div>
                                <div className="text-base font-black text-foreground flex items-center gap-2 tracking-tight">
                                {user.name}
                                {user.isActive === false && (
                                  <Badge variant="outline" className="h-5 px-2 bg-destructive/10 text-destructive border-destructive/20 text-[9px] font-black uppercase tracking-tighter">Disabled</Badge>
                                )}
                              </div>
                              {user.jobTitle && (
                                <div className="text-[10px] font-black text-primary/80 uppercase tracking-widest mt-0.5">
                                  {user.jobTitle}
                                </div>
                              )}
                              <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 mt-1">
                                <Mail className="h-3 w-3 text-primary/50" />
                                {user.email}
                              </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-4">
                            <Badge className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                              user.role?.toLowerCase() === "creator" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                              user.role?.toLowerCase() === "head_admin" ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" :
                              user.role?.toLowerCase() === "admin" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                              "bg-slate-500/10 text-slate-600 border-slate-500/20"
                            }`}>
                              {user.role?.toLowerCase().replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-5 px-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                                <div className={`h-1.5 w-1.5 rounded-full ${user.phone ? 'bg-primary' : 'bg-muted'}`} />
                                {user.phone || <span className="text-muted-foreground/40 font-medium italic">No number</span>}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground tracking-wide">
                                <MapPin className="h-3 w-3 text-primary/40" />
                                {user.location || "Not set"}
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-8">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setResetPasswordId(user.id)}
                                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                title="Reset Password"
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setStatusUpdateUser({ id: user.id, name: user.name, currentStatus: user.isActive ?? true })}
                                className={`h-9 w-9 rounded-xl transition-all ${
                                  user.isActive === false 
                                    ? 'text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20' 
                                    : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10'
                                }`}
                                title={user.isActive === false ? "Activate User" : "Deactivate User"}
                                disabled={user.id === currentUser?.id}
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                              
                              {(currentUser?.role?.toLowerCase() === "creator" || currentUser?.role?.toLowerCase() === "superadmin" || currentUser?.role?.toLowerCase() === "master_admin") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteUserId(user.id)}
                                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                  title="Delete User"
                                  disabled={user.id === currentUser?.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!resetPasswordId} onOpenChange={(open) => !open && setResetPasswordId(null)}>
        <DialogContent className="rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-primary/10 to-transparent p-8 pb-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <KeyRound className="h-5 w-5" />
                </div>
                Reset Password
              </DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground mt-2">
                Enter a new secure password for this team member.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleResetPassword} className="p-8 pt-4 space-y-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground ml-1 uppercase tracking-wider">New Password</label>
              <Input
                required
                type="password"
                placeholder="••••••••"
                className="h-12 rounded-xl bg-secondary/30 border-none focus:bg-background transition-all font-medium"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <DialogFooter className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={() => setResetPasswordId(null)} className="h-12 rounded-xl font-bold flex-1">Cancel</Button>
              <Button type="submit" disabled={isResetting} className="h-12 rounded-xl font-black flex-1 shadow-lg shadow-primary/20">
                {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <DialogContent className="rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-destructive/10 to-transparent p-8 pb-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-destructive flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                  <Trash2 className="h-5 w-5" />
                </div>
                Delete Account
              </DialogTitle>
              <DialogDescription className="font-bold text-muted-foreground mt-2 uppercase tracking-tight">
                This action is permanent and irreversible
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 pt-4 space-y-4">
            <p className="text-sm font-medium text-foreground/80 leading-relaxed">
              Are you sure you want to delete this user? All their access will be revoked immediately. Their contributions will be preserved but they will be unassigned from all active tasks.
            </p>
            <DialogFooter className="flex items-center gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setDeleteUserId(null)} disabled={isDeleting} className="h-12 rounded-xl font-bold flex-1">Keep User</Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => deleteUserId && handleDeleteUser(deleteUserId)}
                disabled={isDeleting}
                className="h-12 rounded-xl font-black flex-1 shadow-lg shadow-destructive/20"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Delete"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!statusUpdateUser} onOpenChange={(open) => !open && setStatusUpdateUser(null)}>
        <DialogContent className="rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className={`p-8 pb-6 bg-gradient-to-br ${statusUpdateUser?.currentStatus ? 'from-amber-500/10' : 'from-emerald-500/10'} to-transparent`}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${statusUpdateUser?.currentStatus ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                  <Power className="h-5 w-5" />
                </div>
                {statusUpdateUser?.currentStatus ? 'Deactivate' : 'Reactivate'} Account
              </DialogTitle>
              <DialogDescription className="font-bold text-muted-foreground mt-2 uppercase tracking-wider">
                {statusUpdateUser?.name}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 pt-4 space-y-4">
            <p className="text-sm font-medium text-foreground/80 leading-relaxed">
              {statusUpdateUser?.currentStatus 
                ? `Deactivating this account will prevent the user from logging in or accessing any organization resources until you manually reactivate them.`
                : `This will immediately restore the user's access to the platform and all their assigned tasks.`}
            </p>
            <DialogFooter className="flex items-center gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setStatusUpdateUser(null)} disabled={isUpdatingStatus} className="h-12 rounded-xl font-bold flex-1">Cancel</Button>
              <Button 
                type="button" 
                variant={statusUpdateUser?.currentStatus ? "destructive" : "default"}
                onClick={toggleUserStatus}
                disabled={isUpdatingStatus}
                className={`h-12 rounded-xl font-black flex-1 shadow-lg transition-all ${
                  !statusUpdateUser?.currentStatus 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20" 
                    : "shadow-destructive/20"
                }`}
              >
                {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : (statusUpdateUser?.currentStatus ? "Confirm Deactivation" : "Confirm Activation")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      {/* ─── Upgrade Modal ─── */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-4xl rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <VisuallyHidden.Root>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
          </VisuallyHidden.Root>
          {/* Header */}
          <div className="relative bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-8 pb-6 border-b border-border/30">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">Upgrade Your Plan</h2>
                <p className="text-muted-foreground font-medium text-sm mt-0.5">You've reached the user limit. Upgrade to add more team members.</p>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Starter */}
              <div className="relative p-6 rounded-2xl border border-border bg-card flex flex-col hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-none">Starter</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Perfect for small teams</p>
                  </div>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-black text-foreground">₱1,499</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {["Up to 10 users", "Task management & assignments", "Basic analytics dashboard", "Email notifications", "Standard support"].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full h-11 font-bold rounded-xl group-hover:border-blue-500/50 group-hover:text-blue-600 transition-all"
                  onClick={() => handleUpgradePlan("STARTER")}
                  disabled={isUpgrading !== false}
                >
                  {isUpgrading === "STARTER" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4 mr-2" /> Choose Starter</>}
                </Button>
              </div>

              {/* Pro – highlighted */}
              <div className="relative p-6 rounded-2xl border-2 border-primary bg-primary/5 flex flex-col shadow-xl shadow-primary/10">
                <div className="absolute -top-3 right-5">
                  <span className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow">
                    Most Popular
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-none">Pro</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">For growing businesses</p>
                  </div>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-black text-foreground">₱2,999</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {["Up to 25 users", "Everything in Starter", "Advanced analytics & reports", "Task extension requests", "Progress notes & discussions", "Priority email support"].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full h-11 font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  onClick={() => handleUpgradePlan("PRO")}
                  disabled={isUpgrading !== false}
                >
                  {isUpgrading === "PRO" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Zap className="h-4 w-4 mr-2" /> Choose Pro</>}
                </Button>
              </div>

              {/* Enterprise */}
              <div className="relative p-6 rounded-2xl border border-border bg-card flex flex-col hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-none">Enterprise</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">For large organizations</p>
                  </div>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-black text-foreground">₱4,999+</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {["Unlimited users", "Everything in Pro", "Custom integrations & API access", "Dedicated account manager", "SLA-backed uptime guarantee", "24/7 dedicated support"].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full h-11 font-bold rounded-xl group-hover:border-violet-500/50 group-hover:text-violet-600 transition-all"
                  onClick={() => handleUpgradePlan("ENTERPRISE")}
                  disabled={isUpgrading !== false}
                >
                  {isUpgrading === "ENTERPRISE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4 mr-2" /> Choose Enterprise</>}
                </Button>
              </div>

            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">All plans include a secure Stripe checkout. Cancel anytime.</p>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
