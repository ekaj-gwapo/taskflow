"use client"

import { Suspense } from "react"
import { OTPVerificationScreen } from "@/components/otp-verification-screen"

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    }>
      <OTPVerificationScreen />
    </Suspense>
  )
}
