"use client"

import * as React from "react"
import { ChevronRight, MoreVertical } from "lucide-react"

interface CalendarEventItem {
  id?: string
  title: string
  time: string
  room?: string
}

export function TeacherCalendarWidget() {
  const [todayDate, setTodayDate] = React.useState<string>("")
  const [todayEvents, setTodayEvents] = React.useState<CalendarEventItem[]>([])
  const [tomorrowEvents, setTomorrowEvents] = React.useState<CalendarEventItem[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)

  React.useEffect(() => {
    fetch("/api/teacher/calendar")
      .then((res) => {
        if (!res.ok) throw new Error("Failed")
        return res.json()
      })
      .then((data) => {
        if (data.todayDateStr) setTodayDate(data.todayDateStr)
        if (Array.isArray(data.todayEvents)) setTodayEvents(data.todayEvents)
        if (Array.isArray(data.tomorrowEvents)) setTomorrowEvents(data.tomorrowEvents)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const tomorrowAccents = ["#9D38FF", "#FF7A5A", "#D7D842", "#9D38FF"]

  return (
    <section className="mx-4 lg:mx-6 my-4 select-none">
      <div className="w-full bg-[#1A1A1A] rounded-[24px] border border-white/[0.06] p-5 shadow-2xl shadow-black/60 transition-all duration-300">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-1 mb-1">
          <div className="flex items-center gap-1.5 cursor-pointer group">
            <h2 className="text-white font-bold text-base tracking-tight font-sans">
              Calendar
            </h2>
            <ChevronRight className="size-4 text-zinc-400 stroke-[2.5] group-hover:text-white transition-colors" />
          </div>
          <button className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors">
            <MoreVertical className="size-4" />
          </button>
        </div>

        {loading ? (
          /* ── Skeleton ── */
          <div className="mt-3 space-y-3 animate-pulse">
            <div className="h-3 w-32 rounded bg-white/[0.07]" />
            <div className="h-[42px] rounded-[14px] bg-white/[0.05]" />
            <div className="h-3 w-24 rounded bg-white/[0.07] mt-4" />
            <div className="h-[40px] rounded-[12px] bg-white/[0.04]" />
            <div className="h-[40px] rounded-[12px] bg-white/[0.04]" />
          </div>
        ) : (
          <>
            {/* ── TODAY section ── */}
            <div className="mt-3">
              <div className="text-[#FF5A52] text-[12px] font-bold tracking-wider uppercase mb-2.5 px-1">
                {todayDate || "TODAY"}
              </div>

              {todayEvents.length === 0 ? (
                <div className="h-[42px] px-3.5 rounded-[14px] bg-white/[0.03] flex items-center">
                  <span className="text-zinc-600 text-xs">No classes scheduled today</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {todayEvents.map((ev, i) => (
                    <div
                      key={ev.id ?? i}
                      className="h-[42px] px-3.5 rounded-[14px] bg-[#242416] border border-[#D7D842]/20 flex items-center justify-between transition-all duration-200 hover:bg-[#2a2a19]"
                    >
                      <div className="flex items-center min-w-0 pr-2">
                        <div className="w-[3.5px] h-4 rounded-full bg-[#D7D842] mr-2.5 shrink-0" />
                        <span className="text-[#D7D842] font-medium text-xs sm:text-sm truncate">
                          {ev.title}
                        </span>
                      </div>
                      <span className="text-[#D7D842] text-xs font-semibold tracking-tight shrink-0 ml-2">
                        {ev.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── TOMORROW section ── */}
            <div className="mt-4">
              <div className="text-[#8A8A8A] text-[12px] font-bold tracking-wider uppercase mb-2 px-1">
                TOMORROW
              </div>

              {tomorrowEvents.length === 0 ? (
                <div className="h-[40px] px-2.5 rounded-[12px] bg-transparent flex items-center">
                  <span className="text-zinc-600 text-xs">No classes scheduled tomorrow</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {tomorrowEvents.map((ev, i) => {
                    const color = tomorrowAccents[i % tomorrowAccents.length]
                    return (
                      <div
                        key={ev.id ?? i}
                        className="h-[40px] px-2.5 rounded-[12px] bg-transparent flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="flex items-center min-w-0 pr-2">
                          <div
                            className="w-[3.5px] h-4 rounded-full mr-2.5 shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span
                            className="font-medium text-xs sm:text-sm truncate"
                            style={{ color }}
                          >
                            {ev.title}
                          </span>
                        </div>
                        <span
                          className="text-xs font-semibold tracking-tight shrink-0 ml-2"
                          style={{ color }}
                        >
                          {ev.time}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </section>
  )
}
