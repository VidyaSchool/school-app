import { Skeleton } from "@/components/ui/skeleton"

export default function StudentAccountLoading() {
  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="grid w-full grid-cols-3 max-w-lg p-1 bg-muted rounded-lg">
          <Skeleton className="h-8 rounded-md" />
          <Skeleton className="h-8 rounded-md" />
          <Skeleton className="h-8 rounded-md" />
        </div>

        {/* Profile Details Card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-xs">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-border">
            <Skeleton className="size-24 rounded-full" />
            <div className="space-y-2 text-center sm:text-left">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-3.5 w-60 rounded" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-44 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Academic Info Grid */}
          <div className="space-y-4 pt-4 border-t border-border">
            <Skeleton className="h-5 w-36 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3.5 w-20 rounded" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
