import React, { useState, useCallback, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { logger } from '../lib/logger';
import {
  Settings,
  LogOut,
  Calendar as CalendarIcon,
  Users,
  UserPlus,
  FolderKanban,
  PenTool as Tool,
  Zap,
  DollarSign,
  CreditCard,
  Target,
  Receipt,
  Package,
  Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from '@/lib/supabase';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserProfileDialog from '@/components/UserProfileDialog';

const LOGO_URL = "/favicon.png";

const Logo = () => {
  return (
    <a
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      {LOGO_URL ? (
        <img
          src={LOGO_URL}
          className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
          alt="Logo"
        />
      ) : (
        <Zap className="h-5 w-6 text-black dark:text-white flex-shrink-0" />
      )}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        BaitoAI Labs
      </motion.span>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-200 dark:bg-neutral-700" />
      <div className="absolute bottom-[-20px] left-0 right-0 text-center text-xs text-neutral-500 dark:text-neutral-400">
        v0.0.1
      </div>
    </a>
  );
};

const LogoIcon = () => {
  return (
    <a
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      {LOGO_URL ? (
        <img
          src={LOGO_URL}
          className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
          alt="Logo"
        />
      ) : (
        <Zap className="h-5 w-6 text-black dark:text-white flex-shrink-0" />
      )}
    </a>
  );
};

// UserProfileButton component
interface UserProfileButtonProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

function UserProfileButton({ open, setOpen }: UserProfileButtonProps) {
  const [avatarUrl, setAvatarUrl] = useState("");
  const [fullName, setFullName] = useState("User");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fetch user data from the database
  const fetchUserData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Get user data from public.users table
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userData) {
          // Set full name from user data
          setFullName(userData.full_name || user.email?.split('@')[0] || 'User');

          // Check for avatar in user metadata
          try {
            if (user.user_metadata && user.user_metadata.avatar_url) {
              setAvatarUrl(user.user_metadata.avatar_url);
            } else if (userData.raw_user_meta_data && userData.raw_user_meta_data.avatar_url) {
              setAvatarUrl(userData.raw_user_meta_data.avatar_url);
            }
          } catch (e) {
            logger.error('Error parsing user metadata:', e);
          }
        } else {
          // Fallback to auth user data if no public user record exists
          setFullName(user.email?.split('@')[0] || 'User');
          if (user.user_metadata && user.user_metadata.avatar_url) {
            setAvatarUrl(user.user_metadata.avatar_url);
          }
        }
      }
    } catch (error) {
      logger.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchUserData();
  }, []);

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part?.[0] || '')
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle profile click
  const handleProfileClick = () => {
    // If on mobile, close sidebar first
    if (window.innerWidth < 768) {
      setOpen(false);
    }

    // Open the dialog
    setProfileDialogOpen(true);
  };

  if (!mounted) return null;
  
  if (open) {
    // When sidebar is open, show avatar and name
    return (
      <>
        <div 
          className="px-3 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
          onClick={handleProfileClick}
        >
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-7 w-7 border-2 border-primary/10">
              <AvatarImage 
                src={avatarUrl} 
                alt={`${fullName}'s avatar`} 
                className="object-cover"
              />
              <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium flex-1 break-words line-clamp-1">
              {fullName}
            </span>
          </div>
        </div>
        
        <UserProfileDialog 
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
        />
      </>
    );
  }
  
  // When sidebar is collapsed, show just the avatar
  return (
    <>
      <div 
        className="flex justify-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
        onClick={handleProfileClick}
      >
        <Avatar className="h-7 w-7 border-2 border-primary/10">
          <AvatarImage 
            src={avatarUrl} 
            alt={`${fullName}'s avatar`} 
            className="object-cover"
          />
          <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
        </Avatar>
      </div>
      
      <UserProfileDialog 
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </>
  );
}

// Main SidebarAdapter
interface SidebarAdapterProps {
  children: React.ReactNode;
}

export function SidebarAdapter({ children }: SidebarAdapterProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string>('staff');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Set mounted to true after initial render and fetch user role
  useEffect(() => {
    setMounted(true);
    fetchUserRole();
  }, []);

  // Fetch user role
  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role, is_super_admin')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          setUserRole(userData.role || 'staff');
          setIsSuperAdmin(userData.is_super_admin || false);
        }
      }
    } catch (error) {
      logger.error('Error fetching user role:', error);
    }
  };

  // Handle navigation
  const handleNavigation = useCallback((path: string) => {
    // Close mobile menu if on mobile
    if (window.innerWidth < 768) {
      setOpen(false);
    }
    
    // Navigate to the path
    navigate(path);
  }, [navigate]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      
      // Force navigation to login page
      navigate('/login');
    } catch (error) {
      logger.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!mounted) {
    return null;
  }

  // Check if user can access admin features
  const canAccessPayments = userRole === 'admin' || isSuperAdmin;

  // Define navigation links
  const links = [
    {
      label: "Projects",
      href: "/projects",
      icon: <FolderKanban className="sidebar-link-icon" />,
      onClick: (e) => {
        e.preventDefault();
        handleNavigation("/projects");
      },
      className: cn(
        "sidebar-link",
        location.pathname.startsWith("/projects") && "bg-muted"
      ),
      "aria-current": location.pathname.startsWith("/projects") ? "page" : undefined,
    },
    {
      label: "Calendar",
      href: "/calendar/list",
      icon: <CalendarIcon className="sidebar-link-icon" />,
      onClick: (e) => {
        e.preventDefault();
        handleNavigation("/calendar/list");
      },
      className: cn(
        "sidebar-link",
        location.pathname.startsWith("/calendar") && "bg-muted"
      ),
      "aria-current": location.pathname.startsWith("/calendar") ? "page" : undefined,
    },
    {
      label: "Candidates",
      href: "/candidates",
      icon: <UserPlus className="sidebar-link-icon" />,
      onClick: (e) => {
        e.preventDefault();
        handleNavigation("/candidates");
      },
      className: cn(
        "sidebar-link",
        location.pathname === "/candidates" && "bg-muted"
      ),
      "aria-current": location.pathname === "/candidates" ? "page" : undefined,
    },
    {
      label: "Tools",
      href: "/tools",
      icon: <Tool className="sidebar-link-icon" />,
      onClick: (e) => {
        e.preventDefault();
        handleNavigation("/tools");
      },
      className: cn(
        "sidebar-link",
        location.pathname === "/tools" && "bg-muted"
      ),
      "aria-current": location.pathname === "/tools" ? "page" : undefined,
    },
    ...(canAccessPayments ? [{
      label: "Admin Dashboard",
      href: "/admin",
      icon: <Shield className="sidebar-link-icon" />,
      onClick: (e) => {
        e.preventDefault();
        handleNavigation("/admin");
      },
      className: cn(
        "sidebar-link",
        location.pathname === "/admin" && "bg-muted"
      ),
      "aria-current": location.pathname === "/admin" ? "page" : undefined,
    }] : []),
    {
      label: "Goals",
      href: "/goals",
      icon: <Target className="sidebar-link-icon" />,
      onClick: (e) => {
        e.preventDefault();
        handleNavigation("/goals");
      },
      className: cn(
        "sidebar-link",
        location.pathname === "/goals" && "bg-muted"
      ),
      "aria-current": location.pathname === "/goals" ? "page" : undefined,
    },
    {
      label: "Warehouse",
      href: "/warehouse",
      icon: <Package className="sidebar-link-icon" />,
      onClick: (e) => {
        e.preventDefault();
        handleNavigation("/warehouse");
      },
      className: cn(
        "sidebar-link",
        location.pathname === "/warehouse" && "bg-muted"
      ),
      "aria-current": location.pathname === "/warehouse" ? "page" : undefined,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="sidebar-link-icon" />,
      onClick: (e) => {
        e.preventDefault();
        handleNavigation("/settings");
      },
      className: cn(
        "sidebar-link",
        location.pathname === "/settings" && "bg-muted"
      ),
      "aria-current": location.pathname === "/settings" ? "page" : undefined,
    },
  ];

  return (
    <div
      className={cn(
        "rounded-xl flex flex-col md:flex-row w-full max-w-[1200px] min-h-[calc(100vh-64px)] border border-neutral-200 dark:border-neutral-700 shadow-xl relative",
        "md:h-[calc(100vh-64px)] md:max-h-[calc(100vh-64px)]", // Fixed height only on desktop
        "overflow-y-auto md:overflow-hidden" // Allow scroll on mobile, hidden on desktop (children handle scroll)
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between py-6">
          <div className="flex flex-col flex-1 gap-10">
            <div className="flex justify-center w-full">
              {open ? <Logo /> : <LogoIcon />}
            </div>
            <div className="flex flex-col gap-3">
              {links.map((link, idx) => (
                <SidebarLink 
                  key={idx} 
                  link={link} 
                  open={open}
                  className={link.className}
                  aria-label={link["aria-label"]}
                  aria-current={link["aria-current"]}
                />
              ))}
            </div>
          </div>
          <div className="mt-auto pt-6 border-t border-neutral-200 dark:border-neutral-700 flex flex-col items-center w-full">
            {/* Logout button */}
            <button
              data-testid="user-menu"
              onClick={handleLogout}
              className={cn(
                "flex items-center w-full px-3 py-2 mb-4 text-sm rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors",
                open ? "justify-start" : "justify-center"
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {open && <span className="ml-3">Logout</span>}
            </button>

            {/* User avatar */}
            <UserProfileButton open={open} setOpen={setOpen} />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex-1 flex flex-col bg-gray-100 dark:bg-neutral-800 overflow-y-auto pb-16 md:pb-0">
        <div className="flex-1 w-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default SidebarAdapter;