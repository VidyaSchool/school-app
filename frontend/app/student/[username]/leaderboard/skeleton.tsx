import { Skeleton } from "@/components/ui/skeleton"

export default function StudentLeaderboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans px-4 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>

        {/* Search */}
        <Skeleton className="h-9.5 w-full sm:w-64 rounded-lg" />
      </div>

      {/* Podium Section (Top 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end justify-center pt-8 max-w-4xl mx-auto w-full">
        {/* 2nd Place */}
        <div className="flex flex-col items-center justify-end text-center p-5 rounded-2xl border border-border/60 bg-card/40 md:h-[290px] shadow-xs space-y-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-1 w-full flex flex-col items-center">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center justify-end text-center p-5 rounded-2xl border border-primary/20 bg-primary/[0.03] md:h-[330px] shadow-sm space-y-3 relative">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="size-20 rounded-full ring-4 ring-primary/20" />
          <div className="space-y-1 w-full flex flex-col items-center">
            <Skeleton className="h-5 w-32 rounded font-semibold" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center justify-end text-center p-5 rounded-2xl border border-border/60 bg-card/40 md:h-[260px] shadow-xs space-y-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="size-14 rounded-full" />
          <div className="space-y-1 w-full flex flex-col items-center">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      {/* Remaining Leaderboard List */}
      <div className="max-w-4xl mx-auto w-full pt-4">
        <div className="rounded-2xl border border-border bg-card/30 overflow-hidden shadow-xs divide-y divide-border/60">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-20 rounded hidden sm:block" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
