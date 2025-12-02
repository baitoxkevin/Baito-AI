import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Edit2, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { ScheduleEntryDialog } from './ScheduleEntryDialog';
import { ScheduleStaffAssignment } from './ScheduleStaffAssignment';
import { cn } from '@/lib/utils';

interface ProjectSchedule {
  id: string;
  project_id: string;
  start_date: string;
  end_date: string;
  location: string;
  venue_details?: string;
  shift_start_time: string;
  shift_end_time: string;
  call_time?: string;
  daily_rate?: number;
  is_active: boolean;
}

interface DaySchedulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  date: Date;
  onSchedulesUpdated?: () => void;
}

export function DaySchedulesDialog({
  open,
  onOpenChange,
  projectId,
  date,
  onSchedulesUpdated,
}: DaySchedulesDialogProps) {
  const [schedules, setSchedules] = useState<ProjectSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ProjectSchedule | null>(null);
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (open && projectId) {
      loadSchedules();
    }
  }, [open, projectId, date]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('project_schedules')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .lte('start_date', dateStr)
        .gte('end_date', dateStr)
        .order('shift_start_time');

      if (error) throw error;

      setSchedules(data || []);
    } catch (error) {
      logger.error('Error loading schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setScheduleDialogOpen(true);
  };

  const handleEditSchedule = (schedule: ProjectSchedule) => {
    setEditingSchedule(schedule);
    setScheduleDialogOpen(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const { error } = await supabase
        .from('project_schedules')
        .update({ is_active: false })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: 'Schedule Deleted',
        description: 'Schedule has been removed.',
      });

      await loadSchedules();
      onSchedulesUpdated?.();
    } catch (error) {
      logger.error('Error deleting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        variant: 'destructive',
      });
    }
  };

  const handleScheduleSaved = async () => {
    setScheduleDialogOpen(false);
    await loadSchedules();
    onSchedulesUpdated?.();
  };

  const toggleScheduleExpand = (scheduleId: string) => {
    setExpandedSchedules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(scheduleId)) {
        newSet.delete(scheduleId);
      } else {
        newSet.add(scheduleId);
      }
      return newSet;
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold text-xl">
                  Schedules for {format(date, 'EEEE, MMM d, yyyy')}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : schedules.length === 0 ? (
              <Card className="p-8 text-center border-2 border-dashed border-purple-200 dark:border-purple-800">
                <Clock className="h-12 w-12 mx-auto mb-3 text-purple-300 dark:text-purple-700" />
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  No Schedules Yet
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Add your first schedule for this date
                </p>
                <Button
                  onClick={handleAddSchedule}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} for this day
                  </p>
                  <Button
                    onClick={handleAddSchedule}
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another
                  </Button>
                </div>

                <div className="space-y-3">
                  {schedules.map((schedule, index) => {
                    const isExpanded = expandedSchedules.has(schedule.id);

                    return (
                      <Card
                        key={schedule.id}
                        className={cn(
                          "border-l-4 transition-all hover:shadow-md",
                          index === 0
                            ? "border-l-purple-600 bg-purple-50/50 dark:bg-purple-950/20"
                            : "border-l-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/10"
                        )}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-2">
                              {/* Location */}
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                <div>
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {schedule.location}
                                  </span>
                                  {schedule.venue_details && (
                                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                      • {schedule.venue_details}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Timing */}
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {schedule.shift_start_time} - {schedule.shift_end_time}
                                  </span>
                                </div>
                                {schedule.call_time && (
                                  <div className="text-gray-600 dark:text-gray-400">
                                    Call: {schedule.call_time}
                                  </div>
                                )}
                                {schedule.daily_rate && (
                                  <div className="text-gray-600 dark:text-gray-400">
                                    RM {schedule.daily_rate}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleScheduleExpand(schedule.id)}
                                className="h-8 w-8 p-0"
                                title={isExpanded ? "Hide staff" : "Show staff"}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditSchedule(schedule)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Staff Assignment Section - Expandable */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-gray-950/50">
                            <ScheduleStaffAssignment
                              scheduleId={schedule.id}
                              projectId={projectId}
                            />
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ScheduleEntryDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        projectId={projectId}
        date={date}
        existingSchedule={editingSchedule ? {
          id: editingSchedule.id,
          location: editingSchedule.location,
          venue_details: editingSchedule.venue_details,
          shift_start_time: editingSchedule.shift_start_time,
          shift_end_time: editingSchedule.shift_end_time,
          call_time: editingSchedule.call_time,
          daily_rate: editingSchedule.daily_rate,
        } : undefined}
        onScheduleSaved={handleScheduleSaved}
      />
    </>
  );
}
