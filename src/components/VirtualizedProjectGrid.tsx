import React, { useRef, useEffect, useState, useMemo, memo } from 'react';
import { SpotlightCardOptimized } from '@/components/spotlight-card/SpotlightCardOptimized';
import type { Project } from '@/lib/types';

interface VirtualizedProjectGridProps {
  projects: Project[];
  onProjectUpdated?: (updatedProject: Project) => void;
  onViewDetails?: (project: Project) => void;
  columns?: number;
  rowHeight?: number;
  overscan?: number;
}

export const VirtualizedProjectGrid = memo(({
  projects,
  onProjectUpdated,
  onViewDetails,
  columns = 3,
  rowHeight = 280,
  overscan = 2
}: VirtualizedProjectGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate responsive columns based on screen size
  const responsiveColumns = useMemo(() => {
    if (typeof window === 'undefined') return columns;
    const width = window.innerWidth;
    if (width < 768) return 1; // Mobile
    if (width < 1280) return 2; // Tablet
    return columns; // Desktop
  }, [columns]);

  // Calculate grid layout
  const rows = Math.ceil(projects.length / responsiveColumns);
  const totalHeight = rows * rowHeight;

  // Calculate visible range with overscan
  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      rows,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
    );
    
    const startIndex = startRow * responsiveColumns;
    const endIndex = Math.min(projects.length, endRow * responsiveColumns);
    
    return { startIndex, endIndex, startRow };
  }, [scrollTop, containerHeight, rowHeight, rows, responsiveColumns, overscan, projects.length]);

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      requestAnimationFrame(() => {
        setScrollTop(container.scrollTop);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  // Get visible projects
  const visibleProjects = useMemo(() => {
    return projects.slice(visibleRange.startIndex, visibleRange.endIndex).map((project, index) => {
      const actualIndex = visibleRange.startIndex + index;
      const row = Math.floor(actualIndex / responsiveColumns);
      const col = actualIndex % responsiveColumns;
      
      return {
        project,
        style: {
          position: 'absolute' as const,
          top: row * rowHeight,
          left: `${(col * 100) / responsiveColumns}%`,
          width: `${100 / responsiveColumns}%`,
          height: rowHeight,
          padding: '12px'
        }
      };
    });
  }, [projects, visibleRange, responsiveColumns, rowHeight]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-auto"
      style={{ contain: 'strict' }}
    >
      {/* Virtual spacer to maintain scrollbar */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Render only visible cards */}
        {visibleProjects.map(({ project, style }) => (
          <div key={project.id} style={style}>
            <div className="h-full">
              <SpotlightCardOptimized
                project={project}
                onProjectUpdated={onProjectUpdated}
                onViewDetails={onViewDetails}
                tasks={project.tasks || []}
                documents={project.documents || []}
                expenseClaims={project.expense_claims || []}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualizedProjectGrid.displayName = 'VirtualizedProjectGrid';