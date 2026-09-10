"use client"

import * as React from "react"
import { StudentNotes } from "@/components/student-notes"
import { StudentCalendar } from "@/components/student-calendar"
import { StudentWidgets } from "@/components/student-widgets"
import { AcademicPerformanceChart } from "@/components/academic-performance-chart"

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
