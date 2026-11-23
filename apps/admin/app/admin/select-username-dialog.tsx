"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, Shield, User, GraduationCap, Briefcase, Check } from "lucide-react"
import { toast } from "sonner"

const ROLES = [
  { id: "developer", label: "Developer", description: "System maintenance & setup", icon: Shield },
  { id: "principal", label: "Principal", description: "Academic & administrative lead", icon: GraduationCap },
  { id: "vice-principal", label: "Vice-Principal", description: "Co-lead school operations", icon: User },
  { id: "manager", label: "Manager", description: "Operations & logistics lead", icon: Briefcase },
]

export function SelectUsernameDialog({ isOpen }: { isOpen: boolean }) {
  const [slide, setSlide] = React.useState(1)
  const [username, setUsername] = React.useState("")
  const [secondaryRole, setSecondaryRole] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      setError("Username is required")
      return
    }

    const cleanUsername = username.trim().toLowerCase()
    if (!/^[a-zA-Z0-9_-]{3,15}$/.test(cleanUsername)) {
      setError("Username must be 3-15 characters long and contain only letters, numbers, hyphens, or underscores.")
      return
    }

    setSlide(2)
    setError("")
  }

  const handleSubmit = async () => {
    if (!secondaryRole) {
      setError("Please select a secondary role")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/backend/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: username.trim().toLowerCase(),
          secondaryRole 
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete onboarding")
      }

      toast.success("Profile setup completed successfully!")
      window.location.href = "/admin"
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[440px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        
        {slide === 1 ? (
          <form onSubmit={handleNext}>
            <DialogHeader>
              <DialogTitle>Choose Username</DialogTitle>
              <DialogDescription>
                Please select a unique username for your admin account. This username will be used for your profile.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError("")
                  }}
                  placeholder="e.g. admin_rajan"
                  autoComplete="off"
                  disabled={loading}
                  required
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">
                Next Step
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full cursor-pointer"
                  onClick={() => {
                    setSlide(1)
                    setError("")
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground font-semibold">Step 2 of 2</span>
              </div>
              <DialogTitle>Select Secondary Role</DialogTitle>
              <DialogDescription>
                Select your functional designation within the administration.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2 py-2">
              {ROLES.map((role) => {
                const Icon = role.icon
                const isSelected = secondaryRole === role.id
                return (
                  <div
                    key={role.id}
                    onClick={() => {
                      setSecondaryRole(role.id)
                      setError("")
                    }}
                    className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? "border-primary bg-primary/5 ring-1 ring-primary" 
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{role.label}</div>
                        <div className="text-[10px] text-muted-foreground">{role.description}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                )
              })}
              {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            </div>

            <DialogFooter>
              <Button 
                onClick={handleSubmit} 
                className="w-full cursor-pointer" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Profile
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
