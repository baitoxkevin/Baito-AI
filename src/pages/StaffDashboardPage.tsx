import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  Target,
  Award,
  Activity,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, subMonths } from 'date-fns';

interface StaffKPIs {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalCandidates: number;
  activeCandidates: number;
  totalCommission: number;
  monthlyCommission: number;
  averageProjectValue: number;
  projectsByStatus: Record<string, number>;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    project?: string;
  }>;
}

interface ProjectStats {
  id: string;
  title: string;
  status: string;
  staffCount: number;
  commission: number;
  startDate: Date;
  endDate?: Date;
}

export default function StaffDashboardPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [kpis, setKpis] = useState<StaffKPIs>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalCandidates: 0,
    activeCandidates: 0,
    totalCommission: 0,
    monthlyCommission: 0,
    averageProjectValue: 0,
    projectsByStatus: {},
    recentActivities: []
  });
  const [projects, setProjects] = useState<ProjectStats[]>([]);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  // Fetch user data
  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: 'Authentication required',
            description: 'Please sign in to view your dashboard',
            variant: 'destructive'
          });
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .eq('auth_id', user.id)
          .single();

        if (userError) throw userError;

        setUserId(userData.id);
        setUserName(userData.full_name);
        setUserAvatar(userData.avatar_url || '');
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user data',
          variant: 'destructive'
        });
      }
    }

    fetchUserData();
  }, [toast]);

  // Fetch KPIs and project data
  useEffect(() => {
    if (!userId) return;

    async function fetchKPIs() {
      try {
        setLoading(true);

        // Get date range based on selection
        let startDate: Date;
        const endDate = new Date();

        switch (timeRange) {
          case 'month':
            startDate = startOfMonth(new Date());
            break;
          case 'quarter':
            startDate = subMonths(new Date(), 3);
            break;
          case 'year':
            startDate = startOfYear(new Date());
            break;
        }

        // Fetch projects managed by this user
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            id,
            title,
            status,
            start_date,
            end_date,
            budget,
            project_staff!inner(
              id,
              user_id,
              position
            )
          `)
          .eq('project_staff.user_id', userId);

        if (projectsError) throw projectsError;

        // Fetch staff assignments with commission data
        const { data: staffData, error: staffError } = await supabase
          .from('project_staff')
          .select(`
            *,
            projects(title, status),
            candidates(full_name)
          `)
          .eq('user_id', userId);

        if (staffError) throw staffError;

        // Calculate KPIs
        const uniqueProjects = new Set(projectsData?.map(p => p.id) || []);
        const activeProjects = projectsData?.filter(p => p.status === 'active').length || 0;
        const completedProjects = projectsData?.filter(p => p.status === 'completed').length || 0;

        // Calculate total candidates/pax managed
        const uniqueCandidates = new Set(staffData?.map(s => s.candidate_id) || []);
        const activeCandidates = staffData?.filter(s => s.status === 'confirmed').length || 0;

        // Calculate commission
        let totalCommission = 0;
        let monthlyCommission = 0;

        staffData?.forEach(staff => {
          // Calculate commission from working_dates_with_salary
          if (staff.working_dates_with_salary) {
            staff.working_dates_with_salary.forEach((date: any) => {
              const commission = parseFloat(date.commission || '0');
              totalCommission += commission;

              // Check if date is in current month
              const workDate = new Date(date.date);
              if (workDate >= startOfMonth(new Date()) && workDate <= endOfMonth(new Date())) {
                monthlyCommission += commission;
              }
            });
          }
        });

        // Group projects by status
        const projectsByStatus: Record<string, number> = {};
        projectsData?.forEach(project => {
          projectsByStatus[project.status] = (projectsByStatus[project.status] || 0) + 1;
        });

        // Calculate average project value
        const totalBudget = projectsData?.reduce((sum, p) => sum + (parseFloat(p.budget || '0')), 0) || 0;
        const averageProjectValue = uniqueProjects.size > 0 ? totalBudget / uniqueProjects.size : 0;

        // Format project stats
        const projectStats: ProjectStats[] = projectsData?.map(project => ({
          id: project.id,
          title: project.title,
          status: project.status,
          staffCount: project.project_staff?.length || 0,
          commission: staffData
            ?.filter(s => s.project_id === project.id)
            .reduce((sum, s) => {
              return sum + (s.working_dates_with_salary || []).reduce((acc: number, date: any) => {
                return acc + parseFloat(date.commission || '0');
              }, 0);
            }, 0) || 0,
          startDate: new Date(project.start_date),
          endDate: project.end_date ? new Date(project.end_date) : undefined
        })) || [];

        setKpis({
          totalProjects: uniqueProjects.size,
          activeProjects,
          completedProjects,
          totalCandidates: uniqueCandidates.size,
          activeCandidates,
          totalCommission,
          monthlyCommission,
          averageProjectValue,
          projectsByStatus,
          recentActivities: []
        });

        setProjects(projectStats);
      } catch (error) {
        console.error('Error fetching KPIs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }

    fetchKPIs();
  }, [userId, timeRange, toast]);

  // Calculate growth percentages (mock data for now)
  const growthMetrics = useMemo(() => ({
    projects: 12,
    candidates: 8,
    commission: 15,
    completion: 5
  }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-white dark:border-slate-800 shadow-lg">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-bold">
                {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Welcome back, {userName}!
              </h1>
              <p className="text-slate-600 dark:text-slate-400">Here's your performance overview</p>
            </div>
          </div>

          {/* Time Range Selector */}
          <Tabs value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Total Projects</CardTitle>
                <Briefcase className="h-5 w-5 text-blue-100" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpis.totalProjects}</div>
                <div className="flex items-center gap-1 mt-2 text-blue-100 text-xs">
                  <ArrowUp className="h-3 w-3" />
                  <span>+{growthMetrics.projects}% from last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-emerald-100">Total Candidates</CardTitle>
                <Users className="h-5 w-5 text-emerald-100" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpis.totalCandidates}</div>
                <div className="flex items-center gap-1 mt-2 text-emerald-100 text-xs">
                  <ArrowUp className="h-3 w-3" />
                  <span>+{growthMetrics.candidates}% from last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-amber-100">Total Commission</CardTitle>
                <DollarSign className="h-5 w-5 text-amber-100" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">RM {kpis.totalCommission.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-2 text-amber-100 text-xs">
                  <ArrowUp className="h-3 w-3" />
                  <span>+{growthMetrics.commission}% from last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">Active Projects</CardTitle>
                <Activity className="h-5 w-5 text-purple-100" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpis.activeProjects}</div>
                <div className="flex items-center gap-1 mt-2 text-purple-100 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  <span>{kpis.activeCandidates} active candidates</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Monthly Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                RM {kpis.monthlyCommission.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Current month earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Avg. Project Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                RM {kpis.averageProjectValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Per project average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {kpis.totalProjects > 0
                  ? ((kpis.completedProjects / kpis.totalProjects) * 100).toFixed(1)
                  : 0}%
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {kpis.completedProjects} of {kpis.totalProjects} completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Projects Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Projects by Status */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(kpis.projectsByStatus).map(([status, count]) => (
                  <div key={status} className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{count}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 capitalize mt-1">{status}</div>
                  </div>
                ))}
              </div>

              {/* Recent Projects */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Recent Projects</h3>
                <div className="space-y-2">
                  {projects.slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-2 h-2 rounded-full ${
                          project.status === 'active' ? 'bg-green-500' :
                          project.status === 'completed' ? 'bg-blue-500' :
                          'bg-slate-400'
                        }`} />
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 dark:text-white">{project.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {format(project.startDate, 'MMM d, yyyy')}
                            {project.endDate && ` - ${format(project.endDate, 'MMM d, yyyy')}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-500 dark:text-slate-400">Staff</div>
                          <div className="font-semibold text-slate-900 dark:text-white">{project.staffCount}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500 dark:text-slate-400">Commission</div>
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            RM {project.commission.toLocaleString()}
                          </div>
                        </div>
                        <Badge variant={
                          project.status === 'active' ? 'default' :
                          project.status === 'completed' ? 'secondary' :
                          'outline'
                        }>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
