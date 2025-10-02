import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Event title must be at least 2 characters.",
  }),
  startDate: z.string().min(1, {
    message: "Start date is required",
  }),
  endDate: z.string().optional(),
});

interface NewScheduledEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}

export function NewScheduledEventDialog({
  open,
  onOpenChange,
  onSubmit,
}: NewScheduledEventDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      startDate: "",
      endDate: "",
    },
  });

  function handleSubmit(values: z.infer<typeof formSchema>) {
    // Format the date range
    const dateRange = values.endDate 
      ? `${values.startDate} - ${values.endDate}`
      : values.startDate;
      
    onSubmit({ 
      ...values, 
      // Pass a formatted dateRange for display
      dateRange
    });
    
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] w-[95%] p-6 shadow-lg border-neutral-200 dark:border-neutral-700">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-red-100 dark:bg-red-900/30 h-8 w-8 rounded-full flex items-center justify-center">
              <CalendarIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl font-bold">Add New Event</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            Create a new scheduled event with a date range.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Event Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter event title" 
                      {...field} 
                      className="h-10 focus-visible:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Start Date</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <CalendarIcon className="absolute left-3 z-10 h-4 w-4 text-gray-500 pointer-events-none" />
                        <Input 
                          placeholder="e.g., 25/4" 
                          {...field} 
                          className="pl-10 h-10 focus-visible:ring-red-500"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">End Date (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <CalendarIcon className="absolute left-3 z-10 h-4 w-4 text-gray-500 pointer-events-none" />
                        <Input 
                          placeholder="e.g., 20/7" 
                          {...field} 
                          className="pl-10 h-10 focus-visible:ring-red-500"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
            <div className="pt-4 mt-2 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 mb-2 sm:mb-0"
              >
                Save Event
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}