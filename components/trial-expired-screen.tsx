"use client"

import { useState } from "react"
import { useTaskContext } from "@/lib/task-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, CreditCard, LogOut, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export function TrialExpiredScreen() {
  const { currentRole, logout, currentUser } = useTaskContext()
  const router = useRouter()
  const [loading, setLoading] = useState<string | false>(false)

  const handleUpgrade = async (plan: string) => {
    setLoading(plan)
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className={`w-full ${currentRole === 'creator' ? 'max-w-3xl' : 'max-w-md'} shadow-2xl border-destructive/20 overflow-hidden relative`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive to-destructive/50" />
        
        <CardHeader className="text-center pt-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-black">Subscription Required</CardTitle>
          <CardDescription className="text-base mt-2">
            The free trial for <strong className="text-foreground">{currentUser?.organizationName || "this organization"}</strong> has expired.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-8">
          {currentRole === "creator" ? (
            <div className="space-y-6">
              <div className="bg-secondary/20 p-4 rounded-xl border border-border text-sm text-center">
                <p>Choose a plan to instantly restore access for your team.</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {/* Starter Plan */}
                <div className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between hover:border-primary/50 transition-colors">
                  <div>
                    <h3 className="font-bold text-xl mb-1">Starter</h3>
                    <p className="font-black text-2xl text-primary mb-4">₱1,499<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
                    <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                      <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-primary"/> Up to 10 Users</li>
                      <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-primary"/> Basic Task Management</li>
                      <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-primary"/> Standard Support</li>
                    </ul>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => handleUpgrade("STARTER")} 
                    disabled={loading !== false}
                    className="w-full font-bold"
                  >
                    {loading === "STARTER" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    Select Starter
                  </Button>
                </div>

                {/* Pro Plan */}
                <div className="p-5 rounded-2xl border-2 border-primary bg-primary/5 flex flex-col justify-between relative shadow-lg shadow-primary/10">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                    POPULAR
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-1 text-foreground">Pro</h3>
                    <p className="font-black text-2xl text-primary mb-4">₱2,999<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
                    <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                      <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-primary"/> Up to 25 Users</li>
                      <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-primary"/> Advanced Analytics</li>
                      <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-primary"/> Priority Support</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => handleUpgrade("PRO")} 
                    disabled={loading !== false}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
                  >
                    {loading === "PRO" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    Select Pro
                  </Button>
                </div>

                {/* Enterprise Plan */}
                <div className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between hover:border-primary/50 transition-colors">
                  <div>
                    <h3 className="font-bold text-xl mb-1">Enterprise</h3>
                    <p className="font-black text-2xl text-primary mb-4">₱4,999+<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
                    <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                      <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-primary"/> Unlimited Users</li>
                      <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-primary"/> Custom Integrations</li>
                      <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-primary"/> 24/7 Dedicated Support</li>
                    </ul>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => handleUpgrade("ENTERPRISE")} 
                    disabled={loading !== false}
                    className="w-full font-bold"
                  >
                    {loading === "ENTERPRISE" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    Select Enterprise
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-destructive/5 p-5 rounded-xl border border-destructive/10 text-sm text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-destructive/80 mb-2" />
              <p className="text-foreground font-medium mb-1">Workspace Locked</p>
              <p className="text-muted-foreground">Please contact your organization's administrator to upgrade the subscription.</p>
            </div>
          )}

          <div className="pt-6 border-t border-border mt-6">
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
