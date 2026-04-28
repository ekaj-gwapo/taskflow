"use client"

import { useState } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Bell, Check, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function NotificationBell() {
  const { notifications, markNotificationAsRead, selectTask, setTargetSection } = useTaskContext()
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 rounded-full hover:bg-accent/80 transition-colors"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              className="absolute top-0 right-0 h-6 min-w-[24px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground border-2 border-background px-1.5 text-[11px] font-bold animate-in zoom-in"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-bold">
                {unreadCount} NEW
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] px-2 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => markNotificationAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex flex-col p-4 border-b last:border-b-0 hover:bg-accent/50 transition-colors cursor-pointer relative group",
                    !n.isRead ? "bg-primary/5" : "bg-background"
                  )}
                  onClick={() => {
                    markNotificationAsRead(n.id)
                    setIsOpen(false)
                    
                    // Extract taskId from link if it exists (e.g. /tasks/[taskId])
                    const taskId = n.link?.split("/").pop()
                    if (taskId) {
                      selectTask(taskId)
                      
                    // Set target section based on notification type
                    if (n.type === "COMMENT_ADDED") {
                      setTargetSection("discussion")
                    } else if (n.type === "EXTENSION_APPROVED" || n.type === "EXTENSION_REJECTED" || n.type === "EXTENSION_REQUESTED") {
                      setTargetSection("extensions")
                    } else {
                      setTargetSection(null)
                    }
                  }
                }}
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <span className="font-bold text-sm leading-tight">{n.title}</span>
                  {!n.isRead && (
                    <div className={cn(
                      "h-3 w-3 rounded-full shrink-0 mt-1 shadow-sm",
                      n.type === "EXTENSION_REQUESTED" ? "bg-orange-500 animate-pulse" : "bg-primary"
                    )} />
                  )}
                </div>
                <p className="text-[13px] text-muted-foreground line-clamp-3 leading-snug mb-2 font-medium">
                  {n.message}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-muted-foreground/60 font-semibold">
                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {n.link && (
                    <ExternalLink className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-6">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                We'll notify you when your requests are reviewed.
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
