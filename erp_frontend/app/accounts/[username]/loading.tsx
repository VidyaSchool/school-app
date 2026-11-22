import { Skeleton } from "@/components/ui/skeleton"

export default function AccountsDashboardLoading() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      {/* Welcome Banner */}
      <div className="rounded-2xl border bg-card p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-56 rounded" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-muted" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-24 rounded" />
            <Skeleton className="h-4 w-36 rounded" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <Skeleton className="h-6 w-44 rounded" />
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </div>
    </main>
  )
}
