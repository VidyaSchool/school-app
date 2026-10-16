import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDashboardLoading() {
  return (
    <div className="page-container py-4 md:py-6 bg-background min-h-screen font-sans">
      <div className="page-content">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 flex flex-col gap-3">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-7 w-20 rounded" />
              <Skeleton className="h-3 w-40 rounded" />
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="w-full">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <Skeleton className="h-5 w-56 rounded" />
            <Skeleton className="h-3 w-80 rounded" />
            <Skeleton className="h-[260px] w-full rounded-lg" />
          </div>
        </div>

        {/* Complaints table */}
        <div className="w-full">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <Skeleton className="h-5 w-32 rounded" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
