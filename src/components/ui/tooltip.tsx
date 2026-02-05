/**
 * Tooltip Component
 * Provides contextual help and information for UI elements
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  children: React.ReactElement;
  className?: string;
}

export function Tooltip({
  content,
  side = 'top',
  align = 'center',
  delay = 200,
  children,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = 0;
    let left = 0;

    // Calculate vertical position
    switch (side) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - 8;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + 8;
        break;
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        break;
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        break;
    }

    // Calculate horizontal position
    switch (align) {
      case 'start':
        left = triggerRect.left + scrollX;
        break;
      case 'center':
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'end':
        left = triggerRect.right + scrollX - tooltipRect.width;
        break;
    }

    // Adjust for side offset
    if (side === 'left') {
      left = triggerRect.left + scrollX - tooltipRect.width - 8;
    } else if (side === 'right') {
      left = triggerRect.right + scrollX + 8;
    }

    // Keep tooltip in viewport
    const padding = 8;
    const maxLeft = window.innerWidth + scrollX - tooltipRect.width - padding;
    const minLeft = scrollX + padding;

    left = Math.max(minLeft, Math.min(maxLeft, left));

    // Keep vertically in viewport
    const maxTop = window.innerHeight + scrollY - tooltipRect.height - padding;
    const minTop = scrollY + padding;

    top = Math.max(minTop, Math.min(maxTop, top));

    setPosition({ top, left });
  }, [side, align]);

  const showTooltip = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Small delay to ensure DOM is updated before calculating position
      requestAnimationFrame(() => {
        updatePosition();
      });
    }, delay);
  }, [delay, updatePosition]);

  const hideTooltip = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  // Update position on scroll/resize if visible
  React.useEffect(() => {
    if (isVisible) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible, updatePosition]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle ref callback
  const setTriggerRef = React.useCallback((node: HTMLDivElement | null) => {
    triggerRef.current = node;
  }, []);

  return (
    <span
      ref={setTriggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      aria-describedby={isVisible ? 'tooltip-content' : undefined}
      style={{ display: 'inline-flex' }}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          id="tooltip-content"
          className={cn(
            'fixed z-50 px-3 py-2 text-xs bg-popover text-popover-foreground border shadow-md rounded-md max-w-xs pointer-events-none',
            'animate-in fade-in-50 zoom-in-50',
            className
          )}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-popover border rotate-45',
              'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-0 border-l-0'
            )}
            style={{
              [side === 'top' ? 'bottom' : 'top']: '-4px',
              ...(side === 'top' || side === 'bottom'
                ? { left: '50%', transform: 'translateX(-50%) rotate(45deg)' }
                : {}),
              ...(side === 'left'
                ? { right: '-4px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' }
                : {}),
              ...(side === 'right'
                ? { left: '-4px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' }
                : {}),
            }}
          />
        </div>
      )}
    </span>
  );
}

// Help icon with tooltip
export function HelpTooltip({ content }: { content: React.ReactNode }) {
  return (
    <Tooltip content={content} side="top" align="center">
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Help"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </Tooltip>
  );
}

// Shortcut tooltip (shows keyboard shortcut)
export function ShortcutTooltip({
  shortcut,
  children,
  label,
}: {
  shortcut: string;
  children: React.ReactElement;
  label?: string;
}) {
  return (
    <Tooltip
      content={
        <div className="flex items-center gap-2">
          <span>{label || (children.props as any)['aria-label'] || 'Shortcut'}</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-muted border rounded font-mono">
            {shortcut}
          </kbd>
        </div>
      }
      side="bottom"
      align="center"
    >
      {children}
    </Tooltip>
  );
}

// Info tooltip variant
export function InfoTooltip({ content, label }: { content: React.ReactNode; label?: string }) {
  return (
    <Tooltip content={content} side="top" align="center">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-label={label || 'More information'}
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {label}
      </button>
    </Tooltip>
  );
}
