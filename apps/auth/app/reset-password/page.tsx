import { Suspense } from "react"
import ResetPasswordForm from "./reset-password-form"
import Image from "next/image"
import Link from "next/link"

export const dynamic = "force-dynamic"

function PageShell({ children }: { children: React.ReactNode }) {
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
          {children}
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

export default function ResetPasswordPage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </PageShell>
  )
}
