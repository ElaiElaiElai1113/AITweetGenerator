import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/theme-provider'
import { initSentry } from './lib/sentry'
import * as Sentry from '@sentry/react'

// Initialize Sentry as early as possible
initSentry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={({ error, resetError }) => (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h1>Something went wrong</h1>
        <p>An error has been reported to our team.</p>
        {import.meta.env.DEV && error instanceof Error && (
          <details style={{ marginTop: '1rem', textAlign: 'left' }}>
            <summary>Error details (development only)</summary>
            <pre style={{ marginTop: '0.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px', overflow: 'auto' }}>
              {error.stack}
            </pre>
          </details>
        )}
        <button
          onClick={resetError}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try again
        </button>
      </div>
    )}>
      <ThemeProvider defaultTheme="system" storageKey="ai-tweet-generator-theme">
        <App />
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
