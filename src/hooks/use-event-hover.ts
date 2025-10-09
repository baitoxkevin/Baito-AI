import { useState, useEffect, useRef, useCallback } from 'react';
import type { Project } from '@/lib/types';

interface Position {
  top: number;
  left: number;
}

interface UseEventHoverReturn {
  hoveredProject: Project | null;
  hoverPosition: Position | null;
  handleEventHover: (project: Project, element: HTMLElement) => void;
  handleEventLeave: () => void;
  isHovering: boolean;
}

export const useEventHover = (delay: number = 300): UseEventHoverReturn => {
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [hoverPosition, setHoverPosition] = useState<Position | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  const calculatePosition = useCallback((element: HTMLElement): Position => {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Card dimensions (match EventHoverCard width)
    const cardWidth = 320; // w-80 = 20rem = 320px
    const cardHeight = 350; // Approximate height
    const padding = 8; // Spacing from element

    // Default: position to the right of the element
    let top = rect.top;
    let left = rect.right + padding;

    // Check if card would overflow on the right
    if (left + cardWidth > viewportWidth - padding) {
      // Position to the left instead
      left = rect.left - cardWidth - padding;
    }

    // If still overflowing or negative, center horizontally
    if (left < padding || left + cardWidth > viewportWidth - padding) {
      left = Math.max(padding, (viewportWidth - cardWidth) / 2);
    }

    // Vertical positioning
    // Try to align with the top of the element
    if (top + cardHeight > viewportHeight - padding) {
      // If overflowing bottom, align with bottom of element
      top = Math.max(padding, rect.bottom - cardHeight);
    }

    // Ensure doesn't overflow top
    top = Math.max(padding, top);

    return { top, left };
  }, []);

  const handleEventHover = useCallback((project: Project, element: HTMLElement) => {
    // Clear any existing leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    // Clear any existing hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set new hover timeout
    hoverTimeoutRef.current = setTimeout(() => {
      const position = calculatePosition(element);
      setHoveredProject(project);
      setHoverPosition(position);
      setIsHovering(true);
    }, delay);
  }, [delay, calculatePosition]);

  const handleEventLeave = useCallback(() => {
    // Clear hover timeout if exists
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Add a small delay before hiding to allow moving to the card
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovering(false);
      setHoveredProject(null);
      setHoverPosition(null);
    }, 200);
  }, []);

  return {
    hoveredProject,
    hoverPosition,
    handleEventHover,
    handleEventLeave,
    isHovering,
  };
};
