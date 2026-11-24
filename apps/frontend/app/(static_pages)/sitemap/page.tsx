import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  FileText,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Building2,
  Trophy,
  Bell,
  Code2,
  Scale,
  ExternalLink,
  Search,
  CheckCircle2,
  Compass,
  Layers,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Site Map | VIDYA School",
  description:
    "Complete directory of all pages, academic regulations, CBSE mandatory compliance disclosures, admissions guides, campus facilities, and developer manuals on VIDYA School platform.",
}

interface SiteSection {
  title: string
  icon: any
  badge: string
  description: string
  links: {
    title: string
    href: string
    description: string
    tag?: string
  }[]
}

const SECTIONS: SiteSection[] = [
  {
    title: "Institutional Compliance & CBSE Disclosures",
    icon: ShieldCheck,
    badge: "Statutory",
    description: "Official statutory records, CBSE affiliation documents, audit reports, and safety certificates under Appendix IX.",
    links: [
      {
        title: "Mandatory Public Disclosure",
        href: "/docs/compliance/mandatory-disclosure",
        description: "Complete CBSE Appendix IX disclosures, affiliation records, and certified documents.",
        tag: "CBSE Mandate",
      },
      {
        title: "CBSE Affiliation Status",
        href: "/docs/compliance/affiliation",
        description: "Official affiliation certificates, school code 41054, and affiliation number 531105.",
      },
      {
        title: "School Management Committee (SMC)",
        href: "/docs/compliance/smc",
        description: "Certified list of executive SMC members, credentials, and institutional tenure.",
      },
      {
        title: "Parents Teachers Association (PTA)",
        href: "/docs/compliance/pta",
        description: "PTA executive council list, parent representatives, and committee objectives.",
      },
      {
        title: "Statutory Compliance Certificates",
        href: "/docs/compliance/certificates",
        description: "Building safety, fire safety, water sanitation, and government recognition certificates.",
      },
      {
        title: "Annual Pedagogical Reports",
        href: "/docs/compliance/annual-report",
        description: "Annual academic reports, board class achievements, and institutional performance reviews.",
      },
    ],
  },
  {
    title: "Academics & Curricular Regulations",
    icon: GraduationCap,
    badge: "Academics",
    description: "Curriculum frameworks, official fee structures, syllabi, textbooks, and assessment guidelines.",
    links: [
      {
        title: "Fee Structure & Scholarships",
        href: "/docs/academics/fee-structure",
        description: "Approved itemized fee schedule, concession policies, and payment terms.",
        tag: "Updated 2026",
      },
      {
        title: "Annual Academic Calendar",
        href: "/docs/academics/academic-calendar",
        description: "Term schedules, instructional days, examination windows, and official holidays.",
      },
      {
        title: "Curriculum Overview",
        href: "/curriculum",
        description: "Holistic pedagogical curriculum aligned with NEP 2020 and CBSE directives.",
      },
      {
        title: "Curriculum Syllabus",
        href: "/syllabus",
        description: "Grade-wise syllabi, learning outcomes, and subject distribution.",
      },
      {
        title: "Academic Subjects",
        href: "/subjects",
        description: "Comprehensive list of disciplines taught across primary, middle, and senior wings.",
      },
      {
        title: "Prescribed Textbooks",
        href: "/docs/academics/textbooks",
        description: "NCERT and CBSE prescribed book lists with declarations of non-commercial content.",
      },
      {
        title: "Examinations & Evaluations",
        href: "/docs/academics/examinations",
        description: "Continuous and Comprehensive Evaluation (CCE) standards, exam bylaws, and grading rubrics.",
      },
      {
        title: "Board Examination Results",
        href: "/docs/academics/results",
        description: "Last three years Class X & XII board examination results, toppers, and pass percentages.",
      },
    ],
  },
  {
    title: "Admissions & Enrollment",
    icon: BookOpen,
    badge: "Admissions",
    description: "Step-by-step admission criteria, registration timelines, age eligibility, and documentation requirements.",
    links: [
      {
        title: "Admissions Overview",
        href: "/admission",
        description: "General overview of admission stages, scholarships, and child-centric enrollment.",
      },
      {
        title: "Admission Process & Steps",
        href: "/docs/admissions/process",
        description: "Stage-by-stage guide from inquiry form submission to enrollment confirmation.",
        tag: "2027–28 Active",
      },
      {
        title: "Eligibility Criteria",
        href: "/docs/admissions/eligibility",
        description: "Age criteria, admission guidelines, and verified document checklists.",
      },
      {
        title: "Admissions FAQs",
        href: "/docs/faqs",
        description: "Frequently asked questions regarding admission tests, fee payment, and bus transport.",
      },
    ],
  },
  {
    title: "Campus, Infrastructure & Community",
    icon: Building2,
    badge: "Campus",
    description: "School history, leadership, faculty profiles, smart classrooms, libraries, and philanthropic partnerships.",
    links: [
      {
        title: "About VIDYA School",
        href: "/about-vidyaschool",
        description: "Our founding story, educational philosophy, and partnership with VIDYA India.",
      },
      {
        title: "Principal's Message",
        href: "/principals-message",
        description: "Visionary message from Principal Ms. Ila Sarin on holistic child development.",
      },
      {
        title: "Teachers & Educational Staff",
        href: "/teachers-and-staff",
        description: "Directory of qualified educators, credentials, designations, and teacher training records.",
      },
      {
        title: "School Leadership",
        href: "/leadership",
        description: "Governing board, advisory trustees, and academic administrators.",
      },
      {
        title: "Vision & Core Mission",
        href: "/vision-and-mission",
        description: "Institutional mission statement, ethical standards, and educational commitments.",
      },
      {
        title: "Campus Infrastructure",
        href: "/infrastructure",
        description: "Eco-friendly campus facilities, smart digital classrooms, and safe play areas.",
      },
      {
        title: "Laboratories & Science Centers",
        href: "/laboratories",
        description: "Composite science labs, chemistry, physics, biology, and computer education centers.",
      },
      {
        title: "Digital & Physical Library",
        href: "/library",
        description: "Curated book catalog, reading rooms, digital reference databases, and lending rules.",
      },
      {
        title: "Get Involved & Volunteering",
        href: "/get-involved",
        description: "VIDYA MITR mentorship program, volunteer teaching, and corporate sponsorships.",
      },
      {
        title: "Corporate Sponsors & Donors",
        href: "/sponsors",
        description: "Philanthropic partners, educational foundations, and scholarship grantors.",
      },
      {
        title: "Torch Bearers & Alumni",
        href: "/torch-bearers",
        description: "Alumni achievements, higher education placements, and success spotlights.",
      },
      {
        title: "Contact & Location",
        href: "/contact",
        description: "Address, phone numbers, visiting hours, administrative contacts, and Google Maps pin.",
      },
    ],
  },
  {
    title: "Co-Curriculars, STEM & Sports",
    icon: Trophy,
    badge: "Activities",
    description: "Athletics programs, robotics clubs, visual and performing arts, and annual cultural celebrations.",
    links: [
      {
        title: "Student Life & Extracurriculars",
        href: "/student-life",
        description: "Daily school life, peer clubs, community initiatives, and character building.",
      },
      {
        title: "Robotics & Innovation Lab",
        href: "/robotics",
        description: "Hands-on robotics kits, AI coding workshops, and national innovation competitions.",
      },
      {
        title: "STEM Education Hub",
        href: "/stem",
        description: "Integrated science, technology, engineering, and mathematics experiential modules.",
      },
      {
        title: "Arts, Dance & Music",
        href: "/arts-and-music",
        description: "Vocal music, classical and contemporary dance, visual fine arts, and theatre.",
      },
      {
        title: "Sports & Athletics Programs",
        href: "/sports",
        description: "Basketball, volleyball, football, cricket nets, track athletics, and yoga training.",
      },
      {
        title: "Student Clubs & Societies",
        href: "/clubs",
        description: "Eco clubs, literary debating societies, math circles, and social outreach groups.",
      },
      {
        title: "Annual Tech Fest",
        href: "/tech-fest",
        description: "Inter-school science exhibition, hackathons, and creative engineering challenges.",
      },
      {
        title: "Campus Photo & Video Gallery",
        href: "/gallery",
        description: "Visual chronicle of annual day, sports meets, laboratory sessions, and ceremonies.",
      },
    ],
  },
  {
    title: "Notices, Circulars & Announcements",
    icon: Bell,
    badge: "Updates",
    description: "Current announcements, official institutional circulars, upcoming events, and student honors.",
    links: [
      {
        title: "Official Notice Board",
        href: "/notices",
        description: "Real-time institutional notices, holiday announcements, and parent reminders.",
        tag: "Daily",
      },
      {
        title: "CBSE & School Circulars",
        href: "/circulars",
        description: "Downloadable PDF circulars, examination date sheets, and transport advisories.",
      },
      {
        title: "School Events Calendar",
        href: "/events",
        description: "Upcoming inter-school competitions, parent-teacher meetings, and workshops.",
      },
      {
        title: "Institutional Announcements",
        href: "/announcements",
        description: "Press releases, new initiatives, and institutional milestones.",
      },
      {
        title: "Student & School Achievements",
        href: "/achievements",
        description: "State and national awards, academic Olympiad rankings, and athletic trophies.",
      },
      {
        title: "Document Downloads Center",
        href: "/downloads",
        description: "Official forms, leave slips, transfer certificate applications, and syllabus packets.",
      },
    ],
  },
  {
    title: "Documentation & Portal Guides",
    icon: FileText,
    badge: "Docs Hub",
    description: "Step-by-step role guides, user onboarding, password recovery, and fee payment instructions.",
    links: [
      {
        title: "Documentation Hub",
        href: "/docs",
        description: "Central documentation portal overview and categorical navigation index.",
        tag: "Hub",
      },
      {
        title: "Platform Overview",
        href: "/docs/getting-started/overview",
        description: "Introduction to VIDYA School digital platform, modules, and role privileges.",
      },
      {
        title: "Quick Start by Role",
        href: "/docs/getting-started/quickstart",
        description: "Fast-track onboarding paths for students, parents, teachers, and clerks.",
      },
      {
        title: "Account Registration & Onboarding",
        href: "/docs/auth/signup",
        description: "Creating verified user accounts, email verification, and profile setup.",
      },
      {
        title: "Login & Multi-Device Access",
        href: "/docs/auth/login",
        description: "Secure login streams, QR authentication, and password management.",
      },
      {
        title: "Student Portal Guide",
        href: "/docs/student/onboarding",
        description: "Navigating student dashboard, reviewing marks, tracking attendance, and library books.",
      },
      {
        title: "Online Fee Payment Guide",
        href: "/docs/student/fees",
        description: "Settling dues via Razorpay, UPI, net banking, and downloading digital receipts.",
      },
      {
        title: "Teacher Workspace Guide",
        href: "/docs/teacher/roster",
        description: "Classroom rosters, submitting marks, publishing circulars, and managing leaves.",
      },
      {
        title: "Co-Curricular Activities Guide",
        href: "/docs/co-curriculars/overview",
        description: "Student clubs, athletic tournaments, and science fair participation guidelines.",
      },
    ],
  },
  {
    title: "Developer & System Architecture",
    icon: Code2,
    badge: "Engineers",
    description: "Technical specifications, API documentation, Next.js architecture, and database schemas.",
    links: [
      {
        title: "Full-Stack System Architecture",
        href: "/docs/developers/architecture",
        description: "Overview of Next.js 16 frontend, FastAPI microservices, and Neon PostgreSQL database.",
        tag: "Technical",
      },
      {
        title: "Next.js Frontend Architecture",
        href: "/docs/developers/frontend",
        description: "React Server Components (RSC), Tailwind styling, Fumadocs UI, and client hooks.",
      },
      {
        title: "FastAPI Backend & Microservices",
        href: "/docs/developers/backend",
        description: "Python FastAPI endpoints, async background tasks, and AI page builder engine.",
      },
      {
        title: "Database Schemas & Drizzle ORM",
        href: "/docs/developers/database",
        description: "PostgreSQL tables, foreign key relations, fee ledgers, and Drizzle migrations.",
      },
      {
        title: "DevOps & Cloud Deployment",
        href: "/docs/developers/deployment",
        description: "Turborepo monorepo setup, Vercel deployments, Neon branching, and Sentry monitoring.",
      },
      {
        title: "Security & RBAC Architecture",
        href: "/docs/developers/security",
        description: "Role-based access control, JWT session encryption, and OWASP defense-in-depth.",
      },
      {
        title: "Developer Portal Landing",
        href: "/developers",
        description: "Overview of open API initiatives and engineering opportunities at VIDYA School.",
      },
    ],
  },
  {
    title: "Legal, Privacy & Governance",
    icon: Scale,
    badge: "Legal",
    description: "Binding terms of service, student data privacy policies, refund terms, and acceptable use rules.",
    links: [
      {
        title: "Terms of Service",
        href: "/docs/legal/terms-of-service",
        description: "Binding contract governing user accounts, academic integrity, and portal utilization.",
        tag: "Binding",
      },
      {
        title: "Privacy Policy",
        href: "/docs/legal/privacy-policy",
        description: "Student data protection under FERPA, COPPA, and DPDP Act. No commercial advertising.",
      },
      {
        title: "Acceptable Use Policy (AUP)",
        href: "/docs/legal/acceptable-use",
        description: "Zero-tolerance rules against cyberbullying, harassment, cheating, and system attacks.",
      },
      {
        title: "Fee Refund & Cancellation Policy",
        href: "/docs/legal/refund-policy",
        description: "Rules governing online fee payments, duplicate debits, and admission caution deposits.",
      },
      {
        title: "Cookie Policy & Session Security",
        href: "/docs/legal/cookie-policy",
        description: "Details on cryptographic session tokens and browser preference storage.",
      },
      {
        title: "Security & Vulnerability Disclosure",
        href: "/docs/legal/security-policy",
        description: "Responsible cybersecurity disclosure guidelines and researcher safe harbor terms.",
      },
      {
        title: "DMCA & Copyright Policy",
        href: "/docs/legal/dmca-policy",
        description: "Takedown procedure for user-uploaded educational content and designated copyright agents.",
      },
      {
        title: "AI Transparency & Academic Disclaimer",
        href: "/docs/legal/ai-disclaimer",
        description: "Disclaimer on generative AI tools as supplemental educational aids.",
      },
    ],
  },
  {
    title: "Monorepo Apps & Institutional Portals",
    icon: Layers,
    badge: "Portals",
    description: "Direct links to dedicated role portals and applications across the VIDYA School digital ecosystem.",
    links: [
      {
        title: "ERP Operations Portal",
        href: "/erp",
        description: "Integrated school ERP console for students, faculty, accountants, and staff.",
        tag: "Port 3003",
      },
      {
        title: "Authentication & Sessions Portal",
        href: "/login-accounts",
        description: "Single Sign-On (SSO), active device sessions, and multi-factor authentication.",
        tag: "Port 3002",
      },
      {
        title: "Student Portal Login",
        href: "https://auth.vidyaschool.com/login",
        description: "Direct entry point for enrolled students to access homework, marks, and timetable.",
      },
      {
        title: "Teacher Portal Login",
        href: "https://auth.vidyaschool.com/signup",
        description: "Educator onboarding, classroom roster administration, and attendance marking.",
      },
      {
        title: "Full XML Machine-Readable Sitemap",
        href: "/sitemap.xml",
        description: "Standard XML sitemap index for search engine crawlers (Google, Bing, DuckDuckGo).",
        tag: "XML",
      },
    ],
  },
]

export default function SitemapPage() {
  const totalLinks = SECTIONS.reduce((acc, sec) => acc + sec.links.length, 0)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-background via-primary/5 to-background py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                <Compass className="size-3.5" />
                Comprehensive Directory
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                VIDYA School <span className="text-primary">Site Map</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
                Complete navigational directory of all <strong>{totalLinks}+ pages</strong> across academic regulations, CBSE statutory compliance disclosures, admissions, campus facilities, and technical manuals.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/sitemap.xml"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-border bg-card hover:bg-muted text-foreground transition-all shadow-xs"
                >
                  <FileText className="size-3.5 text-primary" />
                  View XML Sitemap (<code className="text-[11px] text-primary">/sitemap.xml</code>)
                  <ExternalLink className="size-3 opacity-60" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                >
                  <BookOpen className="size-3.5" />
                  Explore Documentation Hub
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sitemap Sections Grid */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 max-w-6xl space-y-12">
            {SECTIONS.map((section, idx) => {
              const SectionIcon = section.icon
              return (
                <div key={idx} className="space-y-4" id={`sec-${idx}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <SectionIcon className="size-4.5" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                          {section.title}
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-border bg-muted/50 text-muted-foreground">
                            {section.badge}
                          </span>
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground self-start sm:self-auto shrink-0 font-mono">
                      {section.links.length} pages
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {section.links.map((item, itemIdx) => (
                      <Link
                        key={itemIdx}
                        href={item.href}
                        className="group flex flex-col justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 hover:border-primary/40 transition-all shadow-2xs hover:shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                              <CheckCircle2 className="size-3 text-primary/70 shrink-0" />
                              {item.title}
                            </span>
                            {item.tag && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20 shrink-0">
                                {item.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <div className="pt-2 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <span className="truncate max-w-[200px] text-primary/70 group-hover:underline">
                            {item.href.startsWith("http") ? item.href : item.href}
                          </span>
                          <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
