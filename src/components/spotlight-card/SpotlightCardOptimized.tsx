import React, { memo, lazy, Suspense, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { SpotlightCardMinimized } from './SpotlightCardMinimized';
import type { Project } from '@/lib/types';

// Lazy load the full card component
const SpotlightCardFull = lazy(() => import('./index').then(module => ({ 
  default: module.SpotlightCard 
})));

interface SpotlightCardOptimizedProps {
  project: Project;
  onProjectUpdated?: (updatedProject: Project) => void;
  onViewDetails?: (project: Project) => void;
  tasks?: unknown[];
  documents?: unknown[];
  expenseClaims?: unknown[];
}

// Loading placeholder component
const CardLoadingPlaceholder = () => (
  <div className="relative border shadow-sm bg-white dark:bg-slate-900 rounded-lg p-5 h-[200px] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
  </div>
);

export const SpotlightCardOptimized = memo(({ 
  project, 
  onProjectUpdated,
  onViewDetails,
  tasks = [],
  documents = [],
  expenseClaims = []
}: SpotlightCardOptimizedProps) => {
  // Track if card should be expanded
  const storageKey = `spotlight-expanded-${project.id}`;
  const [isExpanded, setIsExpanded] = React.useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored === 'true';
  });

  // Track if component should be mounted (for lazy loading)
  const [shouldMount, setShouldMount] = React.useState(isExpanded);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    setShouldMount(true);
    localStorage.setItem(storageKey, 'true');
  }, [storageKey]);

  // If not expanded and never mounted, show minimized version
  if (!shouldMount) {
    return (
      <SpotlightCardMinimized
        project={project}
        onClick={handleExpand}
        tasks={tasks}
        expenseClaims={expenseClaims}
      />
    );
  }

  // If should mount, lazy load the full component
  return (
    <Suspense fallback={<CardLoadingPlaceholder />}>
      <SpotlightCardFull
        project={project}
        onProjectUpdated={onProjectUpdated}
        onViewDetails={onViewDetails}
        tasks={tasks}
        documents={documents}
        expenseClaims={expenseClaims}
      />
    </Suspense>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if key properties change
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.priority === nextProps.project.priority &&
    prevProps.project.title === nextProps.project.title &&
    prevProps.project.filled_positions === nextProps.project.filled_positions &&
    prevProps.project.crew_count === nextProps.project.crew_count &&
    prevProps.tasks?.length === nextProps.tasks?.length &&
    prevProps.documents?.length === nextProps.documents?.length &&
    prevProps.expenseClaims?.length === nextProps.expenseClaims?.length
  );
});

SpotlightCardOptimized.displayName = 'SpotlightCardOptimized';