import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { StudentCalendar } from "@/components/student-calendar"
import { TeacherComplaintsWidget } from "@/components/teacher-complaints-widget"
import { requireRole } from "@/lib/auth-helpers"
import { getClassAveragePerformanceData } from "@/app/api/teacher/class/average-performance/route"

export default async function TeacherDashboardPage() {
  const user = await requireRole(['teacher', 'librarian', 'admin'])
  const perf = await getClassAveragePerformanceData(user.id)

  // ── SectionCards data ────────────────────────────────────────────────────
  const card1 = perf && perf.totalStudents > 0
    ? {
        title: "Class Avg. Score",
        value: `${perf.overallAverage}%`,
        trend: perf.overallAverage >= 60 ? "Above average" : "Needs attention",
        trendUp: perf.overallAverage >= 60,
        footer1: perf.overallAverage >= 60 ? "Class performing well" : "Scores below target",
        footer2: `Based on ${perf.examAverages?.length ?? 0} exam(s)`,
      }
    : undefined

  const card2 = perf && perf.totalStudents > 0
    ? {
        title: "Total Students",
        value: String(perf.totalStudents ?? 0),
        trend: undefined,
        trendUp: true,
        footer1: `Class ${perf.class ?? "—"} – Section ${perf.section ?? "—"}`,
        footer2: "Your assigned class",
      }
    : undefined

  const topSubject = perf?.subjectAverages?.[0]
  const card3 = perf && topSubject
    ? {
        title: "Top Subject",
        value: topSubject.subject,
        trend: `${topSubject.average}%`,
        trendUp: true,
        footer1: "Highest class average",
        footer2: "Across all recorded exams",
      }
    : undefined

  const weakSubject = perf?.subjectAverages && perf.subjectAverages.length > 1
    ? perf.subjectAverages[perf.subjectAverages.length - 1]
    : undefined

  const card4 = perf && weakSubject
    ? {
        title: "Needs Improvement",
        value: weakSubject.subject,
        trend: `${weakSubject.average}%`,
        trendUp: false,
        footer1: "Lowest class average",
        footer2: "Consider focused revision",
      }
    : undefined

  // ── Chart data ─────────────────────────────────────────────────────────
  const chartData = perf?.chartData ?? []

  const chartConfig = {
    average: {
      label: "Class Avg %",
      color: "var(--primary)",
    },
    highest: {
      label: "Top Score %",
      color: "#10b981",
    },
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h2 className="text-lg font-medium mb-2">Teacher Dashboard - Welcome, {user.name}!</h2>
        <p className="text-sm text-muted-foreground font-normal">Role: {user.role}</p>
      </div>
      <SectionCards card1={card1} card2={card2} card3={card3} card4={card4} />
      <StudentCalendar apiUrl="/api/teacher/timetable/today" title="Today's Classes" />
      <TeacherComplaintsWidget />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive
          title="Class Average Performance"
          descriptionLine1={
            perf && perf.totalStudents > 0
              ? `${perf.class ? `Class ${perf.class}` : "Your class"} – Section ${perf.section ?? "—"} · ${perf.totalStudents} students`
              : "Average score (%) across all exams"
          }
          descriptionLine2="Avg score by exam"
          data={chartData.length > 0 ? chartData : undefined}
          config={chartData.length > 0 ? chartConfig : undefined}
          xAxisKey="date"
          dataKey1="average"
          dataKey2={chartData.length > 0 && chartData[0]?.highest !== undefined ? "highest" : undefined}
          hideTimeRangeToggle={true}
        />
      </div>
    </div>
  )
}
