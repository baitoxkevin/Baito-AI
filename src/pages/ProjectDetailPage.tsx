import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '../lib/logger';
// EditProjectDialog removed
import { SpotlightCard } from '@/components/spotlight-card';
import { getProjectById } from '@/lib/getProjectById';
import { Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // editDialogOpen removed
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!projectId) {
          setError('No project ID provided');
          setLoading(false);
          return;
        }

        const fetchedProject = await getProjectById(projectId);
        if (fetchedProject) {
          setProject(fetchedProject);
        } else {
          setError('Project not found');
        }
      } catch (err) {
        logger.error('Error fetching project:', err);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleProjectUpdated = async () => {
    try {
      setLoading(true);
      if (projectId) {
        const updatedProject = await getProjectById(projectId);
        if (updatedProject) {
          setProject(updatedProject);
          toast({
            title: 'Success',
            description: 'Project updated successfully'
          });
        }
      }
    } catch (err) {
      logger.error('Error refreshing project:', err);
      toast({
        title: 'Error',
        description: 'Failed to refresh project data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/projects');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Project Not Found</h2>
          <p className="text-muted-foreground">{error || 'The requested project could not be found'}</p>
        </div>
        <Button onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <h1 className="text-2xl font-bold">Project Details</h1>
      </div>

      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="p-6">
          <SpotlightCard
            project={project}
            onProjectUpdated={handleProjectUpdated}
            onViewDetails={() => {}}
            tasks={project.tasks || []}
            documents={project.documents || []}
          />
        </CardContent>
      </Card>

      {/* EditProjectDialog removed */}
    </div>
  );
};

export default ProjectDetailPage;