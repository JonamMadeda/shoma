import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-border', className)}
    />
  );
}

export function CardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex items-center gap-4 rounded-xl border border-border bg-white px-4 py-3 dark:bg-surface-muted"
    >
      <Skeleton className="size-8 shrink-0 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="mb-2 h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
