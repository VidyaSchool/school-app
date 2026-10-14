import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Flame } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Torch Bearers | VidyaSchool",
  description: "Meet the visionary leaders and torch bearers of VidyaSchool.",
}

const torchBearers = [
  { name: "Mrs. Rashmi Misra", role: "Founder and Chairperson" },
  { name: "Mrs. Malvika Goyal", role: "Vice Chairperson" },
  { name: "Ms. Dilruba Kalsi", role: "Executive Director Pan India" },
  { name: "Mr. Yash Pal Syngal", role: "Mentor" },
  { name: "Ms. Sarita Shahi", role: "School Manager" },
  { name: "Mr. Zal Daver", role: "Mentor" },
  { name: "Pratima Goyal", role: "Guide for Total Wellness" },
  { name: "Ila Sarin", role: "VIDYA School – Principal" },
]

function Avatar({ name }: { name: string }) {
  const initials = name
    .replace(/^(Mrs?|Ms|Mr)\.?\s+/i, "")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground border border-border shrink-0">
      {initials}
    </div>
  )
}

export default function TorchBearersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-8 md:px-12 lg:px-24">
        {/* Hero */}
        <div className="text-center space-y-4 mb-14">
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs font-semibold">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            Leadership
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Our Torch Bearers
          </h1>
          <p className="max-w-xl mx-auto text-muted-foreground text-sm sm:text-base leading-relaxed">
            The visionary leaders who guide, inspire, and shape the future of VidyaSchool every single day.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {torchBearers.map((person) => (
            <Card key={person.name} className="bg-card/60 hover:bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <Avatar name={person.name} />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-sm leading-snug">{person.name}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{person.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
