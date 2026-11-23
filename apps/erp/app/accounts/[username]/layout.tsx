import * as React from "react"
import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { userProfile } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { AccountsSidebar } from "./_components/accounts-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AccountsHeader } from "./_components/accounts-header"

export default async function AccountsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const user = await requireRole(['account', 'admin'])

  const currentProfile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, user.id)
  })

  if (user.role === 'account' && currentProfile?.username && currentProfile.username !== username) {
    redirect(`/accounts/${currentProfile.username}`)
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AccountsSidebar username={username} />
      <SidebarInset>
        <SiteHeader>
          <AccountsHeader />
        </SiteHeader>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
