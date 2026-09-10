"use client"

import { Button } from "@/components/ui/button"
import { logoutUser } from "@/lib/auth-client"
import { ShieldAlert, LogIn, ArrowRight } from "lucide-react"

const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || 'http://localhost:3000'

export default function UnauthorizedPage() {
  const handleAdminSignIn = () => {
    // Clear non-admin session cookie and go directly to Admin Login
    logoutUser()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-8 text-center shadow-lg space-y-5 animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Administrator Access Required</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This console is reserved exclusively for VidyaSchool administrators. Your current session does not have administrative privileges.
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground text-left space-y-1">
          <p className="font-medium text-foreground">What would you like to do?</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Log in with an administrator account</li>
            <li>Return to the Main Portal for students, teachers, and staff</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleAdminSignIn}
            className="flex-1 cursor-pointer gap-2"
          >
            <LogIn className="h-4 w-4" />
            Admin Sign In
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex-1 cursor-pointer gap-2"
          >
            <a href={MAIN_URL}>
              Main Portal
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
