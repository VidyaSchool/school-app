import { Skeleton } from "@/components/ui/skeleton"

export default function StudentMarksSkeleton() {
  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-9 w-56 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-xl rounded-md" />
        </div>

        {/* Search & Combobox Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Skeleton className="h-9.5 w-full sm:w-60 rounded-lg" />
          <Skeleton className="h-9.5 w-36 rounded-lg shrink-0" />
        </div>
      </div>

      {/* KPI Indicators */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 px-6 lg:px-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-xs"
          >
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-2.5 w-28 rounded-md" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          </div>
        ))}
      </div>

      {/* Main layout container (Grid split: Chart + Detail) */}
      <div className="grid gap-6 lg:grid-cols-3 px-6 lg:px-8">
        {/* Chart Column */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card/30 p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-3 w-72 rounded" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>

          {/* Bar Chart Skeletons */}
          <div className="h-[280px] w-full flex items-end justify-between gap-4 px-4 pt-8">
            {[45, 78, 62, 90, 70, 85].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center gap-1.5 h-[220px]">
                  <Skeleton
                    className="w-1/2 rounded-t-md"
                    style={{ height: `${height}%` }}
                  />
                  <Skeleton
                    className="w-1/2 rounded-t-md opacity-40"
                    style={{ height: `${Math.max(30, height - 10)}%` }}
                  />
                </div>
                <Skeleton className="h-3 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Detail Column */}
        <div className="rounded-xl border border-border bg-card/30 p-6 flex flex-col gap-4 shadow-xs">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>

          <div className="space-y-3 pt-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-border/60 bg-card/40 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-2.5 w-16 rounded" />
                </div>
                <Skeleton className="h-6 w-12 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subject cards preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6 lg:px-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card/40 p-5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-6 w-12 rounded-md" />
            </div>
            <Skeleton className="h-3 w-40 rounded" />
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs">
                <Skeleton className="h-3 w-12 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
