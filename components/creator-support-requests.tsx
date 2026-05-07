"use client"

import { useState, useEffect } from "react"
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  Shield, 
  Loader2,
  Plus,
  ArrowLeft
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
    <div className="p-6 h-full flex flex-col space-y-5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Support Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Contact the system administrators for help.</p>
        </div>

        <Button 
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "outline" : "default"}
          className="h-9 text-sm"
        >
          {showForm ? (
            <><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</>
          ) : (
            <><Plus className="mr-1.5 h-4 w-4" /> New Request</>
          )}
        </Button>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Submit a Request</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Describe your issue or concern. An admin will review and respond.</p>
          </div>
          <Textarea 
            placeholder="Type your message here..."
            className="min-h-[160px] resize-none text-sm"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit}
              disabled={isSending || !newMessage.trim()}
              className="h-9 text-sm"
            >
              {isSending ? (
                <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="mr-1.5 h-4 w-4" /> Send Message</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Request History */}
      {!showForm && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-secondary/5">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <h3 className="text-sm font-semibold text-foreground">No support requests yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Click "New Request" to send a message to the system administrators.
              </p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Request Header */}
                <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-secondary/5">
                  <span className="text-xs text-muted-foreground">
                    {new Date(req.created_at).toLocaleString()}
                  </span>
                  {req.status === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" /> Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Replied
                    </span>
                  )}
                </div>

                {/* Request Body */}
                <div className="px-5 py-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Your message</p>
                    <p className="text-sm text-foreground leading-relaxed">{req.message}</p>
                  </div>

                  {req.status === 'REPLIED' && (
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                        <p className="text-xs font-medium text-primary">Admin Response</p>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{req.reply_message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        — {req.replied_by_name || 'Master Admin'} · {req.replied_at ? new Date(req.replied_at).toLocaleString() : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
