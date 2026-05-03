"use client"

import { Building2, Users, LayoutDashboard, ShieldAlert, History, Settings, LogOut, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTaskContext } from "@/lib/task-context"

interface MasterSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function MasterSidebar({ activeView, onViewChange }: MasterSidebarProps) {
  const { logout } = useTaskContext()

  const menuItems = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "organizations", label: "Organization Management", icon: Building2 },
    { id: "users", label: "Global User Directory", icon: Users },
    { id: "logs", label: "System Activity Logs", icon: History },
  ]

  return (
    <div className="h-full flex flex-col bg-card border-r border-border shadow-sm overflow-hidden">
      {/* Sidebar Header - Modern & Sleek */}
      <div className="p-8 border-b border-border/40 relative overflow-hidden group bg-primary/5">
        {/* Subtle background decoration */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
        
        <div className="flex items-center gap-4 relative">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105 duration-300">
            <ShieldAlert className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-black tracking-tight text-foreground leading-none mb-1.5">MASTER</h2>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] leading-none">System Control</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Main Menu</p>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="h-4 w-4" />}
            </button>
          )
        })}

        <div className="pt-8">
          <p className="px-2 mb-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Platform</p>
          <button 
            onClick={() => onViewChange("settings")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group",
              activeView === "settings"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Settings className={cn("h-5 w-5", activeView === "settings" ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
              <span className="font-bold text-sm tracking-tight">System Settings</span>
            </div>
            {activeView === "settings" && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-secondary/20">
        <Button 
          variant="ghost" 
          onClick={logout}
          className="w-full justify-start gap-3 h-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-bold"
        >
          <LogOut className="h-5 w-5" />
          Log Out System
        </Button>
      </div>
    </div>
  )
}
