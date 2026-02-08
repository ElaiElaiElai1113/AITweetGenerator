import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock console.error to avoid cluttering test output
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

const ThrowError = () => {
  throw new Error('Test error');
};

const SuccessfulComponent = () => {
  return <div>Normal content</div>;
};

describe('ErrorBoundary', () => {
  it('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <SuccessfulComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error display</div>;
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error display')).toBeInTheDocument();
  });

  it('has reload button in fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    const reloadButton = screen.getByRole('button');
    expect(reloadButton).toBeInTheDocument();
    expect(reloadButton).toHaveTextContent('Reload Page');
  });

  it('handles multiple children correctly', () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });
});
