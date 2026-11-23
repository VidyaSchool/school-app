import { redirect } from 'next/navigation'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">403</h1>
        <h2 className="text-2xl font-semibold">Unauthorized Access</h2>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
        <div className="flex gap-4 justify-center mt-6">
          <a
            href="/student"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Dashboard
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
