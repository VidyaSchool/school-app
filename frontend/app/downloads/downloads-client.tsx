"use client"

import * as React from "react"
import { Smartphone, Download, QrCode, ShieldCheck, Info, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function DownloadsClient() {
  const [appVersion, setAppVersion] = React.useState<string>("v1.0.52")
  const [downloadUrl, setDownloadUrl] = React.useState<string>(
    "https://github.com/VidyaSchool/school-app/releases"
  )
  const [fetching, setFetching] = React.useState<boolean>(true)

  React.useEffect(() => {
    fetch("https://api.github.com/repos/VidyaSchool/school-app/releases")
      .then((res) => {
        if (!res.ok) return []
        return res.json()
      })
      .then((data) => {
        const latest = Array.isArray(data) && data.length > 0 ? data[0] : null
        if (latest?.tag_name) {
          setAppVersion(latest.tag_name)
          const apkAsset = latest.assets?.find((asset: { name?: string; browser_download_url?: string }) => asset.name?.endsWith(".apk"))
          if (apkAsset?.browser_download_url) {
            setDownloadUrl(apkAsset.browser_download_url)
          } else {
            setDownloadUrl(
              `https://github.com/VidyaSchool/school-app/releases/download/${latest.tag_name}/app-debug.apk`
            )
          }
        }
        setFetching(false)
      })
      .catch(() => {
        setFetching(false)
      })
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs font-semibold border-primary/30 bg-primary/5 text-primary">
          <Smartphone className="h-3.5 w-3.5" />
          VidyaSchool Mobile App
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70">
          Take VidyaSchool on the Go
        </h1>
        <p className="max-w-xl mx-auto text-muted-foreground text-sm sm:text-base leading-relaxed">
          Stay connected with your campus. Access grades, notices, fee desks, library logs, and chat portals directly from your phone.
        </p>
      </div>

      {/* Main Grid: Card & Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Download details & QR Code */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-border/80 bg-card/60 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    Android Application
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Latest stable build for Android devices
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {fetching ? "fetching..." : appVersion}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* QR Code Container */}
                <div className="bg-white p-4 rounded-xl border border-border shadow-inner flex-shrink-0 flex items-center justify-center">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                        downloadUrl
                      )}`}
                      alt="Download QR Code"
                      width={160}
                      height={160}
                      className="rounded-lg object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-white/5 opacity-0 hover:opacity-100 transition-opacity">
                      <QrCode className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Info Text */}
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <h3 className="text-sm font-semibold text-foreground flex items-center justify-center md:justify-start gap-1.5">
                    <QrCode className="h-4 w-4 text-primary" /> Scan to Download
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Open your Android camera or QR code scanner and point it at the QR code to instantly download the APK file on your device.
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-1 text-[11px] text-emerald-500 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified safe download • HTTPS encryption
                  </div>
                </div>
              </div>

              <div className="border-t border-border/60 my-2"></div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button asChild variant="default" className="w-full sm:flex-1 gap-2 h-11 text-sm font-semibold shadow-sm cursor-pointer">
                  <a href={downloadUrl} download>
                    <Download className="h-4.5 w-4.5" />
                    Download APK File
                  </a>
                </Button>
                <div className="text-xs text-muted-foreground text-center sm:text-left">
                  File type: <code className="px-1 py-0.5 rounded bg-muted font-mono">.apk</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* iOS Notice */}
          <Card className="border border-dashed border-border/80 bg-muted/10">
            <CardContent className="p-5 flex gap-3.5 items-start">
              <div className="p-2 rounded-lg bg-primary/5 text-primary shrink-0">
                <Info className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground">iOS Application (Apple)</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The iOS App is currently in development and will be available on the Apple App Store soon. In the meantime, iOS users can access all portal features by pinning the VidyaSchool web app to their home screen.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Step-by-step installation guide */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              How to Install (Android)
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Because this application is distributed directly as an APK, your device requires a quick settings adjustment to complete the installation.
            </p>
          </div>

          <div className="relative border-l-2 border-border/80 pl-6 space-y-8 py-2 ml-3">
            {/* Step 1 */}
            <div className="relative">
              <span className="absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-primary text-xs font-bold text-primary">
                1
              </span>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-foreground">Download the APK</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Click the &quot;Download APK File&quot; button or scan the QR code to save the installer package to your downloads folder.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <span className="absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-primary text-xs font-bold text-primary">
                2
              </span>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-foreground">Open the Installer</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Once downloaded, tap the notification or navigate to your file manager / downloads folder and open the downloaded APK file.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <span className="absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-primary text-xs font-bold text-primary">
                3
              </span>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-foreground">Allow Unknown Apps</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If prompted by system security, toggle on &quot;Allow installation from this source&quot; (Chrome or File Manager) to grant permissions.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <span className="absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-primary text-xs font-bold text-primary">
                4
              </span>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-foreground">Complete & Log In</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tap &quot;Install&quot; and wait for the process to finish. Open the VidyaSchool app and sign in using your portal credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="pt-6 border-t border-border/60">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-10">
          Designed for standard Mobile Experience
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-border/80 bg-card/40 space-y-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Smartphone className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-foreground text-sm">Native UI Navigation</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Optimized for mobile interfaces with quick swipe tabs, responsive lists, and touch-friendly controls.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/80 bg-card/40 space-y-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-foreground text-sm">Biometric Fast Lock</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use your device&apos;s native fingerprint reader or face recognition to unlock your portal session instantly.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/80 bg-card/40 space-y-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Info className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-foreground text-sm">Live Push Alerts</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Receive immediate push notifications on your phone status bar for urgent notices, messages, and circulars.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

