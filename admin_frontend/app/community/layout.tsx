import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireRole } from "@/lib/auth-helpers"

export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure only authenticated teachers and admins can load the layout
  await requireRole(['admin', 'teacher'])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="h-svh max-h-svh md:h-[calc(100svh-1rem)] md:max-h-[calc(100svh-1rem)] overflow-hidden flex flex-col">
        <SiteHeader title="Community" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="@container/main flex flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
