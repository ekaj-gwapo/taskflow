"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle } from 'lucide-react'

export default function PaymentCancelPage() {
  const router = useRouter()

  useEffect(() => {
    // Automatically redirect back to dashboard after a few seconds
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 5000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-red-500/10 p-4 rounded-full">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
        <p className="text-zinc-400 mb-8">
          Your payment was not completed and you haven't been charged. 
          You'll be redirected back to the dashboard shortly.
        </p>

        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  )
}
