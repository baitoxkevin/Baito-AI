/**
 * Performance monitoring utility for tracking component render times
 * and identifying performance bottlenecks
 */

interface PerformanceEntry {
  component: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

class PerformanceMonitor {
  private entries: PerformanceEntry[] = [];
  private enabled: boolean = process.env.NODE_ENV === 'development';
  private threshold: number = 16; // 16ms for 60fps

  /**
   * Log a render performance entry
   */
  logRender(
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) {
    if (!this.enabled) return;

    const entry: PerformanceEntry = {
      component: id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime
    };

    this.entries.push(entry);

    // Warn about slow renders
    if (actualDuration > this.threshold) {
      console.warn(
        `⚠️ Slow ${phase} detected in ${id}: ${actualDuration.toFixed(2)}ms`,
        {
          idealDuration: baseDuration.toFixed(2),
          startTime: startTime.toFixed(2),
          commitTime: commitTime.toFixed(2)
        }
      );
    }

    // Keep only last 100 entries to prevent memory leaks
    if (this.entries.length > 100) {
      this.entries.shift();
    }
  }

  /**
   * Get performance summary for a component
   */
  getComponentSummary(componentName: string) {
    const componentEntries = this.entries.filter(
      e => e.component === componentName
    );

    if (componentEntries.length === 0) {
      return null;
    }

    const mountEntries = componentEntries.filter(e => e.phase === 'mount');
    const updateEntries = componentEntries.filter(e => e.phase === 'update');

    return {
      component: componentName,
      totalRenders: componentEntries.length,
      mounts: mountEntries.length,
      updates: updateEntries.length,
      averageMountTime: this.calculateAverage(mountEntries, 'actualDuration'),
      averageUpdateTime: this.calculateAverage(updateEntries, 'actualDuration'),
      maxMountTime: Math.max(...mountEntries.map(e => e.actualDuration), 0),
      maxUpdateTime: Math.max(...updateEntries.map(e => e.actualDuration), 0),
      slowRenders: componentEntries.filter(e => e.actualDuration > this.threshold).length
    };
  }

  /**
   * Get overall performance report
   */
  getReport() {
    const components = [...new Set(this.entries.map(e => e.component))];
    const summaries = components
      .map(c => this.getComponentSummary(c))
      .filter(Boolean)
      .sort((a, b) => (b?.slowRenders || 0) - (a?.slowRenders || 0));

    const totalSlowRenders = this.entries.filter(
      e => e.actualDuration > this.threshold
    ).length;

    return {
      totalEntries: this.entries.length,
      totalSlowRenders,
      slowRenderPercentage: ((totalSlowRenders / this.entries.length) * 100).toFixed(2),
      componentSummaries: summaries,
      worstPerformers: summaries.slice(0, 5)
    };
  }

  /**
   * Clear all performance entries
   */
  clear() {
    this.entries = [];
  }

  /**
   * Enable or disable monitoring
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Set the threshold for slow render warnings
   */
  setThreshold(ms: number) {
    this.threshold = ms;
  }

  /**
   * Export entries as CSV for analysis
   */
  exportCSV(): string {
    const headers = ['Component', 'Phase', 'Actual Duration', 'Base Duration', 'Start Time', 'Commit Time'];
    const rows = this.entries.map(e => [
      e.component,
      e.phase,
      e.actualDuration.toFixed(2),
      e.baseDuration.toFixed(2),
      e.startTime.toFixed(2),
      e.commitTime.toFixed(2)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private calculateAverage(entries: PerformanceEntry[], field: keyof PerformanceEntry): number {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, e) => acc + (e[field] as number), 0);
    return sum / entries.length;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React Profiler callback
export const onRenderCallback: React.ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  performanceMonitor.logRender(
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  );
};

// Expose to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).performanceMonitor = performanceMonitor;
}