import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Clock, MapPin, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { Badge } from '@/components/ui/badge';

const bulkScheduleSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  venue_details: z.string().optional(),
  shift_start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  shift_end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  call_time: z.string().optional(),
  daily_rate: z.number().min(0).optional(),
});

type BulkScheduleFormValues = z.infer<typeof bulkScheduleSchema>;

interface BulkScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  dates: Date[];
  onScheduleSaved?: () => void;
}

export function BulkScheduleDialog({
  open,
  onOpenChange,
  projectId,
  dates,
  onScheduleSaved,
}: BulkScheduleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<BulkScheduleFormValues>({
    resolver: zodResolver(bulkScheduleSchema),
    defaultValues: {
      location: '',
      venue_details: '',
      shift_start_time: '09:00',
      shift_end_time: '17:00',
      call_time: '',
      daily_rate: 150,
    },
  });

  const onSubmit = async (values: BulkScheduleFormValues) => {
    setIsSubmitting(true);
    try {
      // Create schedule entries for all selected dates
      const schedules = dates.map((date) => ({
        project_id: projectId,
        start_date: format(date, 'yyyy-MM-dd'),
        end_date: format(date, 'yyyy-MM-dd'),
        location: values.location,
        venue_details: values.venue_details,
        shift_start_time: values.shift_start_time,
        shift_end_time: values.shift_end_time,
        call_time: values.call_time || null,
        daily_rate: values.daily_rate || null,
        is_active: true,
      }));

      // First, deactivate any existing schedules for these dates
      for (const date of dates) {
        const dateStr = format(date, 'yyyy-MM-dd');
        await supabase
          .from('project_schedules')
          .update({ is_active: false })
          .eq('project_id', projectId)
          .lte('start_date', dateStr)
          .gte('end_date', dateStr);
      }

      // Insert new schedules
      const { error } = await supabase
        .from('project_schedules')
        .insert(schedules);

      if (error) throw error;

      toast({
        title: 'Schedules Added',
        description: `${dates.length} date${dates.length > 1 ? 's' : ''} scheduled successfully.`,
      });

      onScheduleSaved?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      logger.error('Error saving bulk schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to save schedules',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold">
              Schedule Editor
            </span>
          </DialogTitle>
          <DialogDescription className="text-base">
            Apply schedule details to <span className="font-semibold text-purple-600 dark:text-purple-400">{dates.length} selected date{dates.length > 1 ? 's' : ''}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Selected dates preview */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800 shadow-sm">
          <div className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
            Selected Dates:
          </div>
          <div className="flex flex-wrap gap-2">
            {dates.slice(0, 10).map((date) => (
              <Badge
                key={format(date, 'yyyy-MM-dd')}
                className="text-xs bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 font-medium px-3 py-1"
              >
                {format(date, 'MMM d')}
              </Badge>
            ))}
            {dates.length > 10 && (
              <Badge className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 font-medium px-3 py-1">
                +{dates.length - 10} more
              </Badge>
            )}
          </div>
        </div>

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

            <DialogFooter className="gap-2 pt-2">
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
                Apply to {dates.length} Date{dates.length > 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
