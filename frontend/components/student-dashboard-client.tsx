"use client"

import * as React from "react"
import { StudentNotes } from "@/components/student-notes"
import { StudentCalendar } from "@/components/student-calendar"
import { StudentWidgets } from "@/components/student-widgets"
import dynamic from "next/dynamic"

const AcademicPerformanceChart = dynamic(
  () => import("@/components/academic-performance-chart").then(mod => ({ default: mod.AcademicPerformanceChart })),
  {
    ssr: false,
    loading: () => (
      <div className="px-4 lg:px-6 py-1.5">
        <div className="rounded-xl border bg-card p-6 space-y-4 animate-pulse">
          <div className="h-5 w-48 rounded-md bg-muted" />
          <div className="h-[250px] w-full rounded-lg bg-muted" />
        </div>
      </div>
    ),
  }
)

export function StudentDashboardClient() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <StudentNotes />
      <StudentCalendar />
      <StudentWidgets />
      <AcademicPerformanceChart />
    </div>
  )
}
