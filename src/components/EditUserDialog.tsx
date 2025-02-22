import { useState } from 'react';
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
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required'),
  company_name: z.string().optional(),
  contact_phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format. Use format: +[country code][number]').optional().or(z.literal('')),
});

type UserFormValues = z.infer<typeof userSchema>;

interface EditUserDialogProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    company_name?: string;
    contact_phone?: string;
    role: string;
    is_super_admin?: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export default function EditUserDialog({
  user,
  open,
  onOpenChange,
  onUserUpdated,
}: EditUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: user.email,
      full_name: user.full_name,
      company_name: user.company_name || '',
      contact_phone: user.contact_phone || '',
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    setIsLoading(true);
    try {
      // Check if email is being changed and if it's already in use
      if (data.email !== user.email) {
        const { data: existingUsers, error: searchError } = await supabase
          .from('users')
          .select('id')
          .eq('email', data.email);

        if (searchError) throw searchError;

        if (existingUsers && existingUsers.length > 0) {
          form.setError('email', {
            type: 'manual',
            message: 'Email already exists',
          });
          setIsLoading(false);
          return;
        }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: data.email,
          full_name: data.full_name,
          company_name: data.company_name || null,
          contact_phone: data.contact_phone || null,
          is_super_admin: user.role === 'admin',
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      onOpenChange(false);
      onUserUpdated();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error updating user',
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
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {user.role === 'client' && (
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
                  <FormLabel>Contact Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+1234567890" />
                  </FormControl>
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
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
