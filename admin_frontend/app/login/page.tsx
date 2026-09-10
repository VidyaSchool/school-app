"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Eye,
  EyeOff,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  Loader2,
  KeyRound,
  ArrowLeft,
  Mail,
  MailCheck,
  ShieldCheck,
  Fingerprint,
} from "lucide-react"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import { io, Socket } from "socket.io-client"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"
const MAIN_FRONTEND_URL = process.env.NEXT_PUBLIC_MAIN_URL ?? "http://localhost:3000"
const QR_TTL = 180 // seconds

type QRStatus = "idle" | "generating" | "active" | "scanned" | "confirmed" | "expired"
type AuthStep = "credentials" | "mfa_select" | "mfa_otp"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<"form" | "qr">("form")

  // Multi-Factor Authentication State
  const [authStep, setAuthStep] = useState<AuthStep>("credentials")
  const [tempToken, setTempToken] = useState<string | null>(null)
  const [adminName, setAdminName] = useState<string>("")
  const [hasPasskey, setHasPasskey] = useState(false)

  // OTP State
  const [otp, setOtp] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpCooldown, setOtpCooldown] = useState(0)

  // WebAuthn / Physical Device State
  const [deviceAuthenticating, setDeviceAuthenticating] = useState(false)

  // QR state
  const [qrStatus, setQrStatus] = useState<QRStatus>("idle")
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrSecondsLeft, setQrSecondsLeft] = useState(QR_TTL)
  const socketRef = useRef<Socket | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cooldown timer for resending OTP
  useEffect(() => {
    if (otpCooldown <= 0) return
    const timer = setInterval(() => {
      setOtpCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [otpCooldown])

  useEffect(() => {
    fetch("/api/profile/username")
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data) => {
        if (data) {
          if (data.role === "admin") {
            if (data.username) {
              window.location.href = `/admin/${data.username}`
            } else {
              window.location.href = "/admin"
            }
          } else {
            await authClient.signOut()
            toast.error("Access Denied: This portal is exclusively for School Administrators.")
          }
        }
      })
      .catch(() => {})

    return () => {
      cleanupQR()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cleanupQR = useCallback(
    (token?: string | null) => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
      const t = token ?? qrToken
      if (socketRef.current && t) {
        socketRef.current.emit("leave_qr_room", { qr_token: t })
        socketRef.current.off("qr_auth_confirmed")
        socketRef.current.disconnect()
        socketRef.current = null
      }
    },
    [qrToken]
  )

  const generateQR = useCallback(async () => {
    cleanupQR()
    setQrStatus("generating")
    setQrToken(null)
    setQrSecondsLeft(QR_TTL)

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/qr/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Failed to generate QR")
      const data = await res.json()
      const token: string = data.qr_token
      setQrToken(token)
      setQrStatus("active")

      const socket = io(BACKEND_URL, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
      })
      socketRef.current = socket

      socket.on("connect", () => {
        socket.emit("join_qr_room", { qr_token: token })
      })

      socket.on("qr_auth_confirmed", async (payload: { session_token: string; user: Record<string, unknown> }) => {
        setQrStatus("confirmed")
        cleanupQR(token)
        await handleQRLoginSuccess(payload.session_token, payload.user)
      })

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`${BACKEND_URL}/api/auth/qr/status/${token}`)
          const pollData = await pollRes.json()
          if (pollData.status === "confirmed") {
            clearInterval(pollRef.current!)
            setQrStatus("confirmed")
            cleanupQR(token)
            await handleQRLoginSuccess(pollData.session_token, pollData.user)
          } else if (pollData.status === "expired") {
            clearInterval(pollRef.current!)
            setQrStatus("expired")
          }
        } catch {}
      }, 2000)

      countdownRef.current = setInterval(() => {
        setQrSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(countdownRef.current!)
            setQrStatus("expired")
            return 0
          }
          return s - 1
        })
      }, 1000)
    } catch {
      toast.error("Could not generate QR code. Please try again.")
      setQrStatus("idle")
    }
  }, [cleanupQR])

  const handleQRLoginSuccess = async (sessionToken: string, user: Record<string, unknown>) => {
    try {
      await fetch(`${window.location.origin}/api/auth/qr-callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: sessionToken, user }),
      })
      try {
        const res = await fetch("/api/profile/username")
        if (res.ok) {
          const data = await res.json()
          if (data.role === "admin") {
            toast.success(`Welcome back, ${user.name ?? "Administrator"}! 🎉`)
            window.location.href = data.username ? `/admin/${data.username}` : "/admin"
            return
          } else {
            await authClient.signOut()
            toast.error("Access Denied: This portal is exclusively for School Administrators.")
            return
          }
        }
      } catch {}
      window.location.href = "/admin"
    } catch {
      window.location.href = `/admin`
    }
  }

  const enterQRMode = () => {
    setMode("qr")
    generateQR()
  }

  const exitQRMode = () => {
    cleanupQR()
    setQrToken(null)
    setQrStatus("idle")
    setMode("form")
  }

  // ── STEP 1: Verify Email & Password Credentials ─────────────────────────
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/admin-mfa/verify-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to sign in", {
          description: "Please check your email and password.",
        })
        setLoading(false)
        return
      }

      // Valid admin credentials! Transition to MFA choice
      setTempToken(data.tempToken)
      setAdminName(data.name || "")
      setHasPasskey(Boolean(data.hasPasskey))
      setAuthStep("mfa_select")
      toast.info("Credentials verified. Please choose a secondary verification method.")
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred during sign in.")
    } finally {
      setLoading(false)
    }
  }

  // ── STEP 2A: Send OTP to Email ──────────────────────────────────────────
  const handleSendEmailOtp = async () => {
    if (!tempToken) return
    setSendingOtp(true)

    try {
      const res = await fetch("/api/auth/admin-mfa/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), tempToken }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch verification code")
      }

      toast.success(data.message || `Verification code sent to ${email}`)
      setAuthStep("mfa_otp")
      setOtpCooldown(30)
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification email")
    } finally {
      setSendingOtp(false)
    }
  }

  // ── STEP 2B: Verify Email OTP ───────────────────────────────────────────
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error("Please enter the complete 6-digit code")
      return
    }

    setVerifyingOtp(true)
    try {
      const res = await fetch("/api/auth/admin-mfa/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), tempToken }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid verification code")
      }

      toast.success("Identity verified! Logging into Admin Portal...")
      window.location.href = data.redirectUrl || "/admin"
    } catch (err: any) {
      toast.error(err.message || "Verification failed")
    } finally {
      setVerifyingOtp(false)
    }
  }

  // ── STEP 2C: Physical Device / Passkey Authentication (WebAuthn) ──────────
  const handleDeviceAuth = async () => {
    if (!tempToken) return
    setDeviceAuthenticating(true)

    try {
      if (typeof window === "undefined" || !window.PublicKeyCredential) {
        toast.error("Your browser or device does not support WebAuthn / Passkeys. Please use Email OTP instead.")
        setDeviceAuthenticating(false)
        return
      }

      const challengeBytes = new Uint8Array(32)
      window.crypto.getRandomValues(challengeBytes)

      let credential: any = null

      // If user has a registered passkey, attempt to verify it first
      if (hasPasskey) {
        try {
          credential = await navigator.credentials.get({
            publicKey: {
              challenge: challengeBytes,
              rpId: window.location.hostname,
              userVerification: "preferred",
              timeout: 60000,
            },
          })
        } catch (getErr) {
          console.warn("Could not get existing device credential, attempting enrollment:", getErr)
        }
      }

      // If no existing credential was matched, enroll & physically store the passkey on this device
      if (!credential) {
        toast.info("Touch your sensor or security key to register this device...")
        const userIdBytes = new TextEncoder().encode(email)
        credential = await navigator.credentials.create({
          publicKey: {
            challenge: challengeBytes,
            rp: {
              name: "VidyaSchool Administration",
              id: window.location.hostname,
            },
            user: {
              id: userIdBytes,
              name: email,
              displayName: adminName || email,
            },
            pubKeyCredParams: [
              { type: "public-key", alg: -7 }, // ES256
              { type: "public-key", alg: -257 }, // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform", // Touch ID, Windows Hello, device physical enclave
              userVerification: "preferred",
              residentKey: "preferred",
            },
            timeout: 60000,
          },
        })
      }

      if (!credential) {
        throw new Error("Device authentication cancelled or failed.")
      }

      const deviceName = navigator.userAgent.includes("Mac")
        ? "Apple Touch ID / Secure Enclave"
        : navigator.userAgent.includes("Windows")
        ? "Windows Hello / TPM"
        : "Physical Security Key"

      const res = await fetch("/api/auth/admin-mfa/verify-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          tempToken,
          credentialId: credential.id,
          deviceName,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to verify physical device")
      }

      toast.success("Physical device verified! Redirecting to Admin Portal...")
      window.location.href = data.redirectUrl || "/admin"
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        toast.error("Device verification was cancelled.")
      } else {
        toast.error(err.message || "Device authentication failed. Try Email OTP instead.")
      }
    } finally {
      setDeviceAuthenticating(false)
    }
  }

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/admin",
    })
  }

  const handleGitHubSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/admin",
    })
  }

  const countdownPct = (qrSecondsLeft / QR_TTL) * 100
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  const qrPayloadString = useCallback(() => {
    if (!qrToken) return ""
    return JSON.stringify({
      type: "vidyaschool_qr_login",
      token: qrToken,
    })
  }, [qrToken])()

  return (
    <div className="min-h-svh w-full flex flex-col items-center justify-center bg-background text-foreground p-4 sm:p-6 md:p-10">
      {/* Centered Brand Header */}
      <div className="mb-6 flex items-center gap-2.5 font-semibold text-lg tracking-tight">
        <Image
          src="/assets/vidyaschool/Logo/no_title.svg"
          alt="VidyaSchool Logo"
          width={26}
          height={26}
          className="h-6 w-6 object-contain"
        />
        VidyaSchool
      </div>

      {/* Centered Form Container */}
      <div className="w-full max-w-sm space-y-6">
            {/* ── MODE 1: EMAIL & PASSWORD / MFA ─────────────────────────── */}
            {mode === "form" ? (
              <>
                {/* ── SUB-STEP 1: Credentials ── */}
                {authStep === "credentials" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col gap-1.5 text-center">
                      <h1 className="text-2xl font-bold tracking-tight">Administrator Sign In</h1>
                      <p className="text-sm text-muted-foreground">
                        Access school administration and governance console
                      </p>
                    </div>

                    <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-5">
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="email">Email</FieldLabel>
                          <Input
                            id="email"
                            type="email"
                            placeholder="admin@vidyaschool.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </Field>

                        <Field>
                          <div className="flex items-center">
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <a
                              href={`${MAIN_FRONTEND_URL}/forgot-password`}
                              className="ml-auto text-xs underline-offset-4 hover:underline text-muted-foreground hover:text-foreground"
                            >
                              Forgot password?
                            </a>
                          </div>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </Field>

                        <Field>
                          <Button type="submit" className="w-full font-semibold cursor-pointer" disabled={loading}>
                            {loading ? "Verifying..." : "Continue"}
                          </Button>
                        </Field>
                      </FieldGroup>
                    </form>

                    {/* Social Login Row */}
                    <div className="flex flex-col gap-5 pt-6 mt-4">
                      <FieldSeparator>Or sign in with</FieldSeparator>

                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={handleGoogleSignIn}
                          className="h-10 border-border bg-background hover:bg-muted text-foreground transition-all duration-200 cursor-pointer"
                          title="Sign in with Google"
                        >
                          <svg
                            width="721"
                            height="737"
                            viewBox="0 0 721 737"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                          >
                            <path
                              d="M721 376.538C721 350.431 718.659 325.329 714.312 301.23L460.213 301.23V443.812L565.831 443.812C557.136 489.666 531.052 528.492 491.925 554.598V647.31H611.312C680.87 583.048 721 488.662 721 376.538Z"
                              fill="#4285F4"
                            />
                            <path
                              d="M367.857 736.34C467.179 736.34 550.448 703.54 611.312 647.31L491.925 554.598C459.153 576.688 417.351 590.076 367.857 590.076C272.214 590.076 190.951 525.479 161.857 438.457H39.461V533.512C99.9903 653.669 224.058 736.34 367.857 736.34Z"
                              fill="#34A853"
                            />
                            <path
                              d="M161.857 438.123C154.5 416.032 150.153 392.603 150.153 368.17C150.153 343.737 154.5 320.308 161.857 298.218V203.163H39.461C14.3799 252.699 0 308.594 0 368.17C0 427.747 14.3799 483.642 39.461 533.177L134.77 458.874L161.857 438.123Z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M367.857 146.599C422.033 146.599 470.188 165.342 508.646 201.49L613.987 96.059C550.114 36.4823 467.179 0 367.857 0C224.058 0 99.9903 82.671 39.461 203.163L161.857 298.218C190.951 211.196 272.214 146.599 367.857 146.599Z"
                              fill="#EA4335"
                            />
                          </svg>
                        </Button>

                        <Button
                          variant="outline"
                          type="button"
                          onClick={handleGitHubSignIn}
                          className="h-10 border-border bg-background hover:bg-muted text-foreground transition-all duration-200 cursor-pointer"
                          title="Sign in with GitHub"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                            <path
                              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                              fill="currentColor"
                            />
                          </svg>
                        </Button>

                        <Button
                          variant="outline"
                          type="button"
                          onClick={enterQRMode}
                          className="h-10 border-border bg-background hover:bg-muted text-foreground transition-all duration-200 cursor-pointer"
                          title="Sign in with QR Code"
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-lg border border-border/60 bg-muted/40 p-2.5 text-center text-xs text-muted-foreground">
                          Student, Teacher, or Staff member?{" "}
                          <a
                            href={`${MAIN_FRONTEND_URL}/login`}
                            className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors inline-flex items-center gap-0.5"
                          >
                            Main Portal &rarr;
                          </a>
                        </div>
                        <FieldDescription className="text-center text-xs text-muted-foreground">
                          Administrator accounts are provisioned internally by school administration.
                        </FieldDescription>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SUB-STEP 2: Multi-Factor Authentication Method Selection ── */}
                {authStep === "mfa_select" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight">Verify Your Identity</h1>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Select a secondary verification method to complete your administrator sign in as{" "}
                        <strong className="text-foreground">{email}</strong>
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Option 1: Physical Device / Passkey (Touch ID, Windows Hello, YubiKey) */}
                      <div
                        onClick={!deviceAuthenticating ? handleDeviceAuth : undefined}
                        className={cn(
                          "group relative flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-primary/50 transition-all cursor-pointer shadow-xs",
                          deviceAuthenticating && "opacity-70 pointer-events-none border-primary bg-primary/5"
                        )}
                      >
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                          {deviceAuthenticating ? (
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                          ) : (
                            <Fingerprint className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {hasPasskey ? "Authenticate with Saved Device" : "Authenticate with Physical Device"}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Hardware
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Use Touch ID, Windows Hello, Face ID, or a hardware security key (saved physically in your device&apos;s secure hardware).
                          </p>
                        </div>
                      </div>

                      {/* Option 2: Send OTP to Email */}
                      <div
                        onClick={!sendingOtp ? handleSendEmailOtp : undefined}
                        className={cn(
                          "group relative flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-primary/50 transition-all cursor-pointer shadow-xs",
                          sendingOtp && "opacity-70 pointer-events-none border-primary bg-primary/5"
                        )}
                      >
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                          {sendingOtp ? (
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          ) : (
                            <Mail className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">Send OTP to Email</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Email Code
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Receive a 6-digit one-time verification passcode sent to {email}.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthStep("credentials")
                          setTempToken(null)
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to credentials
                      </button>
                    </div>
                  </div>
                )}

                {/* ── SUB-STEP 3: 6-Digit Email OTP Entry ── */}
                {authStep === "mfa_otp" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-inner">
                        <MailCheck className="h-6 w-6" />
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight">Enter Verification Code</h1>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        A 6-digit code has been sent to <strong className="text-foreground">{email}</strong>
                      </p>
                    </div>

                    <form onSubmit={handleVerifyEmailOtp} className="space-y-5">
                      <Field>
                        <FieldLabel htmlFor="otp" className="text-center block">
                          6-Digit One-Time Passcode
                        </FieldLabel>
                        <Input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          placeholder="••••••"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          className="text-center text-2xl tracking-[0.5em] font-mono font-bold h-12"
                          required
                          autoFocus
                        />
                      </Field>

                      <Button
                        type="submit"
                        className="w-full font-semibold cursor-pointer"
                        disabled={verifyingOtp || otp.length !== 6}
                      >
                        {verifyingOtp ? "Verifying..." : "Verify & Sign In"}
                      </Button>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <button
                          type="button"
                          onClick={() => setAuthStep("mfa_select")}
                          className="hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          Choose another method
                        </button>

                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={otpCooldown > 0 || sendingOtp}
                          className={cn(
                            "hover:text-primary transition-colors cursor-pointer font-medium",
                            otpCooldown > 0 && "cursor-not-allowed opacity-50"
                          )}
                        >
                          {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : "Resend Code"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            ) : (
              /* ── MODE 2: QR CODE VIEW ─────────────────────────────────── */
              <div className="space-y-6">
                <div className="flex flex-col gap-1.5 text-center">
                  <h1 className="text-2xl font-bold tracking-tight">Scan to Login</h1>
                  <p className="text-sm text-muted-foreground">
                    Open the <strong>VidyaSchool app</strong> on your phone and tap <strong>QR Login</strong>
                  </p>
                </div>

                <div className="flex flex-col items-center gap-5">
                  <div
                    className={cn(
                      "relative rounded-2xl border border-border bg-white p-5 shadow-md transition-all duration-300 flex flex-col items-center justify-center dark:border-zinc-800",
                      qrStatus === "confirmed" && "border-zinc-900 ring-2 ring-zinc-900/20"
                    )}
                  >
                    <div className="w-[190px] h-[190px] flex items-center justify-center bg-white rounded-xl">
                      {qrStatus === "generating" && <Loader2 className="h-7 w-7 animate-spin text-zinc-900" />}

                      {qrStatus === "active" && qrToken && (
                        <QRCodeSVG
                          value={qrPayloadString}
                          size={180}
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                          level="H"
                          includeMargin={false}
                        />
                      )}

                      {qrStatus === "scanned" && (
                        <div className="flex flex-col items-center gap-2.5">
                          <Smartphone className="h-10 w-10 text-zinc-900 animate-pulse" />
                          <p className="text-xs font-semibold text-zinc-900 text-center">
                            QR Scanned!
                            <br />
                            <span className="text-[11px] font-normal text-zinc-500">Confirm on phone…</span>
                          </p>
                        </div>
                      )}

                      {qrStatus === "confirmed" && (
                        <div className="flex flex-col items-center gap-2.5">
                          <CheckCircle2
                            className="h-12 w-12 text-zinc-900"
                            style={{ animation: "pop-in 0.3s ease" }}
                          />
                          <p className="text-xs font-bold text-zinc-900 text-center">
                            Authorized!
                            <br />
                            <span className="text-[11px] font-normal text-zinc-500">Logging you in…</span>
                          </p>
                        </div>
                      )}

                      {qrStatus === "expired" && (
                        <div className="flex flex-col items-center gap-2 text-center p-2">
                          <p className="text-xs font-semibold text-zinc-700">QR Code Expired</p>
                          <p className="text-[11px] text-zinc-400">Click below to generate a fresh code</p>
                        </div>
                      )}
                    </div>

                    {qrStatus === "active" && (
                      <div className="w-full mt-3 space-y-1.5">
                        <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-900 transition-all duration-1000"
                            style={{ width: `${countdownPct}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-zinc-400 text-center font-mono">
                          Expires in {formatTime(qrSecondsLeft)}
                        </p>
                      </div>
                    )}
                  </div>

                  {qrStatus === "expired" && (
                    <Button variant="outline" className="w-full gap-2 font-medium" onClick={generateQR}>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Generate New QR Code
                    </Button>
                  )}

                  <Button variant="outline" className="w-full gap-2 mt-2 font-medium" onClick={exitQRMode}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to login form
                  </Button>
                </div>
              </div>
            )}
          </div>

      {/* Animations keyframe */}
      <style>{`
        @keyframes pop-in {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
