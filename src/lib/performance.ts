// Performance monitoring utilities for Core Web Vitals

export interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Only run in browser
    if (typeof window === 'undefined') return;

    try {
      // Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { 
            startTime: number 
          };
          this.metrics.lcp = lastEntry.startTime;
          this.reportMetric('LCP', lastEntry.startTime);
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
            this.reportMetric('FID', this.metrics.fid);
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.metrics.cls = clsValue;
              this.reportMetric('CLS', clsValue);
            }
          });
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

        // First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              this.reportMetric('FCP', entry.startTime);
            }
          });
        });
        
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      }

      // Time to First Byte (TTFB)
      if ('performance' in window && 'getEntriesByType' in performance) {
        window.addEventListener('load', () => {
          const navigationEntries = performance.getEntriesByType('navigation');
          if (navigationEntries.length > 0) {
            const entry = navigationEntries[0] as PerformanceNavigationTiming;
            this.metrics.ttfb = entry.responseStart - entry.requestStart;
            this.reportMetric('TTFB', this.metrics.ttfb);
          }
        });
      }
    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }
  }

  private reportMetric(name: string, value: number) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const status = this.getMetricStatus(name, value);
      console.log(`%c${name}: ${value.toFixed(2)}ms ${status}`, 
        `color: ${status === 'Good' ? 'green' : status === 'Needs Improvement' ? 'orange' : 'red'}`
      );
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      // Example: send to Google Analytics, Mixpanel, etc.
      // gtag('event', 'web_vitals', {
      //   metric_name: name,
      //   metric_value: Math.round(value),
      //   metric_status: this.getMetricStatus(name, value)
      // });
    }
  }

  private getMetricStatus(metric: string, value: number): 'Good' | 'Needs Improvement' | 'Poor' {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'Good';

    if (value <= threshold.good) return 'Good';
    if (value <= threshold.poor) return 'Needs Improvement';
    return 'Poor';
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Resource loading performance
export function preloadResource(href: string, as: string, crossorigin?: boolean) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (crossorigin) link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

export function preconnectResource(href: string, crossorigin = true) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = href;
  if (crossorigin) link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// Performance budgets
export const PERFORMANCE_BUDGETS = {
  // Target values for good performance
  LCP: 2500, // ms
  FID: 100,  // ms
  CLS: 0.1,  // score
  FCP: 1800, // ms
  TTFB: 800, // ms
  
  // Bundle size budgets
  JS_BUNDLE_SIZE: 244 * 1024, // 244KB (compressed)
  CSS_BUNDLE_SIZE: 50 * 1024,  // 50KB (compressed)
  IMAGE_SIZE: 500 * 1024,      // 500KB per image
  TOTAL_SIZE: 1000 * 1024,     // 1MB total
};

// Create global performance monitor
export const performanceMonitor = new PerformanceMonitor();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.disconnect();
  });
}

// Performance debugging helpers
export function measureAsyncFunction<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  const start = performance.now();
  return fn().finally(() => {
    const duration = performance.now() - start;
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  });
}

export function measureSyncFunction<T>(
  fn: () => T,
  label: string
): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  console.log(`${label}: ${duration.toFixed(2)}ms`);
  return result;
}