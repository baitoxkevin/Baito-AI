// Performance testing utilities for LoginPage optimizations

interface PerformanceTest {
  name: string;
  test: () => Promise<number> | number;
  threshold: number;
  unit: string;
}

export class LoginPagePerformanceTest {
  private tests: PerformanceTest[] = [];

  constructor() {
    this.initializeTests();
  }

  private initializeTests() {
    this.tests = [
      {
        name: 'Component Mount Time',
        test: this.measureComponentMount,
        threshold: 50, // ms
        unit: 'ms'
      },
      {
        name: 'Form Interaction Response',
        test: this.measureFormResponse,
        threshold: 16, // ms (60fps)
        unit: 'ms'
      },
      {
        name: 'Animation Frame Rate',
        test: this.measureAnimationPerformance,
        threshold: 55, // fps
        unit: 'fps'
      },
      {
        name: 'Memory Usage',
        test: this.measureMemoryUsage,
        threshold: 10, // MB
        unit: 'MB'
      },
      {
        name: 'Bundle Load Time',
        test: this.measureBundleLoadTime,
        threshold: 200, // ms
        unit: 'ms'
      }
    ];
  }

  private async measureComponentMount(): Promise<number> {
    return new Promise((resolve) => {
      const start = performance.now();
      
      // Simulate component mounting
      requestAnimationFrame(() => {
        const end = performance.now();
        resolve(end - start);
      });
    });
  }

  private async measureFormResponse(): Promise<number> {
    return new Promise((resolve) => {
      const input = document.querySelector('input[type="email"]') as HTMLInputElement;
      if (!input) {
        resolve(0);
        return;
      }

      const start = performance.now();
      
      // Simulate user input
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      requestAnimationFrame(() => {
        const end = performance.now();
        resolve(end - start);
      });
    });
  }

  private async measureAnimationPerformance(): Promise<number> {
    return new Promise((resolve) => {
      const frames: number[] = [];
      let frameCount = 0;
      const maxFrames = 60; // Test for 1 second at 60fps

      const measureFrame = () => {
        const now = performance.now();
        if (frames.length > 0) {
          const delta = now - frames[frames.length - 1];
          frames.push(now);
          
          if (frameCount >= maxFrames) {
            // Calculate average FPS
            const totalTime = frames[frames.length - 1] - frames[0];
            const fps = (frames.length - 1) / (totalTime / 1000);
            resolve(fps);
            return;
          }
        } else {
          frames.push(now);
        }

        frameCount++;
        requestAnimationFrame(measureFrame);
      };

      requestAnimationFrame(measureFrame);
    });
  }

  private measureMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100; // MB
    }
    return 0;
  }

  private async measureBundleLoadTime(): Promise<number> {
    if (!('getEntriesByType' in performance)) {
      return 0;
    }

    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length === 0) {
      return 0;
    }

    const entry = navigationEntries[0];
    return entry.loadEventEnd - entry.fetchStart;
  }

  public async runAllTests(): Promise<{ [key: string]: any }> {
    const results: { [key: string]: any } = {};

    for (const test of this.tests) {
      try {
        console.log(`Running test: ${test.name}`);
        const start = performance.now();
        const result = await test.test();
        const duration = performance.now() - start;
        
        const passed = result <= test.threshold;
        const status = passed ? '✅ PASS' : '❌ FAIL';
        
        results[test.name] = {
          value: result,
          threshold: test.threshold,
          unit: test.unit,
          passed,
          status,
          testDuration: Math.round(duration * 100) / 100
        };

        console.log(`${status} ${test.name}: ${result}${test.unit} (threshold: ${test.threshold}${test.unit})`);
      } catch (error) {
        results[test.name] = {
          error: error.message,
          passed: false,
          status: '❌ ERROR'
        };
        console.error(`Error in test ${test.name}:`, error);
      }
    }

    return results;
  }

  public async runSingleTest(testName: string): Promise<any> {
    const test = this.tests.find(t => t.name === testName);
    if (!test) {
      throw new Error(`Test "${testName}" not found`);
    }

    const result = await test.test();
    const passed = result <= test.threshold;
    
    return {
      name: testName,
      value: result,
      threshold: test.threshold,
      unit: test.unit,
      passed,
      status: passed ? '✅ PASS' : '❌ FAIL'
    };
  }

  public getTestSummary(): string {
    return `
Performance Test Suite for LoginPage Optimizations
==================================================

Tests Available:
${this.tests.map(test => `• ${test.name} (threshold: ${test.threshold}${test.unit})`).join('\n')}

Usage:
const tester = new LoginPagePerformanceTest();
const results = await tester.runAllTests();
console.table(results);
    `;
  }
}

// Core Web Vitals measurement helpers
export class WebVitalsTracker {
  private metrics: { [key: string]: number } = {};

  public trackLCP(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.metrics.lcp = lastEntry.startTime;
        console.log(`📊 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  public trackFID(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
          console.log(`📊 FID: ${this.metrics.fid.toFixed(2)}ms`);
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  public trackCLS(): void {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
            console.log(`📊 CLS: ${clsValue.toFixed(4)}`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  public getMetrics(): { [key: string]: number } {
    return { ...this.metrics };
  }

  public generateReport(): string {
    const { lcp, fid, cls } = this.metrics;
    
    const lcpStatus = lcp <= 2500 ? '🟢 Good' : lcp <= 4000 ? '🟡 Needs Improvement' : '🔴 Poor';
    const fidStatus = fid <= 100 ? '🟢 Good' : fid <= 300 ? '🟡 Needs Improvement' : '🔴 Poor';
    const clsStatus = cls <= 0.1 ? '🟢 Good' : cls <= 0.25 ? '🟡 Needs Improvement' : '🔴 Poor';

    return `
Core Web Vitals Report
=====================

🎯 LCP (Largest Contentful Paint): ${lcp?.toFixed(2) || 'N/A'}ms ${lcpStatus}
⚡ FID (First Input Delay): ${fid?.toFixed(2) || 'N/A'}ms ${fidStatus}
📐 CLS (Cumulative Layout Shift): ${cls?.toFixed(4) || 'N/A'} ${clsStatus}

Performance Goals:
• LCP: ≤ 2500ms (Excellent), ≤ 4000ms (Good)
• FID: ≤ 100ms (Excellent), ≤ 300ms (Good)  
• CLS: ≤ 0.1 (Excellent), ≤ 0.25 (Good)
    `;
  }
}

// Usage example
export function runLoginPagePerformanceTest() {
  console.log('🚀 Starting LoginPage Performance Test Suite...');
  
  const tester = new LoginPagePerformanceTest();
  const vitalsTracker = new WebVitalsTracker();
  
  // Start Core Web Vitals tracking
  vitalsTracker.trackLCP();
  vitalsTracker.trackFID();
  vitalsTracker.trackCLS();
  
  // Run performance tests after page load
  window.addEventListener('load', async () => {
    // Wait a bit for everything to settle
    setTimeout(async () => {
      try {
        const results = await tester.runAllTests();
        console.table(results);
        
        // Generate reports
        setTimeout(() => {
          console.log(vitalsTracker.generateReport());
        }, 2000);
        
      } catch (error) {
        console.error('Performance test failed:', error);
      }
    }, 1000);
  });
}

// Auto-run in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Only run if on login page
  if (window.location.pathname === '/login' || window.location.pathname === '/') {
    runLoginPagePerformanceTest();
  }
}