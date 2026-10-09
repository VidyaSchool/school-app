import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { StudentCalendar } from "@/components/student-calendar"
import { TeacherComplaintsWidget } from "@/components/teacher-complaints-widget"
import { requireRole } from "@/lib/auth-helpers"
import { getClassAveragePerformanceData } from "@/app/api/teacher/class/average-performance/route"
import { db } from "@/lib/db"
import { userProfile, user as userTable } from "@/lib/schema"
import { eq } from "drizzle-orm"

interface TeacherDashboardPageProps {
  params: Promise<{ username: string }>
}

export default async function TeacherDashboardPage({ params }: TeacherDashboardPageProps) {
  const { username } = await params
  const sessionUser = await requireRole(['teacher', 'librarian', 'admin'])

  // Find the target teacher profile if username is provided
  let targetTeacherId = sessionUser.id
  let displayName = sessionUser.name
  let displayRole = sessionUser.role

  if (username) {
    const profile = await db.query.userProfile.findFirst({
      where: eq(userProfile.username, username),
    })
    if (profile) {
      targetTeacherId = profile.userId
      const u = await db.query.user.findFirst({
        where: eq(userTable.id, profile.userId),
      })
      if (u) {
        displayName = u.name
        displayRole = u.role
      }
    }
  }

  const perf = await getClassAveragePerformanceData(targetTeacherId)

  // ── SectionCards data ────────────────────────────────────────────────────
  const hasClassData = Boolean(perf && perf.class)
  const hasStudents = Boolean(perf && perf.totalStudents > 0)
  const hasExamData = Boolean(perf && perf.examAverages && perf.examAverages.length > 0)

  const card1 = hasExamData
    ? {
        title: "Class Avg. Score",
        value: `${perf.overallAverage}%`,
        trend: perf.overallAverage >= 60 ? "Above average" : "Needs attention",
        trendUp: perf.overallAverage >= 60,
        footer1: perf.overallAverage >= 60 ? "Class performing well" : "Scores below target",
        footer2: `Based on ${perf.examAverages?.length ?? 0} exam(s)`,
      }
    : {
        title: "Class Avg. Score",
        value: "Not available",
        trend: undefined,
        footer1: perf?.message || "No exam data available",
        footer2: hasClassData ? `Class ${perf.class} – Section ${perf.section ?? "—"}` : undefined,
      }

  const card2 = hasClassData
    ? {
        title: "Total Students",
        value: String(perf.totalStudents ?? 0),
        trend: undefined,
        trendUp: true,
        footer1: `Class ${perf.class} – Section ${perf.section ?? "—"}`,
        footer2: "Your assigned class",
      }
    : {
        title: "Total Students",
        value: "Not available",
        trend: undefined,
        footer1: "No class assigned",
        footer2: "Class assignment not available",
      }

  const topSubject = perf?.subjectAverages?.[0]
  const card3 = topSubject
    ? {
        title: "Top Subject",
        value: topSubject.subject,
        trend: `${topSubject.average}%`,
        trendUp: true,
        footer1: "Highest class average",
        footer2: "Across all recorded exams",
      }
    : {
        title: "Top Subject",
        value: "Not available",
        trend: undefined,
        footer1: "No subject records",
        footer2: "Subject data not available",
      }

  const weakSubject = perf?.subjectAverages && perf.subjectAverages.length > 1
    ? perf.subjectAverages[perf.subjectAverages.length - 1]
    : undefined

  const card4 = weakSubject
    ? {
        title: "Needs Improvement",
        value: weakSubject.subject,
        trend: `${weakSubject.average}%`,
        trendUp: false,
        footer1: "Lowest class average",
        footer2: "Consider focused revision",
      }
    : {
        title: "Needs Improvement",
        value: "Not available",
        trend: undefined,
        footer1: perf?.subjectAverages && perf.subjectAverages.length === 1
          ? "Only 1 subject recorded"
          : "No subject records",
        footer2: "Subject data not available",
      }

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

  const timetableUrl = targetTeacherId !== sessionUser.id
    ? `/api/teacher/timetable/today?teacherId=${targetTeacherId}`
    : "/api/teacher/timetable/today"

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h2 className="text-lg font-medium mb-2">Teacher Dashboard - Welcome, {displayName}!</h2>
        <p className="text-sm text-muted-foreground font-normal">Role: {displayRole}</p>
      </div>
      <SectionCards card1={card1} card2={card2} card3={card3} card4={card4} />
      <StudentCalendar apiUrl={timetableUrl} title="Today's Classes" />
      <TeacherComplaintsWidget />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive
          title="Class Average Performance"
          descriptionLine1={
            hasClassData && hasStudents
              ? `Class ${perf.class} – Section ${perf.section ?? "—"} · ${perf.totalStudents} students`
              : "Average score (%) across all exams"
          }
          descriptionLine2={chartData.length > 0 ? "Avg score by exam" : "Not available"}
          data={chartData}
          config={chartConfig}
          xAxisKey="date"
          dataKey1="average"
          dataKey2={chartData.length > 0 && chartData[0]?.highest !== undefined ? "highest" : undefined}
          hideTimeRangeToggle={true}
          emptyMessage={perf?.message || "Class performance data is not available."}
        />
      </div>
    </div>
  )
}
