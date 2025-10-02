import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import App from './App.tsx';
import './index.css';

// Optional imports that may fail
const ErrorBoundary: any = ({ children }: any) => children;

// Dynamically import optional features after app loads
if (typeof window !== 'undefined') {
  // Try to initialize Sentry
  import('./lib/sentry')
    .then((sentry) => {
      sentry.initSentry();
    })
    .catch((error) => {
      console.log('Sentry initialization skipped:', error);
    });

  // Try to register service worker
  import('./lib/service-worker-registration')
    .catch((error) => {
      console.log('Service worker registration skipped:', error);
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={({ error }: any) => (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
          <p className="text-gray-600 mb-4">
            We're sorry, but something went wrong. The error has been reported and we'll look into it.
          </p>
          <details className="text-sm text-gray-500">
            <summary className="cursor-pointer mb-2">Error details</summary>
            <pre className="bg-gray-100 p-2 rounded overflow-auto">
              {error?.message || 'Unknown error'}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    )} showDialog={false}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);