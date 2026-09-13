"use client"

import * as React from "react"
import { 
  Laptop, 
  Smartphone, 
  Trash2, 
  ShieldAlert, 
  LogOut, 
  Clock, 
  Globe, 
  Loader2,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface SessionInfo {
  id: string
  expiresAt: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export default function LoginAccountsPage() {
  const [sessions, setSessions] = React.useState<SessionInfo[]>([])
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  const fetchSessions = () => {
    fetch("/api/sessions")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load sessions")
        return res.json()
      })
      .then((data) => {
        setSessions(data.sessions || [])
        setCurrentSessionId(data.currentSessionId || null)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        toast.error("Failed to load active sessions")
        setLoading(false)
      })
  }

  React.useEffect(() => {
    fetchSessions()
  }, [])

  const handleRevokeSession = (sessionId: string) => {
    setActionLoading(sessionId)
    fetch(`/api/sessions?id=${sessionId}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to revoke session")
        return res.json()
      })
      .then(() => {
        toast.success("Device logged out successfully")
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      })
      .catch((err) => {
        console.error(err)
        toast.error("Failed to log out device")
      })
      .finally(() => {
        setActionLoading(null)
      })
  }

  const handleRevokeOtherSessions = () => {
    setActionLoading("other")
    fetch(`/api/sessions?id=other`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to revoke other sessions")
        return res.json()
      })
      .then(() => {
        toast.success("Logged out of all other devices")
        setSessions((prev) => prev.filter((s) => s.id === currentSessionId))
      })
      .catch((err) => {
        console.error(err)
        toast.error("Failed to log out other devices")
      })
      .finally(() => {
        setActionLoading(null)
      })
  }

  const parseUserAgent = (userAgent: string | null) => {
    if (!userAgent) return { device: "Android", browser: "VidyaSchool Mobile App", isMobile: true }
    const ua = userAgent.toLowerCase()
    let os = "Android"
    let browser = "VidyaSchool Mobile App"

    if (ua.includes("android app") || ua.includes("android-app") || ua.includes("okhttp") || ua.includes("vidyaschool") || ua.includes("mobile")) {
      os = "Android"
      browser = ua.includes("qr") ? "QR Mobile Login" : "VidyaSchool Mobile App"
    } else {
      if (ua.includes("windows")) os = "Windows"
      else if (ua.includes("macintosh") || ua.includes("mac os")) os = "macOS"
      else if (ua.includes("linux")) os = "Linux"
      else if (ua.includes("android")) os = "Android"
      else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS"

      if (ua.includes("chrome") || ua.includes("chromium")) browser = "Chrome"
      else if (ua.includes("safari")) browser = "Safari"
      else if (ua.includes("firefox")) browser = "Firefox"
      else if (ua.includes("edge")) browser = "Edge"
      else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera"
    }

    const browserLabel = browser === "VidyaSchool Mobile App" || browser === "Android App" || browser === "QR Mobile Login"
      ? browser
      : `${browser} on ${os}`

    return { device: os, browser: browserLabel, isMobile: os === "Android" || os === "iOS" }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading active sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            Sessions & Devices
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your active logins and securely log out from other devices.
          </p>
        </div>
        {sessions.length > 1 && (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleRevokeOtherSessions}
            disabled={actionLoading !== null}
            className="flex items-center gap-2 shrink-0 cursor-pointer"
          >
            {actionLoading === "other" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Log out of other devices
          </Button>
        )}
      </div>

      <Card className="animate-in fade-in duration-400">
        <CardHeader>
          <CardTitle className="text-base font-bold">Active Logins</CardTitle>
          <CardDescription>
            You are currently logged into the following devices:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((sess, idx) => {
            const isCurrent = sess.id === currentSessionId
            const uaInfo = parseUserAgent(sess.userAgent)
            
            return (
              <div key={sess.id}>
                {idx > 0 && <Separator className="my-4" />}
                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="bg-muted p-2 rounded-lg shrink-0 mt-0.5 text-muted-foreground">
                      {uaInfo.isMobile ? (
                        <Smartphone className="h-5 w-5" />
                      ) : (
                        <Laptop className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {uaInfo.browser}
                        </span>
                        {isCurrent && (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0.25 font-semibold shrink-0">
                            Current Device
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 shrink-0" />
                          <span className="truncate">IP Address: {sess.ipAddress || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>
                            Logged in on: {new Date(sess.createdAt).toLocaleDateString([], { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })} at {new Date(sess.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!isCurrent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevokeSession(sess.id)}
                      disabled={actionLoading !== null}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                      title="Log out of this device"
                    >
                      {actionLoading === sess.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
      
      <Card className="border-destructive/30 bg-destructive/5 dark:bg-destructive/10 animate-in fade-in duration-500">
        <CardHeader className="flex flex-row items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-destructive shrink-0" />
          <div>
            <CardTitle className="text-base font-bold text-destructive">Security Notice</CardTitle>
            <CardDescription className="text-destructive/80 text-xs sm:text-sm">
              If you see any suspicious activity or unrecognized active logins, we recommend changing your password immediately and logging out of all other devices.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
