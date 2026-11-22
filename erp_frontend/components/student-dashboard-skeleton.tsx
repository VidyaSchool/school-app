import { Skeleton } from "@/components/ui/skeleton"

export function StudentDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

      {/* ── Greeting ── */}
      <div className="px-4 lg:px-6 space-y-1.5">
        <Skeleton className="h-10 w-72 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-4 w-40 rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* ── StudentNotes ── */}
      <section className="rounded-2xl bg-zinc-100 dark:bg-[#121212] mx-4 lg:mx-6 overflow-hidden">
        <div className="px-6 pt-5 pb-4">
          <Skeleton className="h-5 w-14 rounded-md bg-zinc-200 dark:bg-zinc-800 mb-4" />
        </div>
        <div className="flex gap-4 overflow-x-auto px-6 pb-0 -mr-6 scrollbar-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="relative min-w-[280px] max-w-[280px] shrink-0 bg-white dark:bg-[#1e1e1e]
                         rounded-t-xl rounded-b-none shadow-none flex flex-col last:mr-6"
            >
              {/* CardHeader: pb-2 pt-1 px-5 */}
              <div className="pb-2 pt-1 px-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="size-3.5 rounded-full shrink-0 bg-zinc-200 dark:bg-zinc-700" />
                    <Skeleton className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                  <Skeleton className="h-2.5 w-10 rounded shrink-0 bg-zinc-200 dark:bg-zinc-700" />
                </div>
                <Skeleton className="h-5 w-4/5 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>

              {/* CardContent: px-5 pb-3 flex flex-col gap-2 */}
              <div className="px-5 pb-3 flex flex-col gap-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <Skeleton className="mt-[7px] size-1.5 rounded-full shrink-0 bg-zinc-300 dark:bg-zinc-600" />
                    <Skeleton className={`h-4 rounded bg-zinc-100 dark:bg-zinc-800 ${j === 2 ? "w-3/5" : j === 1 ? "w-4/5" : "w-full"}`} />
                  </div>
                ))}
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white dark:from-[#1e1e1e] via-white/60 dark:via-[#1e1e1e]/60 to-transparent pointer-events-none rounded-t-none" />
            </div>
          ))}
        </div>
      </section>

      {/* ── StudentCalendar ── */}
      <section className="mx-4 lg:mx-6 rounded-2xl bg-zinc-100 dark:bg-[#121212] overflow-hidden">
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between mb-5">
            <Skeleton className="h-5 w-20 rounded-md bg-zinc-200 dark:bg-zinc-800" />
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
                    {i === 1 && (
                      <Skeleton className="absolute inset-x-1.5 top-2 h-24 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                    )}
                    {i === 3 && (
                      <Skeleton className="absolute inset-x-1.5 top-6 h-20 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ClassInfoWidget ── */}
      <section className="mx-4 lg:mx-6 rounded-2xl bg-zinc-100 dark:bg-[#121212] overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-6 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl mb-4 bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-3 w-16 rounded mb-3 bg-zinc-200 dark:bg-zinc-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
        </div>
      </section>

      {/* ── StudentWidgets ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 lg:px-6">
        {/* Tasks */}
        <div className="rounded-2xl bg-zinc-100 dark:bg-[#121212] p-5 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-14 rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="size-6 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800/60 flex-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="size-4 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1e1e1e]" />
                <Skeleton className={`h-4 rounded bg-zinc-200 dark:bg-zinc-800 ${i % 2 === 0 ? "w-3/4" : "w-2/3"}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Scratch Pad */}
        <div className="rounded-2xl bg-zinc-100 dark:bg-[#121212] p-5 flex flex-col min-h-[300px] relative">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-24 rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="size-6 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="flex-1 flex flex-col gap-2.5 pt-1">
            <Skeleton className="h-3.5 w-11/12 rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-3.5 w-4/5 rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
            <Skeleton className="h-3.5 w-3/4 rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <Skeleton className="h-8 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>

      {/* ── ChartAreaInteractive ── */}
      <div className="px-4 lg:px-6">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm overflow-hidden">
          <div className="flex flex-row items-start justify-between p-6 pb-0">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-3 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <Skeleton className="h-8 w-40 rounded-md bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="px-6 pt-6 pb-4 h-[260px] flex items-end gap-2">
            {["55%","80%","65%","90%","70%","100%","78%","88%","60%","95%","72%","85%"].map((h, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-t-md bg-zinc-100 dark:bg-zinc-900"
                style={{ height: h }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── DataTable ── */}
      <div className="w-full">
        <div className="flex items-center justify-between px-4 lg:px-6 mb-4">
          <Skeleton className="h-8 w-36 rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-8 w-44 rounded-md bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="px-4 lg:px-6">
          <div className="overflow-hidden rounded-xl border border-border bg-zinc-100 dark:bg-[#121212] shadow-sm">
            <div className="bg-zinc-200/50 dark:bg-zinc-800/30 h-11 border-b border-border flex items-center px-4 gap-6">
              <Skeleton className="h-4 w-24 rounded bg-zinc-300 dark:bg-zinc-700" />
              <Skeleton className="h-4 w-28 rounded bg-zinc-300 dark:bg-zinc-700" />
              <Skeleton className="h-4 w-16 rounded bg-zinc-300 dark:bg-zinc-700" />
              <Skeleton className="h-4 w-32 rounded bg-zinc-300 dark:bg-zinc-700" />
            </div>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-14 border-b border-border last:border-b-0 flex items-center px-4 gap-6 bg-white dark:bg-[#1c1c1c]"
              >
                <div className="flex items-center gap-2 w-24">
                  <Skeleton className="w-1.5 h-6 rounded shrink-0 bg-zinc-300 dark:bg-zinc-700" />
                  <Skeleton className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div className="flex items-center gap-2.5 w-36">
                  <Skeleton className="size-8 rounded-full shrink-0 bg-zinc-200 dark:bg-zinc-800" />
                  <Skeleton className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <Skeleton className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
                <Skeleton className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
