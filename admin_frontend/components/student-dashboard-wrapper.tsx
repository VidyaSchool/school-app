"use client"

import * as React from "react"
import { ClassInfoWidget } from "@/components/class-info-widget"
import { StudentDashboardClient } from "@/components/student-dashboard-client"

interface StudentDashboardWrapperProps {
  greeting: string
  userName: string
  date: string
}

export function StudentDashboardWrapper({
  greeting,
  userName,
  date,
}: StudentDashboardWrapperProps) {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h2 className="text-4xl font-bold mb-1 font-[family-name:var(--font-raleway)]">
          {greeting}, {userName}!
        </h2>
        <p className="text-sm font-thin tracking-wide text-muted-foreground">{date}</p>
      </div>
      <StudentDashboardClient />
      <ClassInfoWidget />
    </div>
  )
}
