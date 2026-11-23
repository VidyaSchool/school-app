import { requireRole } from "@/lib/auth-helpers"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { ComplaintsOutlineTable } from "@/components/complaints-outline-table"
import { SectionCards } from "@/components/section-cards"
import { headers } from "next/headers"

interface PageProps {
  params: Promise<{ username: string }>
}

const performanceChartConfig = {
  classAverage: {
    label: "Class Average",
    color: "hsl(var(--primary))",
  },
  schoolAverage: {
    label: "School Average",
    color: "hsl(var(--chart-2))",
  },
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { username } = await params
  // Ensure only admins can access this page
  const currentUser = await requireRole(['admin'])

  let totalFeesPaid = 0
  let expectedFeesToCollect = 0
  let activeAccounts = 0
  let pendingComplaints = 0

  let performanceData = []
  let schoolAverage = 0

  const cookieHeader = (await headers()).get("cookie") || ""

  // Fetch stats and performance in parallel to significantly reduce latency!
  try {
    const [statsRes, perfRes] = await Promise.all([
      fetch(`${process.env.BACKEND_URL || "http://localhost:8000"}/api/admin/stats`, {
        headers: {
          "cookie": cookieHeader,
        },
        cache: "no-store",
      }).catch(err => {
        console.error("Stats fetch error:", err)
        return null
      }),
      fetch(`${process.env.BACKEND_URL || "http://localhost:8000"}/api/admin/performance`, {
        headers: {
          "cookie": cookieHeader,
        },
        cache: "no-store",
      }).catch(err => {
        console.error("Performance fetch error:", err)
        return null
      })
    ])

    if (statsRes && statsRes.ok) {
      const stats = await statsRes.json()
      totalFeesPaid = stats.total_fee_received || 0
      expectedFeesToCollect = stats.expected_fee_to_collect || 0
      activeAccounts = stats.active_accounts || 0
      pendingComplaints = stats.pending_complaints || 0
    }

    if (perfRes && perfRes.ok) {
      const perf = await perfRes.json()
      performanceData = perf.performance || []
      schoolAverage = perf.school_average || 0
    }
  } catch (err) {
    console.error("Failed to fetch admin stats in parallel:", err)
  }

  return (
    <div className="page-container py-4 md:py-6 bg-background min-h-screen font-sans">
      <div className="page-content">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Welcome, {currentUser.name}!</h2>
          <p className="text-sm text-muted-foreground">Role: {currentUser.role}</p>
        </div>
        <div className="w-full">
          <ChartAreaInteractive 
            title="School Academic Performance"
            descriptionLine1="Class averages compared to overall school average"
            descriptionLine2={schoolAverage > 0 ? `Overall School Average: ${schoolAverage}%` : "No exam data available yet"}
            data={performanceData}
            config={performanceChartConfig}
            xAxisKey="class"
            dataKey1="classAverage"
            dataKey2="schoolAverage"
            hideTimeRangeToggle={true}
          />
        </div>
        <ComplaintsOutlineTable />
      </div>
    </div>
  )
}
