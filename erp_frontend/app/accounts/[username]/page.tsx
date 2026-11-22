import { notFound } from "next/navigation"
import { Suspense } from "react"
import { AccountsDashboard } from "./dashboard-client"

export default async function AccountsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params

  if (!username) {
    notFound()
  }

  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <AccountsDashboard username={username} />
    </Suspense>
  )
}
