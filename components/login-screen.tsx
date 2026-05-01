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

export function LoginScreen() {
  const { login } = useTaskContext()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  
  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.replace("/dashboard")
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

      if (!response.ok) {
        setError(data.error || "Login failed")
        return
      }

      // Store token and login user
      localStorage.setItem("token", data.token)
      login(data.user.role.toLowerCase(), data.user.id, data.user)
      router.replace("/dashboard")
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">TaskFlow</h1>
          </div>
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
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Email Address
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="bg-secondary border-border text-foreground"
                  disabled={loading}
                />
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
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-xs font-medium text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
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

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50"></span>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="bg-card px-3 text-muted-foreground/60">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-secondary/30 hover:bg-secondary/50 border-border/50 text-foreground h-11 rounded-xl font-bold transition-all flex items-center justify-center gap-3 group shadow-sm hover:shadow-md"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                  <svg className="h-3 w-3" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                </div>
                <span>Gmail Login</span>
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
