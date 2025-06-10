import React, { useState, useEffect } from "react";
import { logger } from '../lib/logger';
import type { User, UserRole } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Info } from "lucide-react";
import type { User } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onUserAdded: () => void;
}

export default function NewUserDialog({
  open,
  onOpenChange,
  user,
  onUserAdded
}: NewUserDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "staff",
    password: "" // For direct user creation
  });

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        // Editing existing user
        setFormData({
          full_name: user.full_name || "",
          email: user.email || "",
          role: user.role || "staff",
          password: ""
        });
      } else {
        // Creating new user
        setFormData({
          full_name: "",
          email: "",
          role: "staff",
          password: ""
        });
      }
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // For new users, password is required
    if (!user && !formData.password) {
      toast({
        title: "Error",
        description: "Password is required for new users",
        variant: "destructive"
      });
      return;
    }

    // Validate password length for new users
    if (!user && formData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      if (user) {
        // Update existing user - this is safe as it doesn't touch auth
        const { error } = await supabase
          .from("users")
          .update({
            full_name: formData.full_name,
            email: formData.email,
            role: formData.role,
            is_super_admin: formData.role === 'super_admin',
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User updated successfully"
        });
        
        onUserAdded();
        onOpenChange(false);
      } else {
        // Create new user with password
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Create or update the user profile
          // Start with basic fields that should always exist
          const userProfile: Partial<User> = {
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            is_super_admin: formData.role === 'super_admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Try to add optional fields - these might not exist in all database schemas
          try {
            const username = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
            const { error: profileError } = await supabase
              .from("users")
              .upsert({
                ...userProfile,
                username: username,
                avatar_seed: Math.random().toString(36).substring(2, 12)
              });

            if (profileError) {
              // If the error is about missing columns, try again without them
              if (profileError.message?.includes('avatar_seed') || profileError.message?.includes('username')) {
                logger.debug('Optional columns not found, creating user without them');
                const { error: basicProfileError } = await supabase
                  .from("users")
                  .upsert(userProfile);
                
                if (basicProfileError) throw basicProfileError;
              } else {
                throw profileError;
              }
            }
          } catch (error) {
            // Final fallback - just create with basic fields
            const { error: fallbackError } = await supabase
              .from("users")
              .upsert(userProfile);
            
            if (fallbackError) throw fallbackError;
          }

          toast({
            title: "Success",
            description: "User created successfully. They will receive a confirmation email."
          });
          
          onUserAdded();
          onOpenChange(false);
        }
      }
    } catch (error) {
      logger.error("Error saving user:", error);
      
      let errorMessage = error instanceof Error ? error.message : "Failed to save user";
      
      // Handle specific error cases
      if (errorMessage.includes("duplicate key") || errorMessage.includes("already registered")) {
        errorMessage = "A user with this email already exists.";
      } else if (errorMessage.includes("password")) {
        errorMessage = "Password must be at least 8 characters long.";
      } else if (errorMessage.includes("rate limit")) {
        errorMessage = "Too many attempts. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {user 
                ? "Update the user's information below." 
                : "Create a new user account with email and password."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
                disabled={!!user} // Don't allow email changes for existing users
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {!user && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="password">
                    Password *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                  <p className="text-sm text-muted-foreground">
                    Password must be at least 8 characters long
                  </p>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    The user will receive a confirmation email after account creation. 
                    Make sure to provide them with their password securely.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}