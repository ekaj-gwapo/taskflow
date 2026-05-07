"use client"

import { useState } from "react"
import { useTaskContext } from "@/lib/task-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, CreditCard, LogOut, Loader2, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

export function TrialExpiredScreen() {
  const { currentRole, logout, currentUser } = useTaskContext()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.replace("/auth/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-2xl border-destructive/20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive to-destructive/50" />
        
        <CardHeader className="text-center pt-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-black">Subscription Expired</CardTitle>
          <CardDescription className="text-base mt-2">
            The 31-day trial for <strong className="text-foreground">{currentUser?.organizationName || "this organization"}</strong> has come to an end.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-8">
          {currentRole === "creator" ? (
            <div className="space-y-4">
              <div className="bg-secondary/20 p-4 rounded-xl border border-border text-sm text-muted-foreground text-center">
                Upgrade to the <strong className="text-primary">Pro Plan</strong> now to instantly restore access for you and your entire team.
              </div>
              
              <Button 
                onClick={handleUpgrade} 
                disabled={loading}
                className="w-full h-12 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-5 w-5" />
                )}
                Upgrade to Pro
              </Button>
            </div>
          ) : (
            <div className="bg-destructive/5 p-5 rounded-xl border border-destructive/10 text-sm text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-destructive/80 mb-2" />
              <p className="text-foreground font-medium mb-1">Workspace Locked</p>
              <p className="text-muted-foreground">Please contact your organization's administrator to upgrade the subscription.</p>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full text-muted-foreground hover:text-foreground h-11"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
