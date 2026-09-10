import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { SectionSeparator } from "@/components/section-separator"
import { InViewRender } from "@/components/in-view-render"
import { Button } from "@/components/ui/button"
import { BlurImg } from "@/components/blur-image"
import dynamic from "next/dynamic"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VidyaSchool | Empowering Minds, Shaping Futures',
  description: 'Welcome to VidyaSchool - academic excellence meets holistic development with modern labs, arts programs, and vibrant student community.',
}

const VideoModal = dynamic(() => import("@/components/video-modal"), {
  loading: () => <div className="w-full aspect-video rounded-2xl bg-muted/20 animate-pulse" />
})
const ImageLightbox = dynamic(() => import("@/components/image-lightbox"))
const SchoolGallery = dynamic(() => import("@/components/school-gallery"))

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 flex flex-col">
        <HeroSection />
        <SectionSeparator />

        <div className="mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-8">
          <InViewRender minHeight="380px" rootMargin="200px 0px">
            <section id="about" className="w-full mt-16 md:mt-24 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                <div className="lg:col-span-7"><VideoModal /></div>
                <div className="lg:col-span-5 flex flex-col justify-center space-y-5">

                  <p className="text-lg sm:text-xl font-semibold text-foreground leading-relaxed">
                    "It's like a home to me. It's the place where I grow as a person, get exposed to new ideas, learn and reach for my dreams."
                  </p>

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Here's a short film with the students, teachers, and staff talking about what makes the VIDYA School different and what it means to them.
                  </p>

                  <div className="space-y-2.5 pt-1 text-sm text-muted-foreground">
                    <p>✓ <span className="font-medium text-foreground">Holistic Growth</span> — Fostering personal development alongside academic excellence.</p>
                    <p>✓ <span className="font-medium text-foreground">New Ideas & Exposure</span> — Broadening horizons through visual and physical digital learning.</p>
                    <p>✓ <span className="font-medium text-foreground">A Nurturing Community</span> — A second home where students, teachers, and staff grow together.</p>
                  </div>

                </div>
              </div>
            </section>
          </InViewRender>

          {/* Principal Section */}
          <InViewRender minHeight="380px" rootMargin="200px 0px" className="overflow-visible">
            <section id="principal" className="w-full mt-24 md:mt-36 py-8 overflow-visible">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-16 md:pt-24 lg:pt-36">

                {/* Left — text content */}
                <div className="lg:col-span-5 flex flex-col justify-center space-y-5 order-2 lg:order-1">
                  <div>
                    <p className="text-lg sm:text-xl font-semibold text-foreground leading-snug">Ila Sarin</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Principal, VidyaSchool · MSc Chemistry · B.Ed</p>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    A highly recognized educator deeply committed to empowering underprivileged youth through modern, practical education.
                  </p>
                  <div className="space-y-2.5 pt-1 text-sm text-muted-foreground">
                    <p>✓ <span className="font-medium text-foreground">National Award Winner</span> — Received the Institutional Leadership in Entrepreneurship Award at the Youth Ideathon Awards Ceremony hosted at IIT Delhi.</p>
                    <p>✓ <span className="font-medium text-foreground">Innovation Advocate</span> — Under her guidance, students created "Park2Land" — a smart, tech-driven urban parking solution that beat over 1.85 lakh students to reach the Top 125 National Finals.</p>
                  </div>
                </div>

                {/* Right — principal placeholder */}
                <div className="lg:col-span-7 order-1 lg:order-2 mt-16 sm:mt-20 lg:mt-6">
                  <div
                    className="relative rounded-3xl border border-border/80 h-48 sm:h-64 md:h-80 lg:h-96 overflow-visible"
                  >
                    {/* Clipped bg layer — gradient + grain stay within rounded corners */}
                    <div
                      className="absolute inset-0 rounded-3xl overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, #2a3bbf 0%, #4556d4 35%, #5D6EE2 65%, #6e7fe8 100%)",
                      }}
                    >
                      {/* SVG grain filter */}
                      <svg className="absolute inset-0 w-full h-full opacity-[0.35] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                        <filter id="grain-filter">
                          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
                          <feColorMatrix type="saturate" values="0" />
                        </filter>
                        <rect width="100%" height="100%" filter="url(#grain-filter)" />
                      </svg>
                      {/* Radial glow */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_25%,rgba(255,255,255,0.15)_0%,transparent_65%)] pointer-events-none" />
                    </div>
                    {/* Principal image — overflows above card responsively */}
                    <BlurImg
                      src="/assets/illustrations/principle.png"
                      alt="VidyaSchool Principal"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[300px] sm:h-[400px] md:h-[480px] lg:h-[530px] w-auto max-w-none object-contain"
                    />
                  </div>
                </div>

              </div>
            </section>
          </InViewRender>

          {/* Separator — Our School */}
          <div className="w-full flex flex-col items-center justify-center pt-16 sm:pt-24 pb-6 select-none overflow-hidden my-4 gap-2">
            {/* Top: two separators side by side — cropped via background-position */}
            <div className="flex flex-row w-full max-w-5xl">
              {/* Left: shows left half of SVG (line + left ornament) */}
              <div
                className="flex-1 h-7 opacity-80 dark:opacity-90 pointer-events-none dark:invert dark:hue-rotate-180"
                style={{
                  backgroundImage: "url('/assets/illustrations/separator.svg')",
                  backgroundSize: "200% 100%",
                  backgroundPosition: "left center",
                  backgroundRepeat: "no-repeat",
                }}
              />
              {/* Right: shows right half of SVG (right ornament + line) */}
              <div
                className="flex-1 h-7 opacity-80 dark:opacity-90 pointer-events-none dark:invert dark:hue-rotate-180"
                style={{
                  backgroundImage: "url('/assets/illustrations/separator.svg')",
                  backgroundSize: "200% 100%",
                  backgroundPosition: "right center",
                  backgroundRepeat: "no-repeat",
                }}
              />
            </div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-foreground/80 py-1">
              Our School
            </span>
            {/* Bottom separator — centered */}
            <img
              src="/assets/illustrations/separator.svg"
              alt="Bottom separator"
              className="w-full max-w-xs h-7 object-contain dark:invert dark:hue-rotate-180 opacity-80 dark:opacity-90 pointer-events-none rotate-180"
            />
          </div>

          {/* School Gallery Section */}
          <InViewRender minHeight="540px" rootMargin="250px 0px">
            <section id="students" className="w-full py-6 md:py-10">
              <SchoolGallery />
            </section>
          </InViewRender>

          {/* Mobile App Section - Viewport Partial Rendered */}
          <InViewRender minHeight="450px" rootMargin="250px 0px">
            <section id="mobile-app" className="w-full mt-16 md:mt-24 pt-8 pb-16 md:pb-24 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                {/* Left — mockup cluster */}
                <div className="flex items-center justify-center select-none">
                  <div className="relative flex items-end justify-center w-full max-w-[480px] h-[520px]">
                    {/* Bottom-left mockup */}
                    <BlurImg
                      src="/assets/mockups/bl.svg"
                      alt="App screen – bottom left"
                      className="absolute bottom-0 left-[2%] w-[37%] drop-shadow-xl rounded-[18px] rotate-[-6deg] translate-y-3 z-10"
                      draggable={false}
                    />
                    {/* Centre / main mockup */}
                    <BlurImg
                      src="/assets/mockups/wc.svg"
                      alt="App screen – centre"
                      className="relative w-[46%] drop-shadow-2xl rounded-[22px] z-20"
                      draggable={false}
                    />
                    {/* Bottom-right mockup */}
                    <BlurImg
                      src="/assets/mockups/br.svg"
                      alt="App screen – bottom right"
                      className="absolute bottom-0 right-[2%] w-[37%] drop-shadow-xl rounded-[18px] rotate-[6deg] translate-y-3 z-10"
                      draggable={false}
                    />
                    {/* Soft glow behind centre screen */}
                    <div className="absolute inset-x-[20%] inset-y-[15%] rounded-full bg-rose-500/10 blur-3xl pointer-events-none z-0" />
                  </div>
                </div>

                {/* Right — copy + CTA */}
                <div className="flex flex-col justify-center space-y-7">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                      Now on Mobile
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md">
                      Access assignments, timetables, fee updates, library resources, and live announcements — all from your pocket. The VidyaSchool app keeps students, parents, and teachers seamlessly connected.
                    </p>
                  </div>

                  <Button asChild size="xl" className="rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg hover:shadow-xl self-start px-8">
                    <a href="/downloads">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download Now!
                    </a>
                  </Button>

                  <p className="text-[11px] text-muted-foreground/50">
                    Free to download · Available for Android 8+ &amp; iOS 14+
                  </p>
                </div>
              </div>
            </section>
          </InViewRender>
        </div>
      </main>

      <Footer />
    </div>
  )
}
