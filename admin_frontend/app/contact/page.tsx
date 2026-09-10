import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"
import Link from "next/link"
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  ExternalLink,
  CalendarDays,
  Building2,
  Code,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Get in Touch | VidyaSchool",
  description:
    "Contact VidyaSchool — address, phone number, working hours, and location map. We're here Monday to Saturday at DLF Phase 3, Gurugram.",
}

const HOURS = [
  {
    day: "Monday – Friday",
    hours: "8:00 – 16:30 Hrs",
    note: "Phone lines open until 16:30",
  },
  {
    day: "Saturday",
    hours: "8:00 – 14:00 Hrs",
    note: "Office only",
  },
  {
    day: "Sunday",
    hours: "Closed",
    note: "",
  },
]

const MAPS_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4388.044830651649!2d77.09666967618728!3d28.48607899071487!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d19327f21b643%3A0x3d26c212131a917f!2sVidya%20School%20(Gurugram)!5e1!3m2!1sen!2sin!4v1784549733260!5m2!1sen!2sin"

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-background via-primary/3 to-background py-20 sm:py-28">
          {/* subtle grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(to right,currentColor 1px,transparent 1px),linear-gradient(to bottom,currentColor 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {/* glow */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
              <Building2 className="h-3.5 w-3.5" />
              Gurugram, Haryana
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Get in{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
              We're here to help. Reach us by phone, visit our campus, or drop
              us a message — our team responds within one working day.
            </p>
            <p className="text-sm font-medium italic text-muted-foreground/60">
              "Be the guiding star" — VidyaSchool
            </p>
          </div>
        </section>

        {/* ── School image banner ── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 relative z-10">
          <div className="overflow-hidden rounded-2xl border border-border/60 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/vidyaschool/school.jpg"
              alt="VidyaSchool campus — DLF Phase 3, Gurugram"
              fetchPriority="high"
              decoding="async"
              className="w-full object-cover h-56 sm:h-80 lg:h-[420px]"
            />
          </div>
        </div>

        {/* ── Cards grid ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid gap-6 lg:grid-cols-3">

            {/* ── Address card ── */}
            <div className="group relative flex flex-col gap-5 rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md lg:col-span-1">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </span>
                <h2 className="text-base font-bold text-foreground">We are Here</h2>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground">VIDYA SCHOOL</p>
                <p>Plot No. 3126, Block S,</p>
                <p>Near St. Stephen's Hospital,</p>
                <p>DLF Phase – 3, Sector 24,</p>
                <p>Gurugram, Haryana 122002</p>
              </div>

              <a
                href="https://maps.google.com/?q=DLF+Phase+3+Sector+24+Gurugram+Haryana+122002"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Google Maps
              </a>
            </div>

            {/* ── Contact card ── */}
            <div className="group relative flex flex-col gap-5 rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Phone className="h-5 w-5" />
                </span>
                <h2 className="text-base font-bold text-foreground">Contact Details</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Phone
                  </p>
                  <a
                    href="tel:+918130672281"
                    className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    +91 – 8130672281
                  </a>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Email
                  </p>
                  <a
                    href="mailto:info@vidyaschool.edu.in"
                    className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    info@vidyaschool.edu.in
                  </a>
                </div>
              </div>

              <div className="mt-auto rounded-lg border border-border/50 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                📞 Phone lines are active during working hours only. For urgent matters outside hours, email us.
              </div>
            </div>

            {/* ── Hours card ── */}
            <div className="group relative flex flex-col gap-5 rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" />
                </span>
                <h2 className="text-base font-bold text-foreground">Working Hours</h2>
              </div>

              <div className="flex-1 divide-y divide-border/40">
                {HOURS.map(({ day, hours, note }) => (
                  <div key={day} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{day}</p>
                      {note && (
                        <p className="text-[11px] text-muted-foreground/70">{note}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${
                        hours === "Closed"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {hours}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                Hours may vary on public holidays. Check school circulars for closures.
              </div>
            </div>
          </div>
        </section>

        {/* ── Map ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
          <div className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
            {/* header strip */}
            <div className="flex items-center justify-between border-b border-border/60 bg-card px-5 py-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">VIDYA SCHOOL</p>
                  <p className="text-xs text-muted-foreground">DLF Phase – 3, Sector 24, Gurugram, Haryana 122002</p>
                </div>
              </div>
              <a
                href="https://maps.google.com/?q=DLF+Phase+3+Sector+24+Gurugram+Haryana+122002"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <ExternalLink className="h-3 w-3" />
                Directions
              </a>
            </div>

            {/* Map iframe */}
            <div className="relative h-[420px] w-full bg-muted/20 sm:h-[500px]">
              <iframe
                title="VidyaSchool Location"
                src={MAPS_EMBED}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </section>

        {/* ── Bottom CTA strip ── */}
        <section className="border-t border-border/60 bg-muted/20 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4 text-center">
            <p className="text-2xl font-extrabold tracking-tight text-foreground">
              Still have questions?
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Browse our documentation for step-by-step guides on the student portal, fee payments, library, and more.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="/docs"
                className="inline-flex items-center gap-2 rounded-xl border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                View Documentation
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Link
                href="/developers"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-xs hover:bg-accent transition-colors"
              >
                <Code className="h-4 w-4 text-primary" />
                Meet the Developers
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
