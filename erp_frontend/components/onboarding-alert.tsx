"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function OnboardingAlert({ isTeacher }: { isTeacher?: boolean }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const CACHE_KEY = "vidya_onboarding_status"
    const cached = sessionStorage.getItem(CACHE_KEY)

    if (cached !== null) {
      setShow(cached === "incomplete")
      return
    }

    fetch("/api/backend/api/onboarding/status")
      .then(res => {
        if (!res.ok) throw new Error("Not authenticated or error")
        return res.json()
      })
      .then(data => {
        const incomplete = data && data.onboardingCompleted === false
        sessionStorage.setItem(CACHE_KEY, incomplete ? "incomplete" : "done")
        setShow(incomplete)
      })
      .catch(() => {
        sessionStorage.setItem(CACHE_KEY, "done")
        setShow(false)
      })
  }, [])

  if (!show) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Onboarding Not Completed</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>Please complete your profile to access all features.</span>
        <Button asChild size="sm" variant="outline" className="ml-2">
          <Link href={isTeacher ? "/teacher?onboarding=true" : "/student?onboarding=true"}>Complete Now</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
