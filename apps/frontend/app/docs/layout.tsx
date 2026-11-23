"use client"

import * as React from "react"
import { DocsLayout } from "fumadocs-ui/layouts/docs"
import type * as PageTree from "fumadocs-core/page-tree"
import {
  BookOpen,
  Sun,
  Moon,
  ShieldCheck,
  GraduationCap,
  HelpCircle,
  Code2,
  FileText,
  UserCheck,
  Sparkles,
  School,
  Lock,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

const tree: PageTree.Root = {
  name: "Documentation",
  children: [
    {
      type: "folder",
      name: "Getting Started",
      icon: <Sparkles className="h-4 w-4 text-sky-500" />,
      children: [
        { type: "page", name: "Platform Overview", url: "/docs/getting-started/overview" },
        { type: "page", name: "Quick Start by Role", url: "/docs/getting-started/quickstart" },
        { type: "page", name: "Roles & Permissions", url: "/docs/getting-started/roles" },
      ],
    },
    {
      type: "folder",
      name: "Account & Authentication",
      icon: <Lock className="h-4 w-4 text-emerald-500" />,
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
      icon: <GraduationCap className="h-4 w-4 text-indigo-500" />,
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
      icon: <UserCheck className="h-4 w-4 text-amber-500" />,
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
      name: "Institutional Compliance",
      icon: <ShieldCheck className="h-4 w-4 text-rose-500" />,
      children: [
        { type: "page", name: "Mandatory Public Disclosure", url: "/docs/compliance/mandatory-disclosure" },
        { type: "page", name: "CBSE Affiliation Status", url: "/docs/compliance/affiliation" },
        { type: "page", name: "Annual Report & Audit", url: "/docs/compliance/annual-report" },
        { type: "page", name: "School Management Committee (SMC)", url: "/docs/compliance/smc" },
        { type: "page", name: "Parents Teachers Association (PTA)", url: "/docs/compliance/pta" },
        { type: "page", name: "Statutory Certificates", url: "/docs/compliance/certificates" },
      ],
    },
    {
      type: "folder",
      name: "Academics & Rules",
      icon: <School className="h-4 w-4 text-purple-500" />,
      children: [
        { type: "page", name: "Fee Structure & Payment", url: "/docs/academics/fee-structure" },
        { type: "page", name: "Academic Calendar 2026–27", url: "/docs/academics/academic-calendar" },
        { type: "page", name: "Curriculum Overview", url: "/docs/academics/curriculum" },
        { type: "page", name: "Class Syllabus (I–XII)", url: "/docs/academics/syllabus" },
        { type: "page", name: "Prescribed Textbooks", url: "/docs/academics/textbooks" },
        { type: "page", name: "Examinations & Assessments", url: "/docs/academics/examinations" },
        { type: "page", name: "Board Exam Results (3-Yr)", url: "/docs/academics/results" },
      ],
    },
    {
      type: "folder",
      name: "Admissions",
      icon: <FileText className="h-4 w-4 text-teal-500" />,
      children: [
        { type: "page", name: "Admissions Overview", url: "/docs/admissions/overview" },
        { type: "page", name: "Admission Process & Stages", url: "/docs/admissions/process" },
        { type: "page", name: "Eligibility Criteria", url: "/docs/admissions/eligibility" },
      ],
    },
    {
      type: "folder",
      name: "Frequently Asked Questions",
      icon: <HelpCircle className="h-4 w-4 text-blue-500" />,
      children: [
        { type: "page", name: "All FAQs Directory", url: "/docs/faqs" },
      ],
    },
    {
      type: "folder",
      name: "Co-Curricular Activities",
      icon: <Sparkles className="h-4 w-4 text-pink-500" />,
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
      icon: <Code2 className="h-4 w-4 text-emerald-500" />,
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
      icon: <FileText className="h-4 w-4 text-zinc-500" />,
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
    <>
      <title>VIDYA SCHOOL</title>
      <DocsLayout
        tree={tree}
        nav={{
          title: (
            <div className="flex items-center gap-2 font-bold text-sm tracking-tight">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>VIDYA SCHOOL</span>
            </div>
          ),
        }}
        links={[
          { text: "Overview", url: "/docs/getting-started/overview" },
          { text: "Compliance", url: "/docs/compliance/mandatory-disclosure" },
          { text: "Academics", url: "/docs/academics/fee-structure" },
          { text: "ERP Portal", url: "/login-accounts" },
        ]}
        githubUrl="https://github.com/VidyaSchool/school-app"
        sidebar={{
          collapsible: true,
          defaultOpenLevel: 1,
        }}
        slots={{
          themeSwitch: DocsThemeToggle,
        }}
      >
        {children}
      </DocsLayout>
    </>
  )
}
