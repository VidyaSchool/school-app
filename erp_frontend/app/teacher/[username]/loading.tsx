import { Skeleton } from "@/components/ui/skeleton"

export default function TeacherDashboardLoading() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

      {/* Greeting */}
      <div className="px-4 lg:px-6 space-y-1.5">
        <Skeleton className="h-7 w-72 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-4 w-24 rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* SectionCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#121212] p-5 flex flex-col gap-3 animate-pulse">
            <Skeleton className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-7 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-3 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* StudentCalendar (Today's Schedule) */}
      <section className="mx-4 lg:mx-6 rounded-2xl bg-zinc-100 dark:bg-[#121212] overflow-hidden">
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between mb-5">
            <Skeleton className="h-5 w-32 rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1">
              {["Today", "Week", "Month"].map((t) => (
                <Skeleton key={t} className="h-5 w-12 rounded-md bg-zinc-300 dark:bg-zinc-700" />
              ))}
            </div>
          </div>
          <div className="relative bg-zinc-200/40 dark:bg-black/35 rounded-xl p-4 border border-border/30 overflow-x-hidden">
            <div className="absolute top-[38px] left-4 right-4 h-[2px] bg-zinc-200 dark:bg-zinc-800 z-0" />
            <div className="flex gap-0 min-w-max relative pt-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-1 min-w-[95px] flex flex-col items-start relative">
                  <div className="absolute top-[26px] left-0 size-2.5 rounded-full border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-[#121212] z-20 -translate-x-[5px] -translate-y-[4px]" />
                  <Skeleton className="h-3 w-10 rounded mb-3.5 ml-2.5 z-10 bg-zinc-200 dark:bg-zinc-800" />
                  <div className="w-full border-l border-dashed border-zinc-200/80 dark:border-zinc-800/80 relative min-h-[150px] pt-1">
                    {i === 1 && <Skeleton className="absolute inset-x-1.5 top-2 h-24 rounded-lg bg-zinc-200 dark:bg-zinc-800" />}
                    {i === 3 && <Skeleton className="absolute inset-x-1.5 top-6 h-20 rounded-lg bg-zinc-200 dark:bg-zinc-800" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TeacherComplaintsWidget */}
      <div className="mx-4 lg:mx-6 rounded-2xl bg-zinc-100 dark:bg-[#121212] p-5 flex flex-col gap-4 animate-pulse">
        <Skeleton className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-3.5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>

      {/* ChartAreaInteractive */}
      <div className="px-4 lg:px-6">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm overflow-hidden">
          <div className="flex flex-row items-start justify-between p-6 pb-0">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-3 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <Skeleton className="h-8 w-40 rounded-md bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="px-6 pt-6 pb-4 h-[260px] flex items-end gap-2">
            {["55%","80%","65%","90%","70%","100%","78%","88%","60%","95%","72%","85%"].map((h, i) => (
              <Skeleton key={i} className="flex-1 rounded-t-md bg-zinc-100 dark:bg-zinc-900" style={{ height: h }} />
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
