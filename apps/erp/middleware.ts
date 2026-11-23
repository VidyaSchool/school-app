export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'
import { db } from './lib/db'
import { user as userTable, session as sessionTable, userProfile } from './lib/schema'
import { eq } from 'drizzle-orm'
import { checkRateLimit } from './lib/rate-limit'

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3002'
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'
const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || 'http://localhost:3000'

// Role → destination mapping
const roleDashboardMap: Record<string, string> = {
  teacher: '/teacher',
  librarian: '/librarian',
  account: '/accounts',
  student: '/student',
}

// Protected routes with required roles
const protectedRoutes: Record<string, string[]> = {
  '/student': ['student'],
  '/teacher': ['teacher', 'admin', 'librarian'],
  '/librarian': ['librarian', 'admin'],
  '/accounts': ['admin', 'account'],
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
    return `${AUTH_URL}/signup/onboarding`
  } catch (e) {
    console.error('[erp middleware] userProfile query error:', e)
    return `${AUTH_URL}/signup/onboarding`
  }
}

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

  // 0. CORS PREFLIGHT
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin') || '*'
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': request.headers.get('access-control-request-headers') || 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // 1. PATH TRAVERSAL FILTER
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

  const isRSC = request.nextUrl.searchParams.has('_rsc') || request.headers.get('rsc') === '1'

  // 2. REDIRECT ADMIN ROUTES TO ADMIN_FRONTEND
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (isRSC) return new NextResponse(null, { status: 204 })
    return applySecurityHeaders(NextResponse.redirect(new URL(pathname + search, ADMIN_URL)))
  }

  // 3. REDIRECT PUBLIC MARKETING ROUTES TO MAIN_URL
  const publicWebsiteRoutes = ['/about', '/contact', '/docs', '/downloads', '/notices', '/gallery', '/mandatory-public-disclosure', '/circulars']
  if (publicWebsiteRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    if (isRSC) return new NextResponse(null, { status: 204 })
    return applySecurityHeaders(NextResponse.redirect(new URL(pathname + search, MAIN_URL)))
  }

  // 4. REDIRECT AUTH ROUTES TO AUTH_URL
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/login-accounts']
  if (authRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    if (isRSC) return new NextResponse(null, { status: 204 })
    return applySecurityHeaders(NextResponse.redirect(new URL(pathname + search, AUTH_URL)))
  }

  // 5. API RATE LIMITING
  if (pathname.startsWith('/api')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    const { allowed, remaining, reset } = checkRateLimit(`erp_api:${ip}`, 300, 60000)
    if (!allowed) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(reset),
              'X-RateLimit-Limit': '300',
              'X-RateLimit-Remaining': String(remaining),
              'X-RateLimit-Reset': String(reset),
            },
          }
        )
      )
    }
  }

  // Allow unauthorized page to be viewed directly
  if (pathname === '/unauthorized') {
    return applySecurityHeaders(NextResponse.next())
  }

  // 6. SESSION CHECK
  const rawCookie =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value

  let session: any = null
  if (rawCookie) {
    try {
      session = await auth.api.getSession({
        headers: request.headers,
      })
    } catch (err) {
      console.error('[erp middleware] getSession error:', err)
    }

    if (!session?.user) {
      try {
        const cleanToken = decodeURIComponent(rawCookie).split('.')[0]
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
            session = { user: dbUser, session: dbSession }
          }
        }
      } catch (e) {
        console.error('[erp middleware] DB fallback error:', e)
      }
    }
  }

  // ROOT / REDIRECT
  if (pathname === '/') {
    if (!session?.user) {
      if (isRSC) return new NextResponse(null, { status: 204 })
      const loginUrl = new URL('/login', AUTH_URL)
      loginUrl.searchParams.set('from', request.url)
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }
    const destination = await resolveUserDestination(session.user)
    return applySecurityHeaders(NextResponse.redirect(new URL(destination, request.url)))
  }

  // DASHBOARD REDIRECT
  if (pathname === '/dashboard') {
    if (!session?.user) {
      if (isRSC) return new NextResponse(null, { status: 204 })
      const loginUrl = new URL('/login', AUTH_URL)
      loginUrl.searchParams.set('from', request.url)
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }
    const destination = await resolveUserDestination(session.user)
    return applySecurityHeaders(NextResponse.redirect(new URL(destination, request.url)))
  }

  // FIREWALL: Check protected ERP routes
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => pathname.startsWith(route))
  if (isProtectedRoute) {
    if (!session?.user) {
      if (isRSC) return new NextResponse(null, { status: 204 })
      const loginUrl = new URL('/login', AUTH_URL)
      loginUrl.searchParams.set('from', request.url)
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }

    const user = session.user as any

    // Pending teacher/librarian approval check
    if ((user.preferredRole === 'teacher' || user.preferredRole === 'librarian') && user.teacherApprovalStatus === 'pending') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/auth/waiting-room', AUTH_URL)))
    }

    const roleBasePaths = Object.values(roleDashboardMap)
    const sortedRoutes = Object.entries(protectedRoutes).sort((a, b) => b[0].length - a[0].length)
    for (const [route, allowedRoles] of sortedRoutes) {
      if (pathname.startsWith(route)) {
        if (allowedRoles.includes(user.role as string)) {
          // If user hits root /[role]
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
