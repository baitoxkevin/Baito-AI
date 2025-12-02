import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapPin, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const locationSchema = z.object({
  venue_name: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  is_primary: z.boolean(),
  parking_info: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

type LocationFormValues = z.infer<typeof locationSchema>;

interface ProjectLocation {
  id: string;
  project_id: string;
  address: string;
  venue_name?: string;
  city?: string;
  state?: string;
  date: string;
  end_date?: string;
  is_primary: boolean;
  notes?: string;
  parking_info?: string;
  contact_person?: string;
  contact_phone?: string;
  display_order: number;
}

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (location: Omit<ProjectLocation, 'id' | 'project_id' | 'display_order'>) => Promise<void>;
  existingLocation?: ProjectLocation | null;
}

export function LocationDialog({
  open,
  onOpenChange,
  onSave,
  existingLocation,
}: LocationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      venue_name: '',
      address: '',
      city: '',
      state: '',
      date: '',
      end_date: '',
      is_primary: false,
      parking_info: '',
      contact_person: '',
      contact_phone: '',
      notes: '',
    },
  });

  // Reset form when dialog opens or existingLocation changes
  useEffect(() => {
    if (open) {
      if (existingLocation) {
        form.reset({
          venue_name: existingLocation.venue_name || '',
          address: existingLocation.address,
          city: existingLocation.city || '',
          state: existingLocation.state || '',
          date: existingLocation.date.split('T')[0],
          end_date: existingLocation.end_date ? existingLocation.end_date.split('T')[0] : '',
          is_primary: existingLocation.is_primary,
          parking_info: existingLocation.parking_info || '',
          contact_person: existingLocation.contact_person || '',
          contact_phone: existingLocation.contact_phone || '',
          notes: existingLocation.notes || '',
        });
      } else {
        form.reset({
          venue_name: '',
          address: '',
          city: '',
          state: '',
          date: '',
          end_date: '',
          is_primary: false,
          parking_info: '',
          contact_person: '',
          contact_phone: '',
          notes: '',
        });
      }
    }
  }, [open, existingLocation, form]);

  const onSubmit = async (values: LocationFormValues) => {
    setIsSubmitting(true);
    try {
      await onSave({
        ...values,
        date: new Date(values.date).toISOString(),
        end_date: values.end_date ? new Date(values.end_date).toISOString() : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold text-xl">
              {existingLocation ? 'Edit Location' : 'Add Location'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Venue Name */}
            <FormField
              control={form.control}
              name="venue_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700 dark:text-purple-300 font-medium">
                    Venue Name <span className="text-gray-400 text-xs">(Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Kuala Lumpur Convention Centre"
                      className="border-purple-200 dark:border-purple-800 focus:ring-purple-500 placeholder:text-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700 dark:text-purple-300 font-medium">
                    Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Jalan Pinang, 50450 Kuala Lumpur"
                      className="border-purple-200 dark:border-purple-800 focus:ring-purple-500 placeholder:text-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City and State */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-700 dark:text-purple-300 font-medium">
                      City <span className="text-gray-400 text-xs">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Kuala Lumpur"
                        className="border-purple-200 dark:border-purple-800 focus:ring-purple-500 placeholder:text-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-700 dark:text-purple-300 font-medium">
                      State <span className="text-gray-400 text-xs">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Selangor"
                        className="border-purple-200 dark:border-purple-800 focus:ring-purple-500 placeholder:text-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Range */}
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Active Date Range
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700 dark:text-purple-300 font-medium text-xs">
                        Start Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="border-purple-200 dark:border-purple-800 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700 dark:text-purple-300 font-medium text-xs">
                        End Date <span className="text-gray-400">(Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="border-purple-200 dark:border-purple-800 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                Specify when this location will be used during the project
              </FormDescription>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-700 dark:text-purple-300 font-medium">
                      Contact Person <span className="text-gray-400 text-xs">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Ahmad bin Ali"
                        className="border-purple-200 dark:border-purple-800 focus:ring-purple-500 placeholder:text-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-700 dark:text-purple-300 font-medium">
                      Contact Phone <span className="text-gray-400 text-xs">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., +60 12-345 6789"
                        className="border-purple-200 dark:border-purple-800 focus:ring-purple-500 placeholder:text-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Parking Info */}
            <FormField
              control={form.control}
              name="parking_info"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700 dark:text-purple-300 font-medium">
                    Parking Information <span className="text-gray-400 text-xs">(Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Underground parking available, RM5/hour"
                      className="border-purple-200 dark:border-purple-800 focus:ring-purple-500 placeholder:text-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700 dark:text-purple-300 font-medium">
                    Additional Notes <span className="text-gray-400 text-xs">(Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Any additional information about this location..."
                      rows={3}
                      className="border-purple-200 dark:border-purple-800 focus:ring-purple-500 placeholder:text-gray-400 resize-none"
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
                {existingLocation ? 'Update' : 'Add'} Location
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
