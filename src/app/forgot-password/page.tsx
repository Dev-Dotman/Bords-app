'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { status } = useSession()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/')
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        toast.success(data.message)
        
        // Show reset URL in development
        if (data.resetUrl) {
          console.log('Password Reset URL:', data.resetUrl)
          toast.success('Check console for reset link (dev mode)', {
            duration: 5000,
          })
        }
      } else {
        toast.error(data.error || 'Failed to send reset email')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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
            {!isSubmitted ? (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  >
                    <Mail className="w-8 h-8 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Forgot Password?
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Enter your email and we'll send you reset instructions
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                        placeholder="you@example.com"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Reset Link
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Back to Login */}
                <div className="mt-6">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  >
                    <Send className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    If an account exists with <strong>{email}</strong>, you will receive password reset instructions.
                  </p>
                  <Link
                    href="/login"
                    className="inline-block w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
