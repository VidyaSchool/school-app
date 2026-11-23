"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"

type Tab = "Today" | "Week" | "Month"

interface CalendarEvent {
  hour: number          // 0-indexed from startHour (e.g. 2 = 10am if startHour=8)
  span?: number         // column span (default 1)
  title: string
  time: string
  color: {
    bg: string
    border: string
    title: string
    time: string
  }
}

const START_HOUR = 8   // 8 am
const TOTAL_HOURS = 9  // 8 am → 4 pm

const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => {
  const h = START_HOUR + i
  if (h === 12) return "Noon"
  if (h < 12)  return `${h} am`
  return `${h - 12} pm`
})


interface StudentCalendarProps {
  apiUrl?: string
  title?: string
}

export function StudentCalendar({ 
  apiUrl = '/api/student/timetable/today', 
  title = 'Calendar' 
}: StudentCalendarProps = {}) {
  const [activeTab, setActiveTab] = React.useState<Tab>("Today")
  const [playheadLeft, setPlayheadLeft] = React.useState<number | null>(null)
  const [playheadTime, setPlayheadTime] = React.useState<string>("")
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)

  React.useEffect(() => {
    setLoading(true)
    fetch(apiUrl)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load")
        return res.json()
      })
      .then(data => {
        if (data.events && Array.isArray(data.events)) {
          setEvents(data.events)
        } else {
          setEvents([])
        }
        setLoading(false)
      })
      .catch(() => {
        setEvents([])
        setLoading(false)
      })
  }, [apiUrl])

  React.useEffect(() => {
    function updatePlayhead() {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const currentHour = hours + minutes / 60

      if (currentHour >= 8 && currentHour <= 17) {
        const percentage = ((currentHour - 8) / 9) * 100
        setPlayheadLeft(percentage)
        const formattedTime = now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        setPlayheadTime(formattedTime)
      } else {
        setPlayheadLeft(null)
      }
    }

    updatePlayhead()
    const interval = setInterval(updatePlayhead, 10 * 1000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Show real events from API only — empty grid is correct when no timetable set up
  const displayEvents = events

  return (
    <section className="mx-4 lg:mx-6 rounded-2xl bg-zinc-100 dark:bg-[#121212] overflow-hidden">
      <div className="p-5 pb-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-base leading-snug font-medium text-foreground">{title}</h2>

          {/* Segmented tabs */}
          <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1">
            {(["Today", "Week", "Month"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 select-none",
                  activeTab === tab
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Time grid ── */}
        <div className="relative overflow-x-auto scrollbar-none bg-zinc-200/40 dark:bg-black/35 rounded-xl p-4 shadow-sm border border-border/30">
          {/* Hour labels row */}
          <div className="flex min-w-max relative pt-1">
            {/* Horizontal Timeline Track */}
            <div className="absolute top-[26px] left-0 right-0 h-[2px] bg-zinc-100 dark:bg-zinc-800/60 z-0" />

            {/* Playhead line & glowing indicator */}
            {playheadLeft !== null && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute top-[26px] bottom-3 w-4 cursor-pointer -translate-x-1/2 z-30 transition-all duration-500 group/playhead"
                      style={{ left: `${playheadLeft}%` }}
                    >
                      {/* Playhead Line */}
                      <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-black/40 dark:bg-white/40 transition-colors group-hover/playhead:bg-black dark:group-hover/playhead:bg-white" />
                      
                      {/* Playhead Dot */}
                      <div className="absolute top-0 left-1/2 size-3 rounded-full bg-black dark:bg-white ring-4 ring-black/10 dark:ring-white/10 -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 group-hover/playhead:scale-110" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs py-1 px-2 font-medium">
                    Current Time: {playheadTime}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {HOURS.map((label, i) => (
              <div key={i} className="flex-1 min-w-[95px] flex flex-col items-start relative">
                {/* Timeline Axis Node (Dot) */}
                <div className="absolute top-[26px] left-0 size-2.5 rounded-full border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-[#121212] z-20 -translate-x-[5px] -translate-y-[4px]" />

                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/75 uppercase mb-3.5 pl-2.5 select-none relative z-10">
                  {label}
                </span>
                {/* Column divider */}
                <div className="w-full border-l border-dashed border-zinc-200/80 dark:border-zinc-800/80 relative min-h-[150px] pt-1">
                  {/* Render events that belong to this column */}
                  {loading ? (
                    i % 3 === 1 ? (
                      <div className="absolute inset-x-1.5 top-2 h-24 rounded-lg bg-zinc-200/70 dark:bg-zinc-800/70 animate-pulse" />
                    ) : i % 3 === 2 ? (
                      <div className="absolute inset-x-1.5 top-6 h-16 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50 animate-pulse" />
                    ) : null
                  ) : (
                    displayEvents
                      .filter((ev) => ev.hour === i)
                      .map((ev, j) => (
                        <div
                          key={j}
                          className={cn(
                            "absolute inset-x-1.5 top-2 bottom-3 rounded-lg border px-3 py-2.5 flex flex-col justify-between shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md",
                            ev.color.bg,
                            ev.color.border
                          )}
                        >
                          <span className={cn("text-xs font-semibold leading-snug", ev.color.title)}>
                            {ev.title}
                          </span>
                          <span className={cn("text-[10px] font-medium", ev.color.time)}>
                            {ev.time}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Empty state when no events & not loading ── */}
        {!loading && events.length === 0 && (
          <p className="text-xs text-muted-foreground/60 text-center mt-4 pb-1">
            No classes scheduled for today
          </p>
        )}

      </div>
    </section>
  )
}
