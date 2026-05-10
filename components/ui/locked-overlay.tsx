"use client"

import { Zap, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { PricingModal } from "@/components/pricing-modal"

interface LockedOverlayProps {
  title: string
  description: string
  className?: string
}

export function LockedOverlay({ title, description, className }: LockedOverlayProps) {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)

  return (
    <div className={cn("absolute inset-0 z-20 flex items-center justify-center overflow-hidden", className)}>
      {/* Glassmorphic Background - using theme-aware colors */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md border border-border/50" />
      
      {/* Content */}
      <div className="relative z-30 flex flex-col items-center text-center p-6 max-w-[280px]">
        <div className="mb-4 relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
          <div className="relative h-14 w-14 rounded-2xl bg-card border border-primary/30 flex items-center justify-center shadow-2xl">
            <Zap className="h-7 w-7 text-primary animate-pulse" />
          </div>
          <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center shadow-lg">
            <Lock className="h-3.5 w-3.5 text-foreground" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Pro Feature</span>
        </div>

        <h3 className="text-xl font-black text-foreground tracking-tight mb-2">
          {title}
        </h3>
        
        <p className="text-[13px] font-medium text-muted-foreground mb-8 leading-relaxed">
          {description}
        </p>

        <Button 
          onClick={() => setIsPricingModalOpen(true)}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          Unlock with Pro
        </Button>
      </div>

      <PricingModal 
        open={isPricingModalOpen} 
        onOpenChange={setIsPricingModalOpen} 
      />
    </div>
  )
}
