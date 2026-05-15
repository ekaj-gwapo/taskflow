"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LayoutDashboard, UserPlus, Eye, EyeOff, Check, X, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

export function SignupScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.replace("/dashboard")
    }
  }, [router])

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  // Password validation rules
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  }

  const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean)
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.name.trim()) {
      setError("Full name is required")
      return
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }
    if (!allPasswordChecksPassed) {
      setError("Password does not meet all requirements")
      return
    }
    if (!passwordsMatch) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed")
        return
      }

      // Redirect to OTP verification page
      router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const PasswordRule = ({ passed, label }: { passed: boolean; label: string }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2"
    >
      <div className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${passed ? 'bg-emerald-500' : 'bg-muted-foreground/20'}`}>
        {passed ? <Check className="h-2.5 w-2.5 text-white" /> : <X className="h-2.5 w-2.5 text-muted-foreground/50" />}
      </div>
      <span className={`text-[11px] transition-colors ${passed ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </motion.div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-secondary/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center gap-3 mb-4 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">TaskFlow</h1>
          </Link>
          <p className="text-muted-foreground text-sm">
            Create your account to get started
          </p>
        </div>

        <Card className="border-border bg-card shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-card-foreground">Create Account</CardTitle>
            <CardDescription>Fill in your details to sign up for TaskFlow</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Full Name
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="bg-secondary border-border text-foreground"
                  disabled={loading}
                  autoComplete="name"
                />
              </div>

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
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="bg-secondary border-border text-foreground pr-10"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength rules */}
                <AnimatePresence>
                  {formData.password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 grid grid-cols-2 gap-1.5 overflow-hidden"
                    >
                      <PasswordRule passed={passwordChecks.length} label="8+ characters" />
                      <PasswordRule passed={passwordChecks.uppercase} label="Uppercase letter" />
                      <PasswordRule passed={passwordChecks.lowercase} label="Lowercase letter" />
                      <PasswordRule passed={passwordChecks.number} label="Number" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="bg-secondary border-border text-foreground pr-10"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <AnimatePresence>
                  {formData.confirmPassword.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 overflow-hidden"
                    >
                      <PasswordRule passed={passwordsMatch} label="Passwords match" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/30"
                >
                  <p className="text-xs font-medium text-destructive">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading || !allPasswordChecksPassed || !passwordsMatch}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-xl font-bold transition-all"
              >
                {loading ? (
                  <>
                    <span className="inline-block mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-primary font-semibold hover:underline underline-offset-4 transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating an account, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  )
}
