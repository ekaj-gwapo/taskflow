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

function AppContent() {
  const { currentUser, currentRole, isLoadingSession, login } = useTaskContext()
  const [activeMasterView, setActiveMasterView] = useState("overview")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isLoadingSession) {
      console.log("Dashboard Session Check:", { currentRole, orgId: currentUser?.orgId });
      if (!currentUser || !currentRole) {
        router.replace("/auth/login")
      } else if (currentRole !== "master_admin" && !currentUser.orgId) {
        console.log("Redirecting to onboarding because orgId is missing");
        router.replace("/auth/onboarding")
      }
    }
  }, [currentUser, currentRole, isLoadingSession, router])

  useEffect(() => {
    const verified = searchParams.get("email_verified")
    const error = searchParams.get("email_error")
    
    if (verified === "1") {
      toast.success("Email connected successfully!")
      if (currentUser) {
        login(currentUser.role, currentUser.id, { ...currentUser, emailVerified: true })
      }
      // Remove query param without triggering full reload
      const url = new URL(window.location.href)
      url.searchParams.delete("email_verified")
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
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="flex-1 flex min-h-0">
        {currentRole === "master_admin" ? (
          <div className="flex-1 flex min-h-0">
            <div className="hidden lg:block w-80 shrink-0 border-r border-border">
              <MasterSidebar activeView={activeMasterView} onViewChange={setActiveMasterView} />
            </div>
            <div className="flex-1 overflow-y-auto bg-secondary/5">
              {activeMasterView === "overview" && <MasterOverview />}
              {activeMasterView === "organizations" && <MasterOrgManagement />}
              {activeMasterView === "users" && <MasterUserManagement />}
              {activeMasterView === "logs" && <div className="p-8">Activity Logs Coming Soon</div>}
            </div>
          </div>
        ) : currentRole === "creator" ? (
          <div className="flex-1 flex min-h-0">
            <div className="hidden lg:block w-80 shrink-0 border-r border-border">
              <AdminSidebar selectedEmployeeId={null} onSelectEmployee={() => {}} onSelectTask={() => {}} />
            </div>
            <div className="flex-1 overflow-y-auto bg-secondary/10">
              <UserManagement />
            </div>
          </div>
        ) : (currentRole === "head_admin" || currentRole === "admin") ? (
          <AdminDashboard />
        ) : (
          <EmployeeDashboard />
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
