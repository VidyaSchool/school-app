import { Skeleton } from "@/components/ui/skeleton"

export default function StudentNotesLoading() {
  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-8 min-h-screen animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-9 w-52 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>

        {/* Search */}
        <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
      </div>

      {/* Topics Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Skeleton className="size-4 rounded shrink-0 mr-1" />
        {[...Array(6)].map((_, i) => (
          <Skeleton
            key={i}
            className={`h-7 rounded-full shrink-0 ${
              i === 0 ? "w-12" : i % 2 === 0 ? "w-24" : "w-20"
            }`}
          />
        ))}
      </div>

      {/* Note Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-56 rounded-2xl border border-border/50 bg-card/40 p-5 flex flex-col justify-between shadow-2xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-3 w-14 rounded" />
              </div>
              <Skeleton className="h-5 w-4/5 rounded-md" />
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
            </div>

            <div className="pt-3 border-t border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="size-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
