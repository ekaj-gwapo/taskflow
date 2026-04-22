"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTaskContext } from "@/lib/task-context"
import { Loader2 } from "lucide-react"

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useTaskContext()

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      try {
        // Decode token manually to get user info for the login function
        // The token is a JWT base64 encoded string
        const payloadBase64 = token.split(".")[1]
        const payload = JSON.parse(atob(payloadBase64))
        
        // Save to local storage
        localStorage.setItem("token", token)
        
        // Update context
        login(payload.role.toLowerCase(), payload.id, payload)
        
        // Redirect to dashboard
        router.replace("/dashboard")
      } catch (err) {
        console.error("Failed to process auth token", err)
        router.replace("/auth/login?error=token_processing_failed")
      }
    } else {
      router.replace("/auth/login")
    }
  }, [searchParams, router, login])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-secondary/20 border border-border/50 shadow-xl backdrop-blur-md">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Confirming Authorization</h2>
          <p className="text-sm text-muted-foreground mt-1">Please wait while we set up your session...</p>
        </div>
      </div>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  )
}
