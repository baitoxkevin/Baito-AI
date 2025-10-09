import { useState, useEffect, useMemo } from 'react';

export type EventDisplayMode = 'full' | 'compact' | 'mini';

interface DisplayModeConfig {
  mode: EventDisplayMode;
  eventHeight: number;
  eventSpacing: number;
  maxVisible: number;
  showTime: boolean;
  showLocation: boolean;
  showCrew: boolean;
}

interface UseEventDisplayModeProps {
  cellHeight?: number;
  headerHeight?: number;
  eventsCount: number;
}

export const useEventDisplayMode = ({
  cellHeight = 120,
  headerHeight = 30,
  eventsCount,
}: UseEventDisplayModeProps): DisplayModeConfig => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate available space
  const availableHeight = cellHeight - headerHeight;
  const heightPerEvent = eventsCount > 0 ? availableHeight / eventsCount : availableHeight;

  // Determine display mode based on available space and screen size
  const config = useMemo((): DisplayModeConfig => {
    // Mobile breakpoint
    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;

    // Mobile: always compact or mini
    if (isMobile) {
      if (heightPerEvent >= 25) {
        return {
          mode: 'compact',
          eventHeight: 25,
          eventSpacing: 2,
          maxVisible: 3,
          showTime: true,
          showLocation: false,
          showCrew: false,
        };
      }
      return {
        mode: 'mini',
        eventHeight: 18,
        eventSpacing: 1,
        maxVisible: 4,
        showTime: false,
        showLocation: false,
        showCrew: false,
      };
    }

    // Tablet: compact or mini
    if (isTablet) {
      if (heightPerEvent >= 32) {
        return {
          mode: 'compact',
          eventHeight: 32,
          eventSpacing: 2,
          maxVisible: 4,
          showTime: true,
          showLocation: false,
          showCrew: false,
        };
      }
      if (heightPerEvent >= 22) {
        return {
          mode: 'mini',
          eventHeight: 22,
          eventSpacing: 2,
          maxVisible: 5,
          showTime: true,
          showLocation: false,
          showCrew: false,
        };
      }
      return {
        mode: 'mini',
        eventHeight: 18,
        eventSpacing: 1,
        maxVisible: 5,
        showTime: false,
        showLocation: false,
        showCrew: false,
      };
    }

    // Desktop: full, compact, or mini based on density
    if (heightPerEvent >= 50) {
      // Plenty of space: show full details
      return {
        mode: 'full',
        eventHeight: 48,
        eventSpacing: 3,
        maxVisible: 3,
        showTime: true,
        showLocation: true,
        showCrew: true,
      };
    }

    if (heightPerEvent >= 32) {
      // Moderate space: show time and title
      return {
        mode: 'compact',
        eventHeight: 32,
        eventSpacing: 2,
        maxVisible: 5,
        showTime: true,
        showLocation: false,
        showCrew: false,
      };
    }

    // Limited space: minimal display
    return {
      mode: 'mini',
      eventHeight: 22,
      eventSpacing: 2,
      maxVisible: 6,
      showTime: true,
      showLocation: false,
      showCrew: false,
    };
  }, [heightPerEvent, windowWidth]);

  return config;
};
