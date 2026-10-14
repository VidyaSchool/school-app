import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Plus } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sponsors | VidyaSchool",
  description: "Meet the organizations and partners empowering VidyaSchool's digital classroom and student community.",
}

const sponsors = [
  { name: "WIAUK", logo: "/assets/logos/wiaauk.jpg", width: 48, height: 48, description: "Supporting global education initiatives and student development programs." },
  { name: "Mastercard", logo: "/assets/logos/mastercard.svg", width: 48, height: 48, description: "Enabling secure digital payments and financial literacy for students." },
  { name: "IIT Delhi", logo: "/assets/logos/iitd.png", width: 48, height: 48, description: "Partnering on STEM education, research programs, and innovation labs." },
  { name: "ICA", logo: "/assets/logos/india-for-collective-india.png", width: 48, height: 48, description: "Championing collective growth and community-driven learning initiatives." },
  { name: "RBS", logo: "/assets/logos/rbs.png", width: 48, height: 48, description: "Funding scholarships and financial education programs for students." },
  { name: "Bird Group", logo: "/assets/logos/bird.png", width: 96, height: 32, description: "Providing travel and hospitality support for school events and trips." },
  { name: "Fidelity", logo: "/assets/logos/fidelity.svg", width: 48, height: 48, description: "Supporting financial literacy workshops and career guidance programs." },
  { name: "Verint", logo: "/assets/logos/verint.jpg", width: 48, height: 48, description: "Powering analytics and engagement tools for our digital platforms." },
  { name: "KPMG", logo: "/assets/logos/kpmg.png", width: 88, height: 32, description: "Offering mentorship, audit support, and professional development sessions." },
  { name: "ReNew Power", logo: "/assets/logos/renew.svg", width: 96, height: 32, description: "Driving sustainability education and green energy awareness campaigns." },
  { name: "IndiGo", logo: "/assets/logos/indigo.svg", width: 56, height: 32, description: "Facilitating travel for inter-school competitions and national events." },
  { name: "ICRA", logo: "/assets/logos/icra.png", width: 88, height: 32, description: "Providing credit research insights and economic education resources." },
]

export default function SponsorsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-8 md:px-12 lg:px-24">
        {/* Hero */}
        <div className="text-center space-y-4 mb-14">
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs font-semibold">
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            Our Sponsors & Partners
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Backed by the Best
          </h1>
          <p className="max-w-xl mx-auto text-muted-foreground text-sm sm:text-base leading-relaxed">
            These organizations believe in our mission to empower minds and shape futures. Their support makes VidyaSchool possible.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {sponsors.map((sponsor) => (
            <Card key={sponsor.name} className="bg-card/60 hover:bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="shrink-0 flex items-center justify-center bg-white rounded-lg p-2 shadow-xs w-16 h-16">
                  <Image
                    src={sponsor.logo}
                    width={sponsor.width}
                    height={sponsor.height}
                    alt={`${sponsor.name} logo`}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-foreground text-sm">{sponsor.name}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{sponsor.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          <Link
            href="https://pages.razorpay.com/pl_CFFRr3HwNiFEwo/view"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/20 hover:bg-muted/40 hover:border-foreground/30 transition-all duration-200 min-h-[140px]"
          >
            <Plus className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">Become a Sponsor</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
