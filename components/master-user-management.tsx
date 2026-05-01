"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { UserPlus, Users, Mail, Shield, Building2, Search, Power, KeyRound, Globe } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface User {
  id: string
  name: string
  email: string
  role: string
  organizationName?: string
  avatar?: string
  isActive?: boolean
  createdAt: string
}

export function MasterUserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

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
        setUsers(data.users)
      } else {
        toast.error(data.error || "Failed to load users")
      }
    } catch (error) {
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
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
        toast.success("Creator account created! They can now log in and set up their organization.")
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
        {/* Create Creator Form */}
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

        {/* Creator & Org List */}
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
                <p className="text-xl">No creators or organizations registered yet.</p>
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
                          <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-primary/10">
                            View Org
                          </Button>
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
      <path d="m16.2 16.2 2.9 2.9" />
      <path d="M12 18v4" />
      <path d="m4.9 19.1 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.9 4.9 2.9 2.9" />
    </svg>
  )
}
