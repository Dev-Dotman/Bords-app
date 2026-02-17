import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
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

        // If this user signed up with Google, they can't use credentials
        if (user.provider === 'google' && !user.passwordHash) {
          throw new Error('This account uses Google sign-in. Please sign in with Google.')
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
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash!)

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
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await connectDB()

          const existingUser = await User.findOne({ email: user.email?.toLowerCase() })

          if (existingUser) {
            // If existing user signed up with credentials, link the Google account
            if (existingUser.provider === 'credentials' && !existingUser.providerId) {
              existingUser.provider = 'google'
              existingUser.providerId = account.providerAccountId
              existingUser.image = user.image || existingUser.image
              if (!existingUser.emailVerifiedAt) {
                existingUser.emailVerifiedAt = new Date()
              }
              existingUser.lastLoginAt = new Date()
              await existingUser.save()
            } else {
              // Update last login
              existingUser.lastLoginAt = new Date()
              existingUser.image = user.image || existingUser.image
              await existingUser.save()
            }

            // Set the user id for the JWT callback
            user.id = existingUser._id.toString()
          } else {
            // Create new user from Google profile
            const nameParts = (user.name || '').split(' ')
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || ''

            const newUser = await User.create({
              email: user.email?.toLowerCase(),
              passwordHash: null,
              firstName,
              lastName,
              image: user.image || '',
              provider: 'google',
              providerId: account.providerAccountId,
              emailVerifiedAt: new Date(), // Google emails are pre-verified
              loginAttempts: 0,
              lastLoginAt: new Date(),
            })

            user.id = newUser._id.toString()
          }

          return true
        } catch (error) {
          console.error('Google sign-in error:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }

      // For Google sign-in, fetch the DB user id
      if (account?.provider === 'google' && user?.email) {
        try {
          await connectDB()
          const dbUser = await User.findOne({ email: user.email.toLowerCase() })
          if (dbUser) {
            token.id = dbUser._id.toString()
            token.name = `${dbUser.firstName} ${dbUser.lastName}`.trim()
          }
        } catch (error) {
          console.error('JWT callback error:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
