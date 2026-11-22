export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'
import { db } from './lib/db'
import { userProfile } from './lib/schema'
import { eq } from 'drizzle-orm'
import { checkRateLimit } from './lib/rate-limit'

const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || 'http://localhost:3000'
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'
const ERP_URL = process.env.NEXT_PUBLIC_ERP_URL || 'http://localhost:3003'

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

  // 2. ROOT ROUTE REDIRECT (Visiting auth root redirects to login or main)
  if (pathname === '/') {
    return applySecurityHeaders(NextResponse.redirect(new URL('/login' + search, request.url)))
  }

  // 3. API RATE LIMITING (With strict brute-force protection for sign-in & OTP)
  if (pathname.startsWith('/api')) {
    const isExempt =
      pathname === '/api/profile/username' ||
      pathname === '/api/account' ||
      pathname === '/api/auth/get-session'

    if (!isExempt) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1'

      const isBruteForceTarget =
        pathname.startsWith('/api/auth/sign-in') ||
        pathname.startsWith('/api/auth/send-otp') ||
        pathname.startsWith('/api/auth/verify-otp') ||
        pathname.startsWith('/api/auth/forget-password') ||
        pathname.startsWith('/api/auth/reset-password')

      const isSensitive = isBruteForceTarget || pathname.startsWith('/api/profile/update')
      const limit = isBruteForceTarget ? 15 : isSensitive ? 60 : 300
      const key = `auth_api:${ip}:${isBruteForceTarget ? 'auth_strict' : isSensitive ? 'strict' : 'general'}`

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

  // 4. CHECK LOGGED-IN USERS ON /login AND /signup
  if (pathname === '/login' || pathname === '/signup') {
    const rawCookie = request.cookies.get('better-auth.session_token')?.value ||
      request.cookies.get('__Secure-better-auth.session_token')?.value

    if (rawCookie) {
      const isRSC = request.nextUrl.searchParams.has('_rsc') || request.headers.get('rsc') === '1'
      if (isRSC) return new NextResponse(null, { status: 204 })

      try {
        const session = await auth.api.getSession({ headers: request.headers })
        if (session?.user) {
          const user = session.user as any
          const target = request.nextUrl.searchParams.get('from') || request.nextUrl.searchParams.get('redirect')

          if (target) {
            try {
              if (target.startsWith('http://') || target.startsWith('https://')) {
                const targetUrl = new URL(target)
                const isSafeHost =
                  targetUrl.hostname === 'localhost' ||
                  targetUrl.hostname === '127.0.0.1' ||
                  targetUrl.hostname === 'vidyaschool.com' ||
                  targetUrl.hostname.endsWith('.vidyaschool.com') ||
                  targetUrl.hostname === 'vidyaschool.vercel.app'

                if (isSafeHost) {
                  return applySecurityHeaders(NextResponse.redirect(new URL(target)))
                }
              } else if (target.startsWith('/') && !target.startsWith('//') && !target.includes('\\')) {
                return applySecurityHeaders(NextResponse.redirect(new URL(`${ERP_URL}${target}`)))
              }
            } catch {}
          }

          if (user.role === 'admin') {
            return applySecurityHeaders(NextResponse.redirect(new URL(`${ADMIN_URL}/admin`)))
          }

          const profile = await db.query.userProfile.findFirst({
            where: eq(userProfile.userId, user.id)
          })

          if (profile?.onboardingCompleted && profile?.username) {
            const roleMap: Record<string, string> = {
              teacher: '/teacher',
              librarian: '/librarian',
              account: '/accounts',
              student: '/student',
            }
            const prefix = roleMap[user.role] || '/student'
            return applySecurityHeaders(NextResponse.redirect(new URL(`${ERP_URL}${prefix}/${profile.username}`)))
          } else {
            return applySecurityHeaders(NextResponse.redirect(new URL('/signup/onboarding', request.url)))
          }
        }
      } catch (err) {
        console.error('[auth middleware] session verify error:', err)
      }
    }
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!monitoring|_next/static|_next/image|favicon.ico|assets).*)'],
}
