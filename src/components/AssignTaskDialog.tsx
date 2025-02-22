import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2Icon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { getUsersByRole } from '@/lib/tasks';
import type { Task, User, UserRole } from '@/lib/types';

const assignSchema = z.object({
  assignee_role: z.enum(['admin', 'manager', 'client', 'staff']),
  assigned_to: z.string().min(1, 'Please select an assignee'),
});

type AssignFormValues = z.infer<typeof assignSchema>;

interface AssignTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (userId: string, role: UserRole) => Promise<void>;
}

export default function AssignTaskDialog({
  task,
  open,
  onOpenChange,
  onAssign,
}: AssignTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      assignee_role: task.assignee_role || 'staff',
      assigned_to: task.assigned_to || '',
    },
  });

  const loadUsers = async (role: UserRole) => {
    try {
      const users = await getUsersByRole(role);
      setUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error loading users',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (open) {
      const role = form.getValues('assignee_role');
      loadUsers(role);
    }
  }, [open, form]);

  const onSubmit = async (data: AssignFormValues) => {
    setIsLoading(true);
    try {
      await onAssign(data.assigned_to, data.assignee_role);
      toast({
        title: 'Success',
        description: 'Task assigned successfully',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        title: 'Error assigning task',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <DialogDescription>
            Select a role and user to assign this task to.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assignee_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={(value: UserRole) => {
                      field.onChange(value);
                      loadUsers(value);
                      form.setValue('assigned_to', '');
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an assignee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Assign Task
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
