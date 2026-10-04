import { Skeleton } from "@/components/ui/skeleton"

export default function StudentNoticeSkeleton() {
  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-9 w-52 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-xl rounded-md" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg shrink-0" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 lg:px-8">
        <Skeleton className="h-9.5 w-full sm:w-80 rounded-lg" />
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg shrink-0" />
          ))}
        </div>
      </div>

      {/* Notices List */}
      <div className="grid gap-6 px-6 lg:px-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border p-6 bg-card/30 flex flex-col gap-4 shadow-xs relative overflow-hidden"
          >
            {i === 0 && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/40" />
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-md" />
                {i === 0 && <Skeleton className="h-5 w-16 rounded-md" />}
              </div>
              <Skeleton className="h-4 w-28 rounded" />
            </div>

            <Skeleton className="h-5 w-3/5 rounded-md" />

            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-5/6 rounded" />
              <Skeleton className="h-3.5 w-2/3 rounded" />
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
              <Skeleton className="h-3.5 w-36 rounded" />
              <Skeleton className="h-3.5 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
