"use client"

import { useState } from "react"
import { Check, Zap, Sparkles, Rocket, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface PricingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan?: string
}

const plans = [
  {
    name: "Starter",
    price: "₱1,499",
    description: "Perfect for small teams getting started with structured task management.",
    features: ["Up to 10 Users", "All Basic Features", "Email Support", "Core Analytics"],
    buttonText: "Upgrade to Starter",
    planId: "STARTER",
    icon: Rocket,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-500"
  },
  {
    name: "Pro",
    price: "₱2,999",
    description: "The sweet spot for growing organizations that need more power and users.",
    features: ["Up to 25 Users", "Advanced Analytics", "Priority Support", "Team Performance Reports"],
    buttonText: "Upgrade to Pro",
    planId: "PRO",
    popular: true,
    icon: Zap,
    color: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/50",
    iconColor: "text-emerald-500"
  },
  {
    name: "Enterprise",
    price: "₱4,999",
    description: "Unlimited power for large-scale operations with complex workflows.",
    features: ["Unlimited Users", "Custom Integrations", "Dedicated Support", "Full API Access"],
    buttonText: "Go Enterprise",
    planId: "ENTERPRISE",
    icon: Sparkles,
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
    iconColor: "text-purple-500"
  }
]

export function PricingModal({ open, onOpenChange, currentPlan }: PricingModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleUpgrade = async (plan: string) => {
    setLoadingPlan(plan)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || "Failed to initiate checkout")
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-background border-border overflow-hidden">
        <div className="relative p-6 md:p-10">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_50%)] pointer-events-none" />
          
          <div className="relative text-center mb-10">
            <DialogTitle className="text-3xl font-black text-foreground mb-3 tracking-tight">
              Scale Your Workflow
            </DialogTitle>
            <DialogDescription className="text-muted-foreground max-w-md mx-auto text-sm">
              Choose the plan that fits your team's needs. Upgrade or downgrade anytime.
            </DialogDescription>
          </div>

          <div className="grid md:grid-cols-3 gap-5 relative z-10">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative group flex flex-col p-5 rounded-3xl border transition-all duration-500 bg-card/50 backdrop-blur-xl",
                  plan.borderColor,
                  plan.popular ? "scale-105 shadow-2xl shadow-emerald-500/5 ring-1 ring-emerald-500/20" : "hover:scale-[1.01]"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-500/20">
                    Most Popular
                  </div>
                )}

                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br shadow-inner", plan.color)}>
                  <plan.icon className={cn("w-6 h-6", plan.iconColor)} />
                </div>

                <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-black text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-[10px]">/mo</span>
                </div>
                
                <p className="text-muted-foreground text-xs mb-6 leading-relaxed">
                  {plan.description}
                </p>

                <div className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5">
                      <div className="shrink-0 w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                      <span className="text-foreground/80 text-xs font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleUpgrade(plan.planId)}
                  disabled={loadingPlan !== null || currentPlan === plan.planId}
                  className={cn(
                    "w-full h-12 rounded-2xl font-bold transition-all duration-300",
                    plan.popular
                      ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                      : "bg-white text-black hover:bg-zinc-200"
                  )}
                >
                  {loadingPlan === plan.planId ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : currentPlan === plan.planId ? (
                    "Current Plan"
                  ) : (
                    plan.buttonText
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-zinc-500 text-xs">
              All plans include a 14-day money-back guarantee. Prices in PHP.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
