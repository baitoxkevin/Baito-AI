import React, { useState } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

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

// Icon mapping for different change types
const changeTypeIcons = {
  venue_address: MapPin,
  start_date: Calendar,
  end_date: Calendar,
  crew_count: Users,
  status: BarChart,
  title: FileText,
  priority: Tag,
  working_hours_start: Clock,
  working_hours_end: Clock,
  supervisors_required: Users
};

// Group changes by date
const groupChangesByDate = (changes) => {
  const grouped = {};
  
  changes.forEach(change => {
    const dateStr = change.created_at.split('T')[0];
    if (!grouped[dateStr]) {
      grouped[dateStr] = [];
    }
    grouped[dateStr].push(change);
  });
  
  return Object.entries(grouped)
    .map(([date, changes]) => ({ date, changes }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export function CompactHistory({ projectId }: { projectId: string }) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [expandedChanges, setExpandedChanges] = useState<string[]>([]);
  
  const changeGroups = groupChangesByDate(mockChanges);

  // Set first group as expanded by default
  React.useEffect(() => {
    if (changeGroups.length > 0) {
      setExpandedGroups([changeGroups[0].date]);
      // Also expand first change in the first group
      if (changeGroups[0].changes.length > 0) {
        setExpandedChanges([changeGroups[0].changes[0].id]);
      }
    }
  }, []);
  
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

  return (
    <div className="h-full w-full bg-white dark:bg-gray-950 rounded-lg flex flex-col">
      <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h3 className="text-base font-medium text-gray-900 dark:text-white">Change History</h3>
        <Badge variant="outline" className="text-xs">
          {mockChanges.length} changes
        </Badge>
      </div>
      
      <ScrollArea className="flex-grow w-full">
        <div className="p-0 w-full h-full">
          {changeGroups.map((group) => {
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
                    {group.changes.length}
                  </Badge>
                </button>
                
                {isExpanded && (
                  <div className="pl-9 pr-3 pb-2">
                    <div className="space-y-1">
                      {group.changes.map((change) => {
                        const Icon = changeTypeIcons[change.field_name] || Activity;
                        const isChangeExpanded = expandedChanges.includes(change.id);
                        
                        return (
                          <div key={change.id} className="rounded-md overflow-hidden">
                            <button
                              className="w-full flex items-center justify-between py-1.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-900 focus:outline-none"
                              onClick={() => toggleChangeExpand(change.id)}
                            >
                              <div className="flex items-center">
                                <Icon className="h-3.5 w-3.5 mr-2 text-gray-600 dark:text-gray-400" />
                                <span className="font-medium">{change.display_name}</span>
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                                <span>{format(new Date(change.created_at), 'h:mm a')}</span>
                                {isChangeExpanded ? (
                                  <ChevronDown className="h-3 w-3 ml-1" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                )}
                              </div>
                            </button>
                            
                            {isChangeExpanded && (
                              <div className="bg-gray-50 dark:bg-gray-900 py-2 px-3 text-xs">
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-500">Before:</span>
                                  <span className="text-gray-800 dark:text-gray-200">{change.old_value || '(empty)'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">After:</span>
                                  <span className="font-medium">{change.new_value || '(empty)'}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between text-gray-500">
                                  <span>Changed by: {change.changed_by}</span>
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