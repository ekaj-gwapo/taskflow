"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  User, 
  Building2, 
  Search, 
  Filter,
  ChevronRight,
  Loader2,
  Mail,
  AlertCircle
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
      const res = await fetch(`/api/master/support-requests/${selectedRequest.id}/reply`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: replyMessage })
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
      fetchRequests() // Refresh the list
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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3 uppercase">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            Support Requests
          </h1>
          <p className="text-muted-foreground font-medium">Manage and respond to creator concerns directly.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 h-11 w-64 rounded-xl border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-11 px-4 rounded-xl border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold uppercase tracking-wider"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="REPLIED">Replied</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Request List */}
        <div className="lg:col-span-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-muted-foreground font-bold animate-pulse">Scanning Signal...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-border rounded-3xl bg-secondary/5">
              <AlertCircle className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground font-bold">No requests found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => (
                <motion.button
                  key={req.id}
                  layoutId={`req-${req.id}`}
                  onClick={() => setSelectedRequest(req)}
                  className={cn(
                    "w-full text-left p-5 rounded-3xl border transition-all duration-300 group relative overflow-hidden",
                    selectedRequest?.id === req.id 
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_15px_30px_-10px_rgba(var(--primary),0.4)] scale-[1.02]" 
                      : "bg-card hover:bg-secondary/10 border-border/50 hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center border transition-colors",
                        selectedRequest?.id === req.id ? "bg-white/20 border-white/30" : "bg-primary/10 border-primary/20"
                      )}>
                        <User className={cn("h-5 w-5", selectedRequest?.id === req.id ? "text-white" : "text-primary")} />
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-wider">{req.creator_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Building2 className="h-3 w-3 opacity-60" />
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{req.organization_name}</p>
                        </div>
                      </div>
                    </div>
                    {req.status === 'PENDING' ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/30">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Pending</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Replied</span>
                      </div>
                    )}
                  </div>
                  <p className={cn(
                    "text-xs line-clamp-2 leading-relaxed font-medium mb-3",
                    selectedRequest?.id === req.id ? "text-white/80" : "text-muted-foreground"
                  )}>
                    {req.message}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-bold opacity-60">
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Request Detail & Reply */}
        <div className="lg:col-span-7 h-fit sticky top-8">
          <AnimatePresence mode="wait">
            {selectedRequest ? (
              <motion.div
                key={selectedRequest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="p-8 border-b border-border/40 bg-secondary/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8">
                    {selectedRequest.status === 'PENDING' ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-500/5">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Needs Response</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Resolved</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">{selectedRequest.creator_name}</h2>
                      <div className="flex items-center gap-3 mt-1 text-muted-foreground font-bold text-xs tracking-wider uppercase">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-primary/60" />
                          {selectedRequest.creator_email}
                        </div>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <div className="flex items-center gap-1.5 text-primary">
                          <Building2 className="h-3.5 w-3.5" />
                          {selectedRequest.organization_name}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-3xl bg-background/50 border border-border/40 text-sm leading-relaxed font-medium italic text-muted-foreground relative">
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Message</div>
                    "{selectedRequest.message}"
                    <p className="mt-4 text-[10px] font-black text-primary/40 uppercase tracking-widest">
                      Sent {new Date(selectedRequest.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6 bg-gradient-to-b from-transparent to-secondary/5">
                  {selectedRequest.status === 'REPLIED' ? (
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500/60 flex items-center gap-2">
                        <Send className="h-3.5 w-3.5" />
                        Official Response Sent
                      </h3>
                      <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 text-sm leading-relaxed font-bold text-foreground">
                        {selectedRequest.reply_message}
                        <p className="mt-4 text-[10px] font-black text-emerald-500/40 uppercase tracking-widest">
                          Replied on {new Date(selectedRequest.replied_at!).toLocaleString()}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedRequest({ ...selectedRequest, status: 'PENDING' })
                          setReplyMessage(selectedRequest.reply_message || "")
                        }}
                        className="rounded-2xl h-10 px-6 font-black uppercase tracking-widest text-[10px] border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10"
                      >
                        Edit Response
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary/60 flex items-center gap-2">
                        <Send className="h-3.5 w-3.5" />
                        Compose Official Reply
                      </h3>
                      <div className="relative group">
                        <textarea
                          placeholder="Type your reply here... The creator will receive this via email."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          className="w-full h-48 p-6 rounded-[2rem] border border-border bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium resize-none shadow-inner"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                         <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          Draft saved locally
                        </p>
                        <Button 
                          onClick={handleSendReply}
                          disabled={sendingReply || !replyMessage.trim()}
                          className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.15em] shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {sendingReply ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Transmitting...
                            </>
                          ) : (
                            <>
                              Send Official Reply
                              <Send className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[3rem] bg-secondary/5 text-center p-12">
                <div className="h-24 w-24 rounded-[2rem] bg-background flex items-center justify-center border-2 border-border mb-8 shadow-xl animate-bounce duration-[2000ms]">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <h2 className="text-3xl font-black text-foreground tracking-tight mb-4 uppercase">Select a Message</h2>
                <p className="text-muted-foreground max-w-xs font-medium text-lg">
                  Click on a support request from the left to read and respond.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
