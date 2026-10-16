import { requireRole } from "@/lib/auth-helpers"
import { ClassInfoWidget } from "@/components/class-info-widget"
import { StudentDashboardClient } from "@/components/student-dashboard-client"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

function getDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

export default async function StudentDashboardPage() {
  const user = await requireRole(['student'])
  const greeting = getGreeting()
  const date = getDate()
  
  return (
    <div className="page-container py-4 md:py-6">
      <div className="page-content">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 font-[family-name:var(--font-raleway)]">{greeting}, {user.name}!</h2>
          <p className="text-sm font-normal tracking-wide text-muted-foreground">{date}</p>
        </div>
        <StudentDashboardClient />
        <ClassInfoWidget />
      </div>
    </div>
  )
}
