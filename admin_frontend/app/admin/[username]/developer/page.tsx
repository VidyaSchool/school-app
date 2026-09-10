"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  HardDrive,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Zap
} from "lucide-react"

interface ServerMetrics {
  cpu_usage_pct: number
  cpu_cores: number
  ram_used_mb: number
  ram_total_mb: number
  ram_pct: number
  active_sockets: number
  db_connections: number
  db_pool_max: number
  api_latency_ms: number
  uptime_seconds: number
  backend_log_uid: string
}

export default function AdminDeveloperShadcnPage() {
  const params = useParams()
  const router = useRouter()
  const username = params?.username as string

  const [metrics, setMetrics] = React.useState<ServerMetrics>({
    cpu_usage_pct: 14.2,
    cpu_cores: 4,
    ram_used_mb: 1248.5,
    ram_total_mb: 4096.0,
    ram_pct: 30.5,
    active_sockets: 5,
    db_connections: 8,
    db_pool_max: 20,
    api_latency_ms: 12,
    uptime_seconds: 388800,
    backend_log_uid: "backend-a7f9q"
  })
  const [loading, setLoading] = React.useState(false)

  const fetchMetrics = React.useCallback(async () => {
    try {
      const sessionToken = localStorage.getItem("session_token") || ""
      const res = await fetch("/api/backend/api/admin/metrics", {
        headers: {
          Authorization: sessionToken ? `Bearer ${sessionToken}` : ""
        }
      })
      if (res.ok) {
        const data = await res.json()
        setMetrics(data)
      }
    } catch (err) {
      console.error("Failed to fetch server metrics:", err)
    }
  }, [])

  React.useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  const backendStreamUid = metrics.backend_log_uid || "backend-a7f9q"

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-background text-foreground p-4 sm:p-6 space-y-6">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Cpu className="size-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Developer Operations & Server Usage</h1>
            <Badge variant="outline" className="gap-1.5 font-medium border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time backend metrics, memory usage, database pool health, and live log stream widgets.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true)
            fetchMetrics().finally(() => setLoading(false))
          }}
          className="gap-2 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>Refresh Metrics</span>
        </Button>
      </div>

      <Separator />

      {/* ── Metrics Cards Grid (Shadcn UI Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: CPU Utilization */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              CPU Utilization
            </CardTitle>
            <Cpu className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-bold">{metrics.cpu_usage_pct}%</div>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {metrics.cpu_cores} Cores
              </Badge>
            </div>
            <Progress value={metrics.cpu_usage_pct} className="h-2" />
          </CardContent>
        </Card>

        {/* Metric 2: RAM Memory Usage */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              RAM Memory Usage
            </CardTitle>
            <HardDrive className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-bold">{metrics.ram_pct}%</div>
              <span className="text-xs text-muted-foreground font-mono">
                {metrics.ram_used_mb} / {metrics.ram_total_mb} MB
              </span>
            </div>
            <Progress value={metrics.ram_pct} className="h-2" />
          </CardContent>
        </Card>

        {/* Metric 3: PostgreSQL Database Pool */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Database Pool
            </CardTitle>
            <Database className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-bold">{metrics.db_connections} / {metrics.db_pool_max}</div>
              <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/40">
                Active Pool
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              PostgreSQL pooled connection latency &lt; 1ms
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: API Response Latency */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              API Latency
            </CardTitle>
            <Zap className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-bold">{metrics.api_latency_ms} ms</div>
              <Badge variant="secondary" className="text-[10px] font-mono">
                p99 fast
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Active Sockets & SSE Clients: {metrics.active_sockets}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* ── Widget Link Cards Section ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Developer Operations Widgets & Console Links
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Prominent Widget Card 1: Server Log Streamer Widget linking to /developer/backend-a7f9q */}
          <Card className="border-primary/30 bg-card shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <Terminal className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">
                      Real-Time Server Log Streamer
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Vercel-style live Server-Sent Events (SSE) log stream console.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  /developer/{backendStreamUid}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Inspect live ERROR, WARN, INFO, DB, and FCM log events in real time. Features instant search, level filtering, log copy/download, and pause controls.
              </p>
            </CardContent>

            <Separator />

            <CardFooter className="flex items-center justify-between pt-4 pb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <Radio className="size-3.5 text-emerald-500 animate-pulse" />
                <span>Live Stream Widget Ready</span>
              </div>

              <Button asChild size="sm" className="gap-2 cursor-pointer">
                <Link href={`/developer/${backendStreamUid}`}>
                  <span>Open Server Logs (/developer/{backendStreamUid})</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Widget Card 2: System Health & Infrastructure */}
          <Card className="shadow-sm">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">
                    System Health & Infrastructure
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Automated background tasks and DB pool manager.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Monitors operational engines, FCM multicast push token health, automated scheduler jobs, and socket connection state.
              </p>
            </CardContent>

            <Separator />

            <CardFooter className="flex items-center justify-between pt-4 pb-4">
              <span className="text-xs text-muted-foreground font-mono">
                Uptime: {Math.floor(metrics.uptime_seconds / 86400)}d {Math.floor((metrics.uptime_seconds % 86400) / 3600)}h
              </span>
              <Button variant="outline" size="sm" onClick={fetchMetrics} className="gap-1.5 cursor-pointer">
                <span>Check Health</span>
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              </Button>
            </CardFooter>
          </Card>

        </div>
      </div>

    </div>
  )
}
