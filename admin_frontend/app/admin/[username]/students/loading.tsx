import { Skeleton } from "@/components/ui/skeleton"

export default function AdminStudentsLoading() {
  return (
    <div className="flex flex-col gap-6 py-6 px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-80 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="space-y-0">
          <Skeleton className="h-10 w-full" />
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
