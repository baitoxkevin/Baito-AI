/**
 * Safe localStorage wrapper with error handling
 * Prevents app crashes from corrupt localStorage data
 */

export const safeLocalStorage = {
  /**
   * Safely get an item from localStorage with JSON parsing
   */
  getItem<T = any>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;

    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;

      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Failed to parse localStorage item "${key}", using default:`, error);
      // Clear the corrupt item
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.warn(`Failed to remove corrupt item "${key}":`, removeError);
      }
      return defaultValue;
    }
  },

  /**
   * Safely set an item to localStorage with JSON stringification
   */
  setItem(key: string, value: any): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.warn(`Failed to save to localStorage "${key}":`, error);
      return false;
    }
  },

  /**
   * Safely remove an item from localStorage
   */
  removeItem(key: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove from localStorage "${key}":`, error);
      return false;
    }
  },

  /**
   * Safely clear all localStorage
   */
  clear(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
};
