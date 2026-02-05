/**
 * Toast Notification System
 * Provides user feedback for actions throughout the app
 */

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Toast types
export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const toastTimeouts = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    const timeout = toastTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.current.delete(id);
    }
  }, []);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration
    const duration = toast.duration ?? 4000;
    const timeout = setTimeout(() => {
      removeToast(id);
    }, duration);

    toastTimeouts.current.set(id, timeout);
  }, [removeToast]);

  const clearAll = React.useCallback(() => {
    setToasts([]);
    toastTimeouts.current.forEach(timeout => clearTimeout(timeout));
    toastTimeouts.current.clear();
  }, []);

  React.useEffect(() => {
    return () => {
      // Cleanup all timeouts on unmount
      toastTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Toast Container
function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-label="Toast notifications"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

// Individual Toast
function Toast({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = React.useState(false);

  const handleRemove = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [onRemove, toast.id]);

  React.useEffect(() => {
    // Auto-remove on click unless there's an action
    if (!toast.action) {
      const timer = setTimeout(handleRemove, toast.duration ?? 4000);
      return () => clearTimeout(timer);
    }
  }, [handleRemove, toast]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 max-w-md',
        toastVariants({ variant: toast.variant }),
        isExiting && 'translate-x-full opacity-0'
      )}
      role="alert"
      aria-labelledby={`toast-title-${toast.id}`}
    >
      <Icon variant={toast.variant} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p
            id={`toast-title-${toast.id}`}
            className="font-medium text-sm"
          >
            {toast.title}
          </p>
        )}
        <p className="text-sm opacity-90 mt-1">{toast.message}</p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              handleRemove();
            }}
            className="mt-2 text-sm font-medium underline-offset-4 hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleRemove}
        className="opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

// Toast variants
const toastVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-background border-border',
      success: 'bg-green-950/90 border-green-800 text-green-100 dark:bg-green-900/90',
      error: 'bg-red-950/90 border-red-800 text-red-100 dark:bg-red-900/90',
      warning: 'bg-yellow-950/90 border-yellow-800 text-yellow-100 dark:bg-yellow-900/90',
      info: 'bg-blue-950/90 border-blue-800 text-blue-100 dark:bg-blue-900/90',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

// Toast icons
function Icon({ variant }: { variant?: ToastVariant }) {
  const icons = {
    success: (
      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    default: null,
  };

  return icons[variant ?? 'default'] || icons.default;
}

// Helper functions for common toasts
export const toast = {
  success: (message: string, options?: Partial<Omit<Toast, 'id' | 'variant'>>) => {
    const { addToast } = useToast();
    addToast({ ...options, message, variant: 'success' });
  },
  error: (message: string, options?: Partial<Omit<Toast, 'id' | 'variant'>>) => {
    const { addToast } = useToast();
    addToast({ ...options, message, variant: 'error' });
  },
  warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'variant'>>) => {
    const { addToast } = useToast();
    addToast({ ...options, message, variant: 'warning' });
  },
  info: (message: string, options?: Partial<Omit<Toast, 'id' | 'variant'>>) => {
    const { addToast } = useToast();
    addToast({ ...options, message, variant: 'info' });
  },
  show: (message: string, variant: ToastVariant = 'default', options?: Partial<Omit<Toast, 'id'>>) => {
    const { addToast } = useToast();
    addToast({ ...options, message, variant });
  },
};

// Export a hook that returns the toast functions directly
export function useToastActions() {
  return {
    success: (message: string, options?: Partial<Omit<Toast, 'id' | 'variant'>>) => {
      const { addToast } = useToast();
      addToast({ ...options, message, variant: 'success' });
    },
    error: (message: string, options?: Partial<Omit<Toast, 'id' | 'variant'>>) => {
      const { addToast } = useToast();
      addToast({ ...options, message, variant: 'error' });
    },
    warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'variant'>>) => {
      const { addToast } = useToast();
      addToast({ ...options, message, variant: 'warning' });
    },
    info: (message: string, options?: Partial<Omit<Toast, 'id' | 'variant'>>) => {
      const { addToast } = useToast();
      addToast({ ...options, message, variant: 'info' });
    },
    show: (message: string, variant: ToastVariant = 'default', options?: Partial<Omit<Toast, 'id'>>) => {
      const { addToast } = useToast();
      addToast({ ...options, message, variant });
    },
  };
}
