'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      const callbackUrl = searchParams.get('callbackUrl') || '/'
      router.push(callbackUrl)
    }
  }, [status, router, searchParams])

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      toast.success('Login successful!')
      router.push('/')
      router.refresh()
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

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
          {/* Login Card */}
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl  p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-black rounded-xl mx-auto mb-4 flex items-center justify-center p-3"
              >
                <img src="/bordclear.png" alt="BORDS" className="w-full h-full object-contain" />
              </motion.div>
              <h1 className="text-3xl font-semibold text-white mb-2 brand-font tracking-tight">
                Welcome
              </h1>
              <p className="text-zinc-300 font-light">
                Sign in to continue to BORDS
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-zinc-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 bg-white border ${
                      errors.email ? 'border-red-500' : 'border-zinc-300'
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bfdbfe] focus:border-[#bfdbfe] transition-all text-black placeholder:text-zinc-400 font-light`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500 font-light">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-zinc-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3 bg-white border ${
                      errors.password ? 'border-red-500' : 'border-zinc-300'
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bfdbfe] focus:border-[#bfdbfe] transition-all text-black placeholder:text-zinc-400 font-light`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-zinc-400 hover:text-zinc-600 transition-colors" />
                    ) : (
                      <Eye className="w-5 h-5 text-zinc-400 hover:text-zinc-600 transition-colors" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500 font-light">{errors.password}</p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-black border-zinc-300 rounded focus:ring-[#bfdbfe]"
                  />
                  <span className="ml-2 text-sm text-zinc-200 font-light">
                    Remember me
                  </span>
                </label>
                <Link href="/forgot-password" className="text-sm text-[#bfdbfe] hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-black text-white rounded-xl font-medium shadow-sm hover:bg-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

            {/* Sign Up Link */}
            <p className="mt-6 text-center text-sm text-zinc-200 font-light">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[#bfdbfe] hover:text-white font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
