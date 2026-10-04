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
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h2 className="text-4xl font-bold mb-1 font-[family-name:var(--font-raleway)]">{greeting}, {user.name}!</h2>
        <p className="text-sm font-thin tracking-wide text-muted-foreground">{date}</p>
      </div>
      <StudentDashboardClient />
      <ClassInfoWidget />
    </div>
  )
}
