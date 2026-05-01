"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Users, Mail, Shield, Building2, Search, Power, KeyRound, Globe, ArrowLeft, ClipboardList, Clock } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface User {
  id: string
  name: string
  email: string
  role: string
  orgId?: string
  organizationName?: string
  avatar?: string
  isActive?: boolean
  createdAt: string
}

interface OrgDetails {
  organization: {
    id: string
    name: string
    status: string
    createdat: string
    ownerName: string
    ownerEmail: string
  }
  users: any[]
  tasks: any[]
}

export function MasterUserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [details, setDetails] = useState<OrgDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "creator",
  })

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
      if (res.ok && data.users) {
        // ONLY SHOW CREATORS
        const creators = data.users.filter((u: any) => u.role.toLowerCase() === 'creator')
        setUsers(creators)
      } else {
        toast.error(data.error || "Failed to load creators")
      }
    } catch (error) {
      toast.error("Failed to load creators")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrgDetails = async (orgId: string) => {
    try {
      setLoadingDetails(true)
      setSelectedOrgId(orgId)
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/master/organizations/${orgId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setDetails(data)
      }
    } catch (err) {
      toast.error("Failed to load organization details")
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleCreateCreator = async (e: React.FormEvent) => {
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
        toast.success("Creator account created!")
        setNewUser({ name: "", email: "", password: "", role: "creator" })
        fetchUsers()
      } else {
        toast.error(data.error || "Failed to create creator")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.organizationName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (selectedOrgId && details) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => { setSelectedOrgId(null); setDetails(null); }}
          className="group font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Directory
        </Button>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-80 space-y-6">
            <Card className="border-border bg-card/40 backdrop-blur-md shadow-xl overflow-hidden">
              <div className="h-32 bg-primary/10 flex items-center justify-center">
                <Building2 className="h-16 w-16 text-primary" />
              </div>
              <CardContent className="p-6">
                <h2 className="text-2xl font-black text-foreground">{details.organization.name}</h2>
                <Badge className="mt-2">READ ONLY</Badge>
                
                <div className="mt-8 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Creator</p>
                    <p className="text-sm font-bold text-foreground mt-1">{details.organization.ownerName}</p>
                    <p className="text-xs text-muted-foreground">{details.organization.ownerEmail}</p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs font-medium text-amber-600 flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" />
                      Master Admin View Mode
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border-border bg-card/40 text-center">
                <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-black">{details.users.length}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Users</div>
              </Card>
              <Card className="p-4 border-border bg-card/40 text-center">
                <ClipboardList className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-black">{details.tasks.length}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Tasks</div>
              </Card>
            </div>
          </div>

          <div className="flex-1 space-y-8">
            <Card className="border-border bg-card/40 backdrop-blur-md shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team Directory (Read-Only)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {details.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {user.name?.[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-bold text-foreground">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-bold uppercase text-[10px]">
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/40 backdrop-blur-md shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Task Overview (Read-Only)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {details.tasks.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground italic">No tasks found.</div>
                  ) : (
                    details.tasks.map((task) => (
                      <div key={task.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-foreground">{task.title}</div>
                          <div className="text-[10px] text-muted-foreground mt-1 uppercase font-black">Assignee: {task.assigneeName || "System"}</div>
                        </div>
                        <Badge className="text-[9px] font-bold uppercase">{task.status}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Globe className="h-10 w-10 text-primary" />
            Platform Master Control
          </h1>
          <p className="text-muted-foreground text-lg mt-2">Oversee all organizations and creators across the platform.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search creators or organizations..."
            className="pl-12 h-12 bg-secondary/50 border-border text-lg shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <Card className="xl:col-span-1 border-border bg-card/40 backdrop-blur-md shadow-xl self-start sticky top-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-primary">
              <UserPlus className="h-6 w-6" />
              Register New Head Admin
            </CardTitle>
            <CardDescription>Add a new organization leader to the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCreator} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Full Name</label>
                <Input
                  required
                  placeholder="Creator Name"
                  className="h-11 bg-background"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Email Address</label>
                <Input
                  required
                  type="email"
                  placeholder="email@organization.com"
                  className="h-11 bg-background"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Initial Password</label>
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="h-11 bg-background"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" disabled={isCreating}>
                {isCreating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Create Creator Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3 border-border bg-card/40 backdrop-blur-md shadow-2xl overflow-hidden">
          <CardHeader className="bg-secondary/20 border-b border-border">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Organization & Creator Directory
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                <p className="text-lg font-medium">Synchronizing platform data...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-20 text-center text-muted-foreground">
                <Users className="h-20 w-20 mx-auto mb-6 opacity-10" />
                <p className="text-xl">No creators found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary/40 text-left">
                      <th className="py-4 px-6 text-sm font-bold text-muted-foreground uppercase">Creator</th>
                      <th className="py-4 px-6 text-sm font-bold text-muted-foreground uppercase">Organization</th>
                      <th className="py-4 px-6 text-sm font-bold text-muted-foreground uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-primary/5 transition-all group">
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm">
                              <AvatarFallback className="bg-primary/10 text-primary font-black text-base">
                                {user.name?.[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-base font-bold text-foreground">{user.name}</div>
                              <div className="text-sm text-muted-foreground font-medium">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          {user.organizationName ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-sm font-bold">
                                <Building2 className="h-3.5 w-3.5 mr-1.5" />
                                {user.organizationName}
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="px-3 py-1 text-sm font-medium opacity-60 italic">
                              No Organization Yet
                            </Badge>
                          )}
                        </td>
                        <td className="py-5 px-6 text-right">
                          {user.orgId && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="font-bold text-primary hover:bg-primary/10"
                              onClick={() => fetchOrgDetails(user.orgId!)}
                              disabled={loadingDetails}
                            >
                              {loadingDetails && selectedOrgId === user.orgId ? <Loader2 className="h-4 w-4 animate-spin" /> : "View Org"}
                            </Button>
                          )}
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
    </div>
  )
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4" />
      <path d="m16.2 7.8 2.9-2.9" />
      <path d="M18 12h4" />
      <path d="m16.2 16.2 2.9-2.9" />
      <path d="M12 18v4" />
      <path d="m4.9 19.1 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.9 4.9 2.9 2.9" />
    </svg>
  )
}
