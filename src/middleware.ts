import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login, /signup, /forgot-password, /reset-password, /verify-email (auth pages)
     * - /pricing (public pricing page)
     * - /api/auth/* (auth API routes)
     * - /api/subscription/plans (public plans endpoint)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, /bordclear.png, /bord*.png (static files)
     */
    '/((?!login|signup|forgot-password|reset-password|verify-email|pricing|api/auth|api/subscription/plans|_next|favicon.ico|bordclear.png|bord.*\\.png).*)',
  ],
}
