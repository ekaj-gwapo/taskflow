"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTaskContext } from "@/lib/task-context"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LayoutDashboard, LogIn } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const SQL_INJECTION_PATTERNS = [
  /'\s*OR\s+/i,
  /--/,
  /;\s*DROP\s+/i,
  /;\s*DELETE\s+/i,
  /;\s*UPDATE\s+/i,
  /UNION\s+SELECT/i,
  /xp_cmdshell/i
]

export function LoginScreen() {
  const { login } = useTaskContext()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [lockoutTimer, setLockoutTimer] = useState(0)

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  
  useEffect(() => {
    if (localStorage.getItem("token")) {
      const verified = searchParams?.get("email_verified")
      const emailError = searchParams?.get("email_error")
      const target = `/dashboard${verified ? `?email_verified=${verified}` : ""}${emailError ? `${verified ? "&" : "?"}email_error=${emailError}` : ""}`
      router.replace(target)
      return
    }

    if (searchParams) {
      const verified = searchParams.get("email_verified")
      const emailError = searchParams.get("email_error")
      
      if (verified === "1") {
        toast.success("Email verified! You can now sign in.")
      } else if (emailError) {
        const errorMessages: Record<string, string> = {
          missing_token: "Verification link is missing a token.",
          invalid_token: "Invalid or expired verification token.",
          expired_token: "Verification link has expired.",
          server_error: "An error occurred during verification."
        }
        setError(errorMessages[emailError] || "Failed to verify email.")
        toast.error(errorMessages[emailError] || "Failed to verify email.")
      }
    }
  }, [router, searchParams])
  
  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setInterval(() => {
        setLockoutTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [lockoutTimer])
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google login")
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check for SQL injection patterns
    const isSuspicious = SQL_INJECTION_PATTERNS.some(pattern => 
      pattern.test(formData.email) || pattern.test(formData.password)
    )

    if (isSuspicious) {
      setError("Suspicious login pattern detected. Please use valid credentials.")
      toast.error("Security Alert: Invalid characters detected.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.status === 429 || data.error?.includes("Too many login")) {
        setLockoutTimer(60)
        setError("Too many login attempts. Please try again in 60 seconds.")
        return
      }

      if (!response.ok) {
        setError(data.error || "Login failed")
        return
      }

      // Store token and login user
      localStorage.setItem("token", data.token)
      login(data.user.role.toLowerCase(), data.user.id, data.user)
      
      if (data.user.role.toLowerCase() !== 'master_admin' && !data.user.orgId) {
        router.replace(`/auth/onboarding`)
      } else {
        router.replace(`/dashboard${window.location.search}`)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center gap-3 mb-4 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">TaskFlow</h1>
          </Link>
          <p className="text-muted-foreground text-sm">
            Professional task management system
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-card-foreground">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">Username or Email</label>
                  <div className="relative group/input">
                    <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                    <Input
                      name="email"
                      type="text"
                      placeholder="Enter your username or email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-12 pl-12 rounded-2xl bg-secondary/30 border-transparent focus:bg-background transition-all"
                      disabled={loading || lockoutTimer > 0}
                      required
                    />
                  </div>
                </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Password
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="bg-secondary border-border text-foreground"
                  disabled={loading || lockoutTimer > 0}
                />
              </div>

              {(error || lockoutTimer > 0) && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-xs font-medium text-destructive">
                    {lockoutTimer > 0 ? `Too many login attempts. Please try again in ${lockoutTimer} seconds.` : error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || lockoutTimer > 0}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-xl font-bold transition-all"
              >
                {loading ? (
                  <>
                    <span className="inline-block mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>


            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-primary font-semibold hover:underline underline-offset-4 transition-colors"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Secure authentication with encrypted passwords
        </p>
      </div>
    </div>
  )
}
