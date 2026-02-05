/**
 * Loading Skeleton Components
 * Provides better perceived performance during loading states
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

// Base skeleton animation class
const skeletonShimmer = 'animate-shimmer';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rounded';
}

export function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  const variantClasses = {
    default: 'rounded-md',
    text: 'rounded-sm h-4',
    circular: 'rounded-full',
    rounded: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'bg-muted/50',
        skeletonShimmer,
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

// Tweet Preview Skeleton
export function TweetPreviewSkeleton() {
  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      {/* Header with avatar and name */}
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" className="h-10 w-10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton variant="text" className="h-4 w-24" />
            <Skeleton variant="text" className="h-3 w-16" />
          </div>
          <Skeleton variant="text" className="h-3 w-32" />
        </div>
      </div>

      {/* Tweet content lines */}
      <div className="space-y-2 pl-13">
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-5/6" />
        <Skeleton variant="text" className="h-4 w-4/6" />
      </div>

      {/* Tweet actions */}
      <div className="flex items-center gap-6 pt-2 border-t">
        <Skeleton variant="circular" className="h-5 w-5" />
        <Skeleton variant="circular" className="h-5 w-5" />
        <Skeleton variant="circular" className="h-5 w-5" />
        <Skeleton variant="circular" className="h-5 w-5" />
      </div>
    </div>
  );
}

// History Item Skeleton
export function HistoryItemSkeleton() {
  return (
    <div className="p-3 space-y-2 border-b last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-4 w-3/4" />
          <Skeleton variant="text" className="h-3 w-full" />
          <Skeleton variant="text" className="h-3 w-2/3" />
        </div>
        <Skeleton variant="circular" className="h-8 w-8 flex-shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="text" className="h-3 w-16" />
        <Skeleton variant="text" className="h-3 w-20" />
      </div>
    </div>
  );
}

// History List Skeleton
export function HistoryListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <HistoryItemSkeleton key={i} />
      ))}
    </div>
  );
}

// Batch Results Skeleton
export function BatchResultsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <TweetPreviewSkeleton key={i} />
      ))}
    </div>
  );
}

// Card Skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card border rounded-lg p-4 space-y-3', className)}>
      <Skeleton variant="text" className="h-5 w-1/3" />
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-5/6" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton variant="rounded" className="h-8 w-20" />
        <Skeleton variant="rounded" className="h-8 w-20" />
      </div>
    </div>
  );
}

// Form Skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-24" />
        <Skeleton variant="rounded" className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-20" />
        <Skeleton variant="rounded" className="h-24 w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rounded" className="h-10 w-24" />
        <Skeleton variant="rounded" className="h-10 w-32" />
      </div>
    </div>
  );
}

// Stats/Analytics Skeleton
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-16" />
        <Skeleton variant="text" className="h-8 w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-16" />
        <Skeleton variant="text" className="h-8 w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-16" />
        <Skeleton variant="text" className="h-8 w-20" />
      </div>
    </div>
  );
}

// Loading overlay for sections
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

// Inline loading spinner (small)
export function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={cn(
        'border-muted border-t-primary rounded-full animate-spin',
        sizes[size],
        className
      )}
    />
  );
}
