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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ListTodo } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Project title must be at least 2 characters.",
  }),
  assignedTo: z.string({
    required_error: "Please select a team member.",
  }),
});

interface NewTeamProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  teamMembers: string[];
}

export function NewTeamProjectDialog({
  open,
  onOpenChange,
  onSubmit,
  teamMembers,
}: NewTeamProjectDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      assignedTo: "",
    },
  });

  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] w-[95%] p-6 shadow-lg border-neutral-200 dark:border-neutral-700">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-blue-100 dark:bg-blue-900/30 h-8 w-8 rounded-full flex items-center justify-center">
              <ListTodo className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-xl font-bold">Add New Project</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            Create a new project and assign it to a team member.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Project Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter project title" 
                      {...field} 
                      className="h-10 focus-visible:ring-blue-500"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Assign To</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 focus:ring-blue-500 flex items-center">
                        <Users className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                        <SelectValue placeholder="Select a team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member} value={member} className="cursor-pointer">
                          {member}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
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
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 mb-2 sm:mb-0"
              >
                Save Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}