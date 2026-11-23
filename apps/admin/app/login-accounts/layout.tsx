import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireAuth } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { userProfile } from "@/lib/schema"
import { eq } from "drizzle-orm"

export default async function LoginAccountsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure user is authenticated
  const user = await requireAuth()

  const profile = await db
    .select({ username: userProfile.username })
    .from(userProfile)
    .where(eq(userProfile.userId, user.id))
    .then(res => res[0])
    .catch(() => null)

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          username: profile?.username ?? null,
        }}
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader title="Sessions & Devices" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:p-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
