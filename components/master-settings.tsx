"use client"

import { useState } from "react"
import { ShieldAlert, Trash2, AlertTriangle, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

export function MasterSettings() {
  const [confirmText, setConfirmText] = useState("")
  const [isResetting, setIsResetting] = useState(false)

  const handleReset = async () => {
    if (confirmText !== "RESET_ALL_DATA") {
      toast.error("Invalid confirmation text")
      return
    }

    setIsResetting(true)
    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ confirmText })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("System reset successful")
        setConfirmText("")
        // Optional: reload the page or redirect
        setTimeout(() => window.location.reload(), 2000)
      } else {
        toast.error(data.error || "Failed to reset system")
      }
    } catch (error) {
      console.error("Reset error:", error)
      toast.error("A network error occurred")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-foreground">System Settings</h1>
        <p className="text-muted-foreground">Manage platform-wide configurations and maintenance.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Maintenance Mode or other settings could go here */}

        <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
          <CardHeader className="bg-destructive/10 border-b border-destructive/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive text-destructive-foreground">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription className="text-destructive/70">
                  Highly destructive actions that cannot be undone.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 rounded-xl border border-destructive/20 bg-background/50">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Full System Reset
                </h4>
                <p className="text-sm text-muted-foreground max-w-md">
                  This will delete all organizations, users, tasks, logs, and notifications. 
                  Your Master Admin account will be preserved. <strong>This action is irreversible.</strong>
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="font-bold shadow-lg shadow-destructive/20">
                    Reset All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md border-destructive/50">
                  <AlertDialogHeader>
                    <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <AlertDialogTitle className="text-center text-xl font-black">Final Confirmation</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="text-center space-y-4 pt-2 text-sm text-muted-foreground">
                        <p>
                          Are you absolutely sure you want to perform a <strong>Full System Reset</strong>?
                        </p>
                        <div className="p-3 rounded-lg bg-secondary/50 text-left space-y-2">
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">What will be deleted:</p>
                          <ul className="text-xs space-y-1 list-disc list-inside text-foreground/80">
                            <li>All Organizations & Branding</li>
                            <li>All Users (Admins, Employees, etc.)</li>
                            <li>All Tasks & Project Data</li>
                            <li>All Activity Logs & History</li>
                          </ul>
                        </div>
                        <p className="text-sm">
                          To confirm, please type <code className="bg-muted px-1.5 py-0.5 rounded font-mono font-bold text-destructive">RESET_ALL_DATA</code> below:
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Input 
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Type the confirmation text"
                      className="text-center font-mono border-destructive/30 focus-visible:ring-destructive"
                    />
                  </div>
                  <AlertDialogFooter className="sm:flex-col gap-2">
                    <Button 
                      variant="destructive" 
                      className="w-full font-bold h-11"
                      disabled={confirmText !== "RESET_ALL_DATA" || isResetting}
                      onClick={handleReset}
                    >
                      {isResetting ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Resetting System...
                        </>
                      ) : (
                        "Permanently Delete All Data"
                      )}
                    </Button>
                    <AlertDialogCancel className="w-full font-bold h-11 border-none bg-secondary hover:bg-secondary/80">
                      Cancel and Go Back
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Database Connectivity</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-3">
              <span className="text-muted-foreground">File Storage (Attachments)</span>
              <span className="font-bold text-emerald-600">Operational</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-3">
              <span className="text-muted-foreground">Notification Service</span>
              <span className="font-bold text-amber-500">Standby</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
