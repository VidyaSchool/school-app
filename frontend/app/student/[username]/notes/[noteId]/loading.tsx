import { Skeleton } from "@/components/ui/skeleton"

export default function StudentNoteDetailLoading() {
  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-8 max-w-5xl mx-auto w-full min-h-screen animate-in fade-in duration-200">
      {/* Top navigation & action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      {/* Note Header banner card */}
      <div className="rounded-2xl border border-border/60 bg-card/40 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-9 w-4/5 max-w-xl rounded-lg" />
        <div className="flex items-center gap-3 pt-2">
          <Skeleton className="size-10 rounded-full shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        </div>
      </div>

      {/* Main Document Reading Canvas */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 space-y-6 shadow-sm">
        {/* Paragraph 1 */}
        <div className="space-y-2.5">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-11/12 rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>

        {/* Code / Callout block */}
        <div className="p-5 rounded-xl border border-border/60 bg-muted/30 space-y-2">
          <Skeleton className="h-4 w-2/3 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>

        {/* Paragraph 2 */}
        <div className="space-y-2.5">
          <Skeleton className="h-6 w-36 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>

        {/* List items */}
        <div className="space-y-3 pl-4 border-l-2 border-border/60">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-1/3 rounded" />
              <Skeleton className="h-3.5 w-4/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
