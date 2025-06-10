import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Building2, 
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import {
  getOpenProjects,
  applyToProject,
  hasAppliedToProject,
  isProjectOpen,
  getCandidateApplications
} from '@/lib/project-application-service';
import { format } from 'date-fns';

interface CandidateProjectApplicationsProps {
  candidateId: string;
  candidateName?: string;
}

export function CandidateProjectApplications({ candidateId, candidateName }: CandidateProjectApplicationsProps) {
  const [openProjects, setOpenProjects] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [designation, setDesignation] = useState('Crew');
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'applications'>('open');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [candidateId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load open projects
      const { data: projects, error: projectsError } = await getOpenProjects();
      if (projectsError) throw projectsError;

      // Load candidate's applications
      const { data: applications, error: appsError } = await getCandidateApplications(candidateId);
      if (appsError) throw appsError;

      // Mark projects that candidate has already applied to
      const appliedProjectIds = new Set(applications?.map(app => app.project_id) || []);
      const projectsWithStatus = projects?.map(project => ({
        ...project,
        hasApplied: appliedProjectIds.has(project.id)
      })) || [];

      setOpenProjects(projectsWithStatus);
      setMyApplications(applications || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedProject || !candidateId) return;

    setApplying(true);
    try {
      const { data, error } = await applyToProject({
        project_id: selectedProject.id,
        candidate_id: candidateId,
        designation: designation,
        apply_type: 'applied',
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: `Your application for ${selectedProject.title} has been submitted successfully.`
      });

      setShowApplicationDialog(false);
      setSelectedProject(null);
      loadData(); // Refresh the data
    } catch (error: any) {
      console.error('Error applying to project:', error);
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit application",
        variant: "destructive"
      });
    } finally {
      setApplying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getApplicationStatus = (application: any) => {
    const status = application.working_dates_with_salary?.status || 'pending';
    return status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('open')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'open'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Briefcase className="w-4 h-4" />
            Open Projects ({openProjects.filter(p => !p.hasApplied).length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'applications'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />
            My Applications ({myApplications.length})
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'open' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {openProjects.filter(p => !p.hasApplied).map((project) => (
            <Card key={project.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: project.color }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {project.company_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(new Date(project.start_date), 'dd MMM yyyy')}
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4 mr-2" />
                  {project.venue_address}
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4 mr-2" />
                  {project.working_hours_start} - {project.working_hours_end}
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Users className="w-4 h-4 mr-2" />
                  {project.filled_positions || 0} / {project.crew_count} positions filled
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => {
                    setSelectedProject(project);
                    setShowApplicationDialog(true);
                  }}
                >
                  Apply Now
                </Button>
              </CardFooter>
            </Card>
          ))}
          {openProjects.filter(p => !p.hasApplied).length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500">
              No open projects available at the moment.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {myApplications.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{application.projects?.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Building2 className="w-4 h-4" />
                      {application.projects?.company_name}
                    </CardDescription>
                  </div>
                  {getStatusBadge(getApplicationStatus(application))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(application.projects?.start_date), 'dd MMM yyyy')}
                    </div>
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Applied as: {application.designation}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      {application.projects?.venue_address}
                    </div>
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4 mr-2" />
                      Applied: {format(new Date(application.created_at), 'dd MMM yyyy')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {myApplications.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              You haven't applied to any projects yet.
            </div>
          )}
        </div>
      )}

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Project</DialogTitle>
            <DialogDescription>
              Submit your application for {selectedProject?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Details</Label>
              <div className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                <p><strong>Company:</strong> {selectedProject?.company_name}</p>
                <p><strong>Date:</strong> {selectedProject && format(new Date(selectedProject.start_date), 'dd MMM yyyy')}</p>
                <p><strong>Location:</strong> {selectedProject?.venue_address}</p>
                <p><strong>Working Hours:</strong> {selectedProject?.working_hours_start} - {selectedProject?.working_hours_end}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Position/Role</Label>
              <Select value={designation} onValueChange={setDesignation}>
                <SelectTrigger id="designation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Crew">Crew</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Team Lead">Team Lead</SelectItem>
                  <SelectItem value="Coordinator">Coordinator</SelectItem>
                  <SelectItem value="Assistant">Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Applicant:</strong> {candidateName || 'Candidate'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApplicationDialog(false);
                setSelectedProject(null);
              }}
              disabled={applying}
            >
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={applying}>
              {applying ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}