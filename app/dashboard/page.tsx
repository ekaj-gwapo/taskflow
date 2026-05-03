"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { TaskProvider, useTaskContext } from "@/lib/task-context"
import { toast } from "sonner"
import { AppHeader } from "@/components/app-header"
import { AdminDashboard } from "@/components/admin-dashboard"
import { EmployeeDashboard } from "@/components/employee-dashboard"
import { UserManagement } from "@/components/user-management"
import { AdminSidebar } from "@/components/admin-sidebar"
import { MasterUserManagement } from "@/components/master-user-management"
import { MasterSidebar } from "@/components/master-sidebar"
import { MasterOverview } from "@/components/master-overview"
import { MasterOrgManagement } from "@/components/master-org-management"
import { MasterSettings } from "@/components/master-settings"
import { Rocket, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

function AppContent() {
  const { currentUser, currentRole, isLoadingSession, login } = useTaskContext()
  const [activeMasterView, setActiveMasterView] = useState("overview")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isLoadingSession) {

      if (!currentUser || !currentRole) {
        router.replace(`/auth/login${window.location.search}`)
      } else if (currentRole !== "master_admin" && currentRole !== "creator" && !currentUser.orgId) {

        router.replace("/auth/onboarding")
      }
    }
  }, [currentUser, currentRole, isLoadingSession, router])

  useEffect(() => {
    const verified = searchParams.get("email_verified")
    const error = searchParams.get("email_error")
    const openProfile = searchParams.get("open_profile")
    
    if (verified === "1") {
      if (currentUser && !currentUser.emailVerified) {
        toast.success("Email connected successfully!")
        login(currentUser.role, currentUser.id, { ...currentUser, emailVerified: true })
        setIsProfileOpen(true)
      }
      // Remove query param without triggering full reload
      const url = new URL(window.location.href)
      url.searchParams.delete("email_verified")
      url.searchParams.delete("open_profile")
      window.history.replaceState({}, "", url.toString())
    } else if (openProfile === "1") {
      setIsProfileOpen(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("open_profile")
      window.history.replaceState({}, "", url.toString())
    } else if (error) {
      const errorMessages: Record<string, string> = {
        missing_token: "Verification link is missing a token.",
        invalid_token: "Invalid verification token.",
        expired_token: "Verification link has expired.",
        server_error: "An error occurred during verification."
      }
      toast.error(errorMessages[error] || "Failed to verify email.")
      const url = new URL(window.location.href)
      url.searchParams.delete("email_error")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams, router, currentUser, login])

  if (isLoadingSession || !currentUser || !currentRole) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="inline-block h-6 w-6 border-2 border-primary border-r-transparent animate-spin rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <main className="flex-1 flex w-full min-h-0 overflow-hidden">
        {currentRole === "master_admin" ? (
          <div className="flex-1 flex flex-col min-h-0">
            <AppHeader />
            <div className="flex-1 flex min-h-0 overflow-hidden">
              <div className="hidden lg:block w-80 shrink-0 border-r border-border">
              <MasterSidebar activeView={activeMasterView} onViewChange={setActiveMasterView} />
            </div>
            <div className="flex-1 overflow-y-auto bg-secondary/5">
              {activeMasterView === "overview" && <MasterOverview />}
              {activeMasterView === "organizations" && <MasterOrgManagement />}
              {activeMasterView === "users" && <MasterUserManagement />}
              {activeMasterView === "logs" && <div className="p-8">Activity Logs Coming Soon</div>}
              {activeMasterView === "settings" && <MasterSettings />}
            </div>
          </div>
        </div>
      ) : currentRole === "creator" ? (
          <div className="flex-1 flex min-h-0">
            {!currentUser.orgId ? (
              <div className="flex-1 flex flex-col min-h-0">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center p-6 bg-secondary/10 overflow-y-auto">
                <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 mb-2">
                    <Rocket className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-foreground">Ready to Launch?</h2>
                  <p className="text-muted-foreground text-lg">
                    You haven&apos;t created an organization yet. Let&apos;s set up your workspace to start managing tasks and teams.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => router.push("/auth/onboarding")}
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Create Organization
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
              <AdminDashboard 
                isProfileOpen={isProfileOpen} 
                setIsProfileOpen={setIsProfileOpen} 
              />
            )}
          </div>
        ) : (currentRole === "head_admin" || currentRole === "admin") ? (
          <AdminDashboard isProfileOpen={isProfileOpen} setIsProfileOpen={setIsProfileOpen} />
        ) : (
          <EmployeeDashboard isProfileOpen={isProfileOpen} setIsProfileOpen={setIsProfileOpen} />
        )}
      </main>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="inline-block h-6 w-6 border-2 border-primary border-r-transparent animate-spin rounded-full" />
      </div>
    }>
      <AppContent />
    </Suspense>
  )
}
