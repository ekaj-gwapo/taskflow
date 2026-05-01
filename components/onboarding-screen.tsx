"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Building2, ArrowRight, Loader2, Rocket, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { useTaskContext } from "@/lib/task-context"
import { toast } from "sonner"

export function OnboardingScreen() {
  const router = useRouter()
  const { login, currentUser, isLoadingSession } = useTaskContext()
  const [loading, setLoading] = useState(false)
  const [orgName, setOrgName] = useState("")

  // Safety redirect
  useEffect(() => {
    if (!isLoadingSession && currentUser?.orgId) {
      router.replace("/dashboard")
    }
  }, [currentUser, isLoadingSession, router])

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim() || orgName.trim().length < 3) {
      toast.error("Please enter a valid organization name (min 3 characters)")
      return
    }

    setLoading(true)
    const token = localStorage.getItem("token")

    try {
      const response = await fetch("/api/organizations/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: orgName.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Organization created! Welcome to TaskFlow.")
        
        // Refresh the user context to include the new orgid/role
        if (currentUser) {
          login("creator", currentUser.id, { 
            ...currentUser, 
            role: "creator", 
            orgId: data.orgId 
          })
        }
        
        router.push("/dashboard")
      } else {
        toast.error(data.error || "Failed to create organization")
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-secondary/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <Rocket className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">Welcome to TaskFlow</h1>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto">
            You&apos;re almost there! Let&apos;s set up your organization to get started.
          </p>
        </div>

        <Card className="border-border bg-card shadow-2xl overflow-hidden relative">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Create Organization
            </CardTitle>
            <CardDescription className="text-base">
              This will be the home for your team and projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleCreateOrg} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  Organization Name
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Acme Corporation, Creative Hub"
                    className="h-12 bg-secondary/50 border-border text-lg pl-11 focus-visible:ring-primary"
                    disabled={loading}
                    autoFocus
                  />
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  You can change this later in settings.
                </p>
              </div>

              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">You are the Super Admin</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      As the creator, you&apos;ll have full control over organization roles, team members, and settings.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || orgName.trim().length < 3}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold text-base shadow-lg shadow-primary/20 transition-all group"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Launch My Organization
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Want to join an existing organization? 
            <button className="text-primary font-bold ml-1 hover:underline underline-offset-4">
              Enter Invite Code
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
