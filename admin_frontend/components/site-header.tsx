"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { HeaderComplaintButton } from "@/components/header-complaint-button"
import { Mail, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SiteHeaderProps {
  title?: string
  children?: React.ReactNode
  actions?: React.ReactNode
}

export function SiteHeader({ title, children, actions }: SiteHeaderProps) {
  const pathname = usePathname()
  const [mailOpen, setMailOpen] = React.useState(false)
  const isChatPage = pathname?.includes("/tasks/")

  const displayTitle = React.useMemo(() => {
    if (title) return title
    if (!pathname) return "Dashboard"

    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return "Dashboard"

    const lastSegment = segments[segments.length - 1]
    
    // Fallback if the user is on the root role dashboard (e.g., /student, /teacher, /admin)
    if (["student", "teacher", "admin", "librarian", "accounts"].includes(lastSegment.toLowerCase())) {
      return "Dashboard"
    }

    const pathMap: Record<string, string> = {
      dashboard: "Dashboard",
      fees: "Fees",
      library: "Library",
      marks: "Marks",
      notice: "Notices",
      notices: "Notices",
      class: "My Class",
      subjects: "Subject Class",
      requests: "Requests",
      complaints: "Complaints",
      students: "Students",
      teachers: "Teachers",
      "fee-management": "Fee Management",
      slider: "Slider Banners",
      books: "Manage Books",
      borrowings: "Book Issues",
      community: "Community Chat",
      downloads: "Mobile App Downloads",
      notes: "Notes",
    }

    if (pathMap[lastSegment.toLowerCase()]) {
      return pathMap[lastSegment.toLowerCase()]
    }

    // If last segment looks like a UUID, use the second-to-last segment label
    if (/^[0-9a-f-]{8,}$/i.test(lastSegment)) {
      const parent = segments[segments.length - 2]
      return pathMap[parent?.toLowerCase()] ?? parent?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "Page"
    }

    // If it's a 2-segment path where the second segment is the username (e.g. /student/ankit)
    if (segments.length === 2) {
      return "Dashboard"
    }

    return lastSegment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }, [title, pathname])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="relative flex w-full items-center gap-2 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4! self-center!"
        />
        {pathname.includes("/notes/")
          ? <div id="site-header-title" className="flex items-center gap-2 min-w-0 flex-1" />
          : isChatPage
          ? (
            <>
              <h1 className="text-base font-medium">{displayTitle}</h1>
              <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
                <Button asChild variant="link" size="sm">
                  <Link href={`/teacher/${pathname.split("/").filter(Boolean)[1]}/tasks/${crypto.randomUUID()}`}>
                    <Plus className="size-3.5" />
                    New Chat
                  </Link>
                </Button>
              </div>
            </>
          )
          : (children || <h1 className="text-base font-medium">{displayTitle}</h1>)
        }
        <div className="flex-1" />
        <div id="site-header-actions" className="flex items-center gap-2 shrink-0">
          {!pathname.includes("/notes/") && <HeaderComplaintButton />}
          {!pathname.includes("/notes/") && (
            <Button
              onClick={() => setMailOpen(true)}
              size="icon"
              variant="outline"
              className="size-8 rounded-lg border-zinc-200/80 dark:border-zinc-800 bg-background hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
            >
              <Mail className="size-4" />
              <span className="sr-only">Inbox</span>
            </Button>
          )}
          {actions}
        </div>
      </div>

      {/* Dialog: Coming Soon for Inbox */}
      <Dialog open={mailOpen} onOpenChange={setMailOpen}>
        <DialogContent className="sm:max-w-xs text-center p-6 flex flex-col items-center">
          <div className="size-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2">
            <Mail className="size-6 animate-pulse" />
          </div>
          <DialogTitle className="text-base font-semibold">Inbox & Chat</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            The direct messaging and community chat feature is coming soon! Stay tuned for updates.
          </DialogDescription>
          <Button onClick={() => setMailOpen(false)} className="mt-4 w-full h-8 text-xs font-semibold rounded-lg">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </header>
  )
}
