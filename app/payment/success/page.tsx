"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Suspense } from "react"

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.replace("/dashboard")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center space-y-6"
      >
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle2 className="h-14 w-14 text-primary" />
          </motion.div>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Payment Successful!
        </h1>
        <p className="text-muted-foreground text-lg">
          Your organization has been upgraded to the <strong className="text-primary">Pro Plan</strong>. 
          Full access has been restored for you and your entire team.
        </p>

        <div className="pt-4">
          <Button
            onClick={() => router.replace("/dashboard")}
            className="w-full h-12 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Redirecting automatically in <strong>{countdown}s</strong>...
        </p>
      </motion.div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
