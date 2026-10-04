import { Skeleton } from "@/components/ui/skeleton"

export default function StudentLibraryLoading() {
  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans animate-in fade-in duration-200">
      {/* Page Title & Desc */}
      <div className="flex flex-col gap-1.5 px-6 lg:px-8">
        <Skeleton className="h-9 w-48 rounded-lg" />
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

      {/* Book List Operations */}
      <div className="px-6 lg:px-8 space-y-4">
        {/* Controls Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Skeleton className="h-9.5 w-full sm:w-80 rounded-lg" />
          <div className="flex items-center gap-1.5 p-1 bg-muted/40 border border-border/40 rounded-lg">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-md" />
            ))}
          </div>
        </div>

        {/* Books Table */}
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-xs">
          <div className="bg-muted/50 p-4 border-b border-border flex items-center gap-4">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-4 w-28 rounded hidden sm:block" />
            <Skeleton className="h-4 w-24 rounded hidden md:block" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-20 rounded ml-auto" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>

          <div className="divide-y divide-border/60">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="h-10 w-8 rounded shrink-0" />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <Skeleton className="h-4 w-4/5 max-w-xs rounded" />
                    <Skeleton className="h-3 w-1/2 max-w-[180px] rounded" />
                  </div>
                </div>
                <Skeleton className="h-3.5 w-24 rounded hidden sm:block" />
                <Skeleton className="h-3.5 w-24 rounded hidden md:block" />
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-6 w-16 rounded-full shrink-0" />
                <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
