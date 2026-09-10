'use client'

import * as React from "react"
import { 
  GraduationCap, 
  BookOpen, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Loader2,
  Lock,
  Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface OnboardingDialogProps {
  userRole: "student" | "teacher" | "librarian"
  userEmail: string
  onSuccess: (username: string) => void
}

export function OnboardingDialog({ userRole, userEmail, onSuccess }: OnboardingDialogProps) {
  const isStudent = userRole === "student"
  const totalSteps = isStudent ? 4 : 3
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  // Form states
  const [admissionNumber, setAdmissionNumber] = React.useState("") // For teacher this stores teacherId
  const [phoneNumber, setPhoneNumber] = React.useState("")
  const [studentClass, setStudentClass] = React.useState("")
  const [section, setSection] = React.useState("")
  const [transportMode, setTransportMode] = React.useState("walking")
  
  // Student Parent Info
  const [parentName, setParentName] = React.useState("")
  const [parentPhone, setParentPhone] = React.useState("")
  const [parentEmail, setParentEmail] = React.useState("")

  // Username
  const [username, setUsername] = React.useState("")

  // Address
  const [address, setAddress] = React.useState("")
  const [city, setCity] = React.useState("")
  const [state, setState] = React.useState("")
  const [pincode, setPincode] = React.useState("")

  const progress = (step / totalSteps) * 100

  const handleNext = () => {
    // Basic validation per step
    if (step === 1) {
      if (!admissionNumber) {
        toast.error(isStudent ? "Please enter your Admission Number" : userRole === "librarian" ? "Please enter your Librarian ID" : "Please enter your Teacher ID")
        return
      }
      if (!phoneNumber) {
        toast.error("Please enter your Phone Number")
        return
      }
      if (isStudent && (!studentClass || !section)) {
        toast.error("Please select your class and section")
        return
      }
    } else if (isStudent && step === 2) {
      if (!parentName || !parentPhone) {
        toast.error("Please fill in parent/guardian contact details")
        return
      }
    } else if ((isStudent && step === 3) || (!isStudent && step === 2)) {
      if (!username) {
        toast.error("Please choose a username")
        return
      }
      if (username.length < 3) {
        toast.error("Username must be at least 3 characters long")
        return
      }
    }

    setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    // Address validation
    if (!address || !city || !state || !pincode) {
      toast.error("Please complete your address details")
      return
    }
    if (pincode.length !== 6 || isNaN(Number(pincode))) {
      toast.error("Pincode must be a 6-digit number")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/backend/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admissionNumber,
          username,
          phoneNumber,
          parentName: isStudent ? parentName : undefined,
          parentPhone: isStudent ? parentPhone : undefined,
          parentEmail: isStudent ? parentEmail : undefined,
          address,
          city,
          state,
          pincode,
          class: isStudent ? studentClass : undefined,
          section: isStudent ? section : undefined,
          transportMode: isStudent ? transportMode : undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || data.error || "Failed to complete onboarding")
      }

      toast.success("Profile onboarding completed successfully!")
      onSuccess(username)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[85vh] md:max-h-[680px]">
        
        {/* Left decoration panel (Large screen) */}
        <div className="hidden md:flex md:w-[320px] bg-gradient-to-br from-primary via-primary/80 to-chart-1 p-8 text-primary-foreground flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary-foreground animate-pulse" />
              <span className="font-bold tracking-tight text-lg">Vidya School</span>
            </div>
            <div className="space-y-2 mt-8">
              <h2 className="text-2xl font-bold tracking-tight leading-tight">
                {isStudent ? "Welcome, Student!" : "Welcome, Educator!"}
              </h2>
              <p className="text-xs text-primary-foreground/80 leading-relaxed">
                Let's set up your profile space. Having complete records helps us keep fee payments, class rosters, and notifications aligned.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-[11px] text-primary-foreground/70 uppercase tracking-widest font-semibold">
              Onboarding Checklist
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className={`size-4 rounded-full border flex items-center justify-center text-[10px] ${step > 1 ? "bg-emerald-500 border-emerald-500 text-white" : "border-primary-foreground/45"}`}>
                  {step > 1 ? <Check className="size-2.5" /> : "1"}
                </div>
                <span className={step === 1 ? "font-semibold" : "text-primary-foreground/75"}>
                  {isStudent ? "Registration & Class" : "Faculty ID & Phone"}
                </span>
              </div>

              {isStudent && (
                <div className="flex items-center gap-2 text-xs">
                  <div className={`size-4 rounded-full border flex items-center justify-center text-[10px] ${step > 2 ? "bg-emerald-500 border-emerald-500 text-white" : "border-primary-foreground/45"}`}>
                    {step > 2 ? <Check className="size-2.5" /> : "2"}
                  </div>
                  <span className={step === 2 ? "font-semibold" : "text-primary-foreground/75"}>Parent Details</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs">
                <div className={`size-4 rounded-full border flex items-center justify-center text-[10px] ${step > (isStudent ? 3 : 2) ? "bg-emerald-500 border-emerald-500 text-white" : "border-primary-foreground/45"}`}>
                  {step > (isStudent ? 3 : 2) ? <Check className="size-2.5" /> : isStudent ? "3" : "2"}
                </div>
                <span className={step === (isStudent ? 3 : 2) ? "font-semibold" : "text-primary-foreground/75"}>Choose Username</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className={`size-4 rounded-full border flex items-center justify-center text-[10px] ${step > (isStudent ? 4 : 3) ? "bg-emerald-500 border-emerald-500 text-white" : "border-primary-foreground/45"}`}>
                  {step > (isStudent ? 4 : 3) ? <Check className="size-2.5" /> : isStudent ? "4" : "3"}
                </div>
                <span className={step === (isStudent ? 4 : 3) ? "font-semibold" : "text-primary-foreground/75"}>Mailing Address</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Content */}
        <div className="flex-1 flex flex-col justify-between p-6 md:p-8 bg-card overflow-y-auto">
          
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-xl font-bold text-foreground">Complete Onboarding</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Please provide your details below</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-primary">Step {step} of {totalSteps}</span>
                <Progress value={progress} className="w-20 h-1.5 mt-1.5" />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-lg text-xs font-medium mt-4 flex items-center gap-2">
                <Lock className="size-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step Contents */}
            <div className="mt-6 space-y-4">
              
              {/* STEP 1: Registration Details */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in-right">
                  <div className="flex items-center gap-2 border-b pb-2 mb-2">
                    {isStudent ? (
                      <GraduationCap className="h-5 w-5 text-primary" />
                    ) : (
                      <Briefcase className="h-5 w-5 text-primary" />
                    )}
                    <h4 className="text-sm font-semibold text-foreground">
                      {isStudent ? "Academic details" : "Faculty details"}
                    </h4>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="admission">
                      {isStudent ? "Admission Number" : userRole === "librarian" ? "Librarian Employee ID" : "Faculty Employee ID"}
                    </Label>
                    <Input
                      id="admission"
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value.toUpperCase())}
                      placeholder={isStudent ? "e.g., 2024/STU/102" : userRole === "librarian" ? "e.g., LIB/2026/04" : "e.g., TCH/2026/04"}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>

                  {isStudent && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="class">Assigned Class</Label>
                          <Select value={studentClass} onValueChange={setStudentClass}>
                            <SelectTrigger id="class" className="w-full text-xs bg-card">
                              <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                              {["Nursery", "KG", ...Array.from({ length: 12 }, (_, i) => (i + 1).toString())].map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c === "Nursery" || c === "KG" ? c : `Class ${c}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="section">Section</Label>
                          <Select value={section} onValueChange={setSection}>
                            <SelectTrigger id="section" className="w-full text-xs bg-card">
                              <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                              {["A", "B", "C", "D", "E"].map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="transport">Mode of Commute</Label>
                        <Select value={transportMode} onValueChange={setTransportMode}>
                          <SelectTrigger id="transport" className="w-full text-xs bg-card">
                            <SelectValue placeholder="Select Commute Mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="walking">Walking</SelectItem>
                            <SelectItem value="transport">School Transport</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2 (STUDENT ONLY): Parent details */}
              {isStudent && step === 2 && (
                <div className="space-y-4 animate-fade-in-right">
                  <div className="flex items-center gap-2 border-b pb-2 mb-2">
                    <User className="h-5 w-5 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">Parent / Guardian details</h4>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="parentName">Parent Name</Label>
                    <Input
                      id="parentName"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="parentPhone">Parent Phone Number</Label>
                    <Input
                      id="parentPhone"
                      type="tel"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="parentEmail">Parent Email (Optional)</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="parent@example.com"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3 (STUDENT) / STEP 2 (TEACHER): Choose Username */}
              {((isStudent && step === 3) || (!isStudent && step === 2)) && (
                <div className="space-y-4 animate-fade-in-right">
                  <div className="flex items-center gap-2 border-b pb-2 mb-2">
                    <User className="h-5 w-5 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">Account identity</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground/60 text-sm">@</span>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        placeholder="username"
                        className="pl-7"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Choose a unique handle. Only lowercase letters, numbers, and underscores are allowed.
                    </p>
                  </div>

                  <div className="bg-muted/40 p-3.5 rounded-lg border border-border/50 text-[11px] text-muted-foreground leading-relaxed space-y-1.5">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                      <Lock className="size-3 text-primary" /> Account details
                    </div>
                    <div>Registered email: <span className="font-mono text-foreground font-medium">{userEmail}</span></div>
                    <div>Your role: <span className="capitalize text-foreground font-semibold">{userRole}</span></div>
                  </div>
                </div>
              )}

              {/* STEP 4 (STUDENT) / STEP 3 (TEACHER): Address details */}
              {((isStudent && step === 4) || (!isStudent && step === 3)) && (
                <div className="space-y-4 animate-fade-in-right">
                  <div className="flex items-center gap-2 border-b pb-2 mb-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">Contact & Mailing address</h4>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House/Apartment number, Street"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.slice(0,6))}
                      placeholder="6 digit PIN"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-6">
            {step > 1 ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBack} 
                className="gap-1 rounded-lg text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            ) : (
              <div />
            )}
            
            {step < totalSteps ? (
              <Button 
                onClick={handleNext}
                size="sm"
                className="gap-1 rounded-lg text-xs"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                size="sm"
                className="gap-1 rounded-lg text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    Complete Onboarding <Check className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
