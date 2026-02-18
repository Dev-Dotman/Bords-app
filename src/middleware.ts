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
     * - /shared/* (public shared boards)
     * - /api/auth/* (auth API routes)
     * - /api/subscription/plans (public plans endpoint)
     * - /api/boards/public/* (public board viewer API)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, /bordclear.png, /bord*.png (static files)
     */
    '/((?!login|signup|forgot-password|reset-password|verify-email|pricing|shared|api/auth|api/subscription/plans|api/boards/public|_next|favicon.ico|bordclear.png|bord.*\\.png).*)',
  ],
}
