import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2Icon, UserPlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const customerSchema = z.object({
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  full_name: z.string().min(1, 'Full name is required'),
  company_name: z.string().optional(),
  contact_phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format. Use format: +[country code][number]').optional().or(z.literal('')),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface NewCustomerDialogProps {
  onCustomerAdded: () => void;
}

export default function NewCustomerDialog({ onCustomerAdded }: NewCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      email: '',
      full_name: '',
      company_name: '',
      contact_phone: '',
    },
  });

  const onSubmit = async (data: CustomerFormValues) => {
    setIsLoading(true);

    try {
      // Only check for existing email if one is provided
      if (data.email) {
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

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          email: data.email || null,
          full_name: data.full_name,
          company_name: data.company_name,
          contact_phone: data.contact_phone || null,
          role: 'client',
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Customer created successfully',
      });

      form.reset();
      setOpen(false);
      onCustomerAdded();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error creating customer',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <UserPlusIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Enter the customer's details below. Only Contact Name is required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name *</FormLabel>
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
                  <FormLabel>Email (Optional)</FormLabel>
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
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Customer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
