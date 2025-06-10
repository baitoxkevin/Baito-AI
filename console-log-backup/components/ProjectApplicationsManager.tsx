import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  Mail,
  Phone,
  Car,
  GraduationCap,
  AlertCircle
} from 'lucide-react';
import {
  getProjectApplications,
  updateApplicationStatus
} from '@/lib/project-application-service';
import { format } from 'date-fns';

interface ProjectApplicationsManagerProps {
  projectId: string;
  projectTitle?: string;
  canManage?: boolean;
}

export function ProjectApplicationsManager({ 
  projectId, 
  projectTitle,
  canManage = true 
}: ProjectApplicationsManagerProps) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadApplications();
  }, [projectId]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await getProjectApplications(projectId);
      if (error) throw error;

      // Group applications by status
      const sortedApplications = data?.sort((a, b) => {
        const statusOrder = { pending: 0, approved: 1, rejected: 2 };
        const statusA = a.working_dates_with_salary?.status || 'pending';
        const statusB = b.working_dates_with_salary?.status || 'pending';
        return statusOrder[statusA as keyof typeof statusOrder] - statusOrder[statusB as keyof typeof statusOrder];
      }) || [];

      setApplications(sortedApplications);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (candidateId: string, status: 'approved' | 'rejected') => {
    setUpdating(candidateId);
    try {
      const { error } = await updateApplicationStatus(projectId, candidateId, status);
      if (error) throw error;

      toast({
        title: status === 'approved' ? "Application Approved" : "Application Rejected",
        description: `The application has been ${status}.`
      });

      loadApplications(); // Refresh the list
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: `Failed to ${status} application`,
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  const pendingCount = applications.filter(app => 
    (app.working_dates_with_salary?.status || 'pending') === 'pending'
  ).length;

  const approvedCount = applications.filter(app => 
    app.working_dates_with_salary?.status === 'approved'
  ).length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Applications for {projectTitle}</CardTitle>
          <CardDescription>
            Review and manage candidate applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No applications received yet.
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => {
                const status = application.working_dates_with_salary?.status || 'pending';
                const candidate = application.candidates;
                
                return (
                  <div key={application.id} className="border rounded-lg p-4 space-y-3">
                    {/* Candidate Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={candidate?.profile_photo} />
                          <AvatarFallback>
                            {candidate?.full_name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{candidate?.full_name}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Applied for: {application.designation}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {format(new Date(application.created_at), 'dd MMM yyyy, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(status)}
                      </div>
                    </div>

                    {/* Candidate Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{candidate?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Phone className="w-4 h-4" />
                        <span>{candidate?.phone_number || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Car className="w-4 h-4" />
                        <span>{candidate?.has_vehicle ? 'Has Vehicle' : 'No Vehicle'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <GraduationCap className="w-4 h-4" />
                        <span className="truncate">{candidate?.highest_education || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {canManage && status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleUpdateStatus(candidate.id, 'approved')}
                          disabled={updating === candidate.id}
                        >
                          {updating === candidate.id ? (
                            <LoadingSpinner className="mr-2" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleUpdateStatus(candidate.id, 'rejected')}
                          disabled={updating === candidate.id}
                        >
                          {updating === candidate.id ? (
                            <LoadingSpinner className="mr-2" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Reject
                        </Button>
                      </div>
                    )}

                    {/* Status Message */}
                    {status === 'approved' && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                        <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          This application has been approved
                        </p>
                      </div>
                    )}
                    {status === 'rejected' && (
                      <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
                        <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          This application has been rejected
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}