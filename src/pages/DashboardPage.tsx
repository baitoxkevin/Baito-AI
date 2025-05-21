import { useState, useEffect, useMemo, useRef } from 'react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  ArrowUp, 
  ArrowDown, 
  Star, 
  Trophy, 
  Target, 
  BarChart3, 
  Award, 
  Users, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFixedCalendarCache, useFixedProjects } from '@/hooks/use-fixed-calendar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvatarButton } from '@/components/ui/avatar-button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// KPI Card Component
const KpiCard = ({ 
  title, 
  value, 
  target, 
  trend, 
  trendValue,
  icon: Icon,
  level, 
  color = 'blue',
  description
}) => {
  // Calculate progress percentage
  const progress = useMemo(() => {
    if (!target) return 100;
    const numValue = parseFloat(value.toString().replace(/[^0-9.]/g, ''));
    const numTarget = parseFloat(target.toString().replace(/[^0-9.]/g, ''));
    return Math.min(Math.round((numValue / numTarget) * 100), 100);
  }, [value, target]);

  // Map trend to icons and colors
  const trendMap = {
    up: { icon: ArrowUp, color: 'text-green-500' },
    down: { icon: ArrowDown, color: 'text-red-500' },
    flat: { icon: null, color: 'text-gray-500' }
  };
  
  const TrendIcon = trendMap[trend]?.icon;
  const trendColor = trendMap[trend]?.color;
  
  // Colorful styles based on color prop
  const colorMap = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-500', progress: 'bg-blue-500' },
    green: { bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-200 dark:border-green-800', icon: 'text-green-500', progress: 'bg-green-500' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800', icon: 'text-amber-500', progress: 'bg-amber-500' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-500', progress: 'bg-purple-500' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-950', border: 'border-rose-200 dark:border-rose-800', icon: 'text-rose-500', progress: 'bg-rose-500' },
  };
  
  const styles = colorMap[color] || colorMap.blue;

  return (
    <Card className={cn("border shadow-sm transition-all duration-200 hover:shadow-md", styles.bg, styles.border)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base sm:text-lg font-semibold">{title}</CardTitle>
          {Icon && <Icon className={cn("h-5 w-5", styles.icon)} />}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-3xl font-bold">{value}</div>
          {target && (
            <div className="text-sm text-muted-foreground">
              Target: {target}
            </div>
          )}
        </div>
        
        <Progress value={progress} className="h-2 mt-2" indicatorClassName={styles.progress} />
        
        <div className="mt-4 flex justify-between items-center">
          {trend && TrendIcon ? (
            <div className={cn("flex items-center gap-1", trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{trendValue}</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">{description || ''}</div>
          )}
          
          {level && (
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Level {level}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Achievement Badge Component
const AchievementBadge = ({ title, icon: Icon, unlocked, progress, target, date }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "group relative flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 transition-all duration-200",
            unlocked 
              ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300 shadow-md" 
              : "bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-600 filter grayscale"
          )}>
            {Icon && <Icon className={cn("h-6 w-6 transition-transform", unlocked ? "group-hover:scale-110" : "")} />}
            {!unlocked && progress && target && (
              <div className="absolute -bottom-1 w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 dark:bg-amber-600 rounded-full" 
                  style={{ width: `${Math.min(100, (progress / target) * 100)}%` }}
                />
              </div>
            )}
            {unlocked && date && (
              <div className="absolute -bottom-8 text-xs text-muted-foreground">
                {format(new Date(date), 'MMM d')}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{title}</p>
            {!unlocked && progress && target && (
              <p className="text-xs text-muted-foreground mt-1">Progress: {progress}/{target}</p>
            )}
            {unlocked && date && (
              <p className="text-xs text-muted-foreground mt-1">Unlocked on {format(new Date(date), 'MMM d, yyyy')}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Team Member Progress Component
const TeamMemberProgress = ({ name, value, target, rank, lastWeek, avatar }) => {
  const progress = Math.min(Math.round((value / target) * 100), 100);
  const progressColor = progress < 50 ? 'bg-red-500' : progress < 75 ? 'bg-amber-500' : 'bg-green-500';
  
  // Rank change indicator
  const rankChange = lastWeek - rank;
  
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <AvatarButton 
        avatarUrl={avatar || null}
        name={name}
        size="md"
        className="flex-shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <p className="font-medium truncate">{name}</p>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{value}</span>
            <span className="text-xs text-muted-foreground">/ {target}</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
          <div 
            className={cn("h-2 rounded-full transition-all duration-500", progressColor)}
            style={{ width: `${progress}%` }} 
          />
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Trophy className="h-3 w-3 text-amber-500" />
            <span>Rank #{rank}</span>
          </div>
          
          {rankChange !== 0 && (
            <div className={cn(
              "flex items-center gap-0.5",
              rankChange > 0 ? "text-green-500" : "text-red-500"
            )}>
              {rankChange > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              <span>{Math.abs(rankChange)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function DashboardPage() {
  // Date and view state
  // Use a ref for the date since we're not updating it anyway
  const dateRef = useRef(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get project data from fixed implementations to avoid infinite loops
  const { getMonthData } = useFixedCalendarCache();
  const { projects: fetchedProjects, isLoading } = useFixedProjects();
  
  // Use fallback data if no projects are loaded
  const projects = fetchedProjects.length > 0 ? fetchedProjects : [
    {
      id: "mock-1",
      title: "Demo Project 1",
      status: "Completed",
      priority: "High",
      start_date: new Date().toISOString(),
      end_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      venue_address: "123 Main St",
      working_hours_start: "09:00",
      working_hours_end: "17:00",
      event_type: "conference",
      crew_count: 5,
      filled_positions: 5,
      color: "#93C5FD"
    },
    {
      id: "mock-2",
      title: "Demo Project 2",
      status: "In Progress",
      priority: "Medium",
      start_date: new Date().toISOString(),
      end_date: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
      venue_address: "456 Main St",
      working_hours_start: "10:00",
      working_hours_end: "18:00",
      event_type: "roadshow",
      crew_count: 10,
      filled_positions: 7,
      color: "#FCA5A5"
    },
    {
      id: "mock-3",
      title: "Demo Project 3",
      status: "Planned",
      priority: "Low",
      start_date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
      end_date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
      venue_address: "789 Main St",
      working_hours_start: "08:00",
      working_hours_end: "16:00",
      event_type: "corporate",
      crew_count: 8,
      filled_positions: 3,
      color: "#BBF7D0"
    }
  ];
  
  // Initial KPI dummy data
  const initialKpis = {
    projectCompletion: { value: 86, target: 90, trend: 'up', trendValue: '+3%' },
    onTimeDelivery: { value: 78, target: 85, trend: 'down', trendValue: '-2%' },
    resourceUtilization: { value: 92, target: 90, trend: 'up', trendValue: '+5%' },
    clientSatisfaction: { value: 4.7, target: 4.8, trend: 'flat' },
    revenueTarget: { value: '$24,850', target: '$30,000', trend: 'up', trendValue: '+12%' },
    teamProductivity: { value: 87, target: 80, trend: 'up', trendValue: '+4%' },
  };
  
  // Achievements data
  const [achievements, setAchievements] = useState([
    { id: 1, title: 'First Project', icon: Award, unlocked: true, date: '2025-01-15' },
    { id: 2, title: 'Team Player', icon: Users, unlocked: true, date: '2025-02-02' },
    { id: 3, title: 'Deadline Crusher', icon: Clock, unlocked: true, date: '2025-03-05' },
    { id: 4, title: 'Client Hero', icon: Star, unlocked: false, progress: 8, target: 10 },
    { id: 5, title: 'Revenue Master', icon: CreditCard, unlocked: false, progress: 3, target: 5 },
    { id: 6, title: 'Perfect Week', icon: CheckCircle2, unlocked: false, progress: 4, target: 7 },
  ]);
  
  // Team members data
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Sarah Johnson', value: 95, target: 100, rank: 1, lastWeek: 2 },
    { id: 2, name: 'Michael Chen', value: 88, target: 100, rank: 2, lastWeek: 1 },
    { id: 3, name: 'Emily Rodriguez', value: 82, target: 100, rank: 3, lastWeek: 4 },
    { id: 4, name: 'David Kim', value: 76, target: 100, rank: 4, lastWeek: 3 },
    { id: 5, name: 'Jessica Lee', value: 72, target: 100, rank: 5, lastWeek: 5 },
  ]);
  
  // Weekly targets and progress
  const [weeklyGoals, setWeeklyGoals] = useState([
    { id: 1, title: 'Complete project briefs', target: 5, current: 4, dueDate: '2025-04-25' },
    { id: 2, title: 'Client meetings', target: 8, current: 6, dueDate: '2025-04-25' },
    { id: 3, title: 'Resource allocation', target: 10, current: 10, dueDate: '2025-04-22', completed: true },
    { id: 4, title: 'Team check-ins', target: 4, current: 2, dueDate: '2025-04-25' },
  ]);
  
  // User level and experience
  const [userLevel, setUserLevel] = useState({
    level: 12,
    experience: 750,
    nextLevel: 1000,
    title: 'Project Maestro',
    streakDays: 14
  });
  
  // Initial stats (will be calculated with useMemo)
  
  // Calculate days left in current month for targets
  const daysLeftInMonth = differenceInDays(endOfMonth(new Date()), new Date());
  
  // Project completion rate calculation based on actual projects
  const projectStats = useMemo(() => {
    if (projects && projects.length > 0) {
      // For case insensitive comparison since our mock data might have different casing
      const completed = projects.filter(p => 
        p.status?.toLowerCase() === 'completed' || 
        p.status?.toLowerCase() === 'complete'
      ).length;
      
      const inProgress = projects.filter(p => 
        p.status?.toLowerCase() === 'in progress' || 
        p.status?.toLowerCase() === 'in-progress'
      ).length;
      
      const atRisk = projects.filter(p => 
        p.status?.toLowerCase() === 'at risk' || 
        p.status?.toLowerCase() === 'at-risk' || 
        p.status?.toLowerCase() === 'risk'
      ).length;
      
      const future = projects.filter(p => 
        p.status?.toLowerCase() === 'planned' || 
        p.status?.toLowerCase() === 'new' || 
        p.status?.toLowerCase() === 'pending'
      ).length;
      
      const total = projects.length;
      const completionRate = Math.round((completed / total) * 100);
      
      return {
        completed,
        inProgress,
        atRisk,
        future,
        completionRate
      };
    }
    
    return {
      completed: 0,
      inProgress: 0,
      atRisk: 0,
      future: 0,
      completionRate: 0
    };
  }, [projects]);
  
  // Memoize the KPIs instead of using state and useEffect
  const kpis = useMemo(() => {
    // Only update if completionRate is available and not NaN
    if (projectStats.completionRate !== undefined && !isNaN(projectStats.completionRate)) {
      return {
        ...initialKpis,
        projectCompletion: {
          ...initialKpis.projectCompletion,
          value: projectStats.completionRate
        }
      };
    }
    return initialKpis;
  }, [projectStats.completionRate, initialKpis]);
  
  // Calculate user progress and level up logic
  const userProgress = useMemo(() => {
    return Math.round((userLevel.experience / userLevel.nextLevel) * 100);
  }, [userLevel]);

  // Show a loading indicator while data is loading
  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mb-4"></div>
        <p className="text-gray-500">Loading dashboard data...</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 flex flex-col gap-6 h-full overflow-auto">
      {/* Level Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Welcome to Your KPI Dashboard</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center justify-center bg-white/20 rounded-full w-6 h-6">
                  <Trophy className="h-3.5 w-3.5 text-amber-300" />
                </div>
                <span className="text-sm font-medium">Level {userLevel.level}</span>
              </div>
              <Badge className="bg-white/20 hover:bg-white/30 text-white">{userLevel.title}</Badge>
              <Badge className="bg-amber-300/80 hover:bg-amber-300 text-amber-900">
                <Flame className="h-3.5 w-3.5 mr-1" /> {userLevel.streakDays} Day Streak
              </Badge>
            </div>
          </div>
          
          {/* Level progress */}
          <div className="sm:w-64">
            <div className="flex justify-between items-center text-sm mb-1">
              <span>XP: {userLevel.experience}/{userLevel.nextLevel}</span>
              <span>{userProgress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5">
              <div 
                className="h-2.5 rounded-full bg-amber-300"
                style={{ width: `${userProgress}%` }} 
              />
            </div>
            <div className="mt-1 text-xs text-right">
              {userLevel.nextLevel - userLevel.experience} XP to Level {userLevel.level + 1}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl"></div>
      </div>
      
      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team Leaderboard</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Main Content Area */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* KPI Cards */}
          <KpiCard 
            title="Project Completion" 
            value={`${kpis.projectCompletion.value}%`} 
            target={`${kpis.projectCompletion.target}%`} 
            trend={kpis.projectCompletion.trend} 
            trendValue={kpis.projectCompletion.trendValue}
            icon={Target}
            color="blue"
          />
          
          <KpiCard 
            title="On-time Delivery" 
            value={`${kpis.onTimeDelivery.value}%`} 
            target={`${kpis.onTimeDelivery.target}%`} 
            trend={kpis.onTimeDelivery.trend} 
            trendValue={kpis.onTimeDelivery.trendValue}
            icon={Clock}
            color="amber"
          />
          
          <KpiCard 
            title="Resource Utilization" 
            value={`${kpis.resourceUtilization.value}%`} 
            target={`${kpis.resourceUtilization.target}%`} 
            trend={kpis.resourceUtilization.trend} 
            trendValue={kpis.resourceUtilization.trendValue}
            icon={Users}
            color="green"
          />
          
          <KpiCard 
            title="Client Satisfaction" 
            value={kpis.clientSatisfaction.value} 
            target={kpis.clientSatisfaction.target} 
            trend={kpis.clientSatisfaction.trend} 
            icon={Star}
            color="purple"
            description="Average rating"
          />
          
          <KpiCard 
            title="Revenue Target" 
            value={kpis.revenueTarget.value} 
            target={kpis.revenueTarget.target} 
            trend={kpis.revenueTarget.trend} 
            trendValue={kpis.revenueTarget.trendValue}
            icon={CreditCard}
            color="rose"
          />
          
          <KpiCard 
            title="Team Productivity" 
            value={`${kpis.teamProductivity.value}%`} 
            target={`${kpis.teamProductivity.target}%`} 
            trend={kpis.teamProductivity.trend} 
            trendValue={kpis.teamProductivity.trendValue}
            icon={BarChart3}
            color="blue"
          />
          
          {/* Weekly Goals */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-gray-50 dark:bg-gray-900">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Weekly Goals 
                  <Badge className="ml-2">{daysLeftInMonth} days left</Badge>
                </CardTitle>
                
                <div className="text-sm text-muted-foreground">
                  {weeklyGoals.filter(goal => goal.completed).length}/{weeklyGoals.length} Completed
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {weeklyGoals.map(goal => (
                  <div 
                    key={goal.id}
                    className={cn(
                      "rounded-lg border p-3 transition-all",
                      goal.completed 
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900" 
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{goal.title}</div>
                      {goal.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {differenceInDays(new Date(goal.dueDate), new Date())} days left
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span>Progress</span>
                        <span>{goal.current}/{goal.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={cn(
                            "h-2 rounded-full",
                            goal.completed ? "bg-green-500" : "bg-blue-500"
                          )}
                          style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Project Status Summary */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">Project Status</CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{projectStats.completed}</div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Completed</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{projectStats.inProgress}</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>In Progress</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50">
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{projectStats.atRisk}</div>
                  <div className="text-sm text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" />
                    <span>At Risk</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/50">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{projectStats.future}</div>
                  <div className="text-sm text-purple-700 dark:text-purple-300 mt-1 flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Upcoming</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span>Monthly Goal Progress</span>
                  <span>{projectStats.completed} of {projectStats.completed + projectStats.inProgress + projectStats.atRisk + projectStats.future}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (projectStats.completed / (projectStats.completed + projectStats.inProgress + projectStats.atRisk + projectStats.future)) * 100)}%` }} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Team Leaderboard Preview */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">Team Leaders</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab('team')}
                >View All</Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2 mt-2">
                {teamMembers.slice(0, 3).map(member => (
                  <TeamMemberProgress 
                    key={member.id}
                    name={member.name}
                    value={member.value}
                    target={member.target}
                    rank={member.rank}
                    lastWeek={member.lastWeek}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Team Leaderboard Tab */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Team Performance Leaderboard
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map(member => (
                  <TeamMemberProgress 
                    key={member.id}
                    name={member.name}
                    value={member.value}
                    target={member.target}
                    rank={member.rank}
                    lastWeek={member.lastWeek}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Top Performers
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4">
                  <div className="font-medium">Most Projects Completed</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-300" />
                    </div>
                    <div>
                      <div className="font-medium">{teamMembers[0].name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">12 projects this month</div>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-4">
                  <div className="font-medium">Fastest Delivery Time</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                      <div className="font-medium">{teamMembers[2].name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">2.5 days average</div>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4">
                  <div className="font-medium">Highest Client Satisfaction</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                      <Star className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <div className="font-medium">{teamMembers[1].name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">4.9/5 rating average</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Your Achievements
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 sm:gap-8 mt-2">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="flex flex-col items-center text-center">
                    <AchievementBadge 
                      title={achievement.title}
                      icon={achievement.icon}
                      unlocked={achievement.unlocked}
                      progress={achievement.progress}
                      target={achievement.target}
                      date={achievement.date}
                    />
                    <p className="mt-2 text-sm font-medium">{achievement.title}</p>
                    {!achievement.unlocked && achievement.progress && achievement.target && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.progress}/{achievement.target}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-8 border-t pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Upcoming Achievements
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <div className="font-medium">Project Champion</div>
                        <div className="text-sm text-muted-foreground mt-0.5">Complete 50 projects</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-xs font-medium">28/50</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-indigo-500"
                          style={{ width: '56%' }} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center">
                        <Flame className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <div className="font-medium">On Fire</div>
                        <div className="text-sm text-muted-foreground mt-0.5">30 day streak</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-xs font-medium">{userLevel.streakDays}/30</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-rose-500"
                          style={{ width: `${(userLevel.streakDays / 30) * 100}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}