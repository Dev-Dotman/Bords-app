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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300/30 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-zinc-700/50 p-8">
            <div className="text-center">
              {status === 'loading' && (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 mx-auto mb-4"
                  >
                    <Loader2 className="w-16 h-16 text-blue-500" />
                  </motion.div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Verifying Your Email
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
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
                    className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  >
                    <CheckCircle className="w-8 h-8 text-white" />
                  </motion.div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Email Verified!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {message}
                  </p>
                  <Link
                    href="/login"
                    className="inline-block w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
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
                    className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  >
                    <XCircle className="w-8 h-8 text-white" />
                  </motion.div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Verification Failed
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {message}
                  </p>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/signup"
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      Create New Account
                    </Link>
                    <Link
                      href="/login"
                      className="w-full py-3 bg-white/50 dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-700 rounded-xl font-medium hover:bg-white dark:hover:bg-zinc-900 transition-all"
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
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
