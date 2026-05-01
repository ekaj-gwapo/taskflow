"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { LayoutDashboard, Mail, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import Link from "next/link"
import { toast } from "sonner"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResend = async () => {
    if (resendCooldown > 0) return
    if (!email) {
      toast.error("We couldn't find your email address. Please sign up again.")
      return
    }
    setResending(true)
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (response.ok) {
        toast.success("Verification email sent!")
        setResendCooldown(60)
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || "Failed to resend")
        toast.error(errorMsg)
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-secondary/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">TaskFlow</h1>
          </div>
        </div>

        <Card className="border-border bg-card shadow-xl">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Animated mail icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="relative"
              >
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-10 w-10 text-primary" />
                </div>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <span className="text-white text-xs font-bold">✓</span>
                </motion.div>
              </motion.div>

              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Check Your Email</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We&apos;ve sent a verification link to
                </p>
                {email && (
                  <p className="text-sm font-semibold text-foreground mt-1 bg-secondary/50 px-3 py-1.5 rounded-lg inline-block">
                    {email}
                  </p>
                )}
              </div>

              <div className="w-full space-y-3 pt-2">
                <div className="bg-secondary/30 rounded-xl p-4 text-left space-y-2">
                  <p className="text-xs font-semibold text-foreground">What happens next:</p>
                  <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                    <li>Click the verification link in your email</li>
                    <li>Sign in to your new account</li>
                    <li>Create or join an organization</li>
                  </ol>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl font-semibold"
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                >
                  {resending ? (
                    <>
                      <span className="inline-block mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>

                <Link href="/auth/login" className="block">
                  <Button
                    variant="ghost"
                    className="w-full h-11 rounded-xl font-semibold text-muted-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Didn&apos;t receive an email? Check your spam folder.
        </p>
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="inline-block h-6 w-6 border-2 border-primary border-r-transparent animate-spin rounded-full" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
