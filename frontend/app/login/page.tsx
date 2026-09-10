"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, RefreshCw, Smartphone, CheckCircle2, Loader2, KeyRound, ArrowLeft } from "lucide-react"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import { io, Socket } from "socket.io-client"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"
const ADMIN_FRONTEND_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001"
const QR_TTL = 180 // seconds

type QRStatus = "idle" | "generating" | "active" | "scanned" | "confirmed" | "expired"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<"form" | "qr">("form")

  // QR state
  const [qrStatus, setQrStatus] = useState<QRStatus>("idle")
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrSecondsLeft, setQrSecondsLeft] = useState(QR_TTL)
  const socketRef = useRef<Socket | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/profile/username')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          if (data.role === 'admin') {
            window.location.href = data.username ? `${ADMIN_FRONTEND_URL}/admin/${data.username}` : `${ADMIN_FRONTEND_URL}/admin`
            return
          }
          const roleDestMap: Record<string, string> = {
            teacher: '/teacher',
            librarian: '/librarian',
            account: '/accounts',
            student: '/student',
          }
          const prefix = roleDestMap[data.role] || '/student'
          if (data.onboardingCompleted && data.username) {
            window.location.href = `${prefix}/${data.username}`
          } else {
            window.location.href = '/signup/onboarding'
          }
        }
      })
      .catch(() => {})

    return () => {
      cleanupQR()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cleanupQR = useCallback((token?: string | null) => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    const t = token ?? qrToken
    if (socketRef.current && t) {
      socketRef.current.emit("leave_qr_room", { qr_token: t })
      socketRef.current.off("qr_auth_confirmed")
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [qrToken])

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
      toast.success(`Welcome back, ${user.name ?? "User"}! 🎉`)
      try {
        const res = await fetch('/api/profile/username')
        if (res.ok) {
          const data = await res.json()
          if (data.role === 'admin') {
            window.location.href = data.username ? `${ADMIN_FRONTEND_URL}/admin/${data.username}` : `${ADMIN_FRONTEND_URL}/admin`
            return
          }
          const roleDestMap: Record<string, string> = {
            teacher: '/teacher',
            librarian: '/librarian',
            account: '/accounts',
            student: '/student',
          }
          const prefix = roleDestMap[data.role] || '/student'
          if (data.onboardingCompleted && data.username) {
            window.location.href = `${prefix}/${data.username}`
            return
          } else {
            window.location.href = '/signup/onboarding'
            return
          }
        }
      } catch {}
      window.location.href = "/dashboard"
    } catch {
      window.location.href = `/dashboard?qr_session=${sessionToken}`
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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      })

      if (error) {
        toast.error(error.message || "Failed to sign in", {
          description: "Please check your credentials and try again.",
        })
        setLoading(false)
      } else {
        toast.success("Login successful! Redirecting...")
        try {
          const res = await fetch('/api/profile/username')
          if (res.ok) {
            const data = await res.json()
            if (data.role === 'admin') {
              window.location.href = data.username ? `${ADMIN_FRONTEND_URL}/admin/${data.username}` : `${ADMIN_FRONTEND_URL}/admin`
              return
            }
            const roleDestMap: Record<string, string> = {
              teacher: '/teacher',
              librarian: '/librarian',
              account: '/accounts',
              student: '/student',
            }
            const prefix = roleDestMap[data.role] || '/student'
            if (data.onboardingCompleted && data.username) {
              window.location.href = `${prefix}/${data.username}`
              return
            } else {
              window.location.href = '/signup/onboarding'
              return
            }
          }
        } catch {}
        window.location.href = "/dashboard"
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred during sign in.")
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    })
  }

  const handleGitHubSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    })
  }

  const countdownPct = (qrSecondsLeft / QR_TTL) * 100
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  // Memoize QR value so SVG stays 100% static during countdown without re-evaluating
  const qrPayloadString = useCallback(() => {
    if (!qrToken) return ""
    return JSON.stringify({
      type: "vidyaschool_qr_login",
      token: qrToken,
    })
  }, [qrToken])()

  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-background text-foreground">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <Image
              src="/assets/vidyaschool/Logo/no_title.svg"
              alt="VidyaSchool Logo"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
            VidyaSchool
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-6">

            {/* ── MODE 1: EMAIL & PASSWORD FORM ─────────────────────────── */}
            {mode === "form" ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-1.5 text-center">
                  <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                  <p className="text-sm text-muted-foreground">
                    Sign in to your VidyaSchool workspace
                  </p>
                </div>

                <form onSubmit={handleEmailSignIn} className="flex flex-col gap-5">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </Field>

                    <Field>
                      <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Link href="/forgot-password" className="ml-auto text-xs underline-offset-4 hover:underline text-muted-foreground hover:text-foreground">
                          Forgot password?
                        </Link>
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
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </Field>

                    <Field>
                      <Button type="submit" className="w-full font-semibold" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                      </Button>
                    </Field>
                  </FieldGroup>
                </form>

                {/* ── Social Login Row with Padding Top ────────────────── */}
                <div className="flex flex-col gap-5 pt-6 mt-4">
                  <FieldSeparator>Or sign in with</FieldSeparator>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="h-10 border-border bg-background hover:bg-muted text-foreground transition-all duration-200"
                      title="Sign in with Google"
                    >
                      <svg width="721" height="737" viewBox="0 0 721 737" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                        <path d="M721 376.538C721 350.431 718.659 325.329 714.312 301.23L460.213 301.23V443.812L565.831 443.812C557.136 489.666 531.052 528.492 491.925 554.598V647.31H611.312C680.87 583.048 721 488.662 721 376.538Z" fill="#4285F4"/>
                        <path d="M367.857 736.34C467.179 736.34 550.448 703.54 611.312 647.31L491.925 554.598C459.153 576.688 417.351 590.076 367.857 590.076C272.214 590.076 190.951 525.479 161.857 438.457H39.461V533.512C99.9903 653.669 224.058 736.34 367.857 736.34Z" fill="#34A853"/>
                        <path d="M161.857 438.123C154.5 416.032 150.153 392.603 150.153 368.17C150.153 343.737 154.5 320.308 161.857 298.218V203.163H39.461C14.3799 252.699 0 308.594 0 368.17C0 427.747 14.3799 483.642 39.461 533.177L134.77 458.874L161.857 438.123Z" fill="#FBBC05"/>
                        <path d="M367.857 146.599C422.033 146.599 470.188 165.342 508.646 201.49L613.987 96.059C550.114 36.4823 467.179 0 367.857 0C224.058 0 99.9903 82.671 39.461 203.163L161.857 298.218C190.951 211.196 272.214 146.599 367.857 146.599Z" fill="#EA4335"/>
                      </svg>
                    </Button>

                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleGitHubSignIn}
                      className="h-10 border-border bg-background hover:bg-muted text-foreground transition-all duration-200"
                      title="Sign in with GitHub"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor" />
                      </svg>
                    </Button>

                    <Button
                      variant="outline"
                      type="button"
                      onClick={enterQRMode}
                      className="h-10 border-border bg-background hover:bg-muted text-foreground transition-all duration-200"
                      title="Sign in with QR Code"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="solar solar-qr-code-bold-duotone h-4 w-4">
                        <g style={{ color: "currentColor", opacity: 0.6 }}>
                          <path d="M10.5531 13.4469C10.1294 13.0232 9.60212 12.8505 9.01812 12.772C8.46484 12.6976 7.76789 12.6976 6.93209 12.6977L5.82717 12.6977C5.24648 12.6977 4.76184 12.6976 4.36823 12.7351C3.95674 12.7742 3.57325 12.8591 3.22152 13.0746C2.87731 13.2856 2.5879 13.575 2.37697 13.9192C2.16142 14.2709 2.07653 14.6544 2.0374 15.0659C1.99998 15.4595 1.99999 15.9442 2 16.5249V16.5932C1.99999 17.477 1.99999 18.1897 2.05454 18.7635C2.1108 19.3552 2.22996 19.8707 2.51405 20.3343C2.80168 20.8037 3.19632 21.1983 3.6657 21.486C4.12929 21.77 4.64482 21.8892 5.23653 21.9455C5.8103 22 6.52304 22 7.40683 22H7.47507C8.05577 22 8.54048 22 8.9341 21.9626C9.34559 21.9235 9.72907 21.8386 10.0808 21.623C10.425 21.4121 10.7144 21.1227 10.9254 20.7785C11.1409 20.4267 11.2258 20.0433 11.2649 19.6318C11.3024 19.2382 11.3023 18.7535 11.3023 18.1728L11.3023 17.0679C11.3024 16.2321 11.3024 15.5352 11.228 14.9819C11.1495 14.3979 10.9768 13.8706 10.5531 13.4469Z" fill="currentColor" />
                          <path d="M8.9341 2.0374C9.34559 2.07653 9.72907 2.16142 10.0808 2.37697C10.425 2.5879 10.7144 2.87731 10.9254 3.22152C11.1409 3.57325 11.2258 3.95674 11.2649 4.36823C11.3024 4.76183 11.3023 5.24658 11.3023 5.82726L11.3023 6.93212C11.3024 7.7679 11.3024 8.46484 11.228 9.01812C11.1495 9.60212 10.9768 10.1294 10.5531 10.5531C10.1294 10.9768 9.60212 11.1495 9.01812 11.228C8.46484 11.3024 7.76787 11.3024 6.93209 11.3023L5.82711 11.3023C5.24643 11.3023 4.76183 11.3024 4.36823 11.2649C3.95674 11.2258 3.57325 11.1409 3.22152 10.9254C2.87731 10.7144 2.5879 10.425 2.37697 10.0808C2.16142 9.72907 2.07653 9.34559 2.0374 8.9341C1.99998 8.54047 1.99999 8.05579 2 7.47506V7.40679C1.99999 6.52302 1.99999 5.81029 2.05454 5.23653C2.1108 4.64482 2.22996 4.12929 2.51405 3.6657C2.80168 3.19632 3.19632 2.80168 3.6657 2.51405C4.12929 2.22996 4.64482 2.1108 5.23653 2.05454C5.81029 1.99999 6.52307 1.99999 7.40684 2H7.4751C8.05583 1.99999 8.54047 1.99998 8.9341 2.0374Z" fill="currentColor" />
                          <path d="M16.5932 2H16.5249C15.9442 1.99999 15.4595 1.99998 15.0659 2.0374C14.6544 2.07653 14.2709 2.16142 13.9192 2.37697C13.575 2.5879 13.2856 2.87731 13.0746 3.22152C12.8591 3.57325 12.7742 3.95674 12.7351 4.36823C12.6976 4.76185 12.6977 5.24654 12.6977 5.82725L12.6977 6.93209C12.6976 7.76789 12.6976 8.46484 12.772 9.01812C12.8505 9.60212 13.0232 10.1294 13.4469 10.5531C13.8706 10.9768 14.3979 11.1495 14.9819 11.228C15.5352 11.3024 16.2321 11.3024 17.0679 11.3023L18.1728 11.3023C18.7535 11.3023 19.2382 11.3024 19.6318 11.2649C20.0433 11.2258 20.4267 11.1409 20.7785 10.9254C21.1227 10.7144 21.4121 10.425 21.623 10.0808C21.8386 9.72907 21.9235 9.34559 21.9626 8.9341C22 8.54048 22 8.05587 22 7.47517V7.40683C22 6.52304 22 5.8103 21.9455 5.23653C21.8892 4.64482 21.77 4.12929 21.486 3.6657C21.1983 3.19632 20.8037 2.80168 20.3343 2.51405C19.8707 2.22996 19.3552 2.1108 18.7635 2.05454C18.1897 1.99999 17.477 1.99999 16.5932 2Z" fill="currentColor" />
                        </g>
                        <path d="M14.0926 21.3024C14.0926 21.6877 13.7803 22.0001 13.3949 22.0001C13.0096 22.0001 12.6973 21.6877 12.6973 21.3024V18.5117H14.0926V21.3024Z" fill="currentColor" />
                        <path d="M21.3022 12.6978C20.9169 12.6978 20.6045 13.0101 20.6045 13.3954V16.6512H21.9998V13.3954C21.9998 13.0101 21.6875 12.6978 21.3022 12.6978Z" fill="currentColor" />
                        <path d="M21.9992 18.5352V18.5117H20.6039C20.6039 18.9547 20.6035 19.252 20.5878 19.4822C20.5725 19.7061 20.5451 19.8152 20.5154 19.8869C20.3974 20.1718 20.171 20.3982 19.8861 20.5162C19.8143 20.546 19.7053 20.5734 19.4813 20.5887C19.2511 20.6044 19.8538 20.6047 18.5109 20.6047H16.6504V22.0001H18.5344C18.9478 22.0001 19.293 22.0001 19.5763 21.9808C19.8713 21.9606 20.1499 21.9173 20.42 21.8054C21.0469 21.5457 21.5449 21.0477 21.8045 20.4209C21.9164 20.1508 21.9598 19.8722 21.9799 19.5772C21.9992 19.2938 21.9992 18.9487 21.9992 18.5352Z" fill="currentColor" />
                        <path d="M12.6973 16.6156V16.6512H14.0926C14.0926 15.9835 14.0935 15.5352 14.1282 15.1934C14.1618 14.8633 14.2212 14.7108 14.2886 14.6099C14.3734 14.4829 14.4824 14.3739 14.6094 14.2891C14.7103 14.2217 14.8628 14.1623 15.1929 14.1287C15.5347 14.0939 15.983 14.0931 16.6508 14.0931H18.5112V12.6978H16.6151C15.9922 12.6977 15.4725 12.6977 15.0517 12.7405C14.6113 12.7853 14.2025 12.8827 13.8342 13.1289C13.5549 13.3155 13.315 13.5553 13.1284 13.8347C12.8823 14.203 12.7848 14.6118 12.74 15.0522C12.6972 15.473 12.6973 15.9927 12.6973 16.6156Z" fill="currentColor" />
                        <path d="M16.0761 16.6173C16 16.8011 16 17.0341 16 17.5C16 17.9659 16 18.1989 16.0761 18.3827C16.1776 18.6277 16.3723 18.8224 16.6173 18.9239C16.8011 19 17.0341 19 17.5 19C17.9659 19 18.1989 19 18.3827 18.9239C18.6277 18.8224 18.8224 18.6277 18.9239 18.3827C19 18.1989 19 17.9659 19 17.5C19 17.0341 19 16.8011 18.9239 16.6173C18.8224 16.3723 18.6277 16.1776 18.3827 16.0761C18.1989 16 17.0341 16 17.5 16C17.0341 16 16.8011 16 16.6173 16.0761C16.3723 16.1776 16.1776 16.3723 16.0761 16.6173Z" fill="currentColor" />
                        <path d="M5.50821 18.6903C5.72656 18.8452 6.03581 18.8452 6.6543 18.8452C7.27278 18.8452 7.58203 18.8452 7.80038 18.6903C7.87743 18.6356 7.9447 18.5683 7.99937 18.4913C8.1543 18.2729 8.1543 17.9637 8.1543 17.3452C8.1543 16.7267 8.1543 16.4175 7.99937 16.1991C7.9447 16.1221 7.87743 16.0548 7.80038 16.0001C7.58203 15.8452 7.27276 15.8452 6.65428 15.8452C6.0358 15.8452 5.72656 15.8452 5.50821 16.0001C5.43117 16.0548 5.36389 16.1221 5.30923 16.1991C5.1543 16.4175 5.1543 16.7267 5.1543 17.3452C5.1543 17.9637 5.1543 18.2729 5.30923 18.4913C5.36389 18.5683 5.43117 18.6356 5.50821 18.6903Z" fill="currentColor" />
                        <path d="M6.6543 8.15479C6.03581 8.15479 5.72656 8.15479 5.50821 7.99986C5.43117 7.94519 5.36389 7.87792 5.30923 7.80087C5.1543 7.58252 5.1543 7.27327 5.1543 6.65479C5.1543 6.0363 5.1543 5.72705 5.30923 5.5087C5.36389 5.43165 5.43117 5.36438 5.50821 5.30971C5.72656 5.15479 6.03581 5.15479 6.6543 5.15479C7.27278 5.15479 7.58203 5.15479 7.80038 5.30971C7.87743 5.36438 7.9447 5.43165 7.99937 5.5087C8.1543 5.72705 8.1543 6.0363 8.1543 6.65479C8.1543 7.27327 8.1543 7.58252 7.99937 7.80087C7.9447 7.87792 7.87743 7.94519 7.80038 7.99986C7.58203 8.15479 7.27278 8.15479 6.6543 8.15479Z" fill="currentColor" />
                        <path d="M16.1996 8C16.418 8.15493 16.7272 8.15493 17.3457 8.15493C17.9642 8.15493 18.2734 8.15493 18.4918 8C18.5688 7.94533 18.6361 7.87806 18.6908 7.80101C18.8457 7.58266 18.8457 7.27342 18.8457 6.65493C18.8457 6.03644 18.8457 5.7272 18.6908 5.50885C18.6361 5.4318 18.5688 5.36453 18.4918 5.30986C18.2734 5.15493 17.9642 5.15493 17.3457 5.15493C16.7272 5.15493 16.418 5.15493 16.1996 5.30986C16.1226 5.36453 16.0553 5.4318 16.0006 5.50885C15.8457 5.7272 15.8457 6.03647 15.8457 6.65494C15.8457 7.27342 15.8457 7.58266 16.0006 7.80101C16.0553 7.87806 16.1226 7.94533 16.1996 8Z" fill="currentColor" />
                      </svg>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <FieldDescription className="text-center text-xs">
                      Don&apos;t have an account?{" "}
                      <Link href="/signup" className="underline underline-offset-4 text-foreground font-medium">
                        Sign up
                      </Link>
                    </FieldDescription>

                    <div className="rounded-lg border border-border/60 bg-muted/40 p-2.5 text-center text-xs text-muted-foreground">
                      School Administrator?{" "}
                      <a
                        href={`${ADMIN_FRONTEND_URL}/login`}
                        className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors inline-flex items-center gap-0.5"
                      >
                        Admin Portal &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              </div>
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
                  {/* High-contrast QR Frame to guarantee instant scanning on dark mode */}
                  <div
                    className={cn(
                      "relative rounded-2xl border border-border bg-white p-5 shadow-md transition-all duration-300 flex flex-col items-center justify-center dark:border-zinc-800",
                      qrStatus === "confirmed" && "border-zinc-900 ring-2 ring-zinc-900/20"
                    )}
                  >
                    <div className="w-[190px] h-[190px] flex items-center justify-center bg-white rounded-xl">
                      {qrStatus === "generating" && (
                        <Loader2 className="h-7 w-7 animate-spin text-zinc-900" />
                      )}

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
                          <CheckCircle2 className="h-12 w-12 text-zinc-900" style={{ animation: "pop-in 0.3s ease" }} />
                          <p className="text-xs font-bold text-zinc-900 text-center">
                            Authenticated!
                            <br />
                            <span className="text-[11px] font-normal text-zinc-500">Redirecting…</span>
                          </p>
                        </div>
                      )}

                      {qrStatus === "expired" && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="rounded-full bg-zinc-100 p-3">
                            <KeyRound className="h-6 w-6 text-zinc-600" />
                          </div>
                          <p className="text-xs text-zinc-500 text-center">QR expired</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Countdown indicator */}
                  {qrStatus === "active" && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <svg width="22" height="22" viewBox="0 0 24 24" className="text-foreground">
                        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
                        <circle
                          cx="12" cy="12" r="9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${2 * Math.PI * 9}`}
                          strokeDashoffset={`${2 * Math.PI * 9 * (1 - countdownPct / 100)}`}
                          strokeLinecap="round"
                          transform="rotate(-90 12 12)"
                          style={{ transition: "stroke-dashoffset 1s linear" }}
                        />
                      </svg>
                      <span className="font-mono text-foreground font-semibold">{formatTime(qrSecondsLeft)}</span>
                      <span>remaining</span>
                    </div>
                  )}

                  {/* Regenerate button */}
                  {(qrStatus === "expired" || qrStatus === "idle") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs font-semibold"
                      onClick={generateQR}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Generate New QR Code
                    </Button>
                  )}

                  {/* Single Back to Login Form Button (No Social Buttons!) */}
                  <Button
                    variant="outline"
                    className="w-full gap-2 mt-2 font-medium"
                    onClick={exitQRMode}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login form
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/assets/illustrations/kid.svg"
            alt="VidyaSchool Logo"
            width={400}
            height={400}
            className="object-contain animate-fade-in"
          />
        </div>
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
