/**
 * Empty State Components
 * Better branded empty states with call-to-actions
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  illustration?: 'history' | 'tweets' | 'search' | 'analytics' | 'scheduled';
}

// Illustrated empty states
const illustrations = {
  history: (
    <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  tweets: (
    <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  search: (
    <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  analytics: (
    <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  scheduled: (
    <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  illustration,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      {illustration && illustrations[illustration]}
      {icon || (illustration && illustrations[illustration])}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function EmptyHistory() {
  return (
    <EmptyState
      illustration="history"
      title="No tweets yet"
      description="Generate your first tweet and it will appear here in your history."
      action={{
        label: 'Generate a tweet',
        onClick: () => {
          // Scroll to top of page
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      }}
    />
  );
}

export function EmptySearchResults({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      illustration="search"
      title="No results found"
      description="Try adjusting your search terms or filters."
      action={onClear ? {
        label: 'Clear search',
        onClick: onClear,
      } : undefined}
    />
  );
}

export function EmptyBatchResults() {
  return (
    <EmptyState
      illustration="tweets"
      title="No tweets generated yet"
      description="Click Generate to create multiple tweet variations at once."
    />
  );
}

export function EmptyScheduled() {
  return (
    <EmptyState
      illustration="scheduled"
      title="No scheduled tweets"
      description="Schedule tweets to be posted automatically at specific times."
    />
  );
}

export function EmptyAnalytics() {
  return (
    <EmptyState
      illustration="analytics"
      title="No analytics data yet"
      description="Generate some tweets to see your engagement statistics."
    />
  );
}

// Compact empty state for smaller containers
export function CompactEmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
        <svg
          className="w-5 h-5 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
