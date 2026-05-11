"use client";

// Activity log view component for tracking system actions and team updates

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActivityLog } from "@/lib/store";
import { FileText, Users, MessageSquare, AlertCircle, Trash2, CheckCircle2, PlusCircle, Paperclip, UserCog, UserCircle, Key, ShieldCheck, UserCheck, Share2, Archive, RotateCcw, UserPlus, Ticket, Sparkles } from "lucide-react";
import { useTaskContext } from "@/lib/task-context";

export function ActivityLogView() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useTaskContext();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/activity-logs", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();

          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error("Failed to fetch activity logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionConfig = (action: string) => {
    switch (action) {
      case "TASK_CREATED":
        return { icon: <FileText className="h-4 w-4 text-emerald-600" />, bg: "bg-emerald-50 border-emerald-200" };
      case "STATUS_UPDATED":
        return { icon: <CheckCircle2 className="h-4 w-4 text-blue-600" />, bg: "bg-blue-50 border-blue-200" };
      case "ASSIGNEE_CHANGED":
      case "TASK_REASSIGNED":
        return { icon: <UserCheck className="h-4 w-4 text-purple-600" />, bg: "bg-purple-50 border-purple-200" };
      case "TEAM_MEMBERS_EDITED":
        return { icon: <Users className="h-4 w-4 text-indigo-600" />, bg: "bg-indigo-50 border-indigo-200" };
      case "MEMBER_REMOVED":
        return { icon: <Trash2 className="h-4 w-4 text-red-600" />, bg: "bg-red-50 border-red-200" };
      case "TASK_DELEGATED":
        return { icon: <Share2 className="h-4 w-4 text-blue-500" />, bg: "bg-blue-50 border-blue-100" };
      case "NOTE_ADDED":
      case "COMMENT_ADDED":
        return { icon: <MessageSquare className="h-4 w-4 text-amber-600" />, bg: "bg-amber-50 border-amber-200" };
      case "TASK_DELETED":
      case "STEP_DELETED":
        return { icon: <Trash2 className="h-4 w-4 text-destructive" />, bg: "bg-destructive/10 border-destructive/20" };
      case "STEP_ADDED":
        return { icon: <PlusCircle className="h-4 w-4 text-emerald-500" />, bg: "bg-emerald-50 border-emerald-100" };
      case "STEP_UPDATED":
        return { icon: <CheckCircle2 className="h-4 w-4 text-sky-500" />, bg: "bg-sky-50 border-sky-100" };
      case "STEP_NOTE_ADDED":
        return { icon: <Paperclip className="h-4 w-4 text-indigo-500" />, bg: "bg-indigo-50 border-indigo-100" };
      case "PROFILE_UPDATED":
        return { icon: <UserCog className="h-4 w-4 text-orange-500" />, bg: "bg-orange-50 border-orange-100" };
      case "AVATAR_UPDATED":
        return { icon: <UserCircle className="h-4 w-4 text-pink-500" />, bg: "bg-pink-50 border-pink-100" };
      case "PASSWORD_RESET":
        return { icon: <Key className="h-4 w-4 text-yellow-600" />, bg: "bg-yellow-50 border-yellow-200" };
      case "USER_STATUS_UPDATED":
        return { icon: <ShieldCheck className="h-4 w-4 text-cyan-600" />, bg: "bg-cyan-50 border-cyan-200" };
      case "USER_CREATED":
        return { icon: <UserPlus className="h-4 w-4 text-emerald-600" />, bg: "bg-emerald-50 border-emerald-200" };
      case "USER_DELETED":
        return { icon: <Trash2 className="h-4 w-4 text-red-600" />, bg: "bg-red-50 border-red-200" };
      case "ORGANIZATION_CREATED":
        return { icon: <ShieldCheck className="h-4 w-4 text-primary" />, bg: "bg-primary/5 border-primary/20" };
      case "TASK_ARCHIVED":
        return { icon: <Archive className="h-4 w-4 text-amber-600" />, bg: "bg-amber-50 border-amber-200" };
      case "TASK_RESTORED":
        return { icon: <RotateCcw className="h-4 w-4 text-emerald-600" />, bg: "bg-emerald-50 border-emerald-200" };
      case "PROMO_CODE_GENERATED":
        return { icon: <Sparkles className="h-4 w-4 text-amber-500" />, bg: "bg-amber-50 border-amber-200" };
      case "PROMO_CODE_REDEEMED":
        return { icon: <Ticket className="h-4 w-4 text-primary" />, bg: "bg-primary/5 border-primary/20" };
      default:
        return { icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />, bg: "bg-secondary/50 border-border" };
    }
  };

  const getLogMessage = (log: ActivityLog) => {
    const taskName = log.taskTitle || log.details?.title || "Unknown Task";
    
    switch (log.action) {
      case "TASK_CREATED":
        const assignees = log.details?.assignees;
        return (
          <span>
            Created the task <strong>{taskName}</strong>
            {assignees && <span> and assigned it to <strong>{assignees}</strong></span>}
          </span>
        );
      case "STATUS_UPDATED":
        return <span>Updated status of <strong>{taskName}</strong> from <span className="uppercase text-[10px] tracking-wide bg-secondary px-1.5 py-0.5 rounded-md">{log.details?.from?.replace(/_/g, ' ')}</span> to <span className="uppercase text-[10px] tracking-wide bg-secondary px-1.5 py-0.5 rounded-md text-primary font-bold">{log.details?.to?.replace(/_/g, ' ')}</span></span>;
      case "ASSIGNEE_CHANGED":
      case "TASK_REASSIGNED":
      case "TEAM_MEMBERS_EDITED":
      case "TASK_DELEGATED":
      case "MEMBER_REMOVED": {
        const added = log.details?.added || [];
        const removed = log.details?.removed || [];
        const isDelegated = log.action === "TASK_DELEGATED";
        
        let prefix = "Updated members for ";
        if (isDelegated) prefix = "Delegated ";
        else if (removed.length > 0 && added.length === 0) prefix = "Removed member(s) from ";
        else if (added.length > 0 && removed.length === 0) prefix = "Added member(s) to ";
        
        return (
          <span>
            {prefix} 
            <strong>{taskName}</strong>:
            {added.length > 0 && (
              <span> added <strong>{added.join(", ")}</strong></span>
            )}
            {added.length > 0 && removed.length > 0 && <span> and </span>}
            {removed.length > 0 && (
              <span> removed <strong>{removed.join(", ")}</strong></span>
            )}
            {added.length === 0 && removed.length === 0 && <span> re-synced team members</span>}
          </span>
        );
      }
      case "NOTE_ADDED":
        return <span>Added a progress note to <strong>{taskName}</strong></span>;
      case "COMMENT_ADDED":
        return <span>Added a comment to <strong>{taskName}</strong></span>;
      case "TASK_DELETED":
        return <span>Deleted the task <strong>{taskName}</strong></span>;
      case "STEP_ADDED":
        return <span>Added action step <span className="text-foreground font-medium italic">"{log.details?.title}"</span> to <strong>{taskName}</strong></span>;
      case "STEP_UPDATED":
        return <span>{log.details?.completed ? "Completed" : "Updated"} action step <span className="text-foreground font-medium italic">"{log.details?.title}"</span> in <strong>{taskName}</strong></span>;
      case "STEP_DELETED":
        return <span>Deleted action step <span className="text-foreground font-medium italic">"{log.details?.title}"</span> from <strong>{taskName}</strong></span>;
      case "STEP_NOTE_ADDED":
        return <span>Added a note to action step in <strong>{taskName}</strong></span>;
      case "PROFILE_UPDATED":
        return <span>Updated the profile of <strong>{log.details?.name || "a user"}</strong></span>;
      case "AVATAR_UPDATED":
        return <span>Updated the profile photo of <strong>{log.userName}</strong></span>;
      case "PASSWORD_RESET":
        return <span>Reset the password for <strong>{log.details?.name || log.details?.resetUserId || "a user"}</strong></span>;
      case "USER_STATUS_UPDATED":
        return <span>{log.details?.isActive ? "Activated" : "Deactivated"} user account <strong>{log.details?.name || log.details?.updatedUserId || "Unknown"}</strong></span>;
      case "USER_CREATED":
        return <span>Created a new user account for <strong>{log.details?.name || "a new member"}</strong> as <strong>{log.details?.role?.toLowerCase() || "employee"}</strong></span>;
      case "USER_DELETED":
        return <span>Permanently deleted user account <strong>{log.details?.name || "a user"}</strong></span>;
      case "ORGANIZATION_CREATED":
        return <span>Created the organization <strong>{log.details?.name || "a new organization"}</strong></span>;
      case "TASK_ARCHIVED":
        return <span>Archived the task <strong>{taskName}</strong></span>;
      case "TASK_RESTORED":
        return <span>Restored the task <strong>{taskName}</strong> from archive</span>;
      case "EXTENSION_REQUESTED":
        return (
          <span>
            Requested a deadline extension for <strong>{taskName}</strong> 
            {log.details?.proposedDueDate && (
              <span> to <strong>{new Date(log.details.proposedDueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
            )}
          </span>
        );
      case "EXTENSION_APPROVED":
        return <span>Approved the extension request for <strong>{taskName}</strong></span>;
      case "EXTENSION_REJECTED":
        return <span>Rejected the extension request for <strong>{taskName}</strong></span>;
      case "DUE_DATE_UPDATED":
        return (
          <span>
            Adjusted the due date of <strong>{taskName}</strong> 
            {log.details?.to && (
              <span> to <strong>{new Date(log.details.to).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
            )}
          </span>
        );
      case "PROMO_CODE_GENERATED":
        return (
          <span>
            Generated promo code <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono font-black">{log.details?.code}</code> for <strong>{log.details?.plan}</strong> plan ({log.details?.days} days)
          </span>
        );
      case "PROMO_CODE_REDEEMED":
        return (
          <span>
            Redeemed promo code <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-mono font-black">{log.details?.code}</code> activating <strong>{log.details?.plan}</strong> access
          </span>
        );
      default:
        return <span>Performed an action on <strong>{taskName}</strong></span>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="inline-block h-6 w-6 border-2 border-primary border-r-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card min-h-[500px] border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-5 border-b bg-muted/30 shrink-0">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Activity Log</h2>
          <p className="text-xs text-muted-foreground">Track who did what and when across {currentUser?.role === 'employee' ? 'your assigned tasks' : 'all system tasks'}.</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground">No activity recorded yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Task creations, updates, and comments will appear here.
            </p>
          </div>
        ) : currentUser?.role === 'creator' ? (
          /* SIMPLE TABLE DESIGN FOR CREATOR - HIGH PERFORMANCE */
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden border-t border-border/50">
              <table className="min-w-full divide-y divide-border/40">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">User</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Action</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Details</th>
                    <th className="px-6 py-3 text-right text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 bg-card">
                  {logs.map((log) => {
                    const config = getActionConfig(log.action);
                    const userName = log.userName || "Unknown";
                    const date = log.createdAt ? new Date(log.createdAt) : new Date();
                    const formattedDate = format(date, 'MMM d, h:mm a');
                    
                    return (
                      <tr key={log.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 border border-border/50">
                              <AvatarFallback className="text-[8px] bg-secondary text-foreground font-bold">
                                {userName.split(" ").map(n => n[0]).join("").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold text-foreground">{userName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className={`p-1 rounded-md ${config.bg} border/50`}>
                              {config.icon}
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="text-xs text-muted-foreground line-clamp-1 group-hover:line-clamp-none transition-all">
                            {getLogMessage(log)}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                          {formattedDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ORIGINAL DETAILED DESIGN FOR OTHER ROLES */
          <div className="p-6">
            <div className="relative border-l-2 border-border/60 ml-4 md:ml-6 space-y-8 pb-8">
              {logs.map((log) => {
                const config = getActionConfig(log.action);
                const userName = log.userName || "Unknown User";
                const initials = userName
                  .split(" ")
                  .filter(Boolean)
                  .map(n => n[0])
                  .join("")
                  .toUpperCase() || "?";
                
                const date = log.createdAt ? new Date(log.createdAt) : new Date();
                const formattedDate = isNaN(date.getTime()) ? "Unknown date" : format(date, 'MMM d, yyyy h:mm a');
                
                return (
                  <div key={log.id} className="relative pl-6 md:pl-8 group">
                    <span className="absolute -left-[1.3rem] top-1 px-1 py-1 rounded-full bg-card items-center justify-center flex border-2 border-border/80 group-hover:border-primary/50 group-hover:scale-110 transition-all z-10">
                      <div className={`p-1.5 rounded-full ${config.bg} border`}>
                        {config.icon}
                      </div>
                    </span>
                    
                    <div className="flex flex-col bg-card border border-border/60 hover:border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-6 w-6 border border-border/50">
                            <AvatarFallback className="text-[9px] bg-secondary text-foreground font-bold">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-semibold text-foreground">{userName}</span>
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground shrink-0 uppercase tracking-wide">
                          {formattedDate}
                        </span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground/90 pl-[2.1rem]">
                        {getLogMessage(log)}
                      </div>
                      
                      {log.details?.content && (
                        <div className="mt-3 ml-[2.1rem] pl-3 py-1.5 border-l-2 border-border/50 text-sm text-foreground/80 italic line-clamp-2">
                          "{log.details.content}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
