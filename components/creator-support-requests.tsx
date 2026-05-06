"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  Shield, 
  User,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SupportRequest {
  id: string
  message: string
  status: 'PENDING' | 'REPLIED'
  reply_message?: string
  replied_by_name?: string
  replied_at?: string
  created_at: string
}

export function CreatorSupportRequests() {
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/contact-admin", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setRequests(data)
    } catch (error) {
      toast.error("Could not load support history")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleSubmit = async () => {
    if (!newMessage.trim()) return

    setIsSending(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/contact-admin", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: newMessage })
      })

      if (!res.ok) throw new Error("Failed to send")
      
      toast.success("Message sent to Master Admin")
      setNewMessage("")
      setShowForm(false)
      fetchRequests()
    } catch (error) {
      toast.error("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3 uppercase">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <Shield className="h-6 w-6 text-amber-500" />
            </div>
            Support Center
          </h1>
          <p className="text-muted-foreground font-medium">Communicate directly with the system administrators.</p>
        </div>

        <Button 
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "h-14 px-8 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl",
            showForm ? "bg-secondary text-foreground" : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
          )}
        >
          {showForm ? (
            <><ArrowLeft className="mr-2 h-5 w-5" /> Back to History</>
          ) : (
            <><MessageSquare className="mr-2 h-5 w-5" /> New Request</>
          )}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-card border border-border/50 rounded-[2.5rem] shadow-2xl p-10 space-y-8 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Send size={200} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-500/80">Submit New Concern</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight uppercase">What can we help you with?</h2>
              <p className="text-muted-foreground font-medium max-w-2xl">
                Please describe your issue, request, or concern in detail. A Master Admin will review it and respond shortly.
              </p>
            </div>

            <div className="space-y-4">
              <Textarea 
                placeholder="Type your message here..."
                className="min-h-[250px] rounded-[2rem] bg-secondary/30 border-border/50 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all text-base leading-relaxed p-8 resize-none shadow-inner"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSending || !newMessage.trim()}
                  className="h-16 px-12 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-amber-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Transmitting...</>
                  ) : (
                    <><Send className="mr-2 h-5 w-5" /> Send to Admin</>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
                <p className="text-muted-foreground font-bold uppercase tracking-widest animate-pulse">Retrieving Messages...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6 border-2 border-dashed border-border rounded-[3rem] bg-secondary/5 text-center">
                <div className="h-20 w-20 rounded-3xl bg-background flex items-center justify-center border-2 border-border mb-2">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/20" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase">No Support History</h3>
                  <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                    You haven't sent any support requests yet. Click "New Request" to get started.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {requests.map((req) => (
                  <motion.div
                    layout
                    key={req.id}
                    className="bg-card border border-border/50 rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500"
                  >
                    <div className="p-8 border-b border-border/40 bg-secondary/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Your Request</p>
                          <p className="text-xs font-bold text-foreground/60">{new Date(req.created_at).toLocaleString()}</p>
                        </div>
                      </div>

                      {req.status === 'PENDING' ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                          <Clock className="h-4 w-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Admin Response</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Responded</span>
                        </div>
                      )}
                    </div>

                    <div className="p-8 space-y-6">
                      <div className="p-6 rounded-2xl bg-background/50 border border-border/30 italic text-muted-foreground">
                        "{req.message}"
                      </div>

                      {req.status === 'REPLIED' && (
                        <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                               <Shield className="h-4 w-4 text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Admin Response</span>
                          </div>
                          <div className="p-8 rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/20 text-foreground font-bold shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                              <Shield size={60} />
                            </div>
                            {req.reply_message}
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">
                              <span>— {req.replied_by_name || 'Master Admin'}</span>
                              <div className="h-1 w-1 rounded-full bg-emerald-500/30" />
                              <span>{req.replied_at ? new Date(req.replied_at).toLocaleString() : ''}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
