import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
  Users, 
  Calendar, 
  MapPin, 
  BarChart,
  Tag,
  Clock,
  Activity,
  ChevronRight,
  ChevronDown,
  Mouse,
  Keyboard,
  Eye,
  Upload,
  Download,
  Edit,
  Trash2,
  Navigation,
  MousePointer,
  Expand,
  Minimize
} from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { activityLogger, ActivityLog, logUtils } from '@/lib/activity-logger';

// Mock data
const mockChanges = [
  {
    id: '1',
    field_name: 'venue_address',
    old_value: '123 Main St, New York',
    new_value: '456 Broadway, New York',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    display_name: 'Venue',
    changed_by: 'John Doe'
  },
  {
    id: '2',
    field_name: 'start_date',
    old_value: '2025-06-15',
    new_value: '2025-06-20',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    display_name: 'Start Date',
    changed_by: 'John Doe'
  },
  {
    id: '3', 
    field_name: 'crew_count',
    old_value: '15',
    new_value: '20',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    display_name: 'Crew Size',
    changed_by: 'Sarah Miller'
  },
  {
    id: '4',
    field_name: 'status',
    old_value: 'Planning',
    new_value: 'In Progress',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    display_name: 'Project Status',
    changed_by: 'Tom Wilson'
  },
  {
    id: '5',
    field_name: 'title',
    old_value: 'Summer Event',
    new_value: 'Summer Festival 2025',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    display_name: 'Project Title',
    changed_by: 'John Doe'
  }
];

// Icon mapping for different activity types and actions
const activityTypeIcons = {
  navigation: Navigation,
  interaction: MousePointer,
  data_change: Edit,
  view: Eye,
  action: Activity
};

const actionIcons = {
  // Navigation actions
  tab_change: Navigation,
  navigate: Navigation,
  
  // Interaction actions
  expand: Expand,
  minimize: Minimize,
  spotlight_card_expand: Expand,
  spotlight_card_minimize: Minimize,
  arrow_left: Keyboard,
  arrow_right: Keyboard,
  previous_tab: ChevronRight,
  next_tab: ChevronRight,
  
  // View actions
  view: Eye,
  spotlight_card: Eye,
  
  // Document actions
  open_upload_dialog: Upload,
  delete_document: Trash2,
  upload: Upload,
  
  // Expense actions
  open_expense_form: FileText,
  create_expense_claim: FileText,
  view_claim_details: Eye,
  
  // Data changes
  data_change: Edit,
  
  // Fallback
  default: Activity
};

// Group activity logs by date
const groupActivitiesByDate = (activities: ActivityLog[]) => {
  const grouped: Record<string, ActivityLog[]> = {};
  
  activities.forEach(activity => {
    const dateStr = activity.timestamp.split('T')[0];
    if (!grouped[dateStr]) {
      grouped[dateStr] = [];
    }
    grouped[dateStr].push(activity);
  });
  
  return Object.entries(grouped)
    .map(([date, activities]) => ({ date, activities }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Helper function to get appropriate icon for activity
const getActivityIcon = (activity: ActivityLog) => {
  const actionKey = activity.action.toLowerCase().replace(/\s+/g, '_');
  return actionIcons[actionKey] || activityTypeIcons[activity.activity_type] || actionIcons.default;
};

// Helper function to format activity description
const formatActivityDescription = (activity: ActivityLog) => {
  const details = activity.details || {};
  
  switch (activity.action) {
    // Document actions
    case 'upload_document':
      if (details.is_external_link) {
        return `Added Google Drive link: ${details.document_name}`;
      }
      return `Uploaded document: ${details.document_name}`;
    
    case 'delete_document':
      return `Deleted document: ${details.document_name}`;
    
    // Expense actions
    case 'create_expense_claim':
      return `Created expense claim: ${details.claim_title} ($${details.claim_amount})`;
    
    case 'delete_expense_claim':
      return `Deleted expense claim: ${details.claim_title} ($${details.claim_amount})`;
    
    case 'approve_expense_claim':
      return `Approved expense claim: ${details.claim_title}`;
    
    case 'reject_expense_claim':
      return `Rejected expense claim: ${details.claim_title}`;
    
    // Data changes
    case 'data_change':
      return `Changed ${details.field}: ${details.old_value} → ${details.new_value}`;
    
    // Staff actions
    case 'add_staff':
      return `Added staff member: ${details.staff_name} (${details.staff_position})`;
    
    case 'remove_staff':
      return `Removed staff member: ${details.staff_name} (${details.staff_position})`;
    
    case 'update_staff_schedule':
      return `Updated schedule for: ${details.staff_name}`;
    
    // Payroll actions
    case 'submit_payment':
      if (details.success) {
        return `Submitted payment for ${details.staff_count || 1} staff ($${details.total_amount})`;
      }
      return `Failed to submit payment for ${details.staff_count || 1} staff`;
    
    case 'export_payment_data':
      return `Exported ${details.export_type?.toUpperCase()} payment data ($${details.total_amount})`;
    
    case 'approve_payment':
      return `Approved payment: $${details.amount}`;
    
    // Default fallback
    default:
      return activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

// Helper function to get activity type color
const getActivityTypeColor = (activityType: string) => {
  const colors = {
    navigation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    interaction: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    data_change: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    view: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    action: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  };
  return colors[activityType] || colors.action;
};

export function CompactHistory({ projectId }: { projectId: string }) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [expandedChanges, setExpandedChanges] = useState<string[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch activity logs for the project
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const logs = await activityLogger.getProjectLogs(projectId, 200);
        
        // Filter to show data changes and actions only, excluding navigation events
        const relevantLogs = logs.filter(log => 
          (log.activity_type === 'data_change' || log.activity_type === 'action') &&
          !log.action.includes('project_focused') &&
          !log.action.includes('spotlight_card_opened') &&
          !log.action.includes('navigation')
        );
        
        setActivities(relevantLogs);
        setError(null);
      } catch (err) {
        console.error('Error fetching activity logs:', err);
        setError('Database unavailable - showing local activity only');
        // Try to get localStorage data as final fallback
        try {
          const localLogs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
          const projectLogs = localLogs
            .filter((log: ActivityLog) => log.project_id === projectId)
            .filter((log: ActivityLog) => 
              (log.activity_type === 'data_change' || log.activity_type === 'action') &&
              !log.action.includes('project_focused') &&
              !log.action.includes('spotlight_card_opened') &&
              !log.action.includes('navigation')
            )
            .sort((a: ActivityLog, b: ActivityLog) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
            .slice(0, 200);
          
          setActivities(projectLogs);
          if (projectLogs.length > 0) {
            setError(null);
          }
        } catch (localError) {
          setActivities([]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchActivities();
    }
  }, [projectId]);
  
  const activityGroups = useMemo(() => groupActivitiesByDate(activities), [activities]);

  // Set first group as expanded by default
  useEffect(() => {
    if (activityGroups.length > 0 && expandedGroups.length === 0) {
      setExpandedGroups([activityGroups[0].date]);
      // Also expand first activity in the first group
      if (activityGroups[0].activities.length > 0 && expandedChanges.length === 0) {
        setExpandedChanges([activityGroups[0].activities[0].id]);
      }
    }
  }, [activityGroups, expandedGroups.length, expandedChanges.length]);
  
  const toggleGroupExpand = (date: string) => {
    setExpandedGroups(current => 
      current.includes(date) 
        ? current.filter(d => d !== date)
        : [...current, date]
    );
  };
  
  const toggleChangeExpand = (id: string) => {
    setExpandedChanges(current => 
      current.includes(id) 
        ? current.filter(cid => cid !== id)
        : [...current, id]
    );
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-white dark:bg-gray-950 rounded-lg flex flex-col">
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-base font-medium text-gray-900 dark:text-white">Change History</h3>
          <Badge variant="outline" className="text-xs">Loading...</Badge>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading activity history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full bg-white dark:bg-gray-950 rounded-lg flex flex-col">
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-base font-medium text-gray-900 dark:text-white">Change History</h3>
          <Badge variant="outline" className="text-xs text-red-600">Error</Badge>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 dark:text-red-400 text-sm text-center">
            {error}
            <br />
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-blue-500 hover:underline"
            >
              Try refreshing the page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="h-full w-full bg-white dark:bg-gray-950 rounded-lg flex flex-col">
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-base font-medium text-gray-900 dark:text-white">Change History</h3>
          <Badge variant="outline" className="text-xs">0 changes</Badge>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400 text-center">
            No changes recorded yet.
            <br />
            <span className="text-sm">Project changes will appear here as you modify data and perform actions.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white dark:bg-gray-950 rounded-lg flex flex-col">
      <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h3 className="text-base font-medium text-gray-900 dark:text-white">Change History</h3>
        <Badge variant="outline" className="text-xs">
          {activities.length} changes
        </Badge>
      </div>
      
      <ScrollArea className="flex-grow w-full">
        <div className="p-0 w-full h-full">
          {activityGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.date);
            
            return (
              <div key={group.date} className="border-b border-gray-100 dark:border-gray-900 w-full">
                <button
                  className="w-full flex items-center justify-between p-3 text-sm font-medium text-left hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => toggleGroupExpand(group.date)}
                >
                  <div className="flex items-center">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
                    )}
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    <span>{format(new Date(group.date), 'MMMM d, yyyy')}</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    {group.activities.length}
                  </Badge>
                </button>
                
                {isExpanded && (
                  <div className="pl-9 pr-3 pb-2">
                    <div className="space-y-1">
                      {group.activities.map((activity) => {
                        const Icon = getActivityIcon(activity);
                        const isActivityExpanded = expandedChanges.includes(activity.id);
                        
                        return (
                          <div key={activity.id} className="rounded-md overflow-hidden">
                            <button
                              className="w-full flex items-center justify-between py-1.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-900 focus:outline-none"
                              onClick={() => toggleChangeExpand(activity.id)}
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <Icon className="h-3.5 w-3.5 mr-2 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                                <span className="font-medium truncate">{formatActivityDescription(activity)}</span>
                              </div>
                              <div className="flex items-center text-xs text-gray-500 ml-2 flex-shrink-0">
                                <Badge className={cn("text-xs mr-2", getActivityTypeColor(activity.activity_type))}>
                                  {activity.activity_type}
                                </Badge>
                                <span>{format(new Date(activity.timestamp), 'h:mm a')}</span>
                                {isActivityExpanded ? (
                                  <ChevronDown className="h-3 w-3 ml-1" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                )}
                              </div>
                            </button>
                            
                            {isActivityExpanded && (
                              <div className="bg-gray-50 dark:bg-gray-900 py-2 px-3 text-xs space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-gray-500">Action:</span>
                                    <span className="ml-2 font-medium">{activity.action}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Type:</span>
                                    <span className="ml-2 font-medium">{activity.activity_type}</span>
                                  </div>
                                </div>
                                
                                {activity.details && Object.keys(activity.details).length > 0 && (
                                  <div>
                                    <span className="text-gray-500">Details:</span>
                                    <div className="mt-1 bg-white dark:bg-gray-800 rounded p-2 text-xs">
                                      {Object.entries(activity.details)
                                        .filter(([key]) => !['session_id', 'url', 'user_agent', 'viewport', 'timestamp_client'].includes(key))
                                        .map(([key, value]) => (
                                          <div key={key} className="flex justify-between py-0.5">
                                            <span className="text-gray-500">{key.replace(/_/g, ' ')}:</span>
                                            <span className="font-medium text-right ml-2 break-all">
                                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                                
                                <Separator className="my-2" />
                                <div className="flex justify-between text-gray-500">
                                  <span>By: {activity.user_name || 'Unknown User'}</span>
                                  <span>{format(new Date(activity.timestamp), 'h:mm:ss a')}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}