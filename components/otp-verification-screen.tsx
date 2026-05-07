"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LayoutDashboard, CheckCircle2, ArrowRight, RefreshCw, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTaskContext } from "@/lib/task-context"

export function OTPVerificationScreen() {
  const router = useRouter()
  const { login } = useTaskContext()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [timer, setTimer] = useState(60)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email) {
      router.replace("/auth/signup")
    }
  }, [email, router])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return
    
    const newOtp = [...otp]
    newOtp[index] = value.substring(value.length - 1)
    setOtp(newOtp)

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const code = otp.join("")
    if (code.length < 6) {
      setError("Please enter the full 6-digit code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Verification failed")
        return
      }

      toast.success("Email verified successfully!")
      
      // Auto-login
      if (data.token) {
        localStorage.setItem("token", data.token)
        
        // Update global state immediately
        login(data.user.role, data.user.id, data.user)
        
        // If it's a new creator with no organization, go to onboarding
        if (data.user.role?.toLowerCase() === 'creator' && !data.user.orgId) {
          router.push("/auth/onboarding")
        } else {
          router.push("/dashboard?open_profile=1")
        }
      } else {
        router.push("/auth/login?verified=1")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (timer > 0) return
    
    setResending(true)
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        toast.success("New verification code sent!")
        setTimer(60)
        setOtp(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to resend code")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setResending(false)
    }
  }

  // Auto-submit when all digits are filled
  useEffect(() => {
    if (otp.every(digit => digit !== "") && otp.length === 6) {
      handleVerify()
    }
  }, [otp])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-secondary/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">TaskFlow</h1>
          </div>
          <h2 className="text-2xl font-black text-foreground">Check your email</h2>
          <p className="text-muted-foreground text-sm mt-2">
            We've sent a 6-digit verification code to <span className="font-bold text-foreground">{email}</span>
          </p>
        </div>

        <Card className="border-border bg-card shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-xl">Enter Code</CardTitle>
            <CardDescription>Enter the digits below to verify your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-8">
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="h-14 w-12 text-center text-2xl font-black rounded-xl border-2 focus:border-primary focus:ring-primary bg-secondary"
                    disabled={loading}
                  />
                ))}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={loading || otp.some(d => !d)}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Verify & Continue
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={timer > 0 || resending}
                    className={cn(
                      "text-sm font-bold transition-colors",
                      timer > 0 ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:text-primary/80"
                    )}
                  >
                    {resending ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Resending...
                      </span>
                    ) : timer > 0 ? (
                      `Resend code in ${timer}s`
                    ) : (
                      "Didn't receive a code? Resend"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
