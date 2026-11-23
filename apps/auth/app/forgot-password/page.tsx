"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    })

    if (error) {
      toast.error(error.message || "Something went wrong", {
        description: "We couldn't send a reset email. Please try again.",
      })
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <Link href="/" className="flex items-center gap-2 font-medium">
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
            <div className="w-full max-w-xs flex flex-col items-center gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Check your inbox</h1>
                <p className="text-sm text-muted-foreground text-balance">
                  We sent a password reset link to{" "}
                  <strong className="text-foreground">{email}</strong>.
                  The link will expire in{" "}
                  <strong className="text-foreground">5 minutes</strong>.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive an email?{" "}
                <button
                  onClick={() => setSent(false)}
                  className="underline underline-offset-4 hover:text-foreground transition-colors"
                >
                  Try again
                </button>
              </p>
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          </div>
        </div>

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

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
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
          <div className="w-full max-w-xs">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <FieldGroup>
                <div className="flex flex-col gap-2 text-center">
                  <h1 className="text-2xl font-bold">Forgot your password?</h1>
                  <p className="text-balance text-sm text-muted-foreground">
                    Enter your email and we&apos;ll send you a reset link. The link expires in 5 minutes.
                  </p>
                </div>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </Field>

                <Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending link..." : "Send reset link"}
                  </Button>
                </Field>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </Link>
                </div>
              </FieldGroup>
            </form>
          </div>
        </div>
      </div>

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
