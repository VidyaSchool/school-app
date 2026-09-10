import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'
import { db } from './lib/db'
import { user as userTable, session as sessionTable, userProfile } from './lib/schema'
import { eq } from 'drizzle-orm'
import { checkRateLimit } from './lib/rate-limit'

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001"

// Public routes - accessible without authentication
const publicRoutes = ['/', '/login', '/signup', '/unauthorized', '/downloads']

// Role → destination mapping for /dashboard and /[role] redirect
const roleDashboardMap: Record<string, string> = {
  teacher: '/teacher',
  librarian: '/librarian',
  account: '/accounts',
  student: '/student',
}

// FIREWALL: Protected routes with required roles
const protectedRoutes = {
  '/community': ['admin', 'teacher', 'librarian'],
  '/student': ['student'],
  '/teacher': ['teacher', 'admin', 'librarian'],
  '/librarian': ['librarian', 'admin'],
  '/accounts': ['admin', 'account'],
  '/login-accounts': ['student', 'teacher', 'admin', 'account', 'librarian'],
}

async function resolveUserDestination(user: any): Promise<string> {
  try {
    const profile = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, user.id))
      .then(res => res[0])

    if (user.role === 'admin') {
      return profile?.username ? `${ADMIN_URL}/admin/${profile.username}` : `${ADMIN_URL}/admin`
    }

    if (profile?.username && profile?.onboardingCompleted) {
      const rolePrefix = roleDashboardMap[user.role as string] ?? '/student'
      return `${rolePrefix}/${profile.username}`
    }
    // If onboarding is not completed or profile/username is missing, direct to onboarding
    return '/signup/onboarding'
  } catch (e) {
    console.error('[middleware] userProfile query error:', e)
    return '/signup/onboarding'
  }
}

// Helper: Attach OWASP Top 10 Security Headers to all responses
function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-DNS-Prefetch-Control', 'on')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()')
  res.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  return res
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search

  // 1. INJECTION & PATH TRAVERSAL FILTER (Block malicious payload attempts)
  if (
    pathname.includes('..') ||
    pathname.includes('%2e%2e') ||
    pathname.includes('\0') ||
    search.includes('<script') ||
    search.includes('javascript:')
  ) {
    return applySecurityHeaders(
      new NextResponse('Bad Request: Malicious or invalid pattern detected.', { status: 400 })
    )
  }

  // Redirect all admin UI routes to dedicated admin_frontend
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return applySecurityHeaders(NextResponse.redirect(new URL(pathname + search, ADMIN_URL)))
  }

  // 2. CSRF & ORIGIN INTEGRITY CHECK (State-changing API operations)
  const method = request.method
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    const isWebhookOrPublic =
      pathname.startsWith('/api/auth/') ||
      pathname.startsWith('/api/razorpay-webhook') ||
      pathname.startsWith('/api/backend/api/public')

    if (!isWebhookOrPublic && origin && host) {
      const originHost = origin.replace(/^https?:\/\//, '').split(':')[0]
      const currentHost = host.split(':')[0]
      const isAllowedHost =
        originHost === currentHost ||
        originHost === 'localhost' ||
        originHost === '127.0.0.1' ||
        originHost.endsWith('.vercel.app') ||
        originHost.endsWith('.blazeneuro.com')

      if (!isAllowedHost) {
        return applySecurityHeaders(
          NextResponse.json({ error: 'Forbidden: Untrusted Origin' }, { status: 403 })
        )
      }
    }
  }

  // 3. CATEGORIZED RATE LIMITING FOR NEXT.JS API ENDPOINTS (/api/*)
  if (pathname.startsWith('/api')) {
    // Exempt lightweight read endpoints and auth routes from strict rate limits
    const isExempt =
      pathname.startsWith('/api/auth/') ||
      pathname === '/api/profile/username' ||
      pathname === '/api/account' ||
      pathname.startsWith('/api/search') ||
      pathname.startsWith('/api/backend/api/public')

    if (!isExempt) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        '127.0.0.1'

      const isSensitive =
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/admin') ||
        pathname.startsWith('/api/profile/update')

      const limit = isSensitive ? 120 : 300
      const key = `next_api:${ip}:${isSensitive ? 'strict' : 'general'}`

      const { allowed, remaining, reset } = checkRateLimit(key, limit, 60000)

      if (!allowed) {
        return applySecurityHeaders(
          NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
              status: 429,
              headers: {
                'Retry-After': String(reset),
                'X-RateLimit-Limit': String(limit),
                'X-RateLimit-Remaining': String(remaining),
                'X-RateLimit-Reset': String(reset),
              },
            }
          )
        )
      }
    }
  }

  // Allow static assets, API auth, docs, well-known, and search endpoints
  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/.well-known') ||
    pathname.startsWith('/docs') ||
    pathname.startsWith('/api/search')
  ) {
    return applySecurityHeaders(NextResponse.next())
  }


  // Get session (single call — reused for redirects AND firewall checks)
  let session: any = null
  try {
    session = await auth.api.getSession({
      headers: request.headers
    })
  } catch (err) {
    console.error('[middleware] getSession error:', err)
  }

  // Robust Fallback: If better-auth getSession returned null, check session token cookie
  if (!session?.user) {
    const rawCookie = request.cookies.get('better-auth.session_token')?.value || 
                      request.cookies.get('__Secure-better-auth.session_token')?.value
    if (rawCookie) {
      const cleanToken = rawCookie.split('.')[0]
      try {
        const dbSession = await db
          .select()
          .from(sessionTable)
          .where(eq(sessionTable.token, cleanToken))
          .then(res => res[0])

        if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
          const dbUser = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, dbSession.userId))
            .then(res => res[0])

          if (dbUser) {
            session = {
              user: dbUser,
              session: dbSession
            }
          }
        }
      } catch (e) {
        console.error('[middleware] DB fallback session check error:', e)
      }
    }
  }

  // ONBOARDING ROUTE HANDLING: /signup/onboarding or /accounts/onboarding
  if (pathname.startsWith('/signup/onboarding') || pathname.startsWith('/accounts/onboarding')) {
    if (!session?.user) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
    }
    // If user has already completed onboarding, redirect directly to their dashboard
    try {
      const profile = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.userId, session.user.id))
        .then(res => res[0])

      if (profile?.username && profile?.onboardingCompleted) {
        const rolePrefix = roleDashboardMap[session.user.role as string] ?? '/student'
        return applySecurityHeaders(NextResponse.redirect(new URL(`${rolePrefix}/${profile.username}`, request.url)))
      }
    } catch {}
    return applySecurityHeaders(NextResponse.next())
  }

  // REDIRECT LOGGED-IN USERS AWAY FROM /login AND /signup
  if ((pathname === '/login' || pathname === '/signup') && session?.user) {
    const user = session.user as any
    const destination = await resolveUserDestination(user)
    if (destination && destination !== pathname) {
      return applySecurityHeaders(NextResponse.redirect(new URL(destination, request.url)))
    }
    return applySecurityHeaders(NextResponse.next())
  }

  // Allow unauthenticated public routes ('/', '/login', '/signup', '/unauthorized', '/downloads')
  if (publicRoutes.some(route => pathname === route)) {
    return applySecurityHeaders(NextResponse.next())
  }

  // FAST /dashboard redirect — handled at edge with session & profile
  if (pathname === '/dashboard') {
    if (!session?.user) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
    }
    const user = session.user as any
    const destination = await resolveUserDestination(user)
    return applySecurityHeaders(NextResponse.redirect(new URL(destination, request.url)))
  }

  // FIREWALL CHECK: Is this a protected route?
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => 
    pathname.startsWith(route)
  )

  // FIREWALL RULE 1: Block unauthenticated users from protected routes
  if (isProtectedRoute && !session?.user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return applySecurityHeaders(NextResponse.redirect(loginUrl))
  }

  // FIREWALL RULE 2: Check role permissions and ensure onboarding is completed
  if (session?.user) {
    const user = session.user as any
    
    // Special handling for teacher/librarian approval flow
    if ((user.preferredRole === 'teacher' || user.preferredRole === 'librarian') && user.teacherApprovalStatus === 'pending') {
      if (!pathname.startsWith('/auth/waiting-room') && !pathname.startsWith('/api')) {
        return applySecurityHeaders(NextResponse.redirect(new URL('/auth/waiting-room', request.url)))
      }
      if (pathname.startsWith('/auth/waiting-room')) {
        return applySecurityHeaders(NextResponse.next())
      }
    }
    
    const roleBasePaths = Object.values(roleDashboardMap)
    const sortedRoutes = Object.entries(protectedRoutes).sort((a, b) => b[0].length - a[0].length)
    for (const [route, allowedRoles] of sortedRoutes) {
      if (pathname.startsWith(route)) {
        if (allowedRoles.includes(user.role as string)) {
          // If user hits root /[role] (e.g. /student, /teacher, /admin, /accounts, /librarian)
          if (roleBasePaths.includes(pathname)) {
            const destination = await resolveUserDestination(user)
            return applySecurityHeaders(NextResponse.redirect(new URL(destination, request.url)))
          }
          return applySecurityHeaders(NextResponse.next())
        } else {
          return applySecurityHeaders(NextResponse.redirect(new URL('/unauthorized', request.url)))
        }
      }
    }
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!monitoring|_next/static|_next/image|favicon.ico|assets).*)'],
}

