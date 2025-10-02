import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User as UserIcon, Mail, ShieldCheck } from "lucide-react";

// Form validation schema
const userFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.string().min(1, "Please select a role"),
  is_super_admin: z.boolean().optional(),
  profile_url: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface NewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  onUserAdded: () => void;
}

export default function NewUserDialog({
  open,
  onOpenChange,
  user,
  onUserAdded
}: NewUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

  // Initialize form with default values or existing user data
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: "staff",
      is_super_admin: false,
      profile_url: "",
    }
  });

  // Update form when editing an existing user
  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || "",
        email: user.email || "",
        role: user.role || "staff",
        is_super_admin: user.is_super_admin || false,
        profile_url: user.avatar_url || "",
      });
      
      setAvatarUrl(user.avatar_url || ''); // Using initials instead
    } else {
      // Generate a random avatar for new users
      setAvatarUrl(''); // Using initials instead
      form.reset({
        full_name: "",
        email: "",
        role: "staff",
        is_super_admin: false,
        profile_url: "",
      });
    }
  }, [user, form]);

  // Generate a new random avatar
  const generateNewAvatar = () => {
    const newSeed = Date.now();
    const newUrl = ''; // Using initials instead
    setAvatarUrl(newUrl);
    form.setValue("profile_url", newUrl);
  };

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      // If profile_url is empty, use the avatarUrl
      if (!data.profile_url) {
        data.profile_url = avatarUrl;
      }
      
      if (user) {
        // Update existing user
        const { error } = await supabase
          .from("users")
          .update({
            full_name: data.full_name,
            email: data.email,
            role: data.role,
            is_super_admin: data.is_super_admin,
            avatar_url: data.profile_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) throw error;
        
        toast({
          title: "User updated",
          description: `${data.full_name} has been successfully updated.`,
        });
      } else {
        // Create new user
        const { error } = await supabase
          .from("users")
          .insert({
            full_name: data.full_name,
            email: data.email,
            role: data.role,
            is_super_admin: data.is_super_admin,
            avatar_url: data.profile_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
        
        toast({
          title: "User added",
          description: `${data.full_name} has been added successfully.`,
        });
      }
      
      // Close dialog and refresh the user list
      onOpenChange(false);
      onUserAdded();
    } catch (error) {
      console.error("Error saving user:", error);
      toast({
        title: "Error",
        description: `Failed to ${user ? 'update' : 'add'} user. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? "Edit" : "Add"} User</DialogTitle>
          <DialogDescription>
            {user
              ? "Update user details and permissions."
              : "Add a new staff member to your organization."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar preview */}
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                  <AvatarImage src={avatarUrl} alt="User avatar" />
                  <AvatarFallback>
                    <UserIcon className="h-12 w-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                  onClick={generateNewAvatar}
                >
                  <span className="sr-only">Change Avatar</span>
                  ↻
                </Button>
              </div>
            </div>

            {/* Full Name */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="John Doe" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="john.doe@example.com" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="operator">Operator</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This defines the user's access level and permissions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Super Admin Toggle */}
            <FormField
              control={form.control}
              name="is_super_admin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center">
                      <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                      Super Admin Access
                    </FormLabel>
                    <FormDescription>
                      Can manage all system settings and users.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!form.watch("full_name") || !form.watch("email")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {user ? "Update" : "Add"} User
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}