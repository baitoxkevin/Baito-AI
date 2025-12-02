import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Calendar,
  Users,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Direct path to optimized image in public folder
const baigerAvatar = '/baiger-optimized.png';

interface NavItem {
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
}

interface MobileBottomNavProps {
  onBaigerClick?: () => void;
  isBaigerActive?: boolean;
  className?: string;
}

export function MobileBottomNav({ onBaigerClick, isBaigerActive = false, className }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      icon: <Home className="h-6 w-6" strokeWidth={1.5} />,
      activeIcon: <Home className="h-6 w-6" strokeWidth={2.5} />,
      label: 'Home',
      path: '/dashboard',
    },
    {
      icon: <FolderKanban className="h-6 w-6" strokeWidth={1.5} />,
      activeIcon: <FolderKanban className="h-6 w-6" strokeWidth={2.5} />,
      label: 'Projects',
      path: '/projects',
    },
    {
      icon: <Calendar className="h-6 w-6" strokeWidth={1.5} />,
      activeIcon: <Calendar className="h-6 w-6" strokeWidth={2.5} />,
      label: 'Calendar',
      path: '/calendar/list',
    },
    {
      icon: <Users className="h-6 w-6" strokeWidth={1.5} />,
      activeIcon: <Users className="h-6 w-6" strokeWidth={2.5} />,
      label: 'Candidates',
      path: '/candidates',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path.split('/')[1] ? `/${path.split('/')[1]}` : path);
  };

  // Reusable NavButton component for consistent styling - compact version
  const NavButton = ({ item }: { item: NavItem }) => {
    const active = isActive(item.path);
    return (
      <motion.button
        key={item.path}
        onClick={() => navigate(item.path)}
        whileTap={{ scale: 0.92 }}
        className={cn(
          "relative flex flex-col items-center justify-center",
          "min-w-[60px] min-h-[44px] py-1 px-2",
          "rounded-xl transition-all duration-200",
          "touch-manipulation select-none",
          active
            ? "text-primary"
            : "text-neutral-400 dark:text-neutral-500 active:text-primary"
        )}
        aria-current={active ? 'page' : undefined}
      >
        {/* Active indicator pill */}
        {active && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-primary/10 dark:bg-primary/15 rounded-xl"
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}

        <span className="relative z-10">
          {active ? item.activeIcon : item.icon}
        </span>
        <span className={cn(
          "relative z-10 text-[10px] mt-0.5 font-medium tracking-tight",
          active && "font-semibold"
        )}>
          {item.label}
        </span>

        {/* Badge */}
        {item.badge && item.badge > 0 && (
          <span className="absolute top-0 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full h-3.5 min-w-[14px] px-1 flex items-center justify-center">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}
      </motion.button>
    );
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg",
        "border-t border-neutral-200/50 dark:border-neutral-700/50",
        "safe-area-bottom",
        className
      )}
      role="navigation"
      aria-label="Mobile navigation"
    >
      {/* Main container - thinner with reduced padding */}
      <div className="grid grid-cols-5 items-end px-1 pt-1 pb-2">
        {/* Left nav items */}
        {navItems.slice(0, 2).map((item) => (
          <div key={item.path} className="flex justify-center">
            <NavButton item={item} />
          </div>
        ))}

        {/* Center Baiger Button - overlapping the top border */}
        <div className="flex justify-center">
          <div className="relative -mt-14">
            <motion.button
              onClick={onBaigerClick}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.02 }}
              className={cn(
                "rounded-full h-[56px] w-[56px] overflow-hidden",
                "flex items-center justify-center",
                "touch-manipulation select-none",
                "border-[3px] border-white dark:border-neutral-800",
                "shadow-lg shadow-neutral-900/10 dark:shadow-black/30",
                "transition-all duration-200",
                "bg-white dark:bg-neutral-800",
                isBaigerActive && "ring-[3px] ring-primary/40 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900"
              )}
              style={{
                boxShadow: isBaigerActive
                  ? '0 8px 24px -4px rgba(59, 130, 246, 0.35), 0 4px 8px -2px rgba(59, 130, 246, 0.15)'
                  : '0 8px 20px -4px rgba(0, 0, 0, 0.15), 0 4px 8px -2px rgba(0, 0, 0, 0.08)'
              }}
              aria-label="Open Baiger AI Assistant"
            >
              <img
                src={baigerAvatar}
                alt="Baiger AI"
                className="w-full h-full object-cover"
              />
            </motion.button>
          </div>
        </div>

        {/* Right nav items */}
        {navItems.slice(2).map((item) => (
          <div key={item.path} className="flex justify-center">
            <NavButton item={item} />
          </div>
        ))}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
