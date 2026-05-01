"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, Search, Trash2, ShieldAlert, Users, Calendar, ArrowUpRight, Ban, CheckCircle2, ArrowLeft, Mail, ClipboardList, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface Organization {
  id: string
  name: string
  slug: string
  createdat: string
  userCount: number
  ownerName: string
  ownerEmail: string
  status: "ACTIVE" | "SUSPENDED"
}

interface OrgDetails {
  organization: Organization
  users: any[]
  tasks: any[]
}

export function MasterOrgManagement() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [details, setDetails] = useState<OrgDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    fetchOrgs()
  }, [])

  const fetchOrgs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const res = await fetch("/api/master/organizations", {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      })
      const data = await res.json()
      if (res.ok) {
        setOrgs(data.organizations || [])
      }
    } catch (err) {
      toast.error("Failed to load organizations")
    } finally {
      setLoading(false)
    }
  }

  const fetchDetails = async (orgId: string) => {
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

  const handleToggleStatus = async (orgId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/master/organizations/${orgId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        toast.success(`Organization ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}!`)
        // Optimistic update
        setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, status: newStatus as any } : o))
        
        await fetchOrgs() // Re-fetch to sync fully with DB
        if (details?.organization.id === orgId) {
          setDetails({ ...details, organization: { ...details.organization, status: newStatus as any } })
        }
      } else {
        toast.error("Failed to update status")
      }
    } catch (err) {
      toast.error("An error occurred")
    }
  }

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.ownerEmail && o.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()))
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
          Back to Organizations
        </Button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Info */}
          <div className="lg:w-80 space-y-6">
            <Card className="border-border bg-card/40 backdrop-blur-md shadow-xl overflow-hidden">
              <div className="h-32 bg-primary/10 flex items-center justify-center">
                <Building2 className="h-16 w-16 text-primary" />
              </div>
              <CardContent className="p-6">
                <h2 className="text-2xl font-black text-foreground">{details.organization.name}</h2>
                <Badge className="mt-2">{details.organization.status}</Badge>
                
                <div className="mt-8 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Creator / Owner</p>
                    <p className="text-sm font-bold text-foreground mt-1">{details.organization.ownerName || "No Owner"}</p>
                    <p className="text-xs text-muted-foreground">{details.organization.ownerEmail}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Established</p>
                    <p className="text-sm font-bold text-foreground mt-1">{new Date(details.organization.createdat).toLocaleDateString()}</p>
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

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            <Card className="border-border bg-card/40 backdrop-blur-md shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Organization Users
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
                  Task Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {details.tasks.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground italic">No tasks created yet.</div>
                  ) : (
                    details.tasks.map((task) => (
                      <div key={task.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-bold text-foreground">{task.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="text-[9px] h-4">{task.status}</Badge>
                            <span className="text-[10px] text-muted-foreground">Assigned to: {task.assigneeName || "Unassigned"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Organization Control</h1>
          <p className="text-muted-foreground text-lg mt-2">Manage, monitor, and moderate all platform organizations.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or owner email..."
            className="pl-12 h-12 bg-secondary/50 border-border text-lg shadow-sm focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
            <div className="h-12 w-12 border-4 border-primary border-r-transparent animate-spin rounded-full mb-4" />
            <p className="text-lg font-bold">Scanning organizations...</p>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground bg-secondary/20 rounded-3xl border-2 border-dashed border-border">
            <Building2 className="h-20 w-20 mx-auto mb-6 opacity-10" />
            <p className="text-xl font-bold">No organizations found.</p>
          </div>
        ) : (
          filteredOrgs.map((org, idx) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-border bg-card/40 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all group overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  {/* Left Section: Org Info */}
                  <div className="flex-1 p-6 flex flex-col md:flex-row items-start md:items-center gap-6 border-b lg:border-b-0 lg:border-r border-border">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black text-foreground">{org.name}</h3>
                        <Badge variant={org.status === "ACTIVE" ? "default" : "destructive"} className="font-bold">
                          {org.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <span className="text-foreground font-bold">{org.ownerName || "No Owner Registered"}</span>
                        {org.ownerEmail && <span>•</span>}
                        <span>{org.ownerEmail}</span>
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                          <Users className="h-4 w-4 text-primary" />
                          {org.userCount} Users
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          Created {new Date(org.createdat).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Actions */}
                  <div className="bg-secondary/20 p-6 flex items-center gap-3 justify-end lg:w-80">
                    <Button 
                      variant="outline" 
                      onClick={() => handleToggleStatus(org.id, org.status)}
                      className={`font-bold gap-2 ${org.status === 'ACTIVE' ? 'hover:bg-red-500/10 hover:text-red-600 border-red-500/20' : 'hover:bg-emerald-500/10 hover:text-emerald-600 border-emerald-500/20'}`}
                    >
                      {org.status === 'ACTIVE' ? (
                        <>
                          <Ban className="h-4 w-4" />
                          Suspend
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button variant="destructive" size="icon" className="h-10 w-10 shadow-lg shadow-red-500/20">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="h-10 w-10"
                      onClick={() => fetchDetails(org.id)}
                      disabled={loadingDetails}
                    >
                      {loadingDetails && selectedOrgId === org.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUpRight className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
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
