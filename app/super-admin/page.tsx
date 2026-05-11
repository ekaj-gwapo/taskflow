"use client"

import { useState, useEffect } from "react"
import { TaskProvider, useTaskContext } from "@/lib/task-context"
import { AppHeader } from "@/components/app-header"
import { AdminSidebar } from "@/components/admin-sidebar"
import { UserManagement } from "@/components/user-management"
import { LoginScreen } from "@/components/login-screen"
import { useRouter } from "next/navigation"
import { Users, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import { PromoFactory } from "@/components/master/promo-factory"

function SuperAdminContent() {
  const { currentUser, currentRole } = useTaskContext()
  const router = useRouter()
  const [activeSubTab, setActiveSubTab] = useState<"users" | "promos">("users")

  useEffect(() => {
    const isSuper = currentRole === "superadmin" || currentRole === "master_admin"
    if (currentUser && !isSuper) {
      router.push("/")
    }
  }, [currentUser, currentRole, router])

  if (!currentUser) {
    return <LoginScreen />
  }

  const isSuper = currentRole === "superadmin" || currentRole === "master_admin"
  if (!isSuper) {
    return null
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* Master Admin Sidebar - Special Version */}
        <aside className="hidden lg:flex w-72 shrink-0 border-r border-border/50 bg-card/30 backdrop-blur-xl flex-col p-4 space-y-2">
          <div className="px-4 py-6">
            <h2 className="text-xl font-black tracking-tight text-foreground">Master Panel</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Global System Control</p>
          </div>

          <button
            onClick={() => setActiveSubTab("users")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest",
              activeSubTab === "users" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
            )}
          >
            <Users className="h-4 w-4" /> User Directory
          </button>

          <button
            onClick={() => setActiveSubTab("promos")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest",
              activeSubTab === "promos" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
            )}
          >
            <Ticket className="h-4 w-4" /> Promo Factory
          </button>
        </aside>

        <div className="flex-1 overflow-y-auto bg-secondary/10 p-6">
          <div className="max-w-[1200px] mx-auto">
            {activeSubTab === "users" ? (
              <UserManagement />
            ) : (
              <PromoFactory />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SuperAdminPage() {
  return (
    <TaskProvider>
      <SuperAdminContent />
    </TaskProvider>
  )
}
