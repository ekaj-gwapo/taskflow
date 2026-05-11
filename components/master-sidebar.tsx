"use client"

import { Building2, Users, LayoutDashboard, ShieldAlert, History, Settings, LogOut, ChevronRight, Search, Ticket } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
    { id: "promo", label: "Promo Factory", icon: Ticket },
    { id: "support", label: "Support Requests", icon: ShieldAlert },
    { id: "logs", label: "System Activity Logs", icon: History },
  ]

  return (
    <div className="h-full flex flex-col bg-card/60 backdrop-blur-3xl border-r border-border/50 shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden relative">
      {/* Dynamic Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

      {/* Sidebar Header - Modern & Sleek */}
      <div className="p-4 border-b border-border/40 flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <ShieldAlert className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xs font-bold tracking-tight text-foreground leading-none mb-1">MASTER</h2>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold leading-none">System Control</p>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto relative z-10">
        <p className="px-3 mb-4 text-[9px] font-black text-primary/40 uppercase tracking-[0.2em]">Main Menu</p>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-300 group/nav relative overflow-hidden mb-1",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-[0_10px_25px_-5px_rgba(var(--primary),0.3)]" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="master-nav-indicator"
                  className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full"
                />
              )}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl border-2 transition-all duration-500",
                  isActive 
                    ? "bg-white/20 border-white/30 text-white" 
                    : "bg-primary/5 text-primary/60 border-primary/10 group-hover/nav:bg-primary group-hover/nav:text-white"
                )}>
                  <Icon className="h-4 w-4 transition-transform group-hover/nav:scale-110" />
                </div>
                <span className="font-black text-[10px] uppercase tracking-wider">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="h-4 w-4 text-white/60 group-hover/nav:translate-x-1 transition-transform" />}
            </button>
          )
        })}

        <div className="pt-6">
          <p className="px-3 mb-4 text-[9px] font-black text-primary/40 uppercase tracking-[0.2em]">Configuration</p>
          <button 
            onClick={() => onViewChange("settings")}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-300 group/nav relative overflow-hidden",
              activeView === "settings"
                ? "bg-primary text-primary-foreground shadow-[0_10px_25px_-5px_rgba(var(--primary),0.3)]" 
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1"
            )}
          >
            {activeView === "settings" && (
              <motion.div 
                layoutId="master-nav-indicator"
                className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full"
              />
            )}
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl border-2 transition-all duration-500",
                activeView === "settings"
                  ? "bg-white/20 border-white/30 text-white" 
                  : "bg-primary/5 text-primary/60 border-primary/10 group-hover/nav:bg-primary group-hover/nav:text-white"
              )}>
                <Settings className="h-4 w-4 transition-transform group-hover/nav:scale-110" />
              </div>
              <span className="font-black text-[10px] uppercase tracking-wider">System Settings</span>
            </div>
            {activeView === "settings" && <ChevronRight className="h-4 w-4 text-white/60 group-hover/nav:translate-x-1 transition-transform" />}
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-border/40 bg-secondary/10 backdrop-blur-md relative z-10">
        <Button 
          variant="ghost" 
          onClick={logout}
          className="w-full justify-start gap-3 h-12 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-black uppercase tracking-widest text-[10px] transition-all"
        >
          <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20 group-hover:bg-destructive group-hover:text-white transition-colors">
            <LogOut className="h-4 w-4" />
          </div>
          Log Out System
        </Button>
      </div>
    </div>
  )
}
