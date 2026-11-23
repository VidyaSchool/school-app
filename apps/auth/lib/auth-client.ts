import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'

const getBaseURL = () => {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: 'string', required: false },
        preferredRole: { type: 'string', required: false },
        teacherApprovalStatus: { type: 'string', required: false }
      }
    })
  ]
})

export const { signIn, signUp, signOut } = authClient
export const useBetterAuthSession = authClient.useSession
export { useSession } from '@/contexts/session-context'

export function logoutUser() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('auth:logout'))
    } catch {}
  }

  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || (isLocal ? 'http://localhost:3002' : 'https://auth.vidyaschool.com')

  // Immediately expire cookies client-side
  if (typeof document !== 'undefined') {
    const isVidyaDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('vidyaschool.com')
    if (isVidyaDomain) {
      document.cookie = "better-auth.session_token=; path=/; domain=.vidyaschool.com; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      document.cookie = "__Secure-better-auth.session_token=; path=/; domain=.vidyaschool.com; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    }
    document.cookie = "better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "__Secure-better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }

  // Clear user session storage and local storage while preserving theme & UI preferences
  try {
    if (typeof localStorage !== 'undefined') {
      const savedPreferences: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (
          k &&
          (k.toLowerCase().includes('theme') ||
            k.toLowerCase().includes('color-scheme') ||
            k === 'wrksz-theme' ||
            k === 'theme-preference' ||
            k === 'sidebar:state')
        ) {
          const val = localStorage.getItem(k)
          if (val !== null) savedPreferences[k] = val
        }
      }
      localStorage.clear()
      for (const [k, v] of Object.entries(savedPreferences)) {
        localStorage.setItem(k, v)
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear()
    }
  } catch (e) {}

  // Background server cleanup
  try {
    fetch(`${AUTH_URL}/api/auth/logout`, { method: "POST", keepalive: true, credentials: "include" }).catch(() => {})
    authClient.signOut().catch(() => {})
  } catch (e) {}

  // Redirect to /login
  window.location.href = `${AUTH_URL}/login`
}
