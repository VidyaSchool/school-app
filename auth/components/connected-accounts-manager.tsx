'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { formatDate } from '@/lib/date-formatter'
import {
  CheckCircle2Icon,
  Loader2Icon,
  ShieldCheckIcon,
  UnlinkIcon,
  InfoIcon,
} from 'lucide-react'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.4 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.6 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

interface ProviderStatus {
  connected: boolean
  createdAt: string | null
  id: string | null
}

interface ConnectedAccountsData {
  google: ProviderStatus
  github: ProviderStatus
  hasPassword: boolean
  totalMethods: number
}

export function ConnectedAccountsManager() {
  const [data, setData] = useState<ConnectedAccountsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectingProvider, setConnectingProvider] = useState<'google' | 'github' | null>(null)
  const [disconnectingProvider, setDisconnectingProvider] = useState<'google' | 'github' | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/account/connected-accounts')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error('Failed to load connected accounts:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()

    // Handle return from OAuth callback (URL search params)
    const searchParams = new URLSearchParams(window.location.search)
    const connectedParam = searchParams.get('connected')
    const errorParam = searchParams.get('error')
    const errorDescParam = searchParams.get('error_description')

    if (connectedParam) {
      const name = connectedParam.charAt(0).toUpperCase() + connectedParam.slice(1)
      toast.success(`${name} account successfully connected!`)
      searchParams.delete('connected')
      const newQuery = searchParams.toString()
      const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '')
      window.history.replaceState({}, '', newUrl)
    } else if (errorParam || errorDescParam) {
      const friendlyErrors: Record<string, string> = {
        access_denied: 'Connection request was cancelled by the user.',
        redirect_uri_mismatch:
          'OAuth callback URL mismatch. Please ensure your OAuth app has http://localhost:3000/api/auth/callback/github (or google) registered as an authorized callback.',
        unable_to_link_account:
          'Unable to link account. Please ensure the provider has a verified email or try connecting again.',
        email_does_not_match:
          'Email on your social account does not match your VidyaSchool account email.',
        account_already_linked_to_different_user:
          'This social account is already linked to another VidyaSchool user.',
        invalid_state: 'Authentication session expired. Please try connecting again.',
      }

      const rawCode = errorParam || 'unknown'
      const displayMsg =
        errorDescParam ||
        friendlyErrors[rawCode] ||
        `Connection failed: ${rawCode}`

      toast.error(displayMsg)
      searchParams.delete('error')
      searchParams.delete('error_description')
      const newQuery = searchParams.toString()
      const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '')
      window.history.replaceState({}, '', newUrl)
    }
  }, [fetchStatus])

  const handleConnect = async (provider: 'google' | 'github') => {
    try {
      setConnectingProvider(provider)
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('tab', 'connect')
      currentUrl.searchParams.set('connected', provider)
      currentUrl.searchParams.delete('error')
      currentUrl.searchParams.delete('error_description')

      const errorUrl = new URL(window.location.href)
      errorUrl.searchParams.set('tab', 'connect')
      errorUrl.searchParams.delete('error')
      errorUrl.searchParams.delete('error_description')
      errorUrl.searchParams.delete('connected')

      const res = await authClient.linkSocial({
        provider,
        callbackURL: currentUrl.toString(),
        errorCallbackURL: errorUrl.toString(),
        disableRedirect: true,
      })

      if (res?.error) {
        toast.error(res.error.message || `Failed to initiate ${provider} connection.`)
        setConnectingProvider(null)
        return
      }

      if (res?.data && 'url' in res.data && typeof res.data.url === 'string') {
        window.location.href = res.data.url
      } else {
        toast.error(`Unable to get authorization link for ${provider}.`)
        setConnectingProvider(null)
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to initiate ${provider} connection.`)
      setConnectingProvider(null)
    }
  }

  const handleDisconnect = async (provider: 'google' | 'github') => {
    if (
      !data?.hasPassword &&
      data?.totalMethods &&
      data.totalMethods <= 1
    ) {
      toast.error(
        'Cannot disconnect your only sign-in method. You must set a password or connect another provider first.'
      )
      return
    }

    try {
      setDisconnectingProvider(provider)
      const res = await fetch('/api/account/connected-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to disconnect account')
      }

      toast.success(
        result.message ||
          `${provider.charAt(0).toUpperCase() + provider.slice(1)} account disconnected.`
      )
      fetchStatus()
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect account')
    } finally {
      setDisconnectingProvider(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Connect your Google or GitHub account to log in directly with 1-click without
            having to enter your email and password every time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <Loader2Icon className="size-6 animate-spin mr-2" />
              <span className="text-sm">Loading connected accounts...</span>
            </div>
          ) : (
            <div className="grid gap-4">
              {/* Google Account Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/10 transition-colors">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-background border border-border/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <GoogleIcon className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-foreground">Google</h4>
                      {data?.google.connected ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-medium inline-flex items-center gap-1 py-0 h-5">
                          <CheckCircle2Icon className="size-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground text-[11px] font-normal py-0 h-5"
                        >
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {data?.google.connected
                        ? `Connected${
                            data.google.createdAt
                              ? ` on ${formatDate(data.google.createdAt)}`
                              : ''
                          } • Can be used for 1-click sign in`
                        : 'Link your Google account for quick and secure 1-click sign in.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {data?.google.connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect('google')}
                      disabled={
                        disconnectingProvider === 'google' ||
                        (!data.hasPassword && data.totalMethods <= 1)
                      }
                      title={
                        !data.hasPassword && data.totalMethods <= 1
                          ? 'Cannot disconnect your only sign-in method'
                          : 'Disconnect Google Account'
                      }
                      className="cursor-pointer text-xs h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                    >
                      {disconnectingProvider === 'google' ? (
                        <>
                          <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <UnlinkIcon className="size-3.5 mr-1.5" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect('google')}
                      disabled={connectingProvider !== null}
                      className="cursor-pointer text-xs h-8 font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
                    >
                      {connectingProvider === 'google' ? (
                        <>
                          <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <GoogleIcon className="size-3.5 mr-1.5" />
                          Connect Google
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* GitHub Account Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/10 transition-colors">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-background border border-border/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <GitHubIcon className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-foreground">GitHub</h4>
                      {data?.github.connected ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-medium inline-flex items-center gap-1 py-0 h-5">
                          <CheckCircle2Icon className="size-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground text-[11px] font-normal py-0 h-5"
                        >
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {data?.github.connected
                        ? `Connected${
                            data.github.createdAt
                              ? ` on ${formatDate(data.github.createdAt)}`
                              : ''
                          } • Can be used for 1-click sign in`
                        : 'Link your GitHub account for developer-friendly 1-click sign in.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {data?.github.connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect('github')}
                      disabled={
                        disconnectingProvider === 'github' ||
                        (!data.hasPassword && data.totalMethods <= 1)
                      }
                      title={
                        !data.hasPassword && data.totalMethods <= 1
                          ? 'Cannot disconnect your only sign-in method'
                          : 'Disconnect GitHub Account'
                      }
                      className="cursor-pointer text-xs h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                    >
                      {disconnectingProvider === 'github' ? (
                        <>
                          <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <UnlinkIcon className="size-3.5 mr-1.5" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect('github')}
                      disabled={connectingProvider !== null}
                      className="cursor-pointer text-xs h-8 font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
                    >
                      {connectingProvider === 'github' ? (
                        <>
                          <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <GitHubIcon className="size-3.5 mr-1.5" />
                          Connect GitHub
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Helpful Info / Security Card */}
      <Card className="border-border/60 bg-muted/20">
        <CardContent className="p-4 sm:p-5 flex items-start gap-3.5">
          <ShieldCheckIcon className="size-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground">
              How 1-Click Login Works
            </p>
            <p>
              Once your Google or GitHub account is linked, you can bypass entering your email and password. On the login page, simply click{' '}
              <strong className="text-foreground font-semibold">Continue with Google</strong> or{' '}
              <strong className="text-foreground font-semibold">Continue with GitHub</strong> to access your VidyaSchool account immediately.
            </p>
            <p className="text-[11px] text-muted-foreground/80 pt-1">
              Your profile data, assignments, role permissions, and academic records remain safe and unified under your single VidyaSchool account.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
