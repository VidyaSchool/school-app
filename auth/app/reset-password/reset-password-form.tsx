"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, TriangleAlert } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import Link from "next/link"
import { toast } from "sonner"

export default function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="w-full max-w-xs flex flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <TriangleAlert className="h-8 w-8 text-destructive" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Invalid reset link</h1>
          <p className="text-sm text-muted-foreground text-balance">
            This password reset link is missing or invalid. Please request a new one.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request new link</Link>
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match", {
        description: "Please make sure both passwords are the same.",
      })
      return
    }

    if (password.length < 8) {
      toast.error("Password too short", {
        description: "Password must be at least 8 characters.",
      })
      return
    }

    setLoading(true)

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    })

    if (error) {
      const isExpired =
        error.message?.toLowerCase().includes("expired") ||
        error.message?.toLowerCase().includes("invalid")

      toast.error(
        isExpired ? "Reset link expired or invalid" : error.message || "Failed to reset password",
        {
          description: isExpired
            ? "Please request a new password reset link."
            : "Something went wrong. Please try again.",
        }
      )
      setLoading(false)
      return
    }

    setDone(true)
    toast.success("Password reset successfully!", {
      description: "You can now log in with your new password.",
    })
    setTimeout(() => router.push("/login"), 2000)
    setLoading(false)
  }

  return (
    <div className="w-full max-w-xs">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <FieldGroup>
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-bold">Set new password</h1>
            <p className="text-balance text-sm text-muted-foreground">
              Choose a strong password for your account.
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="password">New Password</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required
                minLength={8}
                autoFocus
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
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Field>
            <Button type="submit" className="w-full" disabled={loading || done}>
              {done
                ? "Redirecting to login..."
                : loading
                ? "Resetting..."
                : "Reset password"}
            </Button>
          </Field>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Back to login
            </Link>
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
