import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef<number>(Date.now());
  const renderTimes = useRef<number[]>([]);
  
  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;
    
    // Track render times
    renderTimes.current.push(timeSinceLastRender);
    if (renderTimes.current.length > 20) {
      renderTimes.current.shift(); // Keep only last 20 renders
    }
    
    // Log performance metrics every 10 renders
    if (renderCount.current % 10 === 0) {
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      console.log(`[Performance] ${componentName}:`, {
        renders: renderCount.current,
        avgTimeBetweenRenders: `${avgRenderTime.toFixed(2)}ms`,
        lastRenderTime: `${timeSinceLastRender}ms`
      });
    }
  });
  
  const measureOperation = useCallback((operationName: string, fn: () => any) => {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 16) { // Log if operation takes more than 1 frame (16ms)
      console.warn(`[Performance] ${componentName}.${operationName} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }, [componentName]);
  
  return {
    renderCount: renderCount.current,
    measureOperation
  };
}

/**
 * Custom hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Custom hook for throttling callbacks
 */
export function useThrottle(callback: (...args: any[]) => void, delay: number) {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    const now = Date.now();
    
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    } else {
      // Schedule for later
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRun.current = Date.now();
      }, delay - (now - lastRun.current));
    }
  }, [callback, delay]);
}

/**
 * Custom hook for request animation frame
 */
export function useAnimationFrame(callback: (deltaTime: number) => void) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  
  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);
  
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);
}

/**
 * Memory cache with TTL
 */
export class MemoryCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;
  
  constructor(ttlMs: number = 5 * 60 * 1000) { // Default 5 minutes
    this.ttl = ttlMs;
  }
  
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
}

import { useState } from 'react';

/**
 * Custom hook for using memory cache
 */
export function useMemoryCache<T>(ttlMs?: number) {
  const cacheRef = useRef(new MemoryCache<T>(ttlMs));
  
  return cacheRef.current;
}