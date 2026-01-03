'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { Check, X, Loader2 } from 'lucide-react'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!reference) {
      setStatus('failed')
      setMessage('Invalid payment reference')
      return
    }

    verifyPayment()
  }, [reference])

  const verifyPayment = async () => {
    try {
      const response = await fetch('/api/subscription/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage(data.message || 'Payment successful!')
        toast.success('Subscription activated!')
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        setStatus('failed')
        setMessage(data.error || 'Payment verification failed')
        toast.error('Payment failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('failed')
      setMessage('Failed to verify payment')
      toast.error('Verification error')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-6 text-blue-200 animate-spin" />
              <h1 className="text-2xl font-semibold brand-font mb-3">
                Verifying Payment
              </h1>
              <p className="text-zinc-400 font-light">
                Please wait while we confirm your payment...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-semibold brand-font mb-3">
                Payment Successful!
              </h1>
              <p className="text-zinc-400 font-light mb-6">
                {message}
              </p>
              <p className="text-sm text-zinc-500">
                Redirecting to dashboard...
              </p>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-semibold brand-font mb-3">
                Payment Failed
              </h1>
              <p className="text-zinc-400 font-light mb-8">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/pricing')}
                  className="w-full bg-white text-black py-3 rounded-xl font-medium hover:bg-zinc-100 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full border border-zinc-700 py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
