import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        await connectDB()

        // Find user
        const user = await User.findOne({ email: credentials.email.toLowerCase() })

        if (!user) {
          throw new Error('Invalid email or password')
        }

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > new Date()) {
          const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000)
          throw new Error(`Account locked. Try again in ${minutesLeft} minutes`)
        }

        // Check if email is verified
        if (!user.emailVerifiedAt) {
          throw new Error('Please verify your email before logging in')
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValid) {
          // Increment login attempts
          user.loginAttempts += 1

          // Lock account after 5 failed attempts for 15 minutes
          if (user.loginAttempts >= 5) {
            user.lockUntil = new Date(Date.now() + 15 * 60 * 1000)
          }

          await user.save()
          throw new Error('Invalid email or password')
        }

        // Reset login attempts on successful login
        user.loginAttempts = 0
        user.lockUntil = null
        user.lastLoginAt = new Date()
        await user.save()

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          image: user.image,
          emailVerified: user.emailVerifiedAt,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
