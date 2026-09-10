"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "@/components/theme-provider"
import { Sun, Moon, Menu, X, Smartphone, MapPin, Code } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
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

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="mx-auto flex h-14 w-full max-w-[1380px] items-center justify-between px-4 sm:px-6 lg:px-8">
        
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
              
              {/* Portals Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Portals
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem href="/student" title="Student Portal">
                      Access your reports, marks, academic fees, and announcements.
                    </ListItem>
                    <ListItem href="/teacher" title="Teacher Portal">
                      Manage class registers, students, and post notices.
                    </ListItem>
                    <ListItem href="/student/library" title="Library Catalog">
                      Search library books, view reservations, and issue status.
                    </ListItem>
                    <ListItem href="/student/fees" title="Fees Portal">
                      View details of student tuition, fees structures, and history.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Academics Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Academics & Life
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem href="/student/notice" title="Circulars & Notices">
                      Latest announcements and circulars for students and parents.
                    </ListItem>
                    <ListItem href="/student/marks" title="Curriculum & Exams">
                      Exams, syllabus outlines, and student assessment schemes.
                    </ListItem>
                    <ListItem href="/docs/admissions" title="Admissions Guide">
                      Enrollment instructions, registration forms, and policy guides.
                    </ListItem>
                    <ListItem href="/docs/co-curriculars" title="Co-Curricular Activities">
                      Indian performing arts, choral singing, music, and robotics.
                    </ListItem>
                    <ListItem href="/gallery" title="Photo Gallery">
                      Explore campus life, student activities, robotics, and school events.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* About Us Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  About Us
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem href="/torch-bearers" title="Torch Bearers">
                      Meet the visionary leaders, Principal, and mentors guiding VidyaSchool.
                    </ListItem>
                    <ListItem href="/sponsors" title="Sponsors & Partners">
                      Organizations backing and empowering our digital classrooms.
                    </ListItem>
                    <ListItem href="/mandatory-public-disclosure" title="Mandatory Public Disclosure">
                      CBSE SARAS compliance, school affiliation credentials, and governance disclosures.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Mandatory Public Disclosure */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/mandatory-public-disclosure" className="text-foreground/80 hover:text-foreground text-sm font-medium whitespace-nowrap">
                    Mandatory Public Disclosure
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Direct Links */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/downloads" className="text-foreground/80 hover:text-foreground text-sm font-medium">
                    Mobile App
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Support & Contact Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Support & Contact
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem href="/student/notice" title="Notices & Circulars">
                      Read latest school-wide notifications, announcements, and bulletins.
                    </ListItem>
                    <ListItem href="/docs" title="Help & Support">
                      Browse detailed guides, user onboarding instructions, and platform FAQs.
                    </ListItem>
                    <ListItem href="/contact" title="Contact Us">
                      Find campus coordinates, working hours, maps, and direct phone lines.
                    </ListItem>
                    <ListItem href="/developers" title="Developers & Creators">
                      Meet the engineers, designers, and contributors behind VidyaSchool.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Controls */}
        <div className="hidden md:flex items-center gap-3">
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
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-4">
          
          {/* Portals Panel */}
          <div>
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Portals</div>
            <div className="grid gap-1">
              <Link href="/student" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Student Portal
              </Link>
              <Link href="/teacher" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Teacher Portal
              </Link>
              <Link href="/student/library" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Library Catalog
              </Link>
              <Link href="/student/fees" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Fees Portal
              </Link>
            </div>
          </div>

          {/* Academics & Life Panel */}
          <div>
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Academics & Life</div>
            <div className="grid gap-1">
              <Link href="/student/notice" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Circulars & Notices
              </Link>
              <Link href="/student/marks" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Curriculum & Exams
              </Link>
              <Link href="/docs/admissions" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Admissions Guide
              </Link>
              <Link href="/docs/co-curriculars" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Co-Curricular Activities
              </Link>
            </div>
          </div>

          {/* About Us Panel */}
          <div>
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">About Us</div>
            <div className="grid gap-1">
              <Link href="/torch-bearers" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Torch Bearers
              </Link>
              <Link href="/sponsors" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Sponsors & Partners
              </Link>
              <Link href="/mandatory-public-disclosure" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Mandatory Public Disclosure
              </Link>
            </div>
          </div>

          {/* Direct Links Panel */}
          <div className="border-t border-border pt-3 space-y-1">
            <Link href="/mandatory-public-disclosure" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
              Mandatory Public Disclosure
            </Link>
            <Link href="/downloads" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
              Mobile App Download
            </Link>
            <Link href="/student/notice" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
              Notices
            </Link>
            <Link href="/docs" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
              Help & Support
            </Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              Contact Us
            </Link>
            <Link href="/developers" onClick={() => setMobileMenuOpen(false)} className="px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md flex items-center gap-2">
              <Code className="h-4 w-4 text-primary shrink-0" />
              Developers & Creators
            </Link>
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
