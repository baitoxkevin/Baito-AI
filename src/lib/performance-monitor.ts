// Performance monitoring utilities for the payments page

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  dataFetchTime: number;
  interactionTime: number;
  memoryUsage?: number;
  cacheHitRate?: number;
}

interface PerformanceMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private metrics: PerformanceMetrics[] = [];

  // Start a performance measurement
  startMeasure(name: string): void {
    const mark: PerformanceMark = {
      name,
      startTime: performance.now()
    };
    this.marks.set(name, mark);
    
    // Use Performance API if available
    if (typeof performance.mark === 'function') {
      performance.mark(`${name}-start`);
    }
  }

  // End a performance measurement
  endMeasure(name: string): number {
    const mark = this.marks.get(name);
    if (!mark) {
      console.warn(`Performance mark "${name}" not found`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - mark.startTime;
    
    mark.endTime = endTime;
    mark.duration = duration;

    // Use Performance API if available
    if (typeof performance.mark === 'function' && typeof performance.measure === 'function') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }

    return duration;
  }

  // Get measurement duration
  getMeasurement(name: string): number {
    const mark = this.marks.get(name);
    return mark?.duration || 0;
  }

  // Record a complete metric
  recordMetric(metric: Partial<PerformanceMetrics>): void {
    const fullMetric: PerformanceMetrics = {
      loadTime: 0,
      renderTime: 0,
      dataFetchTime: 0,
      interactionTime: 0,
      ...metric
    };
    
    this.metrics.push(fullMetric);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚀 Payment Page Performance Metrics');
      console.table(fullMetric);
      console.groupEnd();
    }
  }

  // Get performance summary
  getPerformanceSummary(): {
    averageLoadTime: number;
    averageRenderTime: number;
    averageDataFetchTime: number;
    totalMeasurements: number;
    improvementSuggestions: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageLoadTime: 0,
        averageRenderTime: 0,
        averageDataFetchTime: 0,
        totalMeasurements: 0,
        improvementSuggestions: []
      };
    }

    const avgLoadTime = this.metrics.reduce((sum, m) => sum + m.loadTime, 0) / this.metrics.length;
    const avgRenderTime = this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length;
    const avgDataFetchTime = this.metrics.reduce((sum, m) => sum + m.dataFetchTime, 0) / this.metrics.length;

    const suggestions: string[] = [];
    
    if (avgLoadTime > 2000) {
      suggestions.push('Consider implementing more aggressive caching for faster load times');
    }
    
    if (avgRenderTime > 100) {
      suggestions.push('Optimize component rendering with better memoization');
    }
    
    if (avgDataFetchTime > 1000) {
      suggestions.push('Optimize database queries or implement request batching');
    }

    return {
      averageLoadTime: Math.round(avgLoadTime),
      averageRenderTime: Math.round(avgRenderTime),
      averageDataFetchTime: Math.round(avgDataFetchTime),
      totalMeasurements: this.metrics.length,
      improvementSuggestions: suggestions
    };
  }

  // Measure async operation
  async measureAsync<T>(
    operationName: string,
    asyncOperation: () => Promise<T>
  ): Promise<T> {
    this.startMeasure(operationName);
    try {
      const result = await asyncOperation();
      this.endMeasure(operationName);
      return result;
    } catch (error) {
      this.endMeasure(operationName);
      throw error;
    }
  }

  // Clear all measurements
  clear(): void {
    this.marks.clear();
    this.metrics.length = 0;
  }
}

// Performance hooks for React components
export const usePerformanceMonitor = () => {
  const monitor = new PerformanceMonitor();
  
  return {
    startMeasure: monitor.startMeasure.bind(monitor),
    endMeasure: monitor.endMeasure.bind(monitor),
    getMeasurement: monitor.getMeasurement.bind(monitor),
    recordMetric: monitor.recordMetric.bind(monitor),
    getPerformanceSummary: monitor.getPerformanceSummary.bind(monitor),
    measureAsync: monitor.measureAsync.bind(monitor),
    clear: monitor.clear.bind(monitor)
  };
};

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Automatic performance tracking for route changes
export const trackPageLoad = (pageName: string) => {
  performanceMonitor.startMeasure(`page-load-${pageName}`);
  
  // Track when page is fully loaded
  if (document.readyState === 'complete') {
    performanceMonitor.endMeasure(`page-load-${pageName}`);
  } else {
    window.addEventListener('load', () => {
      performanceMonitor.endMeasure(`page-load-${pageName}`);
    }, { once: true });
  }
};

// Performance recommendations based on metrics
export const getPerformanceRecommendations = (metrics: PerformanceMetrics): string[] => {
  const recommendations: string[] = [];
  
  if (metrics.loadTime > 3000) {
    recommendations.push('Load time is over 3 seconds. Consider implementing code splitting and lazy loading.');
  }
  
  if (metrics.renderTime > 150) {
    recommendations.push('Render time is high. Optimize with React.memo, useMemo, and useCallback.');
  }
  
  if (metrics.dataFetchTime > 1500) {
    recommendations.push('Data fetch time is slow. Consider caching, query optimization, or data prefetching.');
  }
  
  if (metrics.interactionTime > 50) {
    recommendations.push('Interaction response time is slow. Reduce blocking operations on the main thread.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Performance looks good! Consider monitoring for regressions.');
  }
  
  return recommendations;
};

// Cache performance tracking
export const trackCachePerformance = () => {
  let cacheHits = 0;
  let cacheMisses = 0;
  
  return {
    recordCacheHit: () => cacheHits++,
    recordCacheMiss: () => cacheMisses++,
    getCacheHitRate: () => {
      const total = cacheHits + cacheMisses;
      return total === 0 ? 0 : (cacheHits / total) * 100;
    },
    reset: () => {
      cacheHits = 0;
      cacheMisses = 0;
    }
  };
};

// React Profiler callback for performance tracking
export const onRenderCallback = (
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => {
  if (process.env.NODE_ENV === 'development') {
    performanceMonitor.recordMetric({
      loadTime: phase === 'mount' ? actualDuration : 0,
      renderTime: actualDuration,
      dataFetchTime: 0,
      interactionTime: 0
    });

    console.log(`🚀 Component "${id}" ${phase}:`, {
      actualDuration: Math.round(actualDuration * 100) / 100,
      baseDuration: Math.round(baseDuration * 100) / 100,
      startTime: Math.round(startTime),
      commitTime: Math.round(commitTime)
    });
  }
};