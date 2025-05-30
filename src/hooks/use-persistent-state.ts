import { useState, useRef, useEffect } from 'react';

// Global state storage
const globalStateStore: Record<string, unknown> = {};

/**
 * Hook to maintain state persistence even when component unmounts temporarily
 * Useful for views that are conditionally rendered based on tab/navigation state
 * 
 * @param key A unique identifier for this state (should be consistent across renders)
 * @param initialValue The initial value if no persisted state exists
 * @returns A stateful value and a function to update it (like useState)
 */
export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((prevValue: T) => T)) => void] {
  // Create a ref to track if this is the first render
  const isFirstRender = useRef(true);
  
  // Initialize state - either from global store or initial value
  const [state, setState] = useState<T>(() => {
    // Check if we have a stored value
    if (globalStateStore[key] !== undefined) {
      return globalStateStore[key];
    }
    
    // Otherwise use the initial value
    const value = typeof initialValue === 'function' ? initialValue() : initialValue;
    globalStateStore[key] = value;
    return value;
  });
  
  // Update global store when state changes
  useEffect(() => {
    // Skip on first render since we already initialized
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    globalStateStore[key] = state;
  }, [key, state]);
  
  // Wrapper for setState that also updates global store
  const setPersistedState = (value: T | ((prevValue: T) => T)) => {
    setState(prevState => {
      const newValue = typeof value === 'function'
        ? (value as ((prevValue: T) => T))(prevState)
        : value;
      
      globalStateStore[key] = newValue;
      return newValue;
    });
  };
  
  return [state, setPersistedState];
}

/**
 * Clear all persistent state for a specific key or all keys
 * @param key Optional specific key to clear
 */
export function clearPersistentState(key?: string): void {
  if (key) {
    delete globalStateStore[key];
  } else {
    // Clear all keys
    Object.keys(globalStateStore).forEach(k => {
      delete globalStateStore[k];
    });
  }
}