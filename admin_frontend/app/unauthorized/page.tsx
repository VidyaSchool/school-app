import { redirect } from 'next/navigation'

const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || 'http://localhost:3000'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md p-6">
        <h1 className="text-4xl font-bold">403</h1>
        <h2 className="text-2xl font-semibold">Administrator Access Required</h2>
        <p className="text-muted-foreground text-sm">
          This portal is reserved exclusively for VidyaSchool administrators. Your account does not have administrative privileges.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <a
            href={`${MAIN_URL}/login`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Main Portal &rarr;
          </a>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            Admin Sign In
          </a>
        </div>
      </div>
    </div>
  )
}
