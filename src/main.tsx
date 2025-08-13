import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import App from './App.tsx';
import './index.css';

// Global error handler to catch and log errors
window.addEventListener('error', (event) => {
  // Filter out known external resource errors
  if (event.message?.includes('Failed to load resource') || 
      event.message?.includes('NetworkError') ||
      event.filename?.includes('chrome-extension://') ||
      event.filename?.includes('moz-extension://')) {
    // Prevent these errors from bubbling up
    event.preventDefault();
    return;
  }
  // console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Filter out known issues
  if (event.reason?.message?.includes('A listener indicated an asynchronous response')) {
    // This is often from browser extensions
    event.preventDefault();
    return;
  }
  // console.error('Unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <App />
    </ThemeProvider>
  </StrictMode>
);