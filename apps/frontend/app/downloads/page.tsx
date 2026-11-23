import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DownloadsClient } from "./downloads-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mobile App Downloads | VidyaSchool",
  description: "Download the official VidyaSchool Mobile App for Android. Scan the QR code or download the APK directly.",
}

export default function DownloadsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-8 py-12">
        <DownloadsClient />
      </main>

      <Footer />
    </div>
  )
}
