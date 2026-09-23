"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  MailCheck,
  RotateCw,
  AtSign,
  AlertCircle,
  GraduationCap,
  UserCheck,
  User,
  Mail,
  Lock,
  Phone,
  Home
} from "lucide-react"

type RoleOption = "student" | "teacher"

const CLASS_OPTIONS = [
  { value: "Nursery", label: "Nursery" },
  { value: "KG", label: "Kindergarten (KG)" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Class ${i + 1}`,
  })),
]

const STATES_AND_CITIES: Record<string, string[]> = {
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak", "Sonipat", "Panchkula", "Other"],
  "Delhi (NCT)": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi", "Dwarka", "Rohini", "Other"],
  "Uttar Pradesh": ["Noida", "Greater Noida", "Ghaziabad", "Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj", "Meerut", "Other"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Alwar", "Bhiwadi", "Other"],
  "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali", "Bathinda", "Other"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Navi Mumbai", "Aurangabad", "Other"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Other"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Other"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Other"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol", "Other"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Other"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Other"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Other"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh", "Other"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu", "Other"],
  "Other State": ["Other City"],
}

export default function SignUpPage() {
  // Steps: 1 = Credentials, 2 = OTP Verification, 3 = Onboarding Details, 4 = Username Selection
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [submitting, setSubmitting] = useState(false)

  // ── Step 1: Credentials ──
  const [role, setRole] = useState<RoleOption>("student")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)

  // ── Step 2: OTP State ──
  const [otp, setOtp] = useState("")
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // ── Step 3: Onboarding Details ──
  const [admissionNumber, setAdmissionNumber] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [studentClass, setStudentClass] = useState("10")
  const [section, setSection] = useState("A")

  // Parent Info
  const [parentName, setParentName] = useState("")
  const [parentPhone, setParentPhone] = useState("")
  const [parentEmail, setParentEmail] = useState("")

  // Address: House Number, State, City, Pincode
  const [houseNumber, setHouseNumber] = useState("")
  const [stateName, setStateName] = useState("Haryana")
  const [city, setCity] = useState("Gurugram")
  const [pincode, setPincode] = useState("122001")

  // Teacher specific
  const [teacherCategory, setTeacherCategory] = useState("TGT")

  // ── Step 4: Username Selection ──
  const [username, setUsername] = useState("")
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  // Resend OTP Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Suggested Username generation when entering Step 4
  useEffect(() => {
    if (step === 4 && !username && name.trim()) {
      const suggested = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 12)
      if (suggested.length >= 3) {
        setUsername(suggested)
      }
    }
  }, [step, name, username])

  // Real-time Debounced Username Availability Check
  useEffect(() => {
    if (step !== 4 || !username.trim()) {
      setUsernameAvailable(null)
      setUsernameError(null)
      return
    }

    const clean = username.trim().toLowerCase()
    if (!/^[a-zA-Z0-9_-]{3,15}$/.test(clean)) {
      setUsernameAvailable(false)
      setUsernameError("Must be 3-15 alphanumeric characters")
      return
    }

    setCheckingUsername(true)
    setUsernameError(null)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/check-username?username=${encodeURIComponent(clean)}`)
        const data = await res.json()
        if (data.available) {
          setUsernameAvailable(true)
          setUsernameError(null)
        } else {
          setUsernameAvailable(false)
          setUsernameError(data.error || "Username is already taken")
        }
      } catch {
        setUsernameAvailable(null)
      } finally {
        setCheckingUsername(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [step, username])

  // ── Step 1 Handler: Send OTP ──
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()

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
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to send verification code")
        setSendingOtp(false)
        return
      }

      setStep(2)
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
    if (resendCooldown > 0 || sendingOtp) return
    setSendingOtp(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to resend code")
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

  // ── Step 2 Handler: Verify OTP ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error("Please enter the complete 6-digit verification code")
      return
    }

    setVerifyingOtp(true)

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Invalid verification code")
        setVerifyingOtp(false)
        return
      }

      toast.success("Email verified successfully!")
      setStep(3)
    } catch {
      toast.error("Verification failed. Please try again.")
    } finally {
      setVerifyingOtp(false)
    }
  }

  // ── Step 3 Handler: Validate Onboarding Form ──
  const handleProceedToUsername = (e: React.FormEvent) => {
    e.preventDefault()

    if (!admissionNumber.trim()) {
      toast.error(role === "student" ? "Please enter your Admission Number" : "Please enter your Staff / Teacher ID")
      return
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 10) {
      toast.error("Please enter a valid 10-digit contact number")
      return
    }

    if (role === "student") {
      if (!parentName.trim()) {
        toast.error("Please enter parent or guardian name")
        return
      }
      if (!parentPhone.trim() || parentPhone.trim().length < 10) {
        toast.error("Please enter a valid parent contact number")
        return
      }
    }

    if (!houseNumber.trim()) {
      toast.error("Please enter house number or street address")
      return
    }
    if (!stateName.trim()) {
      toast.error("Please select your state")
      return
    }
    if (!city.trim()) {
      toast.error("Please select your city")
      return
    }
    if (!pincode.trim() || pincode.trim().length < 6) {
      toast.error("Please enter a valid 6-digit pincode")
      return
    }

    setStep(4)
  }

  // ── Step 4 Handler: Complete Registration ──
  const handleCompleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanUsername = username.trim().toLowerCase()
    if (!/^[a-zA-Z0-9_-]{3,15}$/.test(cleanUsername)) {
      toast.error("Username must be 3-15 characters (letters, numbers, hyphens, underscores)")
      return
    }

    if (usernameAvailable === false) {
      toast.error(usernameError || "Please choose an available username")
      return
    }

    setSubmitting(true)

    try {
      // 1. Create account via Better-Auth
      const { error: signUpError } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        preferredRole: role,
      } as any)

      if (signUpError) {
        toast.error(signUpError.message || "Failed to create account")
        setSubmitting(false)
        return
      }

      // 2. Persist onboarding profile data into AWS PostgreSQL
      const profilePayload = {
        role,
        username: cleanUsername,
        admissionNumber: admissionNumber.trim(),
        phoneNumber: phoneNumber.trim(),
        parentName: role === "student" ? parentName.trim() : undefined,
        parentPhone: role === "student" ? parentPhone.trim() : undefined,
        parentEmail: role === "student" && parentEmail.trim() ? parentEmail.trim() : undefined,
        address: houseNumber.trim(),
        state: stateName.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        class: role === "student" ? studentClass : undefined,
        section: role === "student" ? section : undefined,
        designation: role === "teacher" ? teacherCategory : undefined,
      }

      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to finalize profile")
      }

      toast.success("Account created successfully!")

      setTimeout(() => {
        if (role === "teacher") {
          window.location.href = `/teacher/${cleanUsername}`
        } else {
          window.location.href = `/student/${cleanUsername}`
        }
      }, 1000)
    } catch (err: any) {
      console.error("[SignUp] Finalize error:", err)
      toast.error(err.message || "Failed to complete account registration")
      setSubmitting(false)
    }
  }

  // Handle State Change -> Auto-select first city of new state
  const handleStateChange = (newState: string) => {
    setStateName(newState)
    const availableCities = STATES_AND_CITIES[newState] || ["Other"]
    setCity(availableCities[0] || "Other")
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-background text-foreground">
      {/* ── Left Column: Form ── */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 text-lg tracking-tight font-medium">
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

            {/* ════════════════════════════════════════════════════════════
               STEP 1: Name, Email, Password, Role
               ════════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-5 animate-fade-in">
                <div className="flex flex-col gap-1 text-center">
                  <h1 className="text-2xl font-medium tracking-tight">Create an account</h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your details to register
                  </p>
                </div>

                {/* Role Switcher */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-normal">Select Role</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={cn(
                        "flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer font-normal",
                        role === "student"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <GraduationCap className="h-4 w-4" />
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("teacher")}
                      className={cn(
                        "flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer font-normal",
                        role === "teacher"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <UserCheck className="h-4 w-4" />
                      Teacher
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-normal">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 text-sm font-normal"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-normal">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 text-sm font-normal"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-normal">Password (8+ characters)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10 text-sm font-normal"
                      minLength={8}
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
                </div>

                <Button type="submit" className="w-full gap-2 cursor-pointer font-normal" disabled={sendingOtp}>
                  {sendingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-2 text-xs text-muted-foreground font-normal">
                  Already have an account?{" "}
                  <Link href="/login" className="underline underline-offset-4 text-foreground hover:text-primary">
                    Sign in
                  </Link>
                </div>
              </form>
            )}

            {/* ════════════════════════════════════════════════════════════
               STEP 2: OTP Verification
               ════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in">
                <div className="flex flex-col gap-2 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-1">
                    <MailCheck className="h-6 w-6" />
                  </div>
                  <h1 className="text-2xl font-medium tracking-tight">Verify Your Email</h1>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-center block text-xs font-normal">Enter Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-xl font-mono tracking-[0.5em] placeholder:tracking-[0.5em] h-12 font-normal"
                    autoFocus
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full cursor-pointer font-normal"
                  disabled={verifyingOtp || otp.length !== 6}
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center text-muted-foreground hover:text-foreground cursor-pointer font-normal"
                  >
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Edit Email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || sendingOtp}
                    className="inline-flex items-center text-primary hover:underline cursor-pointer disabled:text-muted-foreground font-normal"
                  >
                    <RotateCw className={cn("mr-1 h-3.5 w-3.5", sendingOtp && "animate-spin")} />
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Code"}
                  </button>
                </div>
              </form>
            )}

            {/* ════════════════════════════════════════════════════════════
               STEP 3: Onboarding Form (Admission, Contact, Class & Section, Parent, Address)
               ════════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <form onSubmit={handleProceedToUsername} className="space-y-3.5 animate-fade-in">
                <div className="flex flex-col gap-1 text-center">
                  <h1 className="text-xl font-medium tracking-tight">Onboarding Details</h1>
                  <p className="text-xs text-muted-foreground">
                    Please provide your enrollment, parent, and address details
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {/* 1. Admission Number */}
                  <div className="space-y-1">
                    <Label htmlFor="idNum" className="text-xs font-normal">
                      {role === "student" ? "Admission Number *" : "Teacher / Staff ID *"}
                    </Label>
                    <Input
                      id="idNum"
                      type="text"
                      placeholder={role === "student" ? "e.g. VS-2026-001" : "e.g. TCH-102"}
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value)}
                      className="text-xs font-normal h-9"
                      required
                    />
                  </div>

                  {/* 2. Contact Number */}
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs font-normal">Contact Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="pl-8 text-xs font-normal h-9"
                        required
                      />
                    </div>
                  </div>

                  {/* 3. Class & Section (shadcn Select dropdowns including Nursery & KG) */}
                  {role === "student" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-normal">Class *</Label>
                        <Select value={studentClass} onValueChange={setStudentClass}>
                          <SelectTrigger className="w-full h-9 text-xs font-normal">
                            <SelectValue placeholder="Select Class" />
                          </SelectTrigger>
                          <SelectContent>
                            {CLASS_OPTIONS.map((c) => (
                              <SelectItem key={c.value} value={c.value} className="text-xs font-normal">
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-normal">Section *</Label>
                        <Select value={section} onValueChange={setSection}>
                          <SelectTrigger className="w-full h-9 text-xs font-normal">
                            <SelectValue placeholder="Select Section" />
                          </SelectTrigger>
                          <SelectContent>
                            {["A", "B", "C", "D", "E"].map((s) => (
                              <SelectItem key={s} value={s} className="text-xs font-normal">
                                Section {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Teacher Category (shadcn Select) */}
                  {role === "teacher" && (
                    <div className="space-y-1">
                      <Label className="text-xs font-normal">Teacher Category *</Label>
                      <Select value={teacherCategory} onValueChange={setTeacherCategory}>
                        <SelectTrigger className="w-full h-9 text-xs font-normal">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRT" className="text-xs font-normal">PRT (Primary Teacher)</SelectItem>
                          <SelectItem value="TGT" className="text-xs font-normal">TGT (Trained Graduate Teacher)</SelectItem>
                          <SelectItem value="PGT" className="text-xs font-normal">PGT (Post Graduate Teacher)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 4. Parent Info (for Student) */}
                  {role === "student" && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="pName" className="text-xs font-normal">Parent / Guardian Name *</Label>
                        <Input
                          id="pName"
                          type="text"
                          placeholder="Father or Mother name"
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          className="text-xs font-normal h-9"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="pPhone" className="text-xs font-normal">Parent Phone *</Label>
                          <Input
                            id="pPhone"
                            type="tel"
                            placeholder="10-digit mobile"
                            value={parentPhone}
                            onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            className="text-xs font-normal h-9"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="pEmail" className="text-xs font-normal">Parent Email</Label>
                          <Input
                            id="pEmail"
                            type="email"
                            placeholder="parent@example.com"
                            value={parentEmail}
                            onChange={(e) => setParentEmail(e.target.value)}
                            className="text-xs font-normal h-9"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* 5. Address Details: House Number / Street */}
                  <div className="space-y-1">
                    <Label htmlFor="houseNumber" className="text-xs font-normal">House Number / Street *</Label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        id="houseNumber"
                        type="text"
                        placeholder="House / Flat No., Building, Street"
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        className="pl-8 text-xs font-normal h-9"
                        required
                      />
                    </div>
                  </div>

                  {/* 6. State, City, Pincode (shadcn Select for State & City) */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-normal">State *</Label>
                      <Select value={stateName} onValueChange={handleStateChange}>
                        <SelectTrigger className="w-full h-9 text-xs font-normal">
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          {Object.keys(STATES_AND_CITIES).map((st) => (
                            <SelectItem key={st} value={st} className="text-xs font-normal">
                              {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-normal">City *</Label>
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger className="w-full h-9 text-xs font-normal">
                          <SelectValue placeholder="City" />
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          {(STATES_AND_CITIES[stateName] || ["Other"]).map((ct) => (
                            <SelectItem key={ct} value={ct} className="text-xs font-normal">
                              {ct}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pincode" className="text-xs font-normal">Pincode *</Label>
                      <Input
                        id="pincode"
                        type="text"
                        placeholder="6 digits"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="text-xs font-normal h-9"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="w-1/3 cursor-pointer font-normal"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 gap-2 cursor-pointer font-normal">
                    <span>Continue to Username</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* ════════════════════════════════════════════════════════════
               STEP 4: Username Selection & Account Finalization
               ════════════════════════════════════════════════════════════ */}
            {step === 4 && (
              <form onSubmit={handleCompleteAccount} className="space-y-5 animate-fade-in">
                <div className="flex flex-col gap-1 text-center">
                  <h1 className="text-2xl font-medium tracking-tight">Choose Username</h1>
                  <p className="text-sm text-muted-foreground">
                    Select a unique handle for your portal
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-normal">Username</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                      className={cn(
                        "pl-9 pr-10 font-mono text-sm font-normal",
                        usernameAvailable === true && "border-green-500 focus-visible:ring-green-500",
                        usernameAvailable === false && "border-destructive focus-visible:ring-destructive"
                      )}
                      maxLength={15}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingUsername ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : usernameAvailable === true ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : usernameAvailable === false ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : null}
                    </div>
                  </div>

                  {usernameError ? (
                    <p className="text-xs text-destructive flex items-center gap-1 font-normal">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {usernameError}
                    </p>
                  ) : usernameAvailable === true ? (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 font-normal">
                      <Check className="h-3.5 w-3.5" />
                      @{username} is available
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground font-normal">
                      3-15 characters (letters, numbers, hyphens, underscores)
                    </p>
                  )}
                </div>

                {/* Clean URL Preview */}
                <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-xs font-normal">
                  <span className="text-muted-foreground">Your Portal URL: </span>
                  <span className="font-mono text-foreground font-normal">
                    /{role}/{username || "username"}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(3)}
                    disabled={submitting}
                    className="w-1/3 cursor-pointer font-normal"
                  >
                    Back
                  </Button>

                  <Button
                    type="submit"
                    disabled={submitting || usernameAvailable === false}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>

      {/* ── Right Column: Clean Illustration (Matching Login Page) ── */}
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
