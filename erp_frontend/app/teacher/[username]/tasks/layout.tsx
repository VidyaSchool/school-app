"use client"

import * as React from "react"
import { TeacherChatSidebar } from "@/components/teacher-chat-sidebar"
import { SiteHeader } from "@/components/site-header"

export default function TeacherTasksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isChatSidebarOpen, setIsChatSidebarOpen] = React.useState(true)

  return (
    <div className="flex flex-1 w-full h-svh md:h-[calc(100svh-1rem)] max-h-svh md:max-h-[calc(100svh-1rem)] min-h-0 overflow-hidden">
      <TeacherChatSidebar open={isChatSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <SiteHeader
          onToggleChatSidebar={() => setIsChatSidebarOpen((prev) => !prev)}
          isChatSidebarOpen={isChatSidebarOpen}
        />
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  )
}
