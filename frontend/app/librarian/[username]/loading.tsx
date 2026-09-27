import { Skeleton } from "@/components/ui/skeleton"

export default function LibrarianDashboardLoading() {
  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Header */}
      <div className="px-6 lg:px-8 space-y-2">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-4 w-80 rounded-md" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 px-6 lg:px-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card/45 p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-7 w-16 rounded" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card/25 p-6 space-y-4">
          <Skeleton className="h-5 w-48 rounded" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/25 p-6 space-y-4">
          <Skeleton className="h-5 w-36 rounded" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border p-3 flex gap-3">
                <Skeleton className="h-5 w-5 rounded shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-3/4 rounded" />
                  <Skeleton className="h-2.5 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
