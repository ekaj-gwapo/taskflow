"use client"

import { useState, useEffect } from "react"
import { Ticket, Plus, Trash2, Copy, Check, Loader2, Sparkles, Calendar, Zap, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface PromoCode {
  id: string
  code: string
  plan: string
  days: number
  is_used: boolean
  org_name: string | null
  created_at: string
}

export function PromoFactory() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copyingId, setCopyingId] = useState<string | null>(null)

  // New code form state
  const [prefix, setPrefix] = useState("TF")
  const [plan, setPlan] = useState("ENTERPRISE")
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/master/promo", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.codes) setCodes(data.codes)
    } catch (error) {
      toast.error("Failed to load promo codes")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/master/promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan, days, prefix })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Generated: ${data.code}`)
        fetchCodes()
      } else {
        toast.error(data.error || "Generation failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/master/promo", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setCodes(codes.filter(c => c.id !== id))
        toast.success("Code deleted")
      }
    } catch (error) {
      toast.error("Failed to delete")
    }
  }

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopyingId(id)
    toast.success("Code copied to clipboard")
    setTimeout(() => setCopyingId(null), 2000)
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-foreground">Promo Factory</h1>
        <p className="text-muted-foreground text-lg">Forge and manage exclusive access tokens for your partners.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Generator Card */}
        <div className="lg:col-span-2">
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-xl relative overflow-hidden group h-[400px] flex flex-col">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight">Promo Factory</h2>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Forge unique access codes</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prefix</label>
                  <Input 
                    value={prefix} 
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    placeholder="e.g. TF, GOV, CAPITOL"
                    className="bg-background/50 border-border/50 rounded-lg h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Plan Tier</label>
                  <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setPlan("PRO")}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 rounded-lg border-2 transition-all font-bold text-[10px]",
                          plan === "PRO" ? "bg-primary/10 border-primary text-primary" : "bg-background/50 border-border/50 text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        <Zap className="h-3 w-3" /> PRO
                      </button>
                      <button 
                        onClick={() => setPlan("ENTERPRISE")}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 rounded-lg border-2 transition-all font-bold text-[10px]",
                          plan === "ENTERPRISE" ? "bg-amber-500/10 border-amber-500 text-amber-500" : "bg-background/50 border-border/50 text-muted-foreground hover:border-amber-500/30"
                        )}
                      >
                        <ShieldCheck className="h-3 w-3" /> ENT
                      </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Duration (Days)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[14, 30, 90].map(d => (
                      <button 
                        key={d}
                        onClick={() => setDays(d)}
                        className={cn(
                          "py-2 rounded-xl border-2 transition-all font-black text-[10px]",
                          days === d ? "bg-foreground text-background border-foreground" : "bg-background/50 border-border/50 text-muted-foreground hover:border-foreground/30"
                        )}
                      >
                        {d}D
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 text-[10px]"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-3.5 w-3.5 mr-2" /> Generate Code</>}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* List Card */}
        <div className="lg:col-span-3">
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-xl h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Ticket className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight">Active Codes</h2>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">History and status of generated tokens</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchCodes} className="rounded-lg h-7 text-[9px] font-black uppercase tracking-widest px-2">
                Refresh
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {codes.map((c) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={c.id}
                    className={cn(
                      "group flex items-center justify-between p-2.5 rounded-xl border transition-all",
                      c.is_used ? "bg-secondary/20 border-border/30 opacity-60" : "bg-background/40 border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border",
                        c.plan === "ENTERPRISE" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-primary/10 border-primary/20 text-primary"
                      )}>
                        {c.plan === "ENTERPRISE" ? <ShieldCheck className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-black tracking-tighter text-foreground font-mono">{c.code}</code>
                          {c.is_used && (
                            <span className="px-2 py-0.5 rounded-md bg-secondary text-[8px] font-black uppercase tracking-widest">Used</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                            <Calendar className="h-2.5 w-2.5" /> {c.days} Days
                          </span>
                          {c.org_name && (
                            <span className="text-[9px] font-bold text-primary uppercase tracking-tighter truncate max-w-[120px]">
                              @ {c.org_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => copyToClipboard(c.code, c.id)}
                      >
                        {copyingId === c.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {codes.length === 0 && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-secondary/30">
                    <Ticket className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground uppercase tracking-tight">No codes generated yet</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Start forging tokens using the generator on the left.</p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="h-full flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
