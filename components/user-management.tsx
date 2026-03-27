"use client"

import { useState, useEffect } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { UserPlus, Users, Mail, Shield, Smartphone, Trash2, Loader2, Search, Power, KeyRound, MapPin } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  location?: string
  avatar?: string
  isActive?: number
}

export function UserManagement() {
  const { refreshUsers } = useTaskContext()
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
    location: ""
  })

  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [isResetting, setIsResetting] = useState(false)

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

  const toggleUserStatus = async (id: string, currentStatus: number = 1) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1
      const res = await fetch(`/api/users/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ isActive: newStatus })
      })
      if (res.ok) {
        toast.success(`User ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update status")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Fetch users error:", error)
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsCreating(true)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success("User created successfully")
        setNewUser({ name: "", email: "", password: "", role: "EMPLOYEE", phone: "", location: "" })
        await fetchUsers()
        await refreshUsers()
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

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Super Admin Control
          </h1>
          <p className="text-muted-foreground mt-1">Manage system users and access levels.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            className="pl-10 bg-secondary/50 border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form */}
        <Card className="lg:col-span-1 border-border bg-card/50 backdrop-blur-sm self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Create New User
            </CardTitle>
            <CardDescription>Add a new employee or administrator.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input 
                  required
                  placeholder="John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input 
                  required
                  type="email"
                  placeholder="john@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Password</label>
                <Input 
                  required
                  type="password"
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select 
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="EMPLOYEE">Regular Employee</option>
                  <option value="ADMIN">2nd Admin</option>
                  <option value="HEAD_ADMIN">Head Admin</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone (Optional)</label>
                <Input 
                  placeholder="+1 (555) 000-0000"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location (Optional)</label>
                <Input 
                  placeholder="New York, NY"
                  value={newUser.location}
                  onChange={(e) => setNewUser({...newUser, location: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isCreating}>
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create User Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User List */}
        <Card className="lg:col-span-2 border-border bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Directory
            </CardTitle>
            <CardDescription>A list of all users registered in the system.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Loading user database...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No users found matching your search.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact & Location</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className={`hover:bg-accent/30 transition-colors group ${user.isActive === 0 ? "opacity-60 bg-muted/30" : ""}`}>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className={`h-9 w-9 border border-border ${user.isActive === 0 ? "grayscale" : ""}`}>
                              {user.avatar ? (
                                <AvatarImage src={user.avatar} />
                              ) : (
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                  {user.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="text-sm font-semibold flex items-center gap-2">
                                {user.name}
                                {user.isActive === 0 && (
                                  <Badge variant="destructive" className="h-5 px-1.5 py-0">Deactivated</Badge>
                                )}
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={user.role === "SUPERADMIN" ? "destructive" : user.role === "HEAD_ADMIN" ? "default" : user.role === "ADMIN" ? "secondary" : "outline"}>
                            {user.role === "SUPERADMIN" ? "Super Admin" : user.role === "HEAD_ADMIN" ? "Head Admin" : user.role === "ADMIN" ? "2nd Admin" : "Regular Employee"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-xs text-muted-foreground">
                          <div className="space-y-1">
                            {user.phone ? (
                              <div className="flex items-center gap-1">
                                <Smartphone className="h-3 w-3" />
                                {user.phone}
                              </div>
                            ) : (
                              <span className="opacity-50">No phone</span>
                            )}
                            {user.location && (
                              <div className="flex items-center gap-1 text-primary/80">
                                <MapPin className="h-3 w-3" />
                                {user.location}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setResetPasswordId(user.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              title="Reset Password"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => toggleUserStatus(user.id, user.isActive ?? 1)}
                              className={`h-8 w-8 ${user.isActive === 0 ? 'text-green-600 bg-green-100 hover:bg-green-200' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'}`}
                              title={user.isActive === 0 ? "Activate User" : "Deactivate User"}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!resetPasswordId} onOpenChange={(open) => !open && setResetPasswordId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for this user. They will use this to sign in.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                required
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetPasswordId(null)}>Cancel</Button>
              <Button type="submit" disabled={isResetting}>
                {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
