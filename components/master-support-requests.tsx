"use client"

import { useState, useEffect } from "react"
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  User, 
  Building2, 
  Search, 
  Loader2,
  Mail
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SupportRequest {
  id: string
  creator_id: string
  message: string
  status: 'PENDING' | 'REPLIED'
  reply_message?: string
  replied_by?: string
  replied_at?: string
  created_at: string
  creator_name: string
  creator_email: string
  organization_name: string
}

export function MasterSupportRequests() {
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'REPLIED'>('ALL')

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/master/support-requests", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setRequests(data)
    } catch (error) {
      toast.error("Could not load support requests")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleSendReply = async () => {
    if (!selectedRequest || !replyMessage.trim()) return

    setSendingReply(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/master/support-reply`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          id: selectedRequest.id,
          message: replyMessage 
        })
      })

      if (!res.ok) throw new Error("Failed to send reply")
      
      toast.success("Reply sent successfully")
      setReplyMessage("")
      setSelectedRequest({
        ...selectedRequest,
        status: 'REPLIED',
        reply_message: replyMessage,
        replied_at: new Date().toISOString()
      })
      fetchRequests()
    } catch (error) {
      toast.error("Failed to send reply")
    } finally {
      setSendingReply(false)
    }
  }

  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.creator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.creator_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = statusFilter === 'ALL' || r.status === statusFilter
    
    return matchesSearch && matchesFilter
  })

  const pendingCount = requests.filter(r => r.status === 'PENDING').length

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Support Requests
            {pendingCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and respond to creator support tickets.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 h-9 w-48 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="REPLIED">Replied</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Request List */}
        <div className="lg:col-span-5 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-xl bg-secondary/5 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No requests found</p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <button
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg border transition-all",
                  selectedRequest?.id === req.id 
                    ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" 
                    : "bg-card border-border hover:bg-secondary/10"
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{req.creator_name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{req.organization_name}</span>
                      </div>
                    </div>
                  </div>
                  {req.status === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      <Clock className="h-2.5 w-2.5" /> Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Replied
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 pl-10">{req.message}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5 pl-10">{new Date(req.created_at).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </div>

        {/* Request Detail & Reply */}
        <div className="lg:col-span-7">
          {selectedRequest ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Detail Header */}
              <div className="px-5 py-4 border-b border-border bg-secondary/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground">{selectedRequest.creator_name}</h2>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{selectedRequest.creator_email}</span>
                        <span className="text-border">·</span>
                        <Building2 className="h-3 w-3" />
                        <span>{selectedRequest.organization_name}</span>
                      </div>
                    </div>
                  </div>
                  {selectedRequest.status === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" /> Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Replied
                    </span>
                  )}
                </div>

                <div className="bg-background rounded-lg border border-border p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Message</p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedRequest.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Sent on {new Date(selectedRequest.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Reply Section */}
              <div className="p-5 space-y-4">
                {selectedRequest.status === 'REPLIED' ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Response sent
                    </p>
                    <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-4">
                      <p className="text-sm text-foreground leading-relaxed">{selectedRequest.reply_message}</p>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Replied on {new Date(selectedRequest.replied_at!).toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedRequest({ ...selectedRequest, status: 'PENDING' })
                        setReplyMessage(selectedRequest.reply_message || "")
                      }}
                      className="text-xs h-8"
                    >
                      Edit Response
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">Write your reply</p>
                    <textarea
                      placeholder="Type your reply here..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="w-full h-36 p-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSendReply}
                        disabled={sendingReply || !replyMessage.trim()}
                        className="h-9 text-sm"
                      >
                        {sendingReply ? (
                          <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending...</>
                        ) : (
                          <><Send className="mr-1.5 h-4 w-4" /> Send Reply</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-secondary/5 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <h2 className="text-sm font-semibold text-foreground mb-1">Select a request</h2>
              <p className="text-xs text-muted-foreground max-w-xs">
                Click on a support request from the list to view details and reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
