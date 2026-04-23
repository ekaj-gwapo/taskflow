"use client"

import { useTaskContext } from "@/lib/task-context"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Shield, LogOut } from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"
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

export function AppHeader() {
  const { currentUser, currentRole } = useTaskContext()

  if (!currentUser) return null


  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Logo Placeholder - Replace with your logo */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary hover:bg-primary/90 transition-colors" title="Click to upload your logo">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          {/* To add your logo: Replace the above div with: <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-lg object-contain" /> */}

          <span className="font-semibold text-foreground tracking-tight">TaskFlow</span>

        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          {currentRole === "superadmin" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/super-admin"}
              className="hidden md:flex h-9 rounded-lg"
            >
              <Shield className="h-4 w-4 mr-2" />
              Users
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border sm:max-w-[400px]">
              <AlertDialogHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
                  <LogOut className="h-6 w-6" />
                </div>
                <AlertDialogTitle className="text-xl font-bold">End Session?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to log out? Any unsaved changes might be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4 gap-2">
                <AlertDialogCancel className="rounded-xl border-border hover:bg-accent flex-1">
                  Stay
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    localStorage.removeItem("token")
                    window.location.href = "/"
                  }}
                  className="rounded-xl bg-destructive text-white hover:bg-destructive/90 flex-1"
                >
                  Sign Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  )
}