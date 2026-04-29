"use client"

import { useState, useEffect } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

export function EmailSettingsCard() {
  const { currentUser, login } = useTaskContext()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(currentUser?.email || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingVerify, setIsSendingVerify] = useState(false)

  // Notification Preferences State
  const [prefs, setPrefs] = useState({
    notifyOnAssign: currentUser?.notifyOnAssign ?? true,
    notifyOnDeadline: currentUser?.notifyOnDeadline ?? true,
    notifyOnDiscussion: currentUser?.notifyOnDiscussion ?? true,
    notifyOnExtension: currentUser?.notifyOnExtension ?? true,
  })

  // Handle email verification redirect
  useEffect(() => {
    if (searchParams.get("email_verified") === "1") {
      toast.success("Email verified successfully!")
      // In a real app we'd want to refresh the user session here
      if (currentUser) {
        login(currentUser.role, currentUser.id, { ...currentUser, emailVerified: true })
      }
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard')
    } else if (searchParams.get("email_error")) {
      const error = searchParams.get("email_error")
      toast.error(`Email verification failed: ${error}`)
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [searchParams, currentUser, login])

  // Sync preferences with current user on load
  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email || "")
      setPrefs({
        notifyOnAssign: currentUser.notifyOnAssign ?? true,
        notifyOnDeadline: currentUser.notifyOnDeadline ?? true,
        notifyOnDiscussion: currentUser.notifyOnDiscussion ?? true,
        notifyOnExtension: currentUser.notifyOnExtension ?? true,
      })
    }
  }, [currentUser])

  const handleConnectEmail = async () => {
    if (!email) {
      toast.error("Please enter an email address")
      return
    }

    setIsSendingVerify(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/users/connect-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect email")
      }

      toast.success(data.message || "Verification email sent!")
      
      // Update local state temporarily
      if (currentUser) {
        login(currentUser.role, currentUser.id, { 
          ...currentUser, 
          email,
          emailVerified: false 
        })
      }

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSendingVerify(false)
    }
  }

  const handlePrefChange = async (key: keyof typeof prefs, checked: boolean) => {
    const newPrefs = { ...prefs, [key]: checked }
    setPrefs(newPrefs) // Optimistic update

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/users/notification-prefs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [key]: checked })
      })

      if (!response.ok) {
        throw new Error("Failed to update preference")
      }

      // Update context
      if (currentUser) {
        login(currentUser.role, currentUser.id, {
          ...currentUser,
          ...newPrefs
        })
      }
    } catch (error) {
      toast.error("Failed to update preference")
      setPrefs(prefs) // Revert on failure
    }
  }

  if (!currentUser) return null

  const isVerified = currentUser.emailVerified

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 rounded-xl border p-5 bg-card">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Connection
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your email to receive task updates and deadline reminders.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="space-y-2 w-full">
            <Label htmlFor="connect-email">Email Address</Label>
            <div className="relative">
              <Input 
                id="connect-email"
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isVerified}
                className={isVerified ? "bg-muted/50 pr-10" : ""}
              />
              {isVerified && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" title="Email Verified">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
          
          {!isVerified && (
            <Button 
              onClick={handleConnectEmail} 
              disabled={isSendingVerify || !email || email === currentUser.email}
              className="w-full sm:w-auto"
            >
              {isSendingVerify ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
              ) : currentUser.email ? (
                "Resend Verification"
              ) : (
                "Connect Email"
              )}
            </Button>
          )}
        </div>

        {!isVerified && currentUser.email && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>Verification pending. Please check your inbox for a verification link.</p>
          </div>
        )}
      </div>

      {isVerified && (
        <div className="space-y-4 rounded-xl border p-5 bg-card">
          <div>
            <h3 className="font-semibold text-lg">Notification Preferences</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choose what events you want to be notified about via email.
            </p>
          </div>

          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="notify-assign" className="flex flex-col space-y-1 cursor-pointer">
                <span>Task Assignments</span>
                <span className="font-normal text-[12px] text-muted-foreground">When you are assigned a new task or a task is completed.</span>
              </Label>
              <Switch 
                id="notify-assign" 
                checked={prefs.notifyOnAssign} 
                onCheckedChange={(c) => handlePrefChange("notifyOnAssign", c)}
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="notify-deadline" className="flex flex-col space-y-1 cursor-pointer">
                <span>Deadline Reminders</span>
                <span className="font-normal text-[12px] text-muted-foreground">Daily reminder for tasks due the next day.</span>
              </Label>
              <Switch 
                id="notify-deadline" 
                checked={prefs.notifyOnDeadline} 
                onCheckedChange={(c) => handlePrefChange("notifyOnDeadline", c)}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="notify-discussion" className="flex flex-col space-y-1 cursor-pointer">
                <span>Task Discussions</span>
                <span className="font-normal text-[12px] text-muted-foreground">When someone comments on a task you are involved in.</span>
              </Label>
              <Switch 
                id="notify-discussion" 
                checked={prefs.notifyOnDiscussion} 
                onCheckedChange={(c) => handlePrefChange("notifyOnDiscussion", c)}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="notify-extension" className="flex flex-col space-y-1 cursor-pointer">
                <span>Extension Requests</span>
                <span className="font-normal text-[12px] text-muted-foreground">When an extension request is approved or rejected.</span>
              </Label>
              <Switch 
                id="notify-extension" 
                checked={prefs.notifyOnExtension} 
                onCheckedChange={(c) => handlePrefChange("notifyOnExtension", c)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
