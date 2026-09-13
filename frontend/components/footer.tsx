"use client"

import * as React from "react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-background py-12 md:py-16">
      <div className="mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Column 1: Brand Info & Connect */}
          <div className="space-y-4 sm:col-span-2 md:col-span-3 lg:col-span-1">
            <Link id="footer-brand-logo" href="/" className="flex items-center gap-2 font-semibold text-sm tracking-tight text-foreground hover:opacity-90">
              <span className="font-semibold text-sm">VidyaSchool</span>
            </Link>
            <p className="text-sm font-semibold text-foreground">Be the Guiding Star</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Affiliated with CBSE. Dedicated to academic excellence, creative exploration, STEM innovation, and holistic student development.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Plot No. 3126, Block S, DLF Phase–3, Sector 24, Gurugram, Haryana 122002</p>
              <p className="font-medium text-foreground">Ph: +91-8130672281</p>
              <p>info.vidyaschool@vidya-india.org</p>
            </div>
            <div className="pt-2 space-y-2">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Connect With Us</h4>
              <div className="flex items-center gap-2">
                <Link href="https://www.facebook.com/VIDYAEducationAndEmpowerment/" target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200" aria-label="Facebook">
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                  </svg>
                </Link>
                <Link href="https://twitter.com/vidya_india?lang=en" target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200" aria-label="Twitter">
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </Link>
                <Link href="https://www.instagram.com/vidya_india/" target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200" aria-label="Instagram">
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                </Link>
                <Link href="https://www.linkedin.com/company/vidya-integrated-development-for-youth-and-adults/" target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200" aria-label="LinkedIn">
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </Link>
                <Link href="https://www.youtube.com/channel/UC-2Tbv2yczSSkF6uzYtKkBQ" target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200" aria-label="YouTube">
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Column 2: About & Campus */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">About &amp; Campus</h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/p/about-vidyaschool" className="hover:text-foreground transition-colors">About VidyaSchool</Link>
              </li>
              <li>
                <Link href="/p/principals-message" className="hover:text-foreground transition-colors">Principal&apos;s Message</Link>
              </li>
              <li>
                <Link href="/p/vision-and-mission" className="hover:text-foreground transition-colors">Vision &amp; Mission</Link>
              </li>
              <li>
                <Link href="/p/leadership" className="hover:text-foreground transition-colors">Leadership &amp; Governance</Link>
              </li>
              <li>
                <Link href="/p/infrastructure" className="hover:text-foreground transition-colors">Campus Infrastructure</Link>
              </li>
              <li>
                <Link href="/p/laboratories" className="hover:text-foreground transition-colors">Science Laboratories</Link>
              </li>
              <li>
                <Link href="/p/library" className="hover:text-foreground transition-colors">Library Resource Centre</Link>
              </li>
              <li>
                <Link href="/p/sports" className="hover:text-foreground transition-colors">Sports &amp; Physical Ed</Link>
              </li>
              <li>
                <Link href="/p/stem" className="hover:text-foreground transition-colors">STEM &amp; Robotics Hub</Link>
              </li>
              <li>
                <Link href="/p/arts-and-music" className="hover:text-foreground transition-colors">Arts, Dance &amp; Music</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Academics & Admissions */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Academics &amp; Admissions</h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/p/curriculum" className="hover:text-foreground transition-colors">Curriculum Overview</Link>
              </li>
              <li>
                <Link href="/p/subjects" className="hover:text-foreground transition-colors">Academic Subjects</Link>
              </li>
              <li>
                <Link href="/p/syllabus" className="hover:text-foreground transition-colors">Curriculum Syllabus</Link>
              </li>
              <li>
                <Link href="/p/textbooks" className="hover:text-foreground transition-colors">Prescribed Textbooks</Link>
              </li>
              <li>
                <Link href="/p/examinations" className="hover:text-foreground transition-colors">Examinations &amp; Evaluations</Link>
              </li>
              <li>
                <Link href="/p/academic-calendar" className="hover:text-foreground transition-colors">Academic Calendar</Link>
              </li>
              <li>
                <Link href="/p/results" className="hover:text-foreground transition-colors">Board Exam Results</Link>
              </li>
              <li>
                <Link href="/p/admission-process" className="hover:text-foreground transition-colors">Admission Process</Link>
              </li>
              <li>
                <Link href="/p/eligibility" className="hover:text-foreground transition-colors">Eligibility Criteria</Link>
              </li>
              <li>
                <Link href="/p/fee-structure" className="hover:text-foreground transition-colors">Fee Structure &amp; Scholarships</Link>
              </li>
              <li>
                <Link href="/p/faqs" className="hover:text-foreground transition-colors">Admission FAQs</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Students & Community */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Students &amp; Community</h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/p/student-life" className="hover:text-foreground transition-colors">Student Life at Vidya</Link>
              </li>
              <li>
                <Link href="/p/achievements" className="hover:text-foreground transition-colors">Achievements &amp; Honors</Link>
              </li>
              <li>
                <Link href="/p/clubs" className="hover:text-foreground transition-colors">Student Clubs &amp; Societies</Link>
              </li>
              <li>
                <Link href="/p/activities" className="hover:text-foreground transition-colors">Co-Curricular Activities</Link>
              </li>
              <li>
                <Link href="/p/get-involved" className="hover:text-foreground transition-colors">Get Involved &amp; Mentorship</Link>
              </li>
              <li>
                <Link href="/p/tech-fest" className="hover:text-foreground transition-colors">Vidya Tech Fest</Link>
              </li>
              <li>
                <Link href="/p/events" className="hover:text-foreground transition-colors">Events &amp; Celebrations</Link>
              </li>
              <li>
                <Link href="/p/notices" className="hover:text-foreground transition-colors">Notices &amp; Bulletins</Link>
              </li>
              <li>
                <Link href="/p/circulars" className="hover:text-foreground transition-colors">Administrative Circulars</Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-foreground transition-colors">Campus Photo Gallery</Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Disclosures & Portals */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Disclosures &amp; Portals</h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/p/mandatory-public-disclosure" className="hover:text-foreground transition-colors">Mandatory Public Disclosure</Link>
              </li>
              <li>
                <Link href="/p/affiliation" className="hover:text-foreground transition-colors">CBSE Affiliation Status</Link>
              </li>
              <li>
                <Link href="/p/certificates" className="hover:text-foreground transition-colors">Compliance Certificates</Link>
              </li>
              <li>
                <Link href="/p/annual-report" className="hover:text-foreground transition-colors">Annual Reports</Link>
              </li>
              <li>
                <Link href="/p/school-management-committee" className="hover:text-foreground transition-colors">School Management (SMC)</Link>
              </li>
              <li>
                <Link href="/p/pta" className="hover:text-foreground transition-colors">Parents Teachers Assoc. (PTA)</Link>
              </li>
              <li>
                <Link href="/p/faculty-details" className="hover:text-foreground transition-colors">Faculty Details (OASIS)</Link>
              </li>
              <li>
                <Link href="/p/infrastructure-details" className="hover:text-foreground transition-colors">Infrastructure Details</Link>
              </li>
              <li>
                <Link href="/student" className="hover:text-foreground transition-colors">Student Portal</Link>
              </li>
              <li>
                <Link href="/teacher" className="hover:text-foreground transition-colors">Teacher Portal</Link>
              </li>
              <li>
                <Link href="/p/contact" className="hover:text-foreground transition-colors">Contact Us</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Giant Footer Watermark */}
        <div className="mt-16 md:mt-24 select-none">
          <h2 className="text-center font-bold tracking-tighter text-foreground/20 dark:text-foreground/10 text-4xl sm:text-6xl md:text-[8rem] lg:text-[10rem] xl:text-[12rem] leading-none">
            Vidya School
          </h2>
        </div>

        {/* Bottom copyright section */}
        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} VidyaSchool. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <Link href="/docs/privacy-policy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/docs/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/docs/refund-policy" className="hover:text-foreground transition-colors">Refunds</Link>
            <Link href="/docs/cookie-policy" className="hover:text-foreground transition-colors">Cookies</Link>
            <Link href="/docs/security-policy" className="hover:text-foreground transition-colors">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
