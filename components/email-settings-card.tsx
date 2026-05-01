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
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

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
    <div className="space-y-8">
      {/* Connection Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-3xl blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex flex-col space-y-6 rounded-3xl border border-white/20 dark:border-white/5 p-6 bg-background/40 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight">Email Connection</h3>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Notification Channel</p>
              </div>
            </div>
            {isVerified && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                Verified
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Connect your organizational email to receive automated task updates, 
            deadline reminders, and team activity notifications.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 w-full">
              <Label htmlFor="connect-email" className="text-[11px] font-black text-muted-foreground ml-1 uppercase tracking-widest">Target Email Address</Label>
              <div className="relative group/input">
                <Input 
                  id="connect-email"
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isVerified}
                  className={cn(
                    "h-12 pl-4 rounded-2xl bg-secondary/30 border-transparent focus:bg-background transition-all pr-12",
                    isVerified && "opacity-80"
                  )}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isVerified ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 drop-shadow-sm" />
                  ) : (
                    <Mail className="h-5 w-5 text-muted-foreground/30 group-focus-within/input:text-primary transition-colors" />
                  )}
                </div>
              </div>
            </div>
            
            {!isVerified && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConnectEmail} 
                disabled={isSendingVerify || !email || email === currentUser.email}
                className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {isSendingVerify ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : currentUser.email ? (
                  "Resend Link"
                ) : (
                  "Connect Now"
                )}
              </motion.button>
            )}
          </div>

          {!isVerified && currentUser.email && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-start gap-3 text-sm text-amber-600 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20"
            >
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-medium leading-relaxed">
                <span className="font-black uppercase tracking-wider block mb-1">Check your inbox</span>
                A verification link has been sent to your email. Please click it to activate notifications.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Preferences Section */}
      {isVerified && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 px-1">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Notification Filters</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { id: "notify-assign", key: "notifyOnAssign", label: "Task Assignments", desc: "Get notified for new tasks or completion updates." },
              { id: "notify-deadline", key: "notifyOnDeadline", label: "Deadline Alerts", desc: "Daily reminders for tasks due within 24 hours." },
              { id: "notify-discussion", key: "notifyOnDiscussion", label: "Team Activity", desc: "Notifications for comments and task discussions." },
              { id: "notify-extension", key: "notifyOnExtension", label: "Extension Status", desc: "Alerts when due date requests are reviewed." },
            ].map((pref) => (
              <div 
                key={pref.id}
                className="flex items-center justify-between p-5 rounded-3xl bg-secondary/20 border border-border/50 hover:bg-secondary/30 transition-all group/pref"
              >
                <div className="flex flex-col gap-1 pr-4">
                  <Label htmlFor={pref.id} className="text-sm font-black text-foreground cursor-pointer group-hover/pref:text-primary transition-colors">
                    {pref.label}
                  </Label>
                  <span className="text-[11px] font-medium text-muted-foreground leading-tight">
                    {pref.desc}
                  </span>
                </div>
                <Switch 
                  id={pref.id} 
                  checked={prefs[pref.key as keyof typeof prefs]} 
                  onCheckedChange={(c) => handlePrefChange(pref.key as keyof typeof prefs, c)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
