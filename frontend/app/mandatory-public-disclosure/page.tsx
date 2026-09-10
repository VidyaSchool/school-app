import * as React from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  FileText,
  ExternalLink,
  Building,
  GraduationCap,
  Award,
  Video,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Mandatory Public Disclosure | Vidya School",
  description:
    "Mandatory Public Disclosure in respect of VIDYA School, Gurgaon in compliance with CBSE Circular No. 09/2021 and SARAS guidelines.",
}

export default function MandatoryPublicDisclosurePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="relative border-b border-border bg-muted/20 py-12 md:py-16">
          <div className="mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline" className="text-primary border-primary/30">
                CBSE Affiliated
              </Badge>
              <Badge variant="secondary">Affiliation No: 531105</Badge>
              <Badge variant="secondary">School Code: 41054</Badge>
              <Badge variant="outline">Circular No: 09/2021</Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Mandatory Public Disclosure
            </h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
              In respect of VIDYA School, Gurgaon. Published in strict compliance with the
              Central Board of Secondary Education (CBSE) directives, SARAS 4.0/5.0 framework,
              and standard institutional transparency norms.
            </p>

            {/* Quick Navigation Anchor Bar */}
            <div className="mt-8 flex flex-wrap gap-2 text-xs">
              <a
                href="#general-info"
                className="px-3 py-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors"
              >
                A: General Info
              </a>
              <a
                href="#documents-info"
                className="px-3 py-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors"
              >
                B: Documents &amp; Certificates
              </a>
              <a
                href="#academics"
                className="px-3 py-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors"
              >
                C: Result &amp; Academics
              </a>
              <a
                href="#board-results"
                className="px-3 py-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors"
              >
                Board Results (X &amp; XII)
              </a>
              <a
                href="#staff"
                className="px-3 py-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors"
              >
                D: Teaching Staff
              </a>
              <a
                href="#infrastructure"
                className="px-3 py-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors"
              >
                E: Infrastructure
              </a>
              <a
                href="#saras-disclosure"
                className="px-3 py-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors"
              >
                F: SARAS Disclosure
              </a>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <div className="mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          
          {/* SECTION A: GENERAL INFORMATION */}
          <section id="general-info" className="scroll-mt-20">
            <Card>
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">A: General Information</CardTitle>
                    <CardDescription>
                      Basic institutional identification and contact coordinates of VIDYA School.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-16 text-center">S.No.</TableHead>
                      <TableHead className="w-1/3">Information</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-center font-medium">1</TableCell>
                      <TableCell className="font-semibold text-foreground">Name of School</TableCell>
                      <TableCell className="font-medium text-foreground">VIDYA SCHOOL, GURGAON</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center font-medium">2</TableCell>
                      <TableCell className="font-semibold text-foreground">Affiliation No. (If Applicable)</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">531105</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center font-medium">3</TableCell>
                      <TableCell className="font-semibold text-foreground">School Code (If Applicable)</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">41054</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center font-medium">4</TableCell>
                      <TableCell className="font-semibold text-foreground">Complete Address with PIN Code</TableCell>
                      <TableCell className="text-muted-foreground whitespace-normal">
                        VIDYA SCHOOL, Plot 3126, S Block, Sector 24, DLF Phase 3, Gurgaon - 122010, Haryana, India
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center font-medium">5</TableCell>
                      <TableCell className="font-semibold text-foreground">Principal Name &amp; Qualification</TableCell>
                      <TableCell className="whitespace-normal">
                        <span className="font-medium text-foreground">Ms. Ila Sarin</span>
                        <span className="text-muted-foreground text-xs block">MSc (Chemistry), B.Ed</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center font-medium">6</TableCell>
                      <TableCell className="font-semibold text-foreground">School Email ID</TableCell>
                      <TableCell className="space-y-1">
                        <div>
                          <a
                            href="mailto:principal.vidyaschool@vidya-india.org"
                            className="text-primary hover:underline text-xs sm:text-sm"
                          >
                            principal.vidyaschool@vidya-india.org
                          </a>
                        </div>
                        <div>
                          <a
                            href="mailto:info.vidyaschool@vidya-india.org"
                            className="text-primary hover:underline text-xs sm:text-sm"
                          >
                            info.vidyaschool@vidya-india.org
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center font-medium">7</TableCell>
                      <TableCell className="font-semibold text-foreground">Contact Detail</TableCell>
                      <TableCell>
                        <a href="tel:+918130672281" className="text-primary hover:underline font-medium">
                          +91-8130672281
                        </a>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* SECTION B: DOCUMENTS AND INFORMATION */}
          <section id="documents-info" className="scroll-mt-20">
            <Card>
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">B: Documents and Information</CardTitle>
                    <CardDescription>
                      Statutory regulatory certificates, safety approvals, and affiliation documentation.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-16 text-center">S.No.</TableHead>
                      <TableHead className="w-3/4">Documents / Information</TableHead>
                      <TableHead className="text-right pr-6">Upload Documents</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        sno: "1",
                        title: "Copies of Affiliation / Upgradation Letter and Recent Extension of Affiliation, if any",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/02/DocScanner-13-Feb-2026-10-20.pdf",
                      },
                      {
                        sno: "2",
                        title: "Copies of Societies / Company Registration / Renewal Certificate, as applicable",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/02/DOC-20260214-WA0003..pdf",
                      },
                      {
                        sno: "3",
                        title: "Copy of No Objection Certificate (NOC) issued, if applicable, by the State Govt./UT",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/02/3-page.pdf",
                      },
                      {
                        sno: "4",
                        title: "Copies of Recognition Certificate under RTE Act, 2009 and its renewal if applicable",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/02/DocScanner-13-Feb-2026-10-23-1.pdf",
                      },
                      {
                        sno: "5",
                        title: "Copy of Valid Building Safety Certificate as per the National Building Code",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/01/new-Building-Certificate.pdf",
                      },
                      {
                        sno: "6",
                        title: "Copy of Valid Fire Safety Certificate issued by the Competent Authority",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/03/updtaed-fire-safety.pdf",
                      },
                      {
                        sno: "7",
                        title: "Copy of the Valid DEO Certificate submitted by the school for affiliation/upgradation/extension of affiliation or Self Declaration by School",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/02/3-page.pdf",
                      },
                      {
                        sno: "8",
                        title: "Copies of Valid Drinking Water, Health and Sanitation Certificates and Water Testing Report",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/02/DOC-20260214-WA0001..pdf",
                      },
                      {
                        sno: "9",
                        title: "Copy of Valid Structural Stability Certificate",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2022/05/New-Doc-05-30-2022-10.51.pdf",
                      },
                    ].map((doc) => (
                      <TableRow key={doc.sno}>
                        <TableCell className="text-center font-medium">{doc.sno}</TableCell>
                        <TableCell className="font-medium text-foreground whitespace-normal py-3">
                          {doc.title}
                        </TableCell>
                        <TableCell className="text-right pr-6 whitespace-nowrap">
                          <Button variant="outline" size="sm" asChild className="gap-1.5 h-8">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-3.5 w-3.5 text-primary" />
                              <span>Click here to view</span>
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* SECTION C: RESULT AND ACADEMICS */}
          <section id="academics" className="scroll-mt-20">
            <Card>
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">C: Result and Academics</CardTitle>
                    <CardDescription>
                      Fee schedules, academic calendars, governance committees, and official disclosures.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-16 text-center">S.No.</TableHead>
                      <TableHead className="w-3/4">Documents / Information</TableHead>
                      <TableHead className="text-right pr-6">Upload Documents</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        sno: "1",
                        title: "Fee Structure of the School (2025-2026)",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/01/Fee-Structure-2025-26.pdf",
                      },
                      {
                        sno: "2",
                        title: "Annual Academic Calendar",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/02/Academic-Session-2025-26-session.docx",
                      },
                      {
                        sno: "3",
                        title: "List of School Management Committee (SMC)",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/02/SMC.pdf",
                      },
                      {
                        sno: "4",
                        title: "Teachers Qualification & Designation",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/02/DocScanner-13-Feb-2026-10-251_rotated.pdf",
                      },
                      {
                        sno: "5",
                        title: "List of Parents Teachers Association (PTA) Members",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/02/pta-members.pdf",
                      },
                      {
                        sno: "6",
                        title: "Last Three Years Academic Results of Board Classes",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/02/DocScanner-13-Feb-2026-10-24-1.pdf",
                      },
                      {
                        sno: "7",
                        title: "Student Strength 2025-2026",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/02/SCHOOL-STRENGTH.pdf",
                      },
                      {
                        sno: "8",
                        title: "Achievements",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/02/achievements.docx",
                      },
                      {
                        sno: "9",
                        title: "Innovations & Initiatives",
                        url: null,
                      },
                      {
                        sno: "10",
                        title: "Important SMC Decisions",
                        url: "https://www.vidyaschool.com/wp-content/uploads/2026/03/WhatsApp-Image-2026-02-26-at-8.01.45-AM-1-1.pdf",
                      },
                    ].map((doc) => (
                      <TableRow key={doc.sno}>
                        <TableCell className="text-center font-medium">{doc.sno}</TableCell>
                        <TableCell className="font-medium text-foreground whitespace-normal py-3">
                          {doc.title}
                        </TableCell>
                        <TableCell className="text-right pr-6 whitespace-nowrap">
                          {doc.url ? (
                            <Button variant="outline" size="sm" asChild className="gap-1.5 h-8">
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-3.5 w-3.5 text-primary" />
                                <span>Click here to view</span>
                                <ExternalLink className="h-3 w-3 opacity-60" />
                              </a>
                            </Button>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Available upon request</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* BOARD RESULTS: CLASS X & CLASS XII */}
          <section id="board-results" className="scroll-mt-20 space-y-8">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Board Examination Performance</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Official CBSE 3-year academic pass metrics for Secondary (Class X) and Senior Secondary (Class XII).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Class X Table */}
              <Card>
                <CardHeader className="border-b border-border/60 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">C (i): Result Class X</CardTitle>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      100% Pass Rate
                    </Badge>
                  </div>
                  <CardDescription>Secondary School Examination (AISSE)</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-12 text-center">S.No.</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead className="text-center">Registered</TableHead>
                        <TableHead className="text-center">Passed</TableHead>
                        <TableHead className="text-center">Pass %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { sno: "1", year: "2022-2023", reg: "70", pass: "70", pct: "100%" },
                        { sno: "2", year: "2023-2024", reg: "79", pass: "79", pct: "100%" },
                        { sno: "3", year: "2024-2025", reg: "67", pass: "67", pct: "100%" },
                      ].map((row) => (
                        <TableRow key={row.year}>
                          <TableCell className="text-center font-medium">{row.sno}</TableCell>
                          <TableCell className="font-semibold text-foreground">{row.year}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{row.reg}</TableCell>
                          <TableCell className="text-center font-medium text-foreground">{row.pass}</TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {row.pct}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Class XII Table */}
              <Card>
                <CardHeader className="border-b border-border/60 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">C (ii): Result Class XII</CardTitle>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      100% Pass Rate
                    </Badge>
                  </div>
                  <CardDescription>Senior School Certificate Examination (AISSCE)</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-12 text-center">S.No.</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead className="text-center">Registered</TableHead>
                        <TableHead className="text-center">Passed</TableHead>
                        <TableHead className="text-center">Pass %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { sno: "1", year: "2022-2023", reg: "72", pass: "72", pct: "100%" },
                        { sno: "2", year: "2023-2024", reg: "88", pass: "88", pct: "100%" },
                        { sno: "3", year: "2024-2025", reg: "82", pass: "82", pct: "100%" },
                      ].map((row) => (
                        <TableRow key={row.year}>
                          <TableCell className="text-center font-medium">{row.sno}</TableCell>
                          <TableCell className="font-semibold text-foreground">{row.year}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{row.reg}</TableCell>
                          <TableCell className="text-center font-medium text-foreground">{row.pass}</TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {row.pct}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* SECTION D: STAFF (TEACHING) */}
          <section id="staff" className="scroll-mt-20">
            <Card>
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">D: Staff (Teaching)</CardTitle>
                    <CardDescription>
                      Faculty breakdown, student-teacher ratio, and certified special educators.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-16 text-center">S.No.</TableHead>
                      <TableHead className="w-1/3">Information</TableHead>
                      <TableHead className="w-24 text-center">Details</TableHead>
                      <TableHead>Name and Qualifications / Document</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-center font-medium">1</TableCell>
                      <TableCell className="font-semibold text-foreground">Principal</TableCell>
                      <TableCell className="text-center font-mono font-medium">01</TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">Ms. Ila Sarin</span>
                        <span className="text-muted-foreground text-xs block">MSc (Chemistry), B.Ed</span>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">2</TableCell>
                      <TableCell className="font-semibold text-foreground">Vice Principal</TableCell>
                      <TableCell className="text-center font-mono font-medium">00</TableCell>
                      <TableCell className="text-muted-foreground">—</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">3</TableCell>
                      <TableCell className="font-semibold text-foreground">
                        Total No. of Teachers
                        <div className="text-xs text-muted-foreground font-normal mt-0.5">
                          PGT: 16 | TGT: 18 | PRT: 15
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-foreground">49</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild className="gap-1.5 h-8">
                          <a
                            href="https://www.vidyaschool.com/wp-content/uploads/2026/02/web-te.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <span>Click here to view faculty register</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">4</TableCell>
                      <TableCell className="font-semibold text-foreground">Teacher Section Ratio</TableCell>
                      <TableCell className="text-center font-mono font-medium">40:1</TableCell>
                      <TableCell className="text-muted-foreground">Standard CBSE class strength</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">5</TableCell>
                      <TableCell className="font-semibold text-foreground">Details of Special Educator</TableCell>
                      <TableCell className="text-center font-mono font-medium">01</TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">Ms. Uma Jangra</span>
                        <span className="text-muted-foreground text-xs block">
                          B.A, M.A (Political Science), B.Ed (Special Education)
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">6</TableCell>
                      <TableCell className="font-semibold text-foreground">Details of Counsellor</TableCell>
                      <TableCell className="text-center font-mono font-medium">01</TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">Ms. Nikita Kulhari</span>
                        <span className="text-muted-foreground text-xs block">M.A (Applied Psychology)</span>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">7</TableCell>
                      <TableCell className="font-semibold text-foreground">Details of Teacher Training</TableCell>
                      <TableCell className="text-center font-mono text-muted-foreground">—</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild className="gap-1.5 h-8">
                          <a
                            href="https://www.vidyaschool.com/wp-content/uploads/2026/02/CBSE-TEACHERS-TRAINING-2025.xlsx"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <span>Click here to view training records (XLSX)</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">8</TableCell>
                      <TableCell className="font-semibold text-foreground">Details of Wellness Teacher</TableCell>
                      <TableCell className="text-center font-mono font-medium">01</TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">Ms. Archana</span>
                        <span className="text-muted-foreground text-xs block">B.A (Social Work)</span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* SECTION E: SCHOOL INFRASTRUCTURE */}
          <section id="infrastructure" className="scroll-mt-20">
            <Card>
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">E: School Infrastructure</CardTitle>
                    <CardDescription>
                      Physical campus dimensions, laboratory capacities, sanitary provisions, and video inspection.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-16 text-center">S.No.</TableHead>
                      <TableHead className="w-2/3">Information</TableHead>
                      <TableHead className="text-right pr-6">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-center font-medium">1</TableCell>
                      <TableCell className="font-semibold text-foreground">Total Campus Area of the School</TableCell>
                      <TableCell className="text-right pr-6 font-mono font-medium">20,235 Sq Mtr</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">2</TableCell>
                      <TableCell className="font-semibold text-foreground">Number and Size of the Classrooms</TableCell>
                      <TableCell className="text-right pr-6 font-mono font-medium">70 (50 Sq Mtr each)</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">3</TableCell>
                      <TableCell className="font-semibold text-foreground">
                        Number and Size of Laboratories Including Computer Labs
                      </TableCell>
                      <TableCell className="text-right pr-6 font-mono font-medium">08 (76 Sq Mtr each)</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">4</TableCell>
                      <TableCell className="font-semibold text-foreground">Internet Facility (Y/N)</TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
                          YES
                        </Badge>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">5</TableCell>
                      <TableCell className="font-semibold text-foreground">Number of Girls Toilets</TableCell>
                      <TableCell className="text-right pr-6 font-mono font-medium">24</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">6</TableCell>
                      <TableCell className="font-semibold text-foreground">Number of Boys Toilets</TableCell>
                      <TableCell className="text-right pr-6 font-mono font-medium">24</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">7</TableCell>
                      <TableCell className="font-semibold text-foreground">
                        Link of YouTube Video of the Inspection of School Covering Infrastructure
                      </TableCell>
                      <TableCell className="text-right pr-6 whitespace-nowrap">
                        <Button variant="outline" size="sm" asChild className="gap-1.5 h-8">
                          <a href="https://youtu.be/ND57JV3uZd4" target="_blank" rel="noopener noreferrer">
                            <Video className="h-3.5 w-3.5 text-rose-500" />
                            <span>Watch YouTube Video</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">8</TableCell>
                      <TableCell className="font-semibold text-foreground">Number and Size of Library</TableCell>
                      <TableCell className="text-right pr-6 font-mono font-medium">02 (111.48 Sq Mtr each)</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-center font-medium">9</TableCell>
                      <TableCell className="font-semibold text-foreground">Number of CWSN Toilets</TableCell>
                      <TableCell className="text-right pr-6 text-muted-foreground">—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* SECTION F: MANDATORY PUBLIC DISCLOSURE (CIRCULAR NO : 09/2021) */}
          <section id="saras-disclosure" className="scroll-mt-20">
            <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">F: Mandatory Public Disclosure (Circular No : 09/2021)</CardTitle>
                    <CardDescription>
                      Consolidated SARAS compliance dossier and statutory portal upload.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-16 text-center">S.No.</TableHead>
                      <TableHead className="w-3/4">Documents / Information</TableHead>
                      <TableHead className="text-right pr-6">Upload Documents</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-center font-medium">1</TableCell>
                      <TableCell className="font-semibold text-foreground py-4">
                        Mandatory Disclosure _ SARAS 4.0 / 5.0
                        <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                          Complete consolidated institutional information dossier submitted to CBSE.
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6 whitespace-nowrap">
                        <Button size="sm" asChild className="gap-1.5 h-8">
                          <a
                            href="https://www.vidyaschool.com/wp-content/uploads/2025/01/Mandatory-Disclosure-Details-_-SARAS-5.0.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Click here to view (PDF)</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
