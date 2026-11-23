import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'

export const getAuthBaseURL = () => {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  return process.env.NEXT_PUBLIC_AUTH_URL || (isLocal ? 'http://localhost:3002' : 'https://auth.vidyaschool.com')
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
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

export function logoutUser(redirectUrl?: string) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('auth:logout'))
    } catch {}
  }

  const AUTH_URL = getAuthBaseURL()

  // Immediately expire cookies client-side across domains
  if (typeof document !== 'undefined') {
    const isVidyaDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('vidyaschool.com')
    if (isVidyaDomain) {
      document.cookie = "better-auth.session_token=; path=/; domain=.vidyaschool.com; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      document.cookie = "__Secure-better-auth.session_token=; path=/; domain=.vidyaschool.com; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    }
    document.cookie = "better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "__Secure-better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }

  // Clear session storage & selective local storage
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

  // Server logout cleanup
  try {
    fetch(`${AUTH_URL}/api/auth/logout`, { method: "POST", keepalive: true, credentials: "include" }).catch(() => {})
    authClient.signOut().catch(() => {})
  } catch (e) {}

  window.location.href = redirectUrl || `${AUTH_URL}/login`
}
