import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway } from "next/font/google";
import { ThemeProvider } from "@wrksz/themes/next"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "VidyaSchool | Empowering Minds, Shaping Futures",
  description: "Welcome to VidyaSchool, a premier educational portal dedicated to academic excellence, STEM innovation, and holistic student growth through co-curricular arts.",
  keywords: ["VidyaSchool", "school portal", "academics", "STEM education", "performing arts", "student portal", "teacher portal"],
  icons: {
    icon: "/assets/vidyaschool/Logo/no_title.svg",
    shortcut: "/assets/vidyaschool/Logo/no_title.svg",
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
}

import { TooltipProvider } from "@/components/ui/tooltip"
import { RootProvider } from "fumadocs-ui/provider/next"
import { PWARegister } from "@/components/pwa-register"
import { CustomSearchDialog } from "@/components/custom-search-dialog"
import { Toaster } from "@/components/ui/sonner"
import { PaperPlanesWrapper } from "@/components/paper-planes-wrapper"
import { Analytics } from "@vercel/analytics/next"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${raleway.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,slnt,wdth,wght,ROND@8..144,-10..0,25..150,400..500,0..100&display=swap" rel="stylesheet" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
        >
          {/* PaperPlanes lives here — direct child of body, no overflow-clipping
              ancestor, so position:fixed on its canvas is always viewport-relative */}
          {/* <PaperPlanesWrapper /> */}
          <TooltipProvider>
            <RootProvider 
              theme={{ enabled: false }}
              search={{ SearchDialog: CustomSearchDialog }}
            >
              <PWARegister />
              {children}
              <Analytics />
              <Toaster richColors position="top-right" />
            </RootProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
