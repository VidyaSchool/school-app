import { Skeleton } from "@/components/ui/skeleton"

export default function StudentDashboardLoading() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 animate-in fade-in duration-300">
      {/* Greeting skeleton */}
      <div className="px-4 lg:px-6 space-y-2">
        <Skeleton className="h-10 w-80 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>

      {/* Notes section skeleton */}
      <div className="px-4 lg:px-6">
        <div className="rounded-2xl border border-border/60 bg-background/50 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="min-w-[245px] h-[210px] shrink-0 rounded-xl bg-card p-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-1/3 rounded-md" />
                    <Skeleton className="h-3 w-1/4 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-4/5 rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full rounded-md" />
                    <Skeleton className="h-3 w-5/6 rounded-md" />
                  </div>
                </div>
                <div className="pt-2 border-t border-border/30 space-y-1.5">
                  <Skeleton className="h-2.5 w-3/4 rounded-md" />
                  <Skeleton className="h-2.5 w-1/2 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar skeleton */}
      <div className="mx-4 lg:mx-6 rounded-2xl bg-zinc-100 dark:bg-[#121212] p-5">
        <div className="flex justify-between mb-5">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-7 w-40 rounded-lg" />
        </div>
        <Skeleton className="h-[190px] w-full rounded-xl" />
      </div>

      {/* Widgets skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 lg:px-6">
        <div className="rounded-2xl bg-zinc-100 dark:bg-[#121212] p-5 min-h-[300px]">
          <Skeleton className="h-5 w-14 rounded-md mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded-md" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-100 dark:bg-[#121212] p-5 min-h-[300px]">
          <Skeleton className="h-5 w-24 rounded-md mb-4" />
          <Skeleton className="h-[200px] w-full rounded-md" />
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
