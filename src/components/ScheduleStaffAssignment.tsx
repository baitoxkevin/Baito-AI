import { useState, useEffect } from 'react';
import { Users, Plus, X, Loader2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface StaffMember {
  id: string;
  name: string;
  designation?: string;
  photo?: string;
  candidate_id?: string;
}

interface AssignedStaff extends StaffMember {
  assignment_id: string;
  status: string;
  daily_rate?: number;
}

interface ScheduleStaffAssignmentProps {
  scheduleId: string;
  projectId: string;
  compact?: boolean;
}

export function ScheduleStaffAssignment({
  scheduleId,
  projectId,
  compact = false,
}: ScheduleStaffAssignmentProps) {
  const [assignedStaff, setAssignedStaff] = useState<AssignedStaff[]>([]);
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAssignedStaff();
    loadAvailableStaff();
  }, [scheduleId, projectId]);

  const loadAssignedStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('schedule_staff_assignments')
        .select(`
          id,
          status,
          daily_rate,
          project_staff!inner (
            id,
            name,
            designation,
            photo,
            candidate_id
          )
        `)
        .eq('schedule_id', scheduleId);

      if (error) throw error;

      const formattedStaff = data?.map((assignment: any) => ({
        id: assignment.project_staff.id,
        name: assignment.project_staff.name,
        designation: assignment.project_staff.designation,
        photo: assignment.project_staff.photo,
        candidate_id: assignment.project_staff.candidate_id,
        assignment_id: assignment.id,
        status: assignment.status,
        daily_rate: assignment.daily_rate,
      })) || [];

      setAssignedStaff(formattedStaff);
    } catch (error) {
      logger.error('Error loading assigned staff:', error);
    }
  };

  const loadAvailableStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('project_staff')
        .select('id, name, designation, photo, candidate_id')
        .eq('project_id', projectId)
        .order('name');

      if (error) throw error;

      setAvailableStaff(data || []);
    } catch (error) {
      logger.error('Error loading available staff:', error);
    }
  };

  const handleAssignStaff = async (staffId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('schedule_staff_assignments')
        .insert({
          schedule_id: scheduleId,
          staff_id: staffId,
          status: 'confirmed',
        });

      if (error) throw error;

      toast({
        title: 'Staff Assigned',
        description: 'Staff member has been assigned to this schedule.',
      });

      await loadAssignedStaff();
      setPopoverOpen(false);
    } catch (error) {
      logger.error('Error assigning staff:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign staff',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignStaff = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('schedule_staff_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: 'Staff Unassigned',
        description: 'Staff member has been removed from this schedule.',
      });

      await loadAssignedStaff();
    } catch (error) {
      logger.error('Error unassigning staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to unassign staff',
        variant: 'destructive',
      });
    }
  };

  // Filter out already assigned staff
  const unassignedStaff = availableStaff.filter(
    (staff) => !assignedStaff.some((assigned) => assigned.id === staff.id)
  );

  if (compact) {
    // Compact view for calendar or list views
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {assignedStaff.slice(0, 3).map((staff) => (
            <Avatar
              key={staff.id}
              className="h-6 w-6 border-2 border-white dark:border-gray-800"
            >
              <AvatarImage src={staff.photo} alt={staff.name} />
              <AvatarFallback className="text-[8px] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {staff.name.split(' ').map((n) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        {assignedStaff.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{assignedStaff.length - 3}
          </Badge>
        )}
        {assignedStaff.length === 0 && (
          <span className="text-xs text-gray-500">No staff assigned</span>
        )}
      </div>
    );
  }

  // Full view for detail dialogs
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Assigned Staff ({assignedStaff.length})
          </h4>
        </div>

        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
            >
              <Plus className="h-3 w-3 mr-1" />
              Assign Staff
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command>
              <CommandInput placeholder="Search staff..." />
              <CommandEmpty>
                {unassignedStaff.length === 0
                  ? 'All staff assigned or no staff available'
                  : 'No staff found'}
              </CommandEmpty>
              <CommandGroup className="max-h-64 overflow-y-auto">
                {unassignedStaff.map((staff) => (
                  <CommandItem
                    key={staff.id}
                    onSelect={() => handleAssignStaff(staff.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={staff.photo} alt={staff.name} />
                        <AvatarFallback className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {staff.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{staff.name}</div>
                        {staff.designation && (
                          <div className="text-xs text-gray-500">
                            {staff.designation}
                          </div>
                        )}
                      </div>
                      <UserCheck className="h-4 w-4 text-purple-600" />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {assignedStaff.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
          <Users className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No staff assigned to this schedule
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignedStaff.map((staff) => (
            <div
              key={staff.assignment_id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
            >
              <Avatar className="h-10 w-10 border border-purple-200 dark:border-purple-800">
                <AvatarImage src={staff.photo} alt={staff.name} />
                <AvatarFallback className="text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {staff.name.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {staff.name}
                </div>
                {staff.designation && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {staff.designation}
                  </div>
                )}
              </div>

              {staff.daily_rate && (
                <Badge variant="secondary" className="text-xs">
                  RM {staff.daily_rate}
                </Badge>
              )}

              <Badge
                variant={staff.status === 'confirmed' ? 'default' : 'secondary'}
                className={cn(
                  'text-xs',
                  staff.status === 'confirmed' &&
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                )}
              >
                {staff.status}
              </Badge>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleUnassignStaff(staff.assignment_id)}
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
