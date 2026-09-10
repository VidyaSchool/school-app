"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Laptop, ShieldCheck, CheckCircle2, AlertCircle, Loader2, KeyRound, ExternalLink, LogIn } from "lucide-react"
import { toast } from "sonner"

function DeviceAuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const urlCode = searchParams?.get("code") || ""
  const [code, setCode] = useState(urlCode)
  const [loadingUser, setLoadingUser] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Fetch logged in user profile
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/backend/api/profile", { credentials: "include" })
        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (e) {
        setUser(null)
      } finally {
        setLoadingUser(false)
      }
    }
    checkAuth()
  }, [])

  const handleApprove = async () => {
    if (!code.trim()) {
      toast.error("Please enter a valid pairing code.")
      return
    }

    setApproving(true)
    setErrorMsg("")

    try {
      let res = await fetch("/api/backend/api/auth/device/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_code: code.trim().toUpperCase() }),
      })

      if (!res.ok) {
        // Fallback to direct backend URL if proxy failed
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.blazeneuro.com"
        res = await fetch(`${backendUrl}/api/auth/device/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ user_code: code.trim().toUpperCase() }),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || "Failed to authorize device.")
      }

      setApproved(true)
      toast.success("Device authorized successfully!")
    } catch (err: any) {
      const msg = err?.message || "Device authorization failed."
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setApproving(false)
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Checking authorization status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
            {approved ? (
              <CheckCircle2 className="size-8 text-emerald-500 animate-in zoom-in-75 duration-300" />
            ) : (
              <Laptop className="size-7 text-primary" />
            )}
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">
            {approved ? "Device Authorized!" : "Authorize New Device"}
          </CardTitle>
          <CardDescription className="text-xs">
            {approved
              ? "Your VidyaSchool Desktop App has been successfully connected."
              : "Connect your VidyaSchool Desktop App to your account."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {!approved ? (
            <>
              {/* Logged in User Badge */}
              {user ? (
                <div className="p-3 rounded-xl border bg-muted/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold truncate text-foreground">{user.name || "Logged In User"}</p>
                      <p className="text-muted-foreground truncate text-[11px]">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                    Active Session
                  </Badge>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                    <AlertCircle className="size-4 shrink-0" />
                    Authentication Required
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Please log into your VidyaSchool web account first to approve this device.
                  </p>
                  <Button
                    size="sm"
                    className="w-full text-xs font-semibold gap-1.5"
                    onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/auth/device?code=${code}`)}`)}
                  >
                    <LogIn className="size-3.5" /> Sign In to Continue
                  </Button>
                </div>
              )}

              {/* Code Display & Input */}
              <div className="space-y-2 text-center pt-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Device Pairing Code
                </label>
                {urlCode ? (
                  <div className="p-4 rounded-xl border bg-muted/40 text-center font-mono text-3xl font-extrabold tracking-widest text-primary shadow-inner">
                    {code}
                  </div>
                ) : (
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. KV3K-VS34"
                    className="text-center font-mono text-xl font-bold uppercase tracking-widest h-12"
                    maxLength={10}
                  />
                )}
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Security Note */}
              <div className="text-[11px] text-muted-foreground bg-muted/20 p-3 rounded-lg border text-center leading-relaxed">
                <ShieldCheck className="size-3.5 inline mr-1 text-primary" />
                By clicking <span className="font-semibold text-foreground">Approve & Sign In</span>, you grant this device access to your VidyaSchool student/teacher dashboard.
              </div>
            </>
          ) : (
            <div className="py-6 text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                <CheckCircle2 className="size-4" /> Code {code} Verified
              </div>
              <p className="text-sm text-muted-foreground">
                You may now close this browser tab and return to your VidyaSchool Desktop App.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-2 border-t">
          {!approved ? (
            user ? (
              <Button
                onClick={handleApprove}
                disabled={approving || !code.trim()}
                className="w-full font-bold h-11 text-sm shadow-md gap-2"
              >
                {approving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Authorizing...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" /> Approve & Sign In
                  </>
                )}
              </Button>
            ) : null
          ) : (
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="w-full text-xs font-semibold"
            >
              Go to Web Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

export default function DeviceAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <DeviceAuthContent />
    </Suspense>
  )
}
