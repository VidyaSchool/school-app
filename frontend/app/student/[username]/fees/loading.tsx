import { Skeleton } from "@/components/ui/skeleton"

export default function StudentFeesLoading() {
  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans animate-in fade-in duration-200">
      {/* Header section */}
      <div className="flex flex-col gap-1.5 px-6 lg:px-8">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-4 w-full max-w-xl rounded-md" />
      </div>

      {/* Metrics Summary Panels */}
      <div className="grid gap-4 md:grid-cols-3 px-6 lg:px-8">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-xs"
          >
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded-md" />
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-2.5 w-36 rounded-md" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          </div>
        ))}
      </div>

      {/* Instalment Schedule Table */}
      <div className="px-6 lg:px-8 space-y-4">
        {/* Table Title and Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>

        {/* Table Container */}
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-xs">
          {/* Table Header */}
          <div className="bg-muted/50 p-4 border-b border-border flex items-center gap-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-24 rounded hidden sm:block" />
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-24 rounded hidden md:block" />
            <Skeleton className="h-4 w-16 rounded ml-auto" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border/60">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="h-4 w-4 rounded shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-2.5 w-16 rounded sm:hidden" />
                </div>
                <Skeleton className="h-4 w-20 rounded hidden sm:block" />
                <Skeleton className="h-4 w-16 rounded font-semibold" />
                <Skeleton className="h-4 w-24 rounded hidden md:block" />
                <Skeleton className="h-6 w-20 rounded-full ml-auto shrink-0" />
                <Skeleton className="h-8 w-24 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
