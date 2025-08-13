// Common bug fixes and safety utilities

/**
 * Safely access array methods with null checks
 */
export function safeArray<T>(arr: T[] | null | undefined): T[] {
  return arr || [];
}

/**
 * Safe map operation with null check
 */
export function safeMap<T, R>(
  arr: T[] | null | undefined,
  fn: (item: T, index: number) => R
): R[] {
  return safeArray(arr).map(fn);
}

/**
 * Safe filter operation with null check
 */
export function safeFilter<T>(
  arr: T[] | null | undefined,
  fn: (item: T, index: number) => boolean
): T[] {
  return safeArray(arr).filter(fn);
}

/**
 * Safe find operation with null check
 */
export function safeFind<T>(
  arr: T[] | null | undefined,
  fn: (item: T, index: number) => boolean
): T | undefined {
  return safeArray(arr).find(fn);
}

/**
 * Safe async operation with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  
  return Promise.race([promise, timeout]);
}

/**
 * Debounce function to prevent rapid fire events
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Safe localStorage access with error handling
 */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  
  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  fallback: T
): T {
  if (!json) return fallback;
  
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Retry failed operations with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

/**
 * Check if value is defined and not null
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Get nested property safely
 */
export function getNestedProperty<T>(
  obj: any,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined) {
      return defaultValue;
    }
  }
  
  return result;
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Format error messages for display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred';
}

/**
 * Create a loading state manager
 */
export class LoadingStateManager {
  private loadingStates = new Map<string, boolean>();
  private listeners = new Map<string, Set<() => void>>();
  
  setLoading(key: string, isLoading: boolean): void {
    this.loadingStates.set(key, isLoading);
    this.notifyListeners(key);
  }
  
  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }
  
  isAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(state => state);
  }
  
  subscribe(key: string, callback: () => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback);
    
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }
  
  private notifyListeners(key: string): void {
    this.listeners.get(key)?.forEach(callback => callback());
  }
}

export const globalLoadingState = new LoadingStateManager();