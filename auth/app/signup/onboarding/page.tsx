"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  GraduationCap, 
  UserCheck, 
  BookOpen, 
  Shield, 
  Wallet, 
  Loader2, 
  ArrowLeft, 
  Check, 
  Sparkles,
  MapPin,
  Phone,
  User as UserIcon
} from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

type RoleOption = "student" | "teacher" | "librarian" | "admin" | "account"

const ROLES: { id: RoleOption; label: string; description: string; icon: any }[] = [
  { 
    id: "student", 
    label: "Student", 
    description: "Access class schedules, study materials, grades, and fee ledger", 
    icon: GraduationCap 
  },
  { 
    id: "teacher", 
    label: "Teacher / Educator", 
    description: "Manage class registers, grade exams, and upload study notes", 
    icon: UserCheck 
  },
  { 
    id: "librarian", 
    label: "Librarian", 
    description: "Manage book inventory, issue deadlines, and library fines", 
    icon: BookOpen 
  },
  { 
    id: "admin", 
    label: "School Administrator", 
    description: "System maintenance, staff approvals, and school settings", 
    icon: Shield 
  },
  { 
    id: "account", 
    label: "Accounts & Finance", 
    description: "Manage fee structures, payment verification, and financial audits", 
    icon: Wallet 
  },
]

export default function SignUpOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Step state (1: Role, 2: Profile Details, 3: Username)
  const [step, setStep] = useState(1)

  // Form Fields
  const [role, setRole] = useState<RoleOption>("student")
  const [username, setUsername] = useState("")
  const [admissionNumber, setAdmissionNumber] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [studentClass, setStudentClass] = useState("10")
  const [section, setSection] = useState("A")
  const [transportMode, setTransportMode] = useState("walking")

  // Parent Info (Student)
  const [parentName, setParentName] = useState("")
  const [parentPhone, setParentPhone] = useState("")
  const [parentEmail, setParentEmail] = useState("")

  // Address
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [pincode, setPincode] = useState("")

  // Admin / Accounts designations
  const [secondaryRole, setSecondaryRole] = useState("principal")
  const [designation, setDesignation] = useState("accountant")

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const res = await fetch("/api/account")
        if (!res.ok) {
          router.push("/login")
          return
        }
        const data = await res.json()
        setUser(data.user)
        
        // If user already completed onboarding, redirect to dashboard
        if (data.profile?.onboardingCompleted && data.profile?.username) {
          const destMap: Record<string, string> = {
            student: `/student/${data.profile.username}`,
            teacher: `/teacher/${data.profile.username}`,
            admin: `/admin/${data.profile.username}`,
            account: `/accounts/${data.profile.username}`,
            librarian: `/librarian/${data.profile.username}`,
          }
          router.push(destMap[data.user.role] || `/student/${data.profile.username}`)
          return
        }
        setLoading(false)
      } catch (err) {
        router.push("/login")
      }
    }

    void checkUserSession()
  }, [router])

  const handleNextStep1 = () => {
    setStep(2)
  }

  const handleNextStep2 = () => {
    // Basic validations
    if (role === "student") {
      if (!admissionNumber.trim()) {
        toast.error("Please enter your Admission Number")
        return
      }
      if (!phoneNumber.trim()) {
        toast.error("Please enter your Phone Number")
        return
      }
      if (!parentName.trim() || !parentPhone.trim()) {
        toast.error("Please enter parent/guardian contact details")
        return
      }
    } else if (role === "teacher" || role === "librarian") {
      if (!admissionNumber.trim()) {
        toast.error(role === "teacher" ? "Please enter your Staff / Teacher ID" : "Please enter your Librarian ID")
        return
      }
      if (!phoneNumber.trim()) {
        toast.error("Please enter your Phone Number")
        return
      }
    }
    setStep(3)
  }

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      toast.error("Please choose a unique username")
      return
    }

    const cleanUsername = username.trim().toLowerCase()
    if (!/^[a-zA-Z0-9_-]{3,15}$/.test(cleanUsername)) {
      toast.error("Username must be 3-15 characters long (letters, numbers, hyphens, underscores).")
      return
    }

    setSubmitting(true)

    try {
      // 1. Submit onboarding profile to backend API
      const response = await fetch("/api/backend/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          preferredRole: role,
          admissionNumber: admissionNumber.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
          parentName: role === "student" ? parentName.trim() : undefined,
          parentPhone: role === "student" ? parentPhone.trim() : undefined,
          parentEmail: role === "student" ? parentEmail.trim() : undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          pincode: pincode.trim() || undefined,
          class: role === "student" ? studentClass : undefined,
          section: role === "student" ? section : undefined,
          transportMode: role === "student" ? transportMode : undefined,
          secondaryRole: role === "admin" ? secondaryRole : undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || data.error || "Failed to complete onboarding")
      }

      // 2. Also sync to frontend Drizzle DB profile route
      await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          phoneNumber,
          parentName: role === "student" ? parentName : undefined,
          parentPhone: role === "student" ? parentPhone : undefined,
          parentEmail: role === "student" ? parentEmail : undefined,
          address,
          city,
          state,
          pincode,
          class: role === "student" ? studentClass : undefined,
          section: role === "student" ? section : undefined,
          secondaryRole: role === "admin" ? secondaryRole : undefined,
        }),
      }).catch(() => {})

      // 3. Create teacher/librarian approval request if necessary
      if ((role === "teacher" || role === "librarian") && user?.id) {
        await fetch("/api/admin/teacher-requests/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, preferredRole: role })
        }).catch(() => {})
      }

      toast.success("Account setup completed! Welcome to VidyaSchool.")

      // 4. Redirect to appropriate dashboard
      const isLocal = typeof window !== 'undefined'
        ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        : process.env.NODE_ENV === 'development'
      const ERP_FRONTEND_URL = process.env.NEXT_PUBLIC_ERP_URL || (isLocal ? 'http://localhost:3003' : 'https://erp.vidyaschool.com')
      const ADMIN_FRONTEND_URL = process.env.NEXT_PUBLIC_ADMIN_URL || (isLocal ? 'http://localhost:3001' : 'https://dashboard.vidyaschool.com')

      if (role === 'admin') {
        window.location.href = `${ADMIN_FRONTEND_URL}/admin/${cleanUsername}`
      } else {
        const destMap: Record<string, string> = {
          student: `${ERP_FRONTEND_URL}/student/${cleanUsername}`,
          teacher: `${ERP_FRONTEND_URL}/teacher/${cleanUsername}`,
          account: `${ERP_FRONTEND_URL}/accounts/${cleanUsername}`,
          librarian: `${ERP_FRONTEND_URL}/librarian/${cleanUsername}`,
        }
        window.location.href = destMap[role] || `${ERP_FRONTEND_URL}/student/${cleanUsername}`
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during setup")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Initializing account setup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left Column: Form Card with Steps */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/assets/vidyaschool/Logo/no_title.svg"
              alt="VidyaSchool Logo"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
            VidyaSchool
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-8 px-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    step === s ? "bg-primary text-primary-foreground" : step > s ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {step > s ? <Check className="h-4 w-4" /> : s}
                  </div>
                  <span className={`text-xs font-semibold ${step === s ? "text-foreground" : "text-muted-foreground"}`}>
                    {s === 1 ? "Role" : s === 2 ? "Profile Details" : "Username"}
                  </span>
                </div>
              ))}
            </div>

            {/* STEP 1: Select Preferred Role */}
            {step === 1 && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="flex flex-col gap-2 text-center">
                  <h1 className="text-2xl font-bold tracking-tight">Select Your Role</h1>
                  <p className="text-balance text-sm text-muted-foreground">
                    Choose your primary role at VidyaSchool to customize your portal setup
                  </p>
                </div>

                <RadioGroup value={role} onValueChange={(val) => setRole(val as RoleOption)} className="grid gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {ROLES.map((r) => {
                    const Icon = r.icon
                    const isSelected = role === r.id
                    return (
                      <div
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={`flex items-start gap-3.5 p-4 border rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                            : "border-border hover:border-muted-foreground/30 hover:bg-muted/20"
                        }`}
                      >
                        <RadioGroupItem value={r.id} id={`role-${r.id}`} className="mt-1 cursor-pointer" />
                        <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <Label htmlFor={`role-${r.id}`} className="flex-1 space-y-1 cursor-pointer">
                          <h4 className="text-sm font-bold text-foreground leading-none">{r.label}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed font-normal">{r.description}</p>
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>

                {(role === "teacher" || role === "librarian") && (
                  <div className="p-3 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20 font-medium">
                    Note: Educator and Librarian registrations require administrator approval before unlocking full dashboard privileges.
                  </div>
                )}

                <Button onClick={handleNextStep1} className="w-full cursor-pointer">
                  Next Step: Fill Details
                </Button>
              </div>
            )}

            {/* STEP 2: Fill Profile Details */}
            {step === 2 && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full cursor-pointer" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex flex-col">
                    <h1 className="text-xl font-bold tracking-tight">Complete Profile Details</h1>
                    <p className="text-xs text-muted-foreground">Setting up details for {ROLES.find(r => r.id === role)?.label}</p>
                  </div>
                </div>

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  
                  {/* Student Details */}
                  {role === "student" && (
                    <>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="admissionNumber">Admission Number *</FieldLabel>
                          <Input
                            id="admissionNumber"
                            placeholder="e.g. VS-202601"
                            value={admissionNumber}
                            onChange={(e) => setAdmissionNumber(e.target.value)}
                            required
                          />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                          <Field>
                            <FieldLabel>Class</FieldLabel>
                            <Select value={studentClass} onValueChange={setStudentClass}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {["Nursery", "KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((c) => (
                                  <SelectItem key={c} value={c}>{c === "Nursery" || c === "KG" ? c : `Class ${c}`}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field>
                            <FieldLabel>Section</FieldLabel>
                            <Select value={section} onValueChange={setSection}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {["A", "B", "C", "D"].map((s) => (
                                  <SelectItem key={s} value={s}>Section {s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>

                        <Field>
                          <FieldLabel htmlFor="phone">Student Phone Number *</FieldLabel>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="10-digit mobile number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                          />
                        </Field>

                        <Field>
                          <FieldLabel>Commute / Transport Mode</FieldLabel>
                          <Select value={transportMode} onValueChange={setTransportMode}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="walking">Self / Walking / On Foot</SelectItem>
                              <SelectItem value="transport">School Transport (Bus / Van)</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="parentName">Parent / Guardian Name *</FieldLabel>
                          <Input
                            id="parentName"
                            placeholder="Parent full name"
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            required
                          />
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="parentPhone">Parent / Guardian Phone *</FieldLabel>
                          <Input
                            id="parentPhone"
                            type="tel"
                            placeholder="10-digit mobile number"
                            value={parentPhone}
                            onChange={(e) => setParentPhone(e.target.value)}
                            required
                          />
                        </Field>
                      </FieldGroup>
                    </>
                  )}

                  {/* Teacher / Librarian Details */}
                  {(role === "teacher" || role === "librarian") && (
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="staffId">
                          {role === "teacher" ? "Teacher / Staff Registration ID *" : "Librarian ID *"}
                        </FieldLabel>
                        <Input
                          id="staffId"
                          placeholder={role === "teacher" ? "e.g. TCH-880" : "e.g. LIB-102"}
                          value={admissionNumber}
                          onChange={(e) => setAdmissionNumber(e.target.value)}
                          required
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="phone">Contact Mobile Number *</FieldLabel>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                        />
                      </Field>
                    </FieldGroup>
                  )}

                  {/* Admin Secondary Designation */}
                  {role === "admin" && (
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Administration Designation</FieldLabel>
                        <Select value={secondaryRole} onValueChange={setSecondaryRole}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="principal">Principal</SelectItem>
                            <SelectItem value="vice-principal">Vice-Principal</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="developer">Developer / IT Lead</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                  )}

                  {/* Accounts Designation */}
                  {role === "account" && (
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Finance Role / Designation</FieldLabel>
                        <Select value={designation} onValueChange={setDesignation}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accountant">Accountant</SelectItem>
                            <SelectItem value="finance-head">Finance Head</SelectItem>
                            <SelectItem value="accounts-manager">Accounts Manager</SelectItem>
                            <SelectItem value="auditor">Auditor</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                  )}

                  {/* Address Section for all */}
                  <div className="pt-2 border-t space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Address Details</h4>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="address">Residential Address</FieldLabel>
                        <Input
                          id="address"
                          placeholder="House / Street details"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field>
                          <FieldLabel htmlFor="city">City</FieldLabel>
                          <Input id="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="pincode">Pincode</FieldLabel>
                          <Input id="pincode" placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
                        </Field>
                      </div>
                    </FieldGroup>
                  </div>

                </div>

                <Button onClick={handleNextStep2} className="w-full cursor-pointer">
                  Next Step: Choose Username
                </Button>
              </div>
            )}

            {/* STEP 3: Choose Username & Final Submit */}
            {step === 3 && (
              <form onSubmit={handleSubmitOnboarding} className="flex flex-col gap-6 animate-fade-in">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" type="button" className="h-8 w-8 rounded-full cursor-pointer" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex flex-col">
                    <h1 className="text-xl font-bold tracking-tight">Choose Your Username</h1>
                    <p className="text-xs text-muted-foreground">Pick a handle to log in and share your profile</p>
                  </div>
                </div>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="username">Unique Username *</FieldLabel>
                    <Input
                      id="username"
                      placeholder="e.g. ankit_student"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      autoComplete="off"
                      required
                    />
                    <FieldDescription>
                      Must be 3-15 characters long. Only letters, numbers, hyphens, or underscores allowed.
                    </FieldDescription>
                  </Field>
                </FieldGroup>

                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <h5 className="font-semibold text-foreground">Ready to launch</h5>
                    <p className="text-muted-foreground leading-relaxed">
                      Clicking submit will finalize your account profile and redirect you to your personalized workspace.
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full cursor-pointer" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing Profile...
                    </>
                  ) : (
                    "Complete Registration & Launch Portal"
                  )}
                </Button>
              </form>
            )}

          </div>
        </div>
      </div>

      {/* Right Column: Branding graphic */}
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/assets/vidyaschool/Logo/restored_no_bg_with_title.png"
            alt="VidyaSchool Logo"
            width={400}
            height={400}
            className="object-contain animate-fade-in"
          />
        </div>
      </div>
    </div>
  )
}
