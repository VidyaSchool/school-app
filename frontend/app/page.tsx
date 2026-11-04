import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { SectionSeparator } from "@/components/section-separator"
import { InViewRender } from "@/components/in-view-render"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BlurImg } from "@/components/blur-image"
import Image from "next/image"
import { Check, Quote, Sparkles } from "lucide-react"
import dynamic from "next/dynamic"
import type { Metadata } from 'next'


export const metadata: Metadata = {
  title: 'VIDYA School | Empowering Minds, Shaping Futures',
  description: 'Welcome to VIDYA School - academic excellence meets holistic development with modern labs, arts programs, and vibrant student community.',
}



const VideoModal = dynamic(() => import("@/components/video-modal"), {
  loading: () => <div className="w-full aspect-video rounded-2xl bg-muted/20 animate-pulse" />
})
const SchoolGallery = dynamic(() => import("@/components/school-gallery"))

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 flex flex-col">
        <HeroSection />
        <SectionSeparator />

        {/* About Section with screen-width background and slight x-axis margin */}
        <div className="w-full px-2 sm:px-4 md:px-6">
          <InViewRender minHeight="380px" rootMargin="200px 0px">
            <section id="about" className="relative isolate w-full mt-16 md:mt-24 py-10 sm:py-14 md:py-18 rounded-3xl border border-border/70 overflow-hidden bg-card/40 shadow-sm">
              {/* High-Performance Section Background: founder_bg.webp */}
              <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none transform-gpu will-change-transform">
                <Image
                  src="/assets/illustrations/founder_bg.webp"
                  alt="VIDYA School Environment"
                  fill
                  sizes="100vw"
                  quality={75}
                  priority={false}
                  className="object-cover object-center opacity-40 dark:opacity-20"
                />
                {/* Smooth zero-lag gradient tint eliminating expensive backdrop-filter compositing */}
                <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-background/95 via-background/80 to-background/95 dark:from-background/95 dark:via-background/85 dark:to-background/95" />
              </div>

              {/* Inner Content constrained to max-w-[1380px] */}
              <div className="mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  <div className="lg:col-span-7">
                    <VideoModal />
                  </div>
                  <div className="lg:col-span-5 flex flex-col justify-center space-y-6 bg-card/90 dark:bg-card/85 p-6 sm:p-8 lg:p-9 rounded-2xl sm:rounded-3xl border border-border/70 shadow-lg dark:shadow-2xl">
                    
                    {/* Badge */}
                    <Badge
                      variant="outline"
                      className="bg-primary/5 text-primary border-primary/20 gap-1.5 px-3 py-1 text-xs font-semibold w-fit"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Life at VIDYA
                    </Badge>

                    {/* Quotation */}
                    <div className="space-y-3">
                      <Quote className="h-7 w-7 text-primary/30 rotate-180" />
                      <p className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground leading-snug sm:leading-relaxed">
                        &ldquo;It&apos;s like a home to me. It&apos;s the place where I grow as a person, get exposed to new ideas, learn and reach for my dreams.&rdquo;
                      </p>
                    </div>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Here&apos;s a short film with the students, teachers, and staff talking about what makes VIDYA School different and what it means to them.
                    </p>

                    <div className="space-y-3 pt-1 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-3 w-3 stroke-[2.5]" />
                        </div>
                        <p className="text-muted-foreground leading-snug">
                          <span className="font-semibold text-foreground">Holistic Growth</span> &mdash; Fostering personal development alongside academic excellence.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-3 w-3 stroke-[2.5]" />
                        </div>
                        <p className="text-muted-foreground leading-snug">
                          <span className="font-semibold text-foreground">New Ideas &amp; Exposure</span> &mdash; Broadening horizons through visual and physical digital learning.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-3 w-3 stroke-[2.5]" />
                        </div>
                        <p className="text-muted-foreground leading-snug">
                          <span className="font-semibold text-foreground">A Nurturing Community</span> &mdash; A second home where students, teachers, and staff grow together.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </section>
          </InViewRender>
        </div>

        <div className="mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-8">



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
              loading="lazy"
              decoding="async"
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
                      Access assignments, timetables, fee updates, library resources, and live announcements — all from your pocket. The VIDYA School app keeps students, parents, and teachers seamlessly connected.
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
