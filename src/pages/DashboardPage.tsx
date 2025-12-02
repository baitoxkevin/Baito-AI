import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, differenceInDays, isSameDay, addDays, isAfter, isBefore } from 'date-fns';
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
    Clock,
    CheckCircle2,
    XCircle,
    Flame,
    Sparkles,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Cake,
    Plane,
    FileText,
    Activity,
    Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
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
import { useToast } from '@/hooks/use-toast';

// Types
interface Project {
    id: string;
    title: string;
    status: string;
    priority: string;
    start_date: string;
    end_date: string;
    venue_address: string;
    working_hours_start: string;
    working_hours_end: string;
    event_type: string;
    crew_count: number;
    filled_positions: number;
    color: string;
}

interface TodoItem {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    due_date?: string;
    project_id?: string;
    project?: { title: string };
}

interface PersonalKPI {
    projectsCompleted: number;
    projectsInProgress: number;
    tasksCompleted: number;
    tasksTotal: number;
    hoursWorked: number;
    reliabilityScore: number;
}

interface Birthday {
    id: string;
    full_name: string;
    date_of_birth: string;
    daysUntil: number;
}

interface LeaveRequest {
    id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    days_count: number;
    status: string;
}

interface LeaveBalance {
    leave_type: string;
    total_days: number;
    used_days: number;
    remaining_days: number;
}

interface AIAdvice {
    id: string;
    type: 'tip' | 'warning' | 'success';
    title: string;
    message: string;
}

// KPI Card Component
interface KpiCardProps {
    title: string;
    value: string | number;
    target?: string | number;
    trend?: 'up' | 'down' | 'flat';
    trendValue?: string;
    icon?: React.ComponentType<{ className?: string }>;
    color?: 'blue' | 'green' | 'amber' | 'purple' | 'rose';
    description?: string;
}

const KpiCard = ({
    title,
    value,
    target,
    trend,
    trendValue,
    icon: Icon,
    color = 'blue',
    description
}: KpiCardProps) => {
    const progress = useMemo(() => {
        if (!target) return 100;
        const numValue = parseFloat(value.toString().replace(/[^0-9.]/g, ''));
        const numTarget = parseFloat(target.toString().replace(/[^0-9.]/g, ''));
        return Math.min(Math.round((numValue / numTarget) * 100), 100);
    }, [value, target]);

    const trendMap: Record<string, { icon: React.ComponentType<{ className?: string }> | null; color: string }> = {
        up: { icon: ArrowUp, color: 'text-green-500' },
        down: { icon: ArrowDown, color: 'text-red-500' },
        flat: { icon: null, color: 'text-gray-500' }
    };

    const TrendIcon = trend && trendMap[trend]?.icon;
    const trendColor = trend && trendMap[trend]?.color;

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
                    <CardTitle className="text-sm sm:text-base font-semibold">{title}</CardTitle>
                    {Icon && <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", styles.icon)} />}
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="flex items-baseline justify-between mb-2">
                    <div className="text-xl sm:text-2xl font-bold">{value}</div>
                    {target && (
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            / {target}
                        </div>
                    )}
                </div>

                {target && <Progress value={progress} className="h-2 mt-2" indicatorClassName={styles.progress} />}

                <div className="mt-3 flex justify-between items-center">
                    {trend && TrendIcon ? (
                        <div className={cn("flex items-center gap-1", trendColor)}>
                            <TrendIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="text-xs sm:text-sm font-medium">{trendValue}</span>
                        </div>
                    ) : (
                        <div className="text-xs sm:text-sm text-muted-foreground">{description || ''}</div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Main Dashboard Component
export default function DashboardPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // State for data
    const [projects, setProjects] = useState<Project[]>([]);
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [personalKPI, setPersonalKPI] = useState<PersonalKPI>({
        projectsCompleted: 0,
        projectsInProgress: 0,
        tasksCompleted: 0,
        tasksTotal: 0,
        hoursWorked: 0,
        reliabilityScore: 0
    });
    const [birthdays, setBirthdays] = useState<Birthday[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
    const [aiAdvice, setAIAdvice] = useState<AIAdvice[]>([]);

    // NUCLEAR OPTION: Just fetch data on mount, let MainAppLayout handle auth
    useEffect(() => {
        console.log('[DASHBOARD] Fetching data directly - MainAppLayout handles auth');
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Don't call getSession() - it hangs on refresh
            // Supabase client has auth automatically, just fetch data
            // If user not authenticated, RLS will return empty results

            // Get user ID from supabase.auth directly (non-blocking)
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            setCurrentUser(user);

            // Fetch projects
            const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select('*')
                .is('deleted_at', null)
                .order('start_date', { ascending: false })
                .limit(20);

            if (projectsError) throw projectsError;
            setProjects(projectsData || []);

            // Fetch todos (from gig_tasks table)
            const { data: todosData, error: todosError } = await supabase
                .from('gig_tasks')
                .select(`
                    id,
                    title,
                    description,
                    status,
                    priority,
                    due_date,
                    project_id
                `)
                .or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`)
                .order('due_date', { ascending: true })
                .limit(10);

            if (!todosError) {
                setTodos(todosData || []);
            }

            // Calculate personal KPIs
            const completedProjects = (projectsData || []).filter(p =>
                p.status?.toLowerCase() === 'completed'
            ).length;
            const inProgressProjects = (projectsData || []).filter(p =>
                p.status?.toLowerCase() === 'in progress'
            ).length;

            const completedTasks = (todosData || []).filter(t => t.status === 'completed').length;
            const totalTasks = (todosData || []).length;

            // Fetch attendance data for hours worked
            const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('total_hours')
                .eq('candidate_id', user.id)
                .gte('created_at', startOfCurrentMonth);

            const hoursWorked = (attendanceData || []).reduce((sum, record) =>
                sum + (parseFloat(record.total_hours) || 0), 0
            );

            // Fetch performance metrics
            const { data: performanceData } = await supabase
                .from('performance_metrics')
                .select('reliability_score')
                .eq('candidate_id', user.id)
                .maybeSingle();

            setPersonalKPI({
                projectsCompleted: completedProjects,
                projectsInProgress: inProgressProjects,
                tasksCompleted: completedTasks,
                tasksTotal: totalTasks,
                hoursWorked: Math.round(hoursWorked * 10) / 10,
                reliabilityScore: performanceData?.reliability_score || 0
            });

            // Fetch upcoming birthdays (internal staff only)
            const today = new Date();
            const thirtyDaysFromNow = addDays(today, 30);

            const { data: usersWithBirthdays } = await supabase
                .from('users')
                .select('id, full_name, date_of_birth')
                .not('date_of_birth', 'is', null);

            const allBirthdays = (usersWithBirthdays || []).map(person => {
                const birthDate = new Date(person.date_of_birth);
                const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

                // If birthday has passed this year, check next year
                if (isBefore(thisYearBirthday, today)) {
                    thisYearBirthday.setFullYear(today.getFullYear() + 1);
                }

                const daysUntil = differenceInDays(thisYearBirthday, today);

                return {
                    ...person,
                    daysUntil
                };
            }).filter(person => person.daysUntil >= 0 && person.daysUntil <= 30)
              .sort((a, b) => a.daysUntil - b.daysUntil);

            setBirthdays(allBirthdays);

            // Fetch leave requests
            const { data: leaveData } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('start_date', { ascending: false })
                .limit(5);

            setLeaveRequests(leaveData || []);

            // Fetch leave balances
            const currentYear = new Date().getFullYear();
            const { data: balanceData } = await supabase
                .from('leave_balances')
                .select('*')
                .eq('user_id', user.id)
                .eq('year', currentYear);

            setLeaveBalances(balanceData || []);

            // Generate AI advice based on data
            generateAIAdvice(projectsData || [], todosData || [], personalKPI);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load dashboard data',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const generateAIAdvice = (projects: Project[], todos: TodoItem[], kpi: PersonalKPI) => {
        const advice: AIAdvice[] = [];

        // Check for overdue tasks
        const overdueTasks = todos.filter(t =>
            t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
        );
        if (overdueTasks.length > 0) {
            advice.push({
                id: 'overdue-tasks',
                type: 'warning',
                title: 'Overdue Tasks',
                message: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Consider prioritizing them today.`
            });
        }

        // Check for upcoming project deadlines
        const upcomingDeadlines = projects.filter(p => {
            const endDate = new Date(p.end_date);
            const daysUntil = differenceInDays(endDate, new Date());
            return daysUntil > 0 && daysUntil <= 7 && p.status !== 'completed';
        });
        if (upcomingDeadlines.length > 0) {
            advice.push({
                id: 'upcoming-deadlines',
                type: 'warning',
                title: 'Upcoming Deadlines',
                message: `${upcomingDeadlines.length} project${upcomingDeadlines.length > 1 ? 's' : ''} due within 7 days. Stay focused!`
            });
        }

        // Check task completion rate
        const completionRate = kpi.tasksTotal > 0 ? (kpi.tasksCompleted / kpi.tasksTotal) * 100 : 0;
        if (completionRate >= 80) {
            advice.push({
                id: 'high-completion',
                type: 'success',
                title: 'Great Progress!',
                message: `You've completed ${Math.round(completionRate)}% of your tasks. Keep up the excellent work!`
            });
        } else if (completionRate < 50 && kpi.tasksTotal > 0) {
            advice.push({
                id: 'low-completion',
                type: 'tip',
                title: 'Boost Your Productivity',
                message: 'Try breaking down large tasks into smaller, manageable steps to improve completion rate.'
            });
        }

        // Check for projects needing attention
        const atRiskProjects = projects.filter(p => p.status?.toLowerCase() === 'at risk');
        if (atRiskProjects.length > 0) {
            advice.push({
                id: 'at-risk-projects',
                type: 'warning',
                title: 'Projects Need Attention',
                message: `${atRiskProjects.length} project${atRiskProjects.length > 1 ? 's are' : ' is'} at risk. Review and take action.`
            });
        }

        setAIAdvice(advice);
    };

    // Calculate project statistics
    const projectStats = useMemo(() => {
        const completed = projects.filter(p => p.status?.toLowerCase() === 'completed').length;
        const inProgress = projects.filter(p => p.status?.toLowerCase() === 'in progress').length;
        const atRisk = projects.filter(p => p.status?.toLowerCase() === 'at risk').length;
        const planned = projects.filter(p =>
            p.status?.toLowerCase() === 'planned' || p.status?.toLowerCase() === 'new'
        ).length;

        return { completed, inProgress, atRisk, planned };
    }, [projects]);

    if (loading) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mb-4"></div>
                <p className="text-gray-500">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6 h-full overflow-auto p-4 sm:p-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg p-6">
                <div className="relative z-10">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {currentUser?.full_name || 'User'}!</h1>
                    <p className="text-sm sm:text-base opacity-90">Here's your dashboard overview for {format(new Date(), 'MMMM d, yyyy')}</p>
                </div>
                <div className="absolute top-0 right-0 w-60 h-60 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-xl"></div>
            </div>

            {/* AI Advice Section */}
            {aiAdvice.length > 0 && (
                <div className="grid gap-3">
                    {aiAdvice.map(advice => (
                        <Card key={advice.id} className={cn(
                            "border-l-4",
                            advice.type === 'warning' ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-950' :
                            advice.type === 'success' ? 'border-l-green-500 bg-green-50 dark:bg-green-950' :
                            'border-l-blue-500 bg-blue-50 dark:bg-blue-950'
                        )}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <Lightbulb className={cn(
                                        "h-5 w-5",
                                        advice.type === 'warning' ? 'text-amber-600' :
                                        advice.type === 'success' ? 'text-green-600' :
                                        'text-blue-600'
                                    )} />
                                    <CardTitle className="text-base">{advice.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{advice.message}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="todos">To-Dos</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid gap-4">
                    {/* Personal KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <KpiCard
                            title="Completed"
                            value={personalKPI.projectsCompleted}
                            icon={CheckCircle2}
                            color="green"
                            description="Projects done"
                        />
                        <KpiCard
                            title="In Progress"
                            value={personalKPI.projectsInProgress}
                            icon={Activity}
                            color="blue"
                            description="Active projects"
                        />
                        <KpiCard
                            title="Tasks"
                            value={personalKPI.tasksCompleted}
                            target={personalKPI.tasksTotal}
                            icon={FileText}
                            color="purple"
                        />
                        <KpiCard
                            title="Hours"
                            value={personalKPI.hoursWorked}
                            icon={Clock}
                            color="amber"
                            description="This month"
                        />
                        <KpiCard
                            title="Reliability"
                            value={`${Math.round(personalKPI.reliabilityScore * 10) / 10}%`}
                            icon={Star}
                            color="rose"
                            description="Score"
                        />
                        <KpiCard
                            title="Leave Days"
                            value={leaveBalances.reduce((sum, b) => sum + b.remaining_days, 0)}
                            icon={Plane}
                            color="blue"
                            description="Available"
                        />
                    </div>

                    {/* Projects, Birthdays, and Leave in a grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Project Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <BarChart3 className="h-5 w-5" />
                                    Project Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span className="text-sm">Completed</span>
                                        </div>
                                        <span className="font-semibold">{projectStats.completed}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm">In Progress</span>
                                        </div>
                                        <span className="font-semibold">{projectStats.inProgress}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                            <span className="text-sm">At Risk</span>
                                        </div>
                                        <span className="font-semibold">{projectStats.atRisk}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-purple-500" />
                                            <span className="text-sm">Planned</span>
                                        </div>
                                        <span className="font-semibold">{projectStats.planned}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Upcoming Birthdays */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Cake className="h-5 w-5 text-pink-500" />
                                    Upcoming Birthdays
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {birthdays.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No birthdays in the next 30 days</p>
                                ) : (
                                    <div className="space-y-2">
                                        {birthdays.slice(0, 4).map(birthday => (
                                            <div key={birthday.id} className="flex justify-between items-center text-sm">
                                                <span className="truncate">{birthday.full_name}</span>
                                                <Badge variant="outline" className="ml-2">
                                                    {birthday.daysUntil === 0 ? 'Today!' :
                                                     birthday.daysUntil === 1 ? 'Tomorrow' :
                                                     `${birthday.daysUntil}d`}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Leave Management */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Plane className="h-5 w-5 text-blue-500" />
                                    Leave Balance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {leaveBalances.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No leave balance data</p>
                                ) : (
                                    <div className="space-y-3">
                                        {leaveBalances.map((balance, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm capitalize">{balance.leave_type}</span>
                                                    <span className="text-sm font-semibold">
                                                        {balance.remaining_days} / {balance.total_days}
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={(balance.remaining_days / balance.total_days) * 100}
                                                    className="h-2"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-3"
                                    onClick={() => toast({ title: 'Leave Request', description: 'Leave request form coming soon!' })}
                                >
                                    Apply for Leave
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
                <div className="grid gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Projects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {projects.slice(0, 10).map(project => (
                                    <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium">{project.title}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {format(new Date(project.start_date), 'MMM d')} - {format(new Date(project.end_date), 'MMM d, yyyy')}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={
                                                project.status?.toLowerCase() === 'completed' ? 'bg-green-500' :
                                                project.status?.toLowerCase() === 'in progress' ? 'bg-blue-500' :
                                                project.status?.toLowerCase() === 'at risk' ? 'bg-amber-500' :
                                                'bg-purple-500'
                                            }>
                                                {project.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* To-Dos Tab */}
            {activeTab === 'todos' && (
                <div className="grid gap-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>My To-Dos</CardTitle>
                                <Badge>{todos.filter(t => t.status !== 'completed').length} pending</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {todos.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No tasks assigned</p>
                            ) : (
                                <div className="space-y-3">
                                    {todos.map(todo => (
                                        <div key={todo.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                            <div className={cn(
                                                "w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0",
                                                todo.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                            )}>
                                                {todo.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={cn(
                                                    "font-medium",
                                                    todo.status === 'completed' && 'line-through text-muted-foreground'
                                                )}>
                                                    {todo.title}
                                                </div>
                                                {todo.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">{todo.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    {todo.priority && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {todo.priority}
                                                        </Badge>
                                                    )}
                                                    {todo.due_date && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Due: {format(new Date(todo.due_date), 'MMM d')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
                <div className="grid gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Birthdays (Next 30 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {birthdays.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No upcoming birthdays</p>
                            ) : (
                                <div className="space-y-3">
                                    {birthdays.map(birthday => (
                                        <div key={birthday.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                                                    <Cake className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{birthday.full_name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {format(new Date(birthday.date_of_birth), 'MMMM d')}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className={birthday.daysUntil === 0 ? 'bg-pink-500' : 'bg-gray-500'}>
                                                {birthday.daysUntil === 0 ? 'Today!' :
                                                 birthday.daysUntil === 1 ? 'Tomorrow' :
                                                 `In ${birthday.daysUntil} days`}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Leave Requests */}
                    <Card>
                        <CardHeader>
                            <CardTitle>My Leave Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {leaveRequests.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No leave requests</p>
                            ) : (
                                <div className="space-y-3">
                                    {leaveRequests.map(request => (
                                        <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <div className="font-medium capitalize">{request.leave_type} Leave</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                                                    <span className="ml-2">({request.days_count} days)</span>
                                                </div>
                                            </div>
                                            <Badge className={
                                                request.status === 'approved' ? 'bg-green-500' :
                                                request.status === 'rejected' ? 'bg-red-500' :
                                                request.status === 'cancelled' ? 'bg-gray-500' :
                                                'bg-amber-500'
                                            }>
                                                {request.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
