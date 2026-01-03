'use client'

import { useEffect, useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message)
          toast.success('Email verified successfully!')
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
          toast.error(data.error || 'Verification failed')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('An error occurred during verification')
        toast.error('An error occurred during verification')
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <div className="fixed inset-0 bg-black">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: 'url(/bord2.png)' }}
      />
      
      {/* Semi-transparent blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-black/50" />

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              {status === 'loading' && (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 mx-auto mb-6"
                  >
                    <Loader2 className="w-16 h-16 text-blue-400" />
                  </motion.div>
                  <h1 className="text-2xl font-semibold text-white mb-2 brand-font tracking-tight">
                    Verifying Your Email
                  </h1>
                  <p className="text-zinc-300 font-light">
                    Please wait while we verify your email address...
                  </p>
                </>
              )}

              {status === 'success' && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-16 h-16 bg-green-500 rounded-xl mx-auto mb-6 flex items-center justify-center"
                  >
                    <CheckCircle className="w-8 h-8 text-white" />
                  </motion.div>
                  <h1 className="text-2xl font-semibold text-white mb-2 brand-font tracking-tight">
                    Email Verified!
                  </h1>
                  <p className="text-zinc-300 font-light mb-6">
                    {message}
                  </p>
                  <Link
                    href="/login"
                    className="inline-block w-full py-4 bg-black hover:bg-zinc-900 text-white rounded-xl font-medium shadow-sm transition-all"
                  >
                    Continue to Login
                  </Link>
                </>
              )}

              {status === 'error' && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-16 h-16 bg-red-500 rounded-xl mx-auto mb-6 flex items-center justify-center"
                  >
                    <XCircle className="w-8 h-8 text-white" />
                  </motion.div>
                  <h1 className="text-2xl font-semibold text-white mb-2 brand-font tracking-tight">
                    Verification Failed
                  </h1>
                  <p className="text-zinc-300 font-light mb-6">
                    {message}
                  </p>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/signup"
                      className="w-full py-4 bg-black hover:bg-zinc-900 text-white rounded-xl font-medium shadow-sm transition-all"
                    >
                      Create New Account
                    </Link>
                    <Link
                      href="/login"
                      className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium transition-all"
                    >
                      Back to Login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
