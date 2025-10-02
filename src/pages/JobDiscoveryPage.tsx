import React, { useState, useEffect, useMemo, useRef } from 'react';
import TinderCard from 'react-tinder-card';
import JobDiscoveryCard from '@/components/JobDiscoveryCard';
import type { Project } from '@/lib/types';
import { getProjectsForDiscovery, recordSwipeAction } from '@/lib/project-application-service';
import { Button } from '@/components/ui/button';
import { PublicPageWrapper } from '@/components/PublicPageWrapper';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { XIcon, HeartIcon, Loader2, RotateCcwIcon, Sparkles, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

const JobDiscoveryPage: React.FC = () => {
  const [jobs, setJobs] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastDirection, setLastDirection] = useState<string | null>(null);
  const [swipedJobs, setSwipedJobs] = useState<{ projectId: string; direction: string }[]>([]);
  const { toast } = useToast();

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
        logger.info('JobDiscoveryPage: Fetching projects for discovery...');
        // Get projects that are currently active or upcoming
        // TODO: Pass candidateId when we have authentication
        const result = await getProjectsForDiscovery();

        if (result.data && result.data.length > 0) {
          logger.info(`JobDiscoveryPage: Fetched ${result.data.length} projects.`);
          // Reverse to simulate stack: last item in array is on top
          setJobs(result.data.reverse());
          setCurrentIndex(result.data.length - 1);
        } else {
          logger.info('JobDiscoveryPage: No projects found for discovery.');
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

  const swiped = async (direction: string, projectId: string | number, index: number) => {
    setLastDirection(direction);
    updateCurrentIndex(index - 1); // Move to the next card in the stack (visually previous in array)
    
    const project = jobs[index];
    logger.info(`JobDiscoveryPage: Swiped ${direction} on project: ${project?.title}, ID: ${projectId}`);
    
    // Record the swipe
    setSwipedJobs(prev => [...prev, { projectId: projectId.toString(), direction }]);
    
    // For now, we'll use a mock candidate ID until authentication is implemented
    // In production, this would come from the authenticated user
    const mockCandidateId = 'mock-candidate-' + Date.now();
    
    if (direction === 'right') {
      // Show immediate feedback
      toast({
        title: "Applied! 🎉",
        description: `You've applied to ${project?.title}`,
        duration: 3000,
      });
      
      // Record the application (in real app, this would use actual candidateId)
      try {
        await recordSwipeAction(projectId.toString(), mockCandidateId, 'like');
      } catch (error) {
        logger.error('Failed to record application:', error);
      }
    } else if (direction === 'left') {
      // Record the pass
      try {
        await recordSwipeAction(projectId.toString(), mockCandidateId, 'pass');
      } catch (error) {
        logger.error('Failed to record pass:', error);
      }
    }
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

  // Calculate stats
  const appliedCount = swipedJobs.filter(j => j.direction === 'right').length;
  const passedCount = swipedJobs.filter(j => j.direction === 'left').length;

  return (
    <PublicPageWrapper>
      <div className="flex flex-col items-center justify-between min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 py-6 overflow-hidden">
        {/* Header with stats */}
        <div className="w-full px-4 mb-4">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Discover Opportunities
              </h1>
              <Sparkles className="h-6 w-6 text-pink-600" />
            </div>
            {lastDirection && !canSwipe && jobs.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                You swiped {lastDirection} on the last job.
              </p>
            )}
          </div>
          
          {/* Stats bar */}
          {(appliedCount > 0 || passedCount > 0) && (
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
                <HeartIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">{appliedCount} Applied</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                <XIcon className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{passedCount} Passed</span>
              </div>
            </div>
          )}
        </div>

        {/* Card container with subtle shadow effect */}
        <div className="relative w-[90vw] max-w-[400px] h-[550px] flex-grow flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-100/20 to-pink-100/20 rounded-3xl blur-3xl" />
          
          {jobs.length > 0 ? jobs.map((job, index) => (
            <TinderCard
              ref={childRefs[index]}
              key={job.id.toString()}
              className="absolute"
              preventSwipe={['up', 'down']}
              onSwipe={(dir) => swiped(dir, job.id, index)}
              onCardLeftScreen={() => outOfFrame(job.id, index)}
            >
              <div className="transform transition-transform hover:scale-[1.02]">
                <JobDiscoveryCard project={job} />
              </div>
            </TinderCard>
          )) : null}

          {!canSwipe && !loading && (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-purple-100">
              <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <AlertCircle className="h-16 w-16 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-2">That's all for now!</p>
              <p className="text-gray-600">Check back later for new opportunities</p>
              {appliedCount > 0 && (
                <p className="text-sm text-green-600 mt-4">
                  You've applied to {appliedCount} {appliedCount === 1 ? 'job' : 'jobs'} today! 🎉
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action buttons with enhanced styling */}
        <div className="flex justify-center items-center gap-8 mt-6 p-4">
          {canSwipe && !loading ? (
            <>
              <Button
                onClick={() => triggerSwipe('left')}
                variant="outline"
                size="lg"
                className="rounded-full p-0 w-20 h-20 flex items-center justify-center bg-white border-2 border-red-200 shadow-xl hover:bg-red-50 hover:border-red-300 hover:shadow-2xl transform transition-all hover:scale-110 focus:ring-4 focus:ring-red-200"
                aria-label="Pass on job"
              >
                <XIcon className="h-10 w-10 text-red-500" />
              </Button>
              
              <Button
                onClick={() => triggerSwipe('right')}
                variant="outline"
                size="lg"
                className="rounded-full p-0 w-20 h-20 flex items-center justify-center bg-white border-2 border-green-200 shadow-xl hover:bg-green-50 hover:border-green-300 hover:shadow-2xl transform transition-all hover:scale-110 focus:ring-4 focus:ring-green-200"
                aria-label="Like job"
              >
                <HeartIcon className="h-10 w-10 text-green-500" />
              </Button>
            </>
          ) : !loading && (
            <Button 
              onClick={() => window.location.reload()} 
              variant="default" 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg transform transition-all hover:scale-105"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Check for New Jobs
            </Button>
          )}
        </div>
      </div>
    </PublicPageWrapper>
  );
};

export default JobDiscoveryPage;
