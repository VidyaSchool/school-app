"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "@/components/theme-provider"
import { Sun, Moon, Menu, X, Search } from "lucide-react"
import { useSearchContext } from "fumadocs-ui/contexts/search"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Memoized — does not re-render on header scroll state changes
const ThemeToggle = React.memo(function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-8 w-8 rounded-md bg-muted/20 border border-border" />
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="cursor-pointer"
      aria-label="Toggle theme"
    >
      <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
      <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
    </Button>
  )
})

const SearchButton = React.memo(function SearchButton() {
  const { setOpenSearch } = useSearchContext()

  const handleOpenSearch = React.useCallback(() => {
    try {
      setOpenSearch(true)
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-vidya-search"))
    }
  }, [setOpenSearch])

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleOpenSearch}
      className="cursor-pointer"
      aria-label="Search (Ctrl + K)"
      title="Search (Ctrl + K)"
    >
      <Search className="h-4.5 w-4.5 text-foreground" />
    </Button>
  )
})

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full relative">
      {/* Linear Gradient Progressive Blur Background — pure blur linear gradient (max at top, minimum at bottom), no color gradient, no bottom border */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full -z-10 overflow-hidden select-none"
        aria-hidden="true"
      >
        {/* Layer 1: Base subtle blur tapering to bottom */}
        <div
          className="absolute inset-0 backdrop-blur-[3px]"
          style={{
            maskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.85) 40%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.85) 40%, transparent 100%)",
          }}
        />
        {/* Layer 2: Medium blur */}
        <div
          className="absolute inset-0 backdrop-blur-[8px]"
          style={{
            maskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.85) 25%, transparent 75%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.85) 25%, transparent 75%)",
          }}
        />
        {/* Layer 3: Strong blur */}
        <div
          className="absolute inset-0 backdrop-blur-[16px]"
          style={{
            maskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.85) 15%, transparent 55%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.85) 15%, transparent 55%)",
          }}
        />
        {/* Layer 4: Maximum blur concentrated at the top */}
        <div
          className="absolute inset-0 backdrop-blur-[28px]"
          style={{
            maskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,1) 8%, transparent 35%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,1) 8%, transparent 35%)",
          }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-[1380px] items-center justify-between px-4 sm:px-6 lg:px-8 pt-2.5 pb-5 md:pt-3 md:pb-6">
        
        {/* Brand/Logo */}
        <div className="flex items-center gap-6">
          <Link id="header-brand-logo" href="/" className="flex items-center gap-2 font-semibold text-sm tracking-tight text-foreground hover:opacity-90">
            <span className="font-semibold text-sm">VidyaSchool</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center flex-1 px-8">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              
              {/* About Us Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  About
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[640px]">
                    <ListItem href="/p/about-vidyaschool" title="About VidyaSchool">
                      Inaugurated in 2009, providing holistic CBSE education to 1000+ students.
                    </ListItem>
                    <ListItem href="/p/principals-message" title="Principal's Message">
                      Educational philosophy and welcoming address from the Principal.
                    </ListItem>
                    <ListItem href="/p/vision-and-mission" title="Vision & Mission">
                      Our core foundational pillars to Educate, Empower, and Transform.
                    </ListItem>
                    <ListItem href="/p/leadership" title="Leadership & Governance">
                      Distinguished educational trustees, directorate, and school leadership.
                    </ListItem>
                    <ListItem href="/torch-bearers" title="Torch Bearers">
                      Meet the visionary mentors and founders guiding VidyaSchool.
                    </ListItem>
                    <ListItem href="/sponsors" title="Sponsors & Partners">
                      Corporate and philanthropic partners empowering our digital classrooms.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Academics Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Academics
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[640px]">
                    <ListItem href="/p/curriculum" title="Curriculum Overview">
                      Holistic CBSE curriculum framework and continuous evaluations.
                    </ListItem>
                    <ListItem href="/p/subjects" title="Academic Subjects">
                      Core and skill subjects from Primary to Senior Secondary levels.
                    </ListItem>
                    <ListItem href="/p/syllabus" title="Curriculum Syllabus">
                      Unit-wise competency syllabus aligned with NCERT and NEP.
                    </ListItem>
                    <ListItem href="/p/textbooks" title="Prescribed Textbooks">
                      Authentic NCERT and CBSE learning materials provided to students.
                    </ListItem>
                    <ListItem href="/p/examinations" title="Examinations & Assessments">
                      Periodic reviews, term-end exams, and pre-board simulations.
                    </ListItem>
                    <ListItem href="/p/academic-calendar" title="Academic Calendar">
                      Term schedules, holidays, examinations, and annual milestone dates.
                    </ListItem>
                    <ListItem href="/p/results" title="Board Results & Honors">
                      100% board pass percentage and academic distinction awards.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Campus & Life Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Campus & Life
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[640px]">
                    <ListItem href="/p/infrastructure" title="Campus Infrastructure">
                      Digital smart classrooms, athletic fields, and modern school facilities.
                    </ListItem>
                    <ListItem href="/p/laboratories" title="Science Laboratories">
                      Modern Physics, Chemistry, Biology, and Computer Science laboratories.
                    </ListItem>
                    <ListItem href="/p/library" title="Library Resource Centre">
                      Over 10,000 volumes, e-learning stations, and reading circles.
                    </ListItem>
                    <ListItem href="/p/sports" title="Sports & Physical Ed">
                      Football, cricket pitches, basketball courts, and athletics training.
                    </ListItem>
                    <ListItem href="/p/robotics" title="Robotics & STEM Hub">
                      Lego STEM arena, micro-controllers, coding, and annual Tech Fest.
                    </ListItem>
                    <ListItem href="/p/arts-and-music" title="Arts, Dance & Music">
                      Visual arts studio, classical Indian music, and theater drama academy.
                    </ListItem>
                    <ListItem href="/p/student-life" title="Student Life at Vidya">
                      Four house system, hot meals, health care, and student council.
                    </ListItem>
                    <ListItem href="/p/clubs" title="Clubs & Activities">
                      Robotics, Eco Crusaders, Literary & Debating Society, and excursions.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Admissions Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Admissions
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem href="/p/admission-process" title="Admission Process">
                      Step-by-step registration guidelines and document verification.
                    </ListItem>
                    <ListItem href="/p/eligibility" title="Eligibility Criteria">
                      Age requirements and prerequisites across Nursery to Class XI.
                    </ListItem>
                    <ListItem href="/p/fee-structure" title="Fee Structure & Scholarships">
                      Subsidized community tuition and 100% full sponsorship opportunities.
                    </ListItem>
                    <ListItem href="/p/faqs" title="Admissions FAQs">
                      Frequently asked questions regarding admissions, timings, and buses.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Disclosures Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Disclosures
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[640px]">
                    <ListItem href="/p/mandatory-public-disclosure" title="Mandatory Public Disclosure">
                      CBSE Appendix IX compliance, SARAS credentials, and disclosures.
                    </ListItem>
                    <ListItem href="/p/affiliation" title="CBSE Affiliation Status">
                      Senior Secondary English-medium CBSE affiliation status details.
                    </ListItem>
                    <ListItem href="/p/certificates" title="Compliance Certificates">
                      Building safety, fire safety, water hygiene, and recognition NOCs.
                    </ListItem>
                    <ListItem href="/p/annual-report" title="Annual Reports">
                      Annual review of institutional operations, academics, and activities.
                    </ListItem>
                    <ListItem href="/p/school-management-committee" title="School Management (SMC)">
                      Governing committee composition, executive members, and roles.
                    </ListItem>
                    <ListItem href="/p/pta" title="Parents Teachers Assoc. (PTA)">
                      Collaborative parent-teacher engagement, forums, and PTM schedules.
                    </ListItem>
                    <ListItem href="/p/faculty-details" title="Faculty Details (OASIS)">
                      Official teacher count, qualifications, and student-teacher ratios.
                    </ListItem>
                    <ListItem href="/p/infrastructure-details" title="Infrastructure Details">
                      Campus land specs, classroom dimensions, and safety measures.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Community & Get Involved Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Community
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem href="/p/get-involved" title="Get Involved & Mentorship">
                      Join the VIDYA MITR mentoring program, workshops, and visits.
                    </ListItem>
                    <ListItem href="/p/events" title="Events & Celebrations">
                      Tech Fest, Lit Fest, National Days, and cultural celebrations.
                    </ListItem>
                    <ListItem href="/p/notices" title="Notices & Bulletins">
                      Official notifications, calendar updates, and parent circulars.
                    </ListItem>
                    <ListItem href="/p/contact" title="Contact Us">
                      Campus coordinates, phone lines, visiting hours, and inquiry form.
                    </ListItem>
                    <ListItem href="/student" title="Student Portal">
                      Access homework, attendance, fee desk, and academic notices.
                    </ListItem>
                    <ListItem href="/teacher" title="Teacher Portal">
                      Class management, attendance marking, and grading tools.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Controls */}
        <div className="hidden md:flex items-center gap-3">
          <SearchButton />
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link id="header-student-portal-btn" href="/login">
              Login
            </Link>
          </Button>
          <Button variant="default" asChild>
            <Link id="header-teacher-portal-btn" href="/signup">
              Signup
            </Link>
          </Button>
        </div>

        {/* Mobile Hamburg Trigger & Controls */}
        <div className="flex md:hidden items-center gap-2">
          <SearchButton />
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

      </div>

      {/* Mobile Drawer Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-4 max-h-[85vh] overflow-y-auto">
          
          {/* About Us Panel */}
          <div>
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</div>
            <div className="grid gap-1">
              <Link href="/p/about-vidyaschool" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                About VidyaSchool
              </Link>
              <Link href="/p/principals-message" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Principal&apos;s Message
              </Link>
              <Link href="/p/vision-and-mission" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Vision &amp; Mission
              </Link>
              <Link href="/p/leadership" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Leadership &amp; Governance
              </Link>
              <Link href="/torch-bearers" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Torch Bearers
              </Link>
            </div>
          </div>

          {/* Academics Panel */}
          <div>
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Academics</div>
            <div className="grid gap-1">
              <Link href="/p/curriculum" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Curriculum Overview
              </Link>
              <Link href="/p/subjects" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Academic Subjects
              </Link>
              <Link href="/p/syllabus" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Curriculum Syllabus
              </Link>
              <Link href="/p/textbooks" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Prescribed Textbooks
              </Link>
              <Link href="/p/examinations" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Examinations &amp; Evaluations
              </Link>
              <Link href="/p/academic-calendar" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Academic Calendar
              </Link>
              <Link href="/p/results" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Board Exam Results
              </Link>
            </div>
          </div>

          {/* Campus & Life Panel */}
          <div>
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Campus &amp; Life</div>
            <div className="grid gap-1">
              <Link href="/p/infrastructure" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Campus Infrastructure
              </Link>
              <Link href="/p/laboratories" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Science Laboratories
              </Link>
              <Link href="/p/library" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Library Resource Centre
              </Link>
              <Link href="/p/sports" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Sports &amp; Athletics
              </Link>
              <Link href="/p/robotics" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Robotics &amp; STEM Hub
              </Link>
              <Link href="/p/arts-and-music" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Arts, Dance &amp; Music
              </Link>
              <Link href="/p/student-life" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Student Life at Vidya
              </Link>
              <Link href="/p/clubs" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Clubs &amp; Activities
              </Link>
              <Link href="/gallery" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Photo Gallery
              </Link>
            </div>
          </div>

          {/* Admissions Panel */}
          <div>
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Admissions</div>
            <div className="grid gap-1">
              <Link href="/p/admission-process" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Admission Process
              </Link>
              <Link href="/p/eligibility" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Eligibility Criteria
              </Link>
              <Link href="/p/fee-structure" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Fee Structure &amp; Scholarships
              </Link>
              <Link href="/p/faqs" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Admissions FAQs
              </Link>
            </div>
          </div>

          {/* Disclosures Panel */}
          <div>
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Disclosures</div>
            <div className="grid gap-1">
              <Link href="/p/mandatory-public-disclosure" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Mandatory Public Disclosure
              </Link>
              <Link href="/p/affiliation" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                CBSE Affiliation Status
              </Link>
              <Link href="/p/certificates" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Compliance Certificates
              </Link>
              <Link href="/p/annual-report" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Annual Reports
              </Link>
              <Link href="/p/school-management-committee" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                School Management (SMC)
              </Link>
              <Link href="/p/pta" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Parents Teachers Assoc. (PTA)
              </Link>
              <Link href="/p/faculty-details" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Faculty Details (OASIS)
              </Link>
              <Link href="/p/infrastructure-details" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Infrastructure Details
              </Link>
            </div>
          </div>

          {/* Community & Contact Panel */}
          <div>
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Community &amp; Portals</div>
            <div className="grid gap-1">
              <Link href="/p/get-involved" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Get Involved &amp; Mentorship
              </Link>
              <Link href="/p/notices" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Notices &amp; Bulletins
              </Link>
              <Link href="/p/events" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Events &amp; Celebrations
              </Link>
              <Link href="/p/contact" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Contact Us
              </Link>
              <Link href="/student" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Student Portal
              </Link>
              <Link href="/teacher" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Teacher Portal
              </Link>
            </div>
          </div>

          {/* Action Buttons Panel */}
          <div className="border-t border-border pt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" asChild className="w-full">
              <Link id="mobile-login-btn" href="/login" onClick={() => setMobileMenuOpen(false)}>
                Login
              </Link>
            </Button>
            <Button variant="default" asChild className="w-full">
              <Link id="mobile-signup-btn" href="/signup" onClick={() => setMobileMenuOpen(false)}>
                Signup
              </Link>
            </Button>
          </div>

        </div>
      )}
    </header>
  )
}

interface ListItemProps extends React.ComponentPropsWithoutRef<"a"> {
  title: string
}

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ className, title, children, href, ...props }, ref) => {
    return (
      <li className="list-none">
        <NavigationMenuLink asChild>
          <Link
            href={href || "/"}
            ref={ref}
            className={cn(
              "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none text-foreground">{title}</div>
            <p className="line-clamp-2 text-xs leading-normal text-muted-foreground mt-1">
              {children}
            </p>
          </Link>
        </NavigationMenuLink>
      </li>
    )
  }
)
ListItem.displayName = "ListItem"
