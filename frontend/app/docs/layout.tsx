"use client"

import * as React from "react"
import { DocsLayout } from "fumadocs-ui/layouts/docs"
import type * as PageTree from "fumadocs-core/page-tree"
import { BookOpen, Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

const tree: PageTree.Root = {
  name: "Documentation",
  children: [
    {
      type: "folder",
      name: "Getting Started",
      children: [
        { type: "page", name: "Platform Overview", url: "/docs/getting-started/overview" },
        { type: "page", name: "Quick Start by Role", url: "/docs/getting-started/quickstart" },
        { type: "page", name: "Roles & Permissions", url: "/docs/getting-started/roles" },
      ],
    },
    {
      type: "folder",
      name: "Account & Authentication",
      children: [
        { type: "page", name: "1. Account Registration", url: "/docs/auth/signup" },
        { type: "page", name: "2. Portal Login Streams", url: "/docs/auth/login" },
        { type: "page", name: "3. Verification & Approval", url: "/docs/auth/approval" },
        { type: "page", name: "4. Password Reset", url: "/docs/auth/password-reset" },
        { type: "page", name: "5. QR Code Login", url: "/docs/auth/qr-login" },
        { type: "page", name: "6. Session Revocation & Safety", url: "/docs/auth/session-security" },
      ],
    },
    {
      type: "folder",
      name: "Student Guide",
      children: [
        { type: "page", name: "1. Profile Onboarding", url: "/docs/student/onboarding" },
        { type: "page", name: "2. Fees & Payments", url: "/docs/student/fees" },
        { type: "page", name: "3. Marks & Academic Cards", url: "/docs/student/marks" },
        { type: "page", name: "4. Library Catalog", url: "/docs/student/library" },
        { type: "page", name: "5. Notices & Circulars", url: "/docs/student/notices" },
        { type: "page", name: "6. Filing a Complaint", url: "/docs/student/complaints" },
      ],
    },
    {
      type: "folder",
      name: "Teacher Guide",
      children: [
        { type: "page", name: "1. Class Roster", url: "/docs/teacher/roster" },
        { type: "page", name: "2. Marks Submission", url: "/docs/teacher/grading" },
        { type: "page", name: "3. Notice Publishing", url: "/docs/teacher/notices" },
        { type: "page", name: "4. Requests & Leaves", url: "/docs/teacher/escalations" },
        { type: "page", name: "5. Educator Complaints", url: "/docs/teacher/complaints" },
      ],
    },
    {
      type: "folder",
      name: "Admissions",
      children: [
        { type: "page", name: "Admissions Overview", url: "/docs/admissions/overview" },
        { type: "page", name: "Document Requirements", url: "/docs/admissions/documents" },
        { type: "page", name: "Fee Structure", url: "/docs/admissions/fees" },
      ],
    },
    {
      type: "folder",
      name: "Co-Curricular Activities",
      children: [
        { type: "page", name: "Programs Overview", url: "/docs/co-curriculars/overview" },
        { type: "page", name: "Performing Arts", url: "/docs/co-curriculars/arts" },
        { type: "page", name: "STEM & Robotics", url: "/docs/co-curriculars/stem" },
        { type: "page", name: "Sports & Athletics", url: "/docs/co-curriculars/sports" },
      ],
    },
    {
      type: "folder",
      name: "Developers Guide",
      children: [
        { type: "page", name: "1. Architecture & Stack", url: "/docs/developers/architecture" },
        { type: "page", name: "2. Frontend & UI System", url: "/docs/developers/frontend" },
        { type: "page", name: "3. FastAPI Backend Engine", url: "/docs/developers/backend" },
        { type: "page", name: "4. Database & ORM Schema", url: "/docs/developers/database" },
        { type: "page", name: "5. Security & Rate Limiting", url: "/docs/developers/security" },
        { type: "page", name: "6. Deployment & Setup", url: "/docs/developers/deployment" },
      ],
    },
    {
      type: "folder",
      name: "Legal Policies",
      children: [
        { type: "page", name: "Terms of Service", url: "/docs/terms-of-service" },
        { type: "page", name: "Privacy Policy", url: "/docs/privacy-policy" },
        { type: "page", name: "Refund & Cancellation Policy", url: "/docs/refund-policy" },
        { type: "page", name: "Cookie Policy", url: "/docs/cookie-policy" },
        { type: "page", name: "Acceptable Use Policy", url: "/docs/acceptable-use" },
        { type: "page", name: "AI & Academic Disclaimer", url: "/docs/ai-disclaimer" },
        { type: "page", name: "DMCA & Copyright Policy", url: "/docs/dmca-policy" },
        { type: "page", name: "Security & Vulnerability Policy", url: "/docs/security-policy" },
      ],
    },
  ],
}

// Custom theme toggle matching @wrksz/themes state, overriding the broken fumadocs-ui next-themes switch.
function DocsThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-9 w-full rounded-md bg-muted/20 border border-border" />
  }

  const isDark = theme === "dark"

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full flex items-center justify-center gap-2 cursor-pointer border-border/80 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-foreground transition-all duration-150 h-9 rounded-lg"
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold">Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-indigo-500 shrink-0" />
          <span className="text-xs font-semibold">Dark Mode</span>
        </>
      )}
    </Button>
  )
}

export default function DocsPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={tree}
      nav={{
        title: (
          <div className="flex items-center gap-2 font-bold text-sm">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>VidyaSchool Docs</span>
          </div>
        ),
      }}
      slots={{
        themeSwitch: DocsThemeToggle,
      }}
    >
      {children}
    </DocsLayout>
  )
}
