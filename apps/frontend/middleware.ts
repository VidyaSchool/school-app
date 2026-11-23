export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit } from './lib/rate-limit'

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || (process.env.NODE_ENV === 'production' ? 'https://dashboard.vidyaschool.com' : 'http://localhost:3001')
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || (process.env.NODE_ENV === 'production' ? 'https://auth.vidyaschool.com' : 'http://localhost:3002')
const ERP_URL = process.env.NEXT_PUBLIC_ERP_URL || (process.env.NODE_ENV === 'production' ? 'https://erp.vidyaschool.com' : 'http://localhost:3003')

// Auth routes that live in the dedicated auth app
const authRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/login-accounts',
  '/auth',
]

// ERP routes that live in the dedicated erp_frontend app
const erpRoutes = [
  '/dashboard',
  '/student',
  '/teacher',
  '/librarian',
  '/accounts',
]

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

  // 2. REDIRECT ADMIN ROUTES TO ADMIN_FRONTEND
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return applySecurityHeaders(NextResponse.redirect(new URL(pathname + search, ADMIN_URL)))
  }

  // 3. REDIRECT AUTH ROUTES TO AUTH APP
  if (authRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return applySecurityHeaders(NextResponse.redirect(new URL(pathname + search, AUTH_URL)))
  }

  // 4. REDIRECT ERP ROUTES TO ERP_FRONTEND
  if (erpRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return applySecurityHeaders(NextResponse.redirect(new URL(pathname + search, ERP_URL)))
  }

  // 5. CSRF & ORIGIN INTEGRITY CHECK for API routes
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
        originHost.endsWith('.vidyaschool.com') ||
        originHost.endsWith('.blazeneuro.com')

      if (!isAllowedHost) {
        return applySecurityHeaders(
          NextResponse.json({ error: 'Forbidden: Untrusted Origin' }, { status: 403 })
        )
      }
    }
  }

  // 6. RATE LIMITING FOR PUBLIC API ENDPOINTS (/api/*)
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
        '127.0.0.1'

      const { allowed, remaining, reset } = checkRateLimit(`frontend_api:${ip}`, 300, 60000)

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
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!monitoring|_next/static|_next/image|favicon.ico|assets).*)'],
}
