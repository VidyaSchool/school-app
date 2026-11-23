import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

// Temporary placeholder page for the School Management Committee (SMC) static page. The actual content will be updated soon.
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"

export const metadata: Metadata = {
  title: `${"School Management Committee (SMC)"} | VidyaSchool`,
  description: "School Management Committee (SMC) - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function SchoolManagementCommitteeStaticPage() {
  const page = getStaticPage("school-management-committee")
  if (!page) notFound()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-[1380px] flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-xl border-dashed bg-card/60">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs font-semibold">
              <RefreshCw className="h-3.5 w-3.5" />
              Page Update
            </Badge>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Content to be Updated
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              This page is currently being updated. Updated sponsor and partner information will be added here soon.
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )

  // return (
  //   <StaticPageRenderer
  //     page={page}
  //   />
  // )
}
