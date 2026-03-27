"use client"

import { useTaskContext } from "@/lib/task-context"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, LogOut, Shield } from "lucide-react"

export function AppHeader() {
  const { currentUser, currentRole, logout } = useTaskContext()

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
          <span className="hidden sm:inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground uppercase">
            {currentRole === "superadmin" ? "Super Admin" : currentRole === "head_admin" ? "Head Admin" : currentRole === "admin" ? "2nd Admin" : "Employee"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentRole === "superadmin" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/super-admin"}
              className="hidden md:flex"
            >
              <Shield className="h-4 w-4 mr-2" />
              Users
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
