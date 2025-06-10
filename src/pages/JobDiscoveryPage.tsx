import React, { useState, useEffect, useMemo, useRef } from 'react';
import TinderCard from 'react-tinder-card';
import JobDiscoveryCard from '@/components/JobDiscoveryCard';
import type { Project } from '@/lib/types';
import { getOpenProjects } from '@/lib/project-application-service'; // Assuming this service exists
import { Button } from '@/components/ui/button';
import { PublicPageWrapper } from '@/components/PublicPageWrapper';
import { XIcon, HeartIcon, Loader2, RotateCcwIcon } from 'lucide-react'; // Added RotateCcwIcon for potential undo
import { logger } from '@/lib/logger';

const JobDiscoveryPage: React.FC = () => {
  const [jobs, setJobs] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastDirection, setLastDirection] = useState<string | null>(null);

  // Used for outOfFrame closure
  const currentIndexRef = useRef(currentIndex);

  // Refs for each card to enable programmatic swiping
  const childRefs = useMemo(() =>
    Array(jobs.length)
      .fill(0)
      .map(() => React.createRef<any>()), // eslint-disable-line @typescript-eslint/no-explicit-any
    [jobs.length]
  );

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        logger.info('JobDiscoveryPage: Fetching open projects...');
        // Assuming getOpenProjects returns projects suitable for discovery
        // In a real app, this would likely be paginated or filtered for new jobs
        const openProjects = await getOpenProjects();

        if (openProjects && openProjects.length > 0) {
          logger.info(`JobDiscoveryPage: Fetched ${openProjects.length} projects.`);
          // Reverse to simulate stack: last item in array is on top
          setJobs(openProjects.reverse());
          setCurrentIndex(openProjects.length - 1);
        } else {
          logger.info('JobDiscoveryPage: No open projects found or empty array returned.');
          setJobs([]);
          setCurrentIndex(0); // No projects, so index is 0
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('JobDiscoveryPage: Failed to fetch jobs for discovery:', { error: errorMessage, originalError: err });
        setError('Failed to load jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const updateCurrentIndex = (val: number) => {
    setCurrentIndex(val);
    // Note: currentIndexRef.current is updated via the useEffect above
  };

  // Determine if there are cards left to swipe
  const canSwipe = currentIndex >= 0 && jobs.length > 0 && currentIndex < jobs.length;

  const swiped = (direction: string, projectId: string | number, index: number) => {
    setLastDirection(direction);
    updateCurrentIndex(index - 1); // Move to the next card in the stack (visually previous in array)
    logger.info(`JobDiscoveryPage: Swiped ${direction} on project ID: ${projectId}, index: ${index}`);
    // TODO: Implement backend interaction here (e.g., record swipe, create application)
    // Example: if (direction === 'right') { recordLike(projectId); } else { recordPass(projectId); }
  };

  const outOfFrame = (projectId: string | number, idx: number) => {
    logger.info(`JobDiscoveryPage: Project ID ${projectId} (index ${idx}) left the screen. Current index ref: ${currentIndexRef.current}`);
    // This is called when a card is entirely out of view.
    // If `currentIndexRef.current >= idx` and `childRefs[idx].current.restoreCard()` was implemented,
    // this could be a place to prevent cards from being fully removed if an "undo" was triggered quickly.
    // For now, the primary logic for "removing" cards is handled by decrementing `currentIndex`.
  };

  const triggerSwipe = async (dir: 'left' | 'right') => {
    if (canSwipe && childRefs[currentIndex]?.current) {
      logger.info(`JobDiscoveryPage: Programmatically swiping ${dir} on card index ${currentIndex}`);
      await childRefs[currentIndex].current.swipe(dir);
    } else {
      logger.warn(`JobDiscoveryPage: Cannot swipe. canSwipe: ${canSwipe}, currentIndex: ${currentIndex}, childRef exists: ${!!childRefs[currentIndex]?.current}`);
    }
  };

  // Basic "Go Back" or "Undo" functionality (conceptual)
  // const goBack = async () => {
  //   if (currentIndex < jobs.length - 1) { // Check if there's a card to go back to
  //     const newIndex = currentIndex + 1;
  //     updateCurrentIndex(newIndex);
  //     setLastDirection(null); // Clear last direction
  //     await childRefs[newIndex]?.current?.restoreCard(); // TinderCard API for undo
  //     logger.info(`JobDiscoveryPage: Restored card for project ID: ${jobs[newIndex].id}`);
  //   } else {
  //     logger.info("JobDiscoveryPage: No card to go back to or already at the beginning.");
  //   }
  // };


  if (loading) {
    return <PublicPageWrapper><div className="flex flex-col justify-center items-center h-screen bg-gray-50"><Loader2 className="h-16 w-16 text-primary animate-spin" /><p className="mt-4 text-lg text-gray-600">Finding jobs...</p></div></PublicPageWrapper>;
  }

  if (error) {
    return <PublicPageWrapper><div className="flex flex-col justify-center items-center h-screen bg-gray-50 text-red-600"><p className="text-xl">{error}</p><p>Please refresh the page or check back later.</p></div></PublicPageWrapper>;
  }

  return (
    <PublicPageWrapper>
      <div className="flex flex-col items-center justify-between h-screen bg-gradient-to-br from-slate-100 to-gray-200 py-8 overflow-hidden">
        <div className="text-center mb-2 px-4">
          <h1 className="text-3xl font-bold text-gray-800">Discover Opportunities</h1>
          {lastDirection && !canSwipe && jobs.length > 0 && ( // Show only if it was the last card
             <p className="text-md text-gray-500 mt-1">You swiped {lastDirection} on the last job.</p>
          )}
        </div>

        <div className="relative w-[90vw] max-w-[380px] h-[520px] flex-grow flex items-center justify-center"> {/* Card container */}
          {jobs.length > 0 ? jobs.map((job, index) => (
            <TinderCard
              ref={childRefs[index]}
              key={job.id.toString()} // Ensure key is string
              className="absolute" // Important for stacking visual
              preventSwipe={['up', 'down']}
              onSwipe={(dir) => swiped(dir, job.id, index)}
              onCardLeftScreen={() => outOfFrame(job.id, index)}
            >
              <JobDiscoveryCard project={job} />
            </TinderCard>
          )) : null}

          {!canSwipe && !loading && (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl shadow-md">
              <img src="/placeholder-images/no-jobs.svg" alt="No more jobs" className="w-40 h-40 mb-4" /> {/* Example placeholder image */}
              <p className="text-2xl font-semibold text-gray-700">That's all for now!</p>
              <p className="text-gray-500 mt-2">Check back later for new job opportunities or adjust your filters.</p>
            </div>
          )}
        </div>

        <div className="flex justify-center items-center space-x-6 mt-6 p-4">
          {canSwipe && !loading ? (
            <>
              <Button
                onClick={() => triggerSwipe('left')}
                variant="outline"
                size="lg"
                className="rounded-full p-0 w-20 h-20 flex items-center justify-center bg-white shadow-xl hover:bg-red-50 focus:ring-red-500"
                aria-label="Pass on job"
              >
                <XIcon className="h-10 w-10 text-red-500" />
              </Button>
              {/* Placeholder for Undo Button - requires more complex state management for childRefs[currentIndex+1]
              <Button
                onClick={goBack}
                variant="outline"
                size="lg"
                className="rounded-full p-0 w-16 h-16 flex items-center justify-center bg-white shadow-lg hover:bg-gray-100 focus:ring-gray-400"
                aria-label="Undo last swipe"
                // disabled={currentIndex >= jobs.length -1} // Example disable condition
              >
                <RotateCcwIcon className="h-6 w-6 text-gray-500" />
              </Button>
              */}
              <Button
                onClick={() => triggerSwipe('right')}
                variant="outline"
                size="lg"
                className="rounded-full p-0 w-20 h-20 flex items-center justify-center bg-white shadow-xl hover:bg-green-50 focus:ring-green-500"
                aria-label="Like job"
              >
                <HeartIcon className="h-10 w-10 text-green-500" />
              </Button>
            </>
          ) : !loading && ( // Show a "Refresh" or "Home" button when no cards are left
             <Button onClick={() => window.location.reload()} variant="default" size="lg">
                Check for New Jobs
             </Button>
          )}
        </div>
      </div>
    </PublicPageWrapper>
  );
};

export default JobDiscoveryPage;
