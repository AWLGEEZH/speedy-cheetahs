import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Base skeleton element with shimmer animation */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton-shimmer rounded", className)}
      aria-hidden="true"
    />
  );
}

/** Multiple lines of skeleton text with varying widths */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ["w-full", "w-5/6", "w-4/6", "w-3/4", "w-2/3"];
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3", widths[i % widths.length])}
        />
      ))}
    </div>
  );
}

/** Card-shaped skeleton with header and content areas */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-xl border border-border shadow-sm p-4 space-y-3",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

/** Stat card skeleton matching dashboard layout */
export function SkeletonStatCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-xl border border-border shadow-sm p-3 sm:py-4",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-6 w-10" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

/** Event row skeleton */
export function SkeletonEventRow({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-lg p-4 flex items-center justify-between",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  );
}

/** Player card skeleton */
export function SkeletonPlayerCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-xl border border-border shadow-sm p-4",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}
