import { redirect } from 'next/navigation'
import { auth } from './auth'
import { headers } from 'next/headers'
import { db } from './db'
import { user as userTable, session as sessionTable } from './schema'
import { eq } from 'drizzle-orm'

export type Role = 'student' | 'teacher' | 'admin' | 'account' | 'librarian'

export async function getAuthenticatedSession(req?: any) {
  let hdrs: Headers
  try {
    hdrs = await headers()
  } catch {
    hdrs = req?.headers || new Headers()
  }

  let session = null
  try {
    session = await auth.api.getSession({
      headers: req?.headers || hdrs
    })
  } catch (err) {
    console.error('[getAuthenticatedSession] getSession error:', err)
  }

  if (!session?.user) {
    let tokenVal: string | null = null

    // 1. Check req.cookies if available
    if (req && 'cookies' in req && typeof req.cookies?.get === 'function') {
      tokenVal =
        req.cookies.get('__Secure-better-auth.session_token')?.value ||
        req.cookies.get('better-auth.session_token')?.value ||
        null
    }

    // 2. Check cookie header
    if (!tokenVal) {
      const rawCookie = req?.headers?.get?.('cookie') || hdrs.get('cookie')
      const cookieMatch = rawCookie?.match(/(?:__Secure-better-auth\.session_token|better-auth\.session_token)=([^;]+)/)
      tokenVal = cookieMatch ? cookieMatch[1] : null
    }

    // 3. Check authorization header (Bearer token)
    if (!tokenVal) {
      const authHeader = req?.headers?.get?.('authorization') || hdrs.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        tokenVal = authHeader.substring(7).trim()
      }
    }

    if (tokenVal) {
      const cleanToken = decodeURIComponent(tokenVal).split('.')[0]
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
        console.error('[getAuthenticatedSession] DB fallback session check error:', e)
      }
    }
  }

  return session
}

export async function getCurrentUser() {
  const session = await getAuthenticatedSession()
  return session?.user || null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

export async function requireRole(allowedRoles: Role | Role[]) {
  const user = await requireAuth()
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  const rolesWithLibrarian = roles.includes('teacher') && !roles.includes('librarian')
    ? [...roles, 'librarian' as Role]
    : roles
  
  if (!rolesWithLibrarian.includes(user.role as Role)) {
    redirect('/unauthorized')
  }
  
  return user
}

export function checkRole(userRole: string, allowedRoles: Role | Role[]): boolean {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  const rolesWithLibrarian = roles.includes('teacher') && !roles.includes('librarian')
    ? [...roles, 'librarian' as Role]
    : roles
  return rolesWithLibrarian.includes(userRole as Role)
}
