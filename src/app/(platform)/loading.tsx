import { Skeleton } from "@/components/ui/skeleton";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — (platform) route-group loading state
// The app code-splits ~530 pages; on slower connections a navigation used to
// show a frozen screen while the segment chunk loaded (the group had NO
// loading.tsx). This gives every platform route a calm branded shimmer that
// mirrors the standard page anatomy (title row, then content blocks).
// ══════════════════════════════════════════════════════════════════════════════

export default function PlatformLoading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6" role="status" aria-label="Loading page">
      <div className="space-y-6">
        {/* Title row */}
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-3.5 w-96 max-w-full" />
        </div>
        {/* Hero block */}
        <Skeleton className="h-44 w-full rounded-[24px]" />
        {/* Content grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl hidden lg:block" />
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
