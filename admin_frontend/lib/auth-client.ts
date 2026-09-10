import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'

// Always resolve to the actual origin at runtime so auth works on every
// Vercel deployment URL (preview, production, PR previews) — not just the
// one baked into NEXT_PUBLIC_APP_URL at build time.
const getBaseURL = () => {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
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

export const { signIn, signUp, signOut, useSession } = authClient

export function logoutUser() {
  // 1. Immediately expire cookies client-side so middleware sees empty session on next page load
  if (typeof document !== 'undefined') {
    document.cookie = "better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "__Secure-better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }

  // 2. Clear user session storage and local storage while safely preserving theme & UI preferences
  try {
    if (typeof localStorage !== 'undefined') {
      const savedPreferences: Record<string, string> = {}
      
      // Preserve all theme and appearance keys (e.g. 'theme', 'wrksz-theme', 'theme-mode', etc.)
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

      // Restore preserved theme and UI preferences
      for (const [k, v] of Object.entries(savedPreferences)) {
        localStorage.setItem(k, v)
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear()
    }
  } catch (e) {}

  // 3. Non-blocking background server cleanup with keepalive
  try {
    fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(() => {})
    authClient.signOut().catch(() => {})
  } catch (e) {}

  // 4. Redirect to /login instantly (< 10ms)
  window.location.href = "/login"
}
