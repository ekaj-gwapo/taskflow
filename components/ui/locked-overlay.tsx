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
      <div className="relative z-30 flex flex-col items-center text-center p-2 w-full max-w-[240px] max-h-full overflow-y-auto scrollbar-hide">
        <div className="mb-2 relative shrink-0">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <div className="relative h-8 w-8 rounded-lg bg-card border border-primary/30 flex items-center justify-center shadow-xl">
            <Zap className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-card border border-border flex items-center justify-center shadow-lg">
            <Lock className="h-2 w-2 text-foreground" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 mb-2 shrink-0">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Pro Feature</span>
        </div>

        <h3 className="text-sm font-black text-foreground tracking-tight mb-0.5 shrink-0">
          {title}
        </h3>
        
        <p className="text-[10px] font-medium text-muted-foreground mb-3 leading-tight shrink-0 max-w-[200px]">
          {description}
        </p>

        <Button 
          onClick={() => setIsPricingModalOpen(true)}
          className="w-full h-8 rounded-lg bg-primary text-primary-foreground font-black text-[8px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0"
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
