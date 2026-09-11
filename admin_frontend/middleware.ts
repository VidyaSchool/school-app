import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'
import { db } from './lib/db'
import { user as userTable, session as sessionTable, userProfile } from './lib/schema'
import { eq } from 'drizzle-orm'
import { checkRateLimit } from './lib/rate-limit'

const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || (process.env.NODE_ENV === 'production' ? 'https://vidyaschool.com' : 'http://localhost:3000')

// Public routes on admin_frontend
const publicRoutes = ['/login', '/unauthorized']

// Main portal routes that should be redirected back to the primary frontend (port 3000)
const mainPortalRoutes = [
  '/student',
  '/teacher',
  '/librarian',
  '/accounts',
  '/login-accounts',
  '/community',
  '/downloads',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/fee',
  '/gallery',
  '/sponsors',
  '/torch-bearers',
  '/docs',
]

async function resolveAdminDestination(user: any): Promise<string> {
  if (user.role !== 'admin') {
    return '/unauthorized'
  }
  try {
    const profile = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, user.id))
      .then(res => res[0])

    if (profile?.username) {
      return `/admin/${profile.username}`
    }
    return '/admin'
  } catch (e) {
    console.error('[middleware] userProfile query error:', e)
    return '/admin'
  }
}

// Helper: Attach OWASP Top 10 Security Headers
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

  // 0. CORS PREFLIGHT (OPTIONS) HANDLER
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

  // 1. INJECTION & PATH TRAVERSAL FILTER
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

  // 2. Redirect non-admin routes to main frontend
  if (mainPortalRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    const isRSC = request.nextUrl.searchParams.has('_rsc') || request.headers.get('rsc') === '1'
    if (isRSC) {
      return new NextResponse(null, { status: 204 })
    }
    return applySecurityHeaders(NextResponse.redirect(new URL(pathname + search, MAIN_URL)))
  }

  // 3. CSRF & ORIGIN INTEGRITY CHECK for API routes
  const method = request.method
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    const isWebhookOrPublic =
      pathname.startsWith('/api/auth/') ||
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

  // 4. RATE LIMITING FOR API ENDPOINTS
  if (pathname.startsWith('/api')) {
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

      const limit = pathname.startsWith('/api/admin') ? 150 : 300
      const key = `admin_api:${ip}`
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

  // Allow static assets, API auth, well-known
  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/.well-known') ||
    pathname.startsWith('/api/search')
  ) {
    return applySecurityHeaders(NextResponse.next())
  }

  const rawCookie = request.cookies.get('better-auth.session_token')?.value || 
                    request.cookies.get('__Secure-better-auth.session_token')?.value

  // Fast path: allow unauthenticated public routes without DB lookup
  if (!rawCookie && publicRoutes.includes(pathname)) {
    return applySecurityHeaders(NextResponse.next())
  }

  // Get session (only when cookie is present)
  let session: any = null
  if (rawCookie) {
    try {
      session = await auth.api.getSession({
        headers: request.headers
      })
    } catch (err) {
      console.error('[admin middleware] getSession error:', err)
    }

    // Fallback cookie check
    if (!session?.user) {
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
        console.error('[admin middleware] DB fallback session check error:', e)
      }
    }
  }

  // Handle Root URL '/'
  if (pathname === '/') {
    if (!session?.user) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
    }
    const dest = await resolveAdminDestination(session.user)
    return applySecurityHeaders(NextResponse.redirect(new URL(dest, request.url)))
  }

  // Handle /dashboard redirect
  if (pathname === '/dashboard') {
    if (!session?.user) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
    }
    const dest = await resolveAdminDestination(session.user)
    return applySecurityHeaders(NextResponse.redirect(new URL(dest, request.url)))
  }

  // Handle /page-builder redirect
  if (pathname === '/page-builder' || pathname.startsWith('/page-builder/')) {
    if (!session?.user) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
    }
    const dest = await resolveAdminDestination(session.user)
    const suffix = pathname.replace(/^\/page-builder/, '')
    return applySecurityHeaders(NextResponse.redirect(new URL(`${dest}/page-builder${suffix}`, request.url)))
  }

  // If logged in and visiting /login
  if (pathname === '/login' && session?.user) {
    const user = session.user as any
    // If already authenticated as admin, go to admin dashboard
    if (user.role === 'admin') {
      const dest = await resolveAdminDestination(user)
      return applySecurityHeaders(NextResponse.redirect(new URL(dest, request.url)))
    }
    // If logged in with another role (e.g. student, teacher), allow visiting /login to switch to admin
    return applySecurityHeaders(NextResponse.next())
  }

  // Allow public routes without authentication
  if (publicRoutes.includes(pathname)) {
    return applySecurityHeaders(NextResponse.next())
  }

  // Firewall for all /admin routes
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!session?.user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }

    const user = session.user as any
    if (user.role !== 'admin') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/unauthorized', request.url)))
    }

    if (pathname === '/admin') {
      const dest = await resolveAdminDestination(user)
      return applySecurityHeaders(NextResponse.redirect(new URL(dest, request.url)))
    }

    return applySecurityHeaders(NextResponse.next())
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!monitoring|_next/static|_next/image|favicon.ico|assets).*)'],
}

