"use client"

import { useTaskContext } from "@/lib/task-context"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Shield, LogOut, Menu } from "lucide-react"
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

export function AppHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const { currentUser, currentRole } = useTaskContext()

  if (!currentUser) return null


  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {/* Logo Placeholder - Replace with your logo */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary hover:bg-primary/90 transition-colors" title="Click to upload your logo">
            <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
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
              className="hidden md:flex h-8 rounded-lg text-xs"
            >
              <Shield className="h-3.5 w-3.5 mr-2" />
              Users
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
            <Button
                variant="ghost"
                className="h-8 px-3 rounded-full bg-secondary/40 hover:bg-destructive/10 hover:text-destructive transition-all gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest border border-border/50 hover:border-destructive/30 shadow-sm"
              >
                <LogOut className="h-3 w-3" />
                <span>Logout</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background/95 backdrop-blur-3xl border border-white/10 dark:border-white/5 sm:max-w-md rounded-[2rem] p-0 overflow-hidden shadow-2xl">
              <div className="p-8 pb-6 bg-gradient-to-br from-destructive/10 via-transparent to-transparent">
                <AlertDialogHeader className="space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive shadow-inner border border-destructive/20 mx-auto sm:mx-0">
                    <LogOut className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left">
                    <AlertDialogTitle className="text-xl font-black tracking-tight text-foreground">
                      End Session?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs font-medium text-muted-foreground">
                      Are you sure you want to sign out?
                    </AlertDialogDescription>
                  </div>
                </AlertDialogHeader>
              </div>
              <div className="p-6 pt-4 bg-muted/20 border-t border-border/50">
                <AlertDialogFooter className="gap-3 sm:gap-4 flex-col sm:flex-row">
                  <AlertDialogCancel className="h-12 rounded-xl border-border/50 bg-background hover:bg-secondary transition-colors flex-1 font-bold">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      localStorage.removeItem("token")
                      window.location.href = "/"
                    }}
                    className="h-12 rounded-xl bg-gradient-to-r from-destructive to-red-600 text-white hover:from-destructive/90 hover:to-red-600/90 shadow-lg shadow-destructive/20 flex-1 font-black transition-all"
                  >
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  )
}