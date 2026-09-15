"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, ArrowLeft, MailCheck, Loader2, RotateCw, ShieldCheck, Lock, Phone, Mail, ArrowRight } from "lucide-react"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"

export default function SignUpPage() {
  // Public registration is disabled by default for institutional security per school audit
  const allowPublicSignup = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_SIGNUP === "true"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<"student" | "teacher">("student")
  const [agreeConsent, setAgreeConsent] = useState(false)

  // OTP State
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreeConsent) {
      toast.error("Please agree to the Terms of Service and Privacy Policy to proceed")
      return
    }
    if (!name.trim()) {
      toast.error("Please enter your full name")
      return
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    setSendingOtp(true)

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to send verification code")
        setSendingOtp(false)
        return
      }

      setOtpSent(true)
      setResendCooldown(30)
      toast.success(data.message || `Verification code sent to ${email}`)
    } catch {
      toast.error("Failed to connect to verification server. Please try again.")
    } finally {
      setSendingOtp(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setSendingOtp(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to resend verification code")
      } else {
        setResendCooldown(30)
        toast.success(`A new verification code has been sent to ${email}`)
      }
    } catch {
      toast.error("Failed to resend code")
    } finally {
      setSendingOtp(false)
    }
  }

  // Step 2: Verify OTP & Create Account
  const handleVerifyOtpAndSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error("Please enter the complete 6-digit verification code")
      return
    }

    setVerifyingOtp(true)

    try {
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      })

      const verifyData = await verifyRes.json()

      if (!verifyRes.ok) {
        toast.error(verifyData.error || "Invalid verification code")
        setVerifyingOtp(false)
        return
      }

      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
      })

      if (error) {
        toast.error(error.message || "Failed to finalize account creation", {
          description: "Please try again.",
        })
        setVerifyingOtp(false)
        return
      }

      toast.success("Email verified successfully! Opening onboarding...")
      window.location.href = "/signup/onboarding"
    } catch {
      toast.error("Verification failed. Please try again.")
      setVerifyingOtp(false)
    }
  }

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/signup/onboarding",
    })
  }

  const handleGitHubSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/signup/onboarding",
    })
  }

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
          <div className="w-full max-w-sm">

            {/* CASE A: PUBLIC REGISTRATION DISABLED (INSTITUTIONAL ACCESS NOTICE) */}
            {!allowPublicSignup ? (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 border-primary/30 text-primary">
                    Institutional Account Access
                  </Badge>
                  <h1 className="text-2xl font-bold tracking-tight">School Provisioned Access</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Direct public self-registration is restricted for student data privacy and child safety.
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3.5 text-xs text-muted-foreground leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <Lock className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block text-xs">Enrolled Students & Guardians</strong>
                      Portal accounts and credentials are issued by the School Administration Office upon enrollment.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 border-t border-border/50 pt-3">
                    <ShieldCheck className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block text-xs">Teachers & Administrative Staff</strong>
                      Please sign in using your official institutional account (<code className="text-foreground">@vidya-india.org</code>).
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button asChild className="w-full font-semibold gap-2">
                    <Link href="/login">
                      <span>Sign In to Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button variant="outline" asChild className="w-full text-xs">
                    <Link href="/p/admission-process">
                      Admissions Information
                    </Link>
                  </Button>
                </div>

                <div className="border-t border-border/60 pt-4 text-center space-y-2 text-xs text-muted-foreground">
                  <p>Need your portal credentials issued or password reset?</p>
                  <div className="flex items-center justify-center gap-4 text-xs font-medium text-foreground">
                    <a href="tel:+918130672281" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      +91-8130672281
                    </a>
                    <span>•</span>
                    <a href="mailto:info.vidyaschool@vidya-india.org" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      Email Office
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              /* CASE B: PUBLIC REGISTRATION ENABLED VIA ENV WITH ROLES & CONSENT */
              <div className="space-y-6">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className={cn("flex flex-col gap-5 animate-fade-in")}>
                    <FieldGroup>
                      <div className="flex flex-col gap-1.5 text-center">
                        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
                        <p className="text-sm text-muted-foreground">
                          Institutional verification will be required
                        </p>
                      </div>

                      <Field>
                        <FieldLabel htmlFor="role">Account Role</FieldLabel>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRole("student")}
                            className={cn(
                              "px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer",
                              role === "student"
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-border text-muted-foreground hover:bg-muted"
                            )}
                          >
                            Student / Parent
                          </button>
                          <button
                            type="button"
                            onClick={() => setRole("teacher")}
                            className={cn(
                              "px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer",
                              role === "teacher"
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-border text-muted-foreground hover:bg-muted"
                            )}
                          >
                            Faculty / Staff
                          </button>
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="name">Full Name</FieldLabel>
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="email">Email Address</FieldLabel>
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="password">Password (8+ characters)</FieldLabel>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pr-10"
                            required
                            minLength={8}
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

                      <div className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          id="consent"
                          checked={agreeConsent}
                          onChange={(e) => setAgreeConsent(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          required
                        />
                        <label htmlFor="consent" className="cursor-pointer leading-snug">
                          I confirm that I am an enrolled student, guardian, or employee of VIDYA School and agree to the{" "}
                          <Link href="/docs/terms-of-service" className="underline hover:text-foreground">
                            Terms
                          </Link>{" "}
                          and{" "}
                          <Link href="/docs/privacy-policy" className="underline hover:text-foreground">
                            Privacy Policy
                          </Link>.
                        </label>
                      </div>

                      <Field>
                        <Button type="submit" className="w-full cursor-pointer font-semibold" disabled={sendingOtp}>
                          {sendingOtp ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...
                            </>
                          ) : (
                            "Send Verification Code"
                          )}
                        </Button>
                      </Field>

                      <div className="flex flex-col gap-4 pt-4 mt-2">
                        <FieldSeparator>Or sign in with</FieldSeparator>
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" type="button" onClick={handleGoogleSignIn}>
                            Google
                          </Button>
                          <Button variant="outline" type="button" onClick={handleGitHubSignIn}>
                            GitHub
                          </Button>
                        </div>

                        <FieldDescription className="text-center pt-2 text-xs">
                          Already have an account?{" "}
                          <Link href="/login" className="underline underline-offset-4 font-medium text-foreground">
                            Sign in
                          </Link>
                        </FieldDescription>
                      </div>
                    </FieldGroup>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtpAndSignUp} className={cn("flex flex-col gap-6 animate-fade-in")}>
                    <FieldGroup>
                      <div className="flex flex-col gap-2 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-1">
                          <MailCheck className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-bold">Verify Your Email</h1>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          We&apos;ve sent a 6-digit verification code to <strong className="text-foreground">{email}</strong>
                        </p>
                      </div>

                      <Field>
                        <FieldLabel htmlFor="otp" className="text-center w-full block">6-Digit Verification OTP Code</FieldLabel>
                        <Input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="••••••"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          className="text-center text-xl font-mono tracking-[0.5em] placeholder:tracking-[0.5em] font-bold h-12"
                          autoFocus
                          required
                        />
                      </Field>

                      <Field>
                        <Button type="submit" className="w-full cursor-pointer font-semibold" disabled={verifyingOtp || otp.length !== 6}>
                          {verifyingOtp ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Code...
                            </>
                          ) : (
                            "Verify & Continue"
                          )}
                        </Button>
                      </Field>

                      <div className="flex items-center justify-between text-xs pt-2">
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="inline-flex items-center text-muted-foreground hover:text-foreground cursor-pointer font-medium"
                        >
                          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Edit Email
                        </button>

                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resendCooldown > 0 || sendingOtp}
                          className="inline-flex items-center text-primary hover:underline cursor-pointer disabled:text-muted-foreground font-medium"
                        >
                          <RotateCw className={cn("mr-1 h-3.5 w-3.5", sendingOtp && "animate-spin")} />
                          {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend Code"}
                        </button>
                      </div>
                    </FieldGroup>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/assets/illustrations/kid.svg"
            alt="VidyaSchool Illustration"
            width={400}
            height={400}
            className="object-contain animate-fade-in"
          />
        </div>
      </div>
    </div>
  )
}
