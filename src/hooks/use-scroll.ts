import { useState, useEffect, useRef } from 'react';

interface ScrollOptions {
  threshold?: number;
  scrollDirection?: 'up' | 'down' | 'both';
  immediateDetection?: boolean;
}

export function useScroll({ 
  threshold = 100, 
  scrollDirection = 'both',
  immediateDetection = false
}: ScrollOptions = {}) {
  // Pre-check if we're already scrolled on mount
  const initialScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  const initialIsScrolled = immediateDetection ? initialScrollY > 0 : initialScrollY > threshold;
  
  const [scrollY, setScrollY] = useState(initialScrollY);
  const [isScrolled, setIsScrolled] = useState(initialIsScrolled);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  
  // Use a ref to track the previous scroll position to avoid dependency issues
  const previousScrollYRef = useRef(0);
  
  useEffect(() => {
    // Enhanced scroll handler with debounce for performance
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const previousScrollY = previousScrollYRef.current;
          
          // Update the ref with current scroll position before state updates
          previousScrollYRef.current = currentScrollY;
          
          // Update scroll position state
          setScrollY(currentScrollY);
          
          // Determine scroll direction with a minimal change threshold
          // for responsive detection while avoiding flickering
          const scrollDelta = currentScrollY - previousScrollY;
          if (scrollDelta < -0.5) { // Smaller threshold for more responsive detection
            setIsScrollingUp(true);
            setIsScrollingDown(false);
          } else if (scrollDelta > 0.5) { // Smaller threshold for more responsive detection
            setIsScrollingUp(false);
            setIsScrollingDown(true);
          }
          
          // Handle scroll state detection based on mode
          if (immediateDetection) {
            // EXACT detection - only consider not scrolled when exactly at the top (0px)
            // No tolerance at all - for hiding UI elements completely
            setIsScrolled(currentScrollY !== 0);
          } else if (currentScrollY <= 1) {
            // Standard behavior with tiny tolerance for normal UI
            setIsScrolled(false);
          } else {
            // Standard threshold-based detection for normal UI elements
            setIsScrolled(currentScrollY > threshold);
          }
          
          ticking = false;
        });
        
        ticking = true;
      }
    };
    
    // Initial check on mount and setup
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold, immediateDetection]); // Only threshold and immediateDetection should be dependencies
  
  // Return all values or filtered by direction
  if (scrollDirection === 'up') {
    return { scrollY, isScrolled, isScrollingUp };
  } else if (scrollDirection === 'down') {
    return { scrollY, isScrolled, isScrollingDown };
  }
  
  return { scrollY, isScrolled, isScrollingUp, isScrollingDown };
}