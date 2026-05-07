"use client"

import { useRouter } from "next/navigation"
import { XCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function PaymentCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center space-y-6"
      >
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-14 w-14 text-destructive" />
        </div>

        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Payment Cancelled
        </h1>
        <p className="text-muted-foreground text-lg">
          No worries! Your payment was not processed. You can try again anytime from your dashboard.
        </p>

        <div className="pt-4">
          <Button
            onClick={() => router.replace("/dashboard")}
            className="w-full h-12 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group"
          >
            <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
