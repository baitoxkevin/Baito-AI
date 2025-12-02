import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays } from 'date-fns';
import { Clock, MapPin, Loader2, Sunrise, Sun, Moon, Copy, Coffee, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const scheduleEntrySchema = z.object({
  location: z.string().min(1, 'Location is required'),
  venue_details: z.string().optional(),
  shift_start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  shift_end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  call_time: z.string().optional(),
  daily_rate: z.number().min(0).optional(),
  break_start_time: z.string().optional(),
  break_end_time: z.string().optional(),
  overtime_rate: z.number().min(0).optional(),
  transport_allowance: z.number().min(0).optional(),
  meal_allowance: z.number().min(0).optional(),
});

type ScheduleEntryFormValues = z.infer<typeof scheduleEntrySchema>;

// Schedule Templates
const SCHEDULE_TEMPLATES = [
  {
    id: 'morning',
    name: 'Morning Shift',
    icon: Sunrise,
    color: 'from-amber-500 to-orange-500',
    call_time: '08:30',
    shift_start_time: '09:00',
    shift_end_time: '17:00',
    break_start_time: '12:00',
    break_end_time: '13:00',
  },
  {
    id: 'evening',
    name: 'Evening Shift',
    icon: Sun,
    color: 'from-orange-500 to-red-500',
    call_time: '16:30',
    shift_start_time: '17:00',
    shift_end_time: '01:00',
    break_start_time: '21:00',
    break_end_time: '22:00',
  },
  {
    id: 'night',
    name: 'Night Shift',
    icon: Moon,
    color: 'from-indigo-500 to-purple-600',
    call_time: '21:30',
    shift_start_time: '22:00',
    shift_end_time: '06:00',
    break_start_time: '02:00',
    break_end_time: '03:00',
  },
  {
    id: 'fullday',
    name: 'Full Day',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    call_time: '07:30',
    shift_start_time: '08:00',
    shift_end_time: '20:00',
    break_start_time: '12:00',
    break_end_time: '13:00',
  },
];

interface ScheduleEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  date: Date;
  existingSchedule?: {
    id: string;
    location: string;
    venue_details?: string;
    shift_start_time: string;
    shift_end_time: string;
    call_time?: string;
    daily_rate?: number;
  };
  onScheduleSaved?: () => void;
}

export function ScheduleEntryDialog({
  open,
  onOpenChange,
  projectId,
  date,
  existingSchedule,
  onScheduleSaved,
}: ScheduleEntryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBreakTime, setShowBreakTime] = useState(false);
  const [copyToMultipleDates, setCopyToMultipleDates] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(1);
  const { toast } = useToast();

  const form = useForm<ScheduleEntryFormValues>({
    resolver: zodResolver(scheduleEntrySchema),
    defaultValues: {
      location: existingSchedule?.location || '',
      venue_details: existingSchedule?.venue_details || '',
      shift_start_time: existingSchedule?.shift_start_time || '09:00',
      shift_end_time: existingSchedule?.shift_end_time || '17:00',
      call_time: existingSchedule?.call_time || '',
      daily_rate: existingSchedule?.daily_rate || 150,
      break_start_time: '',
      break_end_time: '',
      overtime_rate: 1.5,
      transport_allowance: 0,
      meal_allowance: 0,
    },
  });

  // Reset form when dialog opens or existingSchedule changes
  useEffect(() => {
    if (open) {
      form.reset({
        location: existingSchedule?.location || '',
        venue_details: existingSchedule?.venue_details || '',
        shift_start_time: existingSchedule?.shift_start_time || '09:00',
        shift_end_time: existingSchedule?.shift_end_time || '17:00',
        call_time: existingSchedule?.call_time || '',
        daily_rate: existingSchedule?.daily_rate || 150,
        break_start_time: '',
        break_end_time: '',
        overtime_rate: 1.5,
        transport_allowance: 0,
        meal_allowance: 0,
      });
      setShowAdvanced(false);
      setShowBreakTime(false);
      setCopyToMultipleDates(false);
      setNumberOfDays(1);
    }
  }, [open, existingSchedule, form]);

  // Apply schedule template
  const applyTemplate = (template: typeof SCHEDULE_TEMPLATES[0]) => {
    form.setValue('call_time', template.call_time);
    form.setValue('shift_start_time', template.shift_start_time);
    form.setValue('shift_end_time', template.shift_end_time);
    if (template.break_start_time && template.break_end_time) {
      form.setValue('break_start_time', template.break_start_time);
      form.setValue('break_end_time', template.break_end_time);
      setShowBreakTime(true);
    }
    toast({
      title: 'Template Applied',
      description: `${template.name} times have been set.`,
    });
  };

  const onSubmit = async (values: ScheduleEntryFormValues) => {
    setIsSubmitting(true);
    try {
      const baseScheduleData = {
        project_id: projectId,
        location: values.location,
        venue_details: values.venue_details,
        shift_start_time: values.shift_start_time,
        shift_end_time: values.shift_end_time,
        call_time: values.call_time || null,
        daily_rate: values.daily_rate || null,
        break_start_time: showBreakTime ? values.break_start_time || null : null,
        break_end_time: showBreakTime ? values.break_end_time || null : null,
        overtime_rate: showAdvanced ? values.overtime_rate || null : null,
        transport_allowance: showAdvanced ? values.transport_allowance || null : null,
        meal_allowance: showAdvanced ? values.meal_allowance || null : null,
        is_active: true,
      };

      if (existingSchedule?.id) {
        // Update existing schedule
        const scheduleData = {
          ...baseScheduleData,
          start_date: format(date, 'yyyy-MM-dd'),
          end_date: format(date, 'yyyy-MM-dd'),
        };

        const { error } = await supabase
          .from('project_schedules')
          .update(scheduleData)
          .eq('id', existingSchedule.id);

        if (error) throw error;

        toast({
          title: 'Schedule Updated',
          description: `Schedule for ${format(date, 'MMM d, yyyy')} has been updated.`,
        });
      } else {
        // Create new schedule(s)
        const schedulesToCreate = [];

        if (copyToMultipleDates && numberOfDays > 1) {
          // Create schedules for multiple consecutive dates
          for (let i = 0; i < numberOfDays; i++) {
            const targetDate = addDays(date, i);
            schedulesToCreate.push({
              ...baseScheduleData,
              start_date: format(targetDate, 'yyyy-MM-dd'),
              end_date: format(targetDate, 'yyyy-MM-dd'),
            });
          }
        } else {
          // Single schedule
          schedulesToCreate.push({
            ...baseScheduleData,
            start_date: format(date, 'yyyy-MM-dd'),
            end_date: format(date, 'yyyy-MM-dd'),
          });
        }

        const { error } = await supabase
          .from('project_schedules')
          .insert(schedulesToCreate);

        if (error) throw error;

        toast({
          title: copyToMultipleDates && numberOfDays > 1 ? 'Schedules Added' : 'Schedule Added',
          description: copyToMultipleDates && numberOfDays > 1
            ? `Schedule has been copied to ${numberOfDays} consecutive dates starting from ${format(date, 'MMM d, yyyy')}.`
            : `Schedule for ${format(date, 'MMM d, yyyy')} has been added.`,
        });
      }

      onScheduleSaved?.();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error saving schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save schedule',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingSchedule?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('project_schedules')
        .update({ is_active: false })
        .eq('id', existingSchedule.id);

      if (error) throw error;

      toast({
        title: 'Schedule Deleted',
        description: `Schedule for ${format(date, 'MMM d, yyyy')} has been removed.`,
      });

      onScheduleSaved?.();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error deleting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold text-xl">
                {existingSchedule ? 'Edit Schedule' : 'Add Schedule'}
              </span>
            </div>
            <div className="text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800">
              {format(date, 'EEEE, MMM d, yyyy')}
            </div>
          </DialogTitle>

          {/* Schedule Templates */}
          {!existingSchedule && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Quick Templates
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {SCHEDULE_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  return (
                    <Button
                      key={template.id}
                      type="button"
                      variant="outline"
                      onClick={() => applyTemplate(template)}
                      className={cn(
                        "h-auto flex-col gap-1 p-3 border-2 transition-all hover:scale-105",
                        `hover:bg-gradient-to-br hover:${template.color} hover:text-white hover:border-transparent`
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{template.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium">
                    <div className="h-5 w-5 rounded bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <MapPin className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    </div>
                    Location
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., TRX, KLCC, Pavilion"
                      className="border-purple-200 dark:border-purple-800 focus:ring-purple-500 placeholder:text-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Venue Details */}
            <FormField
              control={form.control}
              name="venue_details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700 dark:text-purple-300 font-medium">
                    Venue Details <span className="text-gray-400 text-xs">(Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Hall 1, Floor 3"
                      className="border-purple-200 dark:border-purple-800 focus:ring-purple-500 placeholder:text-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Fields */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="call_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-700 dark:text-purple-300 font-medium text-xs">
                      Call Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        className="border-purple-200 dark:border-purple-800 focus:ring-purple-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shift_start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-700 dark:text-purple-300 font-medium text-xs">
                      Start Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        className="border-purple-200 dark:border-purple-800 focus:ring-purple-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shift_end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-700 dark:text-purple-300 font-medium text-xs">
                      End Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        className="border-purple-200 dark:border-purple-800 focus:ring-purple-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Daily Rate */}
            <FormField
              control={form.control}
              name="daily_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700 dark:text-purple-300 font-medium">
                    Daily Rate (RM)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className="border-purple-200 dark:border-purple-800 focus:ring-purple-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-4" />

            {/* Break Time Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Break Time
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Configure scheduled break periods
                  </div>
                </div>
              </div>
              <Switch
                checked={showBreakTime}
                onCheckedChange={setShowBreakTime}
              />
            </div>

            {/* Break Time Fields */}
            {showBreakTime && (
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/10">
                <FormField
                  control={form.control}
                  name="break_start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700 dark:text-purple-300 font-medium text-xs">
                        Break Start
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="time"
                          className="border-purple-200 dark:border-purple-800 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="break_end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700 dark:text-purple-300 font-medium text-xs">
                        Break End
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="time"
                          className="border-purple-200 dark:border-purple-800 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Advanced Settings Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Advanced Settings
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Overtime rates and allowances
                  </div>
                </div>
              </div>
              <Switch
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
              />
            </div>

            {/* Advanced Settings Fields */}
            {showAdvanced && (
              <div className="space-y-3 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/10">
                <FormField
                  control={form.control}
                  name="overtime_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-indigo-700 dark:text-indigo-300 font-medium text-xs">
                        Overtime Multiplier
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.1"
                          placeholder="e.g., 1.5 for time-and-a-half"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          className="border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Multiplier for overtime hours (e.g., 1.5, 2.0)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="transport_allowance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-indigo-700 dark:text-indigo-300 font-medium text-xs">
                          Transport (RM)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            className="border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="meal_allowance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-indigo-700 dark:text-indigo-300 font-medium text-xs">
                          Meal (RM)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            className="border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Copy to Multiple Dates - Only for new schedules */}
            {!existingSchedule && (
              <>
                <Separator className="my-4" />

                <div className="space-y-3 p-4 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Copy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Copy to Multiple Dates
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Apply this schedule to consecutive days
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={copyToMultipleDates}
                      onCheckedChange={setCopyToMultipleDates}
                    />
                  </div>

                  {copyToMultipleDates && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        Number of Days
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={numberOfDays}
                        onChange={(e) => setNumberOfDays(parseInt(e.target.value) || 1)}
                        className="border-purple-300 dark:border-purple-700 focus:ring-purple-500"
                      />
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        This will create {numberOfDays} identical schedule{numberOfDays !== 1 ? 's' : ''} from{' '}
                        <span className="font-semibold">{format(date, 'MMM d')}</span> to{' '}
                        <span className="font-semibold">{format(addDays(date, numberOfDays - 1), 'MMM d, yyyy')}</span>
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            <DialogFooter className="gap-2 pt-2">
              {existingSchedule && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="mr-auto"
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-purple-500/30"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {existingSchedule ? 'Update' : 'Add'} Schedule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
