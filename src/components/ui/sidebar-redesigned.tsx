"use client";

import React, { useState, createContext, useContext, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronRight } from "lucide-react";

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
  collapsedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const Sidebar = ({
  children,
  open,
  setOpen,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [openState, setOpenState] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  
  const isOpen = open !== undefined ? open : openState;
  const toggleOpen = setOpen !== undefined ? setOpen : setOpenState;
  
  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);
  
  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return (
    <SidebarContext.Provider 
      value={{ 
        open: isOpen, 
        setOpen: toggleOpen, 
        isMobile, 
        collapsedSections,
        toggleSection 
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

interface SidebarBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SidebarBody = ({ children, className, ...props }: SidebarBodyProps) => {
  return (
    <>
      <DesktopSidebar className={className} {...props}>
        {children}
      </DesktopSidebar>
      <MobileSidebar className={className} {...props}>
        {children}
      </MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { open, setOpen } = useSidebar();
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      className={cn(
        "h-full hidden md:flex md:flex-col bg-white dark:bg-gray-900 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 rounded-l-xl overflow-hidden shadow-sm",
        className
      )}
      initial={false}
      animate={{
        width: open ? 240 : 70,
        transition: {
          duration: shouldReduceMotion ? 0 : 0.2,
          ease: "easeInOut"
        }
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      data-state={open ? "open" : "closed"}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { open, setOpen, isMobile } = useSidebar();
  const shouldReduceMotion = useReducedMotion();

  // Only render when on mobile
  if (!isMobile) return null;
  
  return (
    <>
      <div
        className={cn(
          "h-14 px-4 py-4 flex md:hidden items-center justify-between sticky top-0 z-40 bg-white dark:bg-gray-900 w-full shadow-sm",
          className
        )}
        {...props}
      >
        <button 
          onClick={() => setOpen(true)}
          className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
      
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ 
              duration: shouldReduceMotion ? 0 : 0.3, 
              ease: [0.32, 0.72, 0, 1] 
            }}
            className={cn(
              "fixed top-0 left-0 h-full w-[280px] max-w-[80vw] bg-white dark:bg-gray-900 shadow-xl z-50 md:hidden overflow-y-auto p-4",
              className
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium">Menu</span>
              <button 
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  titleClassName?: string;
  icon?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  id: string;
}

export const SidebarSection = ({
  id,
  title,
  titleClassName,
  icon,
  collapsible = false,
  defaultCollapsed = false,
  children,
  className,
  ...props
}: SidebarSectionProps) => {
  const { collapsedSections, toggleSection } = useSidebar();
  
  useEffect(() => {
    if (collapsible && defaultCollapsed) {
      toggleSection(id);
    }
  }, [id, collapsible, defaultCollapsed, toggleSection]);
  
  const isCollapsed = collapsedSections[id] || false;
  
  return (
    <div className={cn("my-2 px-3", className)} {...props}>
      {title && (
        <div 
          className={cn(
            "flex items-center justify-between text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 h-7",
            collapsible && "cursor-pointer hover:text-gray-900 dark:hover:text-gray-100",
            titleClassName
          )}
          onClick={collapsible ? () => toggleSection(id) : undefined}
        >
          <div className="flex items-center gap-2">
            {icon && <span className="h-4 w-4">{icon}</span>}
            <span>{title}</span>
          </div>
          
          {collapsible && (
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-3 w-3" />
            </motion.div>
          )}
        </div>
      )}
      
      <AnimatePresence initial={false}>
        {(!collapsible || !isCollapsed) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SidebarLinkProps {
  link: {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: {
      content: React.ReactNode;
      variant?: "default" | "secondary" | "outline" | "destructive";
    };
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    "aria-label"?: string;
    "aria-current"?: string;
    "aria-disabled"?: boolean;
  };
  className?: string;
}

export const SidebarLink = ({ link, className }: SidebarLinkProps) => {
  const { open } = useSidebar();
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  
  // Motion variants for enhanced animation
  const iconMotion = {
    initial: { scale: 1 },
    hover: { scale: 1.1 },
    active: { scale: 0.95 }
  };
  
  const linkMotion = {
    initial: { 
      backgroundColor: "rgba(0, 0, 0, 0)",
      x: 0 
    },
    hover: { 
      backgroundColor: "rgba(0, 0, 0, 0.05)",
      x: 2,
      transition: { duration: 0.2 } 
    },
    tap: { 
      x: 0,
      backgroundColor: "rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.1 } 
    }
  };
  
  const isActive = link["aria-current"] === "page";
  
  return (
    <motion.a
      href={link.href}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      animate={isHovered ? "hover" : "initial"}
      variants={!shouldReduceMotion ? linkMotion : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "flex items-center justify-start gap-3 px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 transition-all",
        "relative overflow-hidden",
        isActive && "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium",
        link.className,
        className
      )}
      onClick={link.onClick}
      aria-label={link["aria-label"]}
      aria-current={link["aria-current"]}
      aria-disabled={link["aria-disabled"]}
    >
      {isActive && (
        <motion.div 
          className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
          initial={{ height: 0 }}
          animate={{ height: "100%" }}
          layoutId="activeIndicator"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      
      <motion.div 
        className="flex-shrink-0 w-5 h-5"
        variants={!shouldReduceMotion ? iconMotion : {}}
      >
        {link.icon}
      </motion.div>
      
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ 
              width: "auto", 
              opacity: 1,
              transition: { 
                duration: shouldReduceMotion ? 0 : 0.2,
                ease: "easeOut"
              }
            }}
            exit={{ 
              width: 0, 
              opacity: 0,
              transition: { 
                duration: shouldReduceMotion ? 0 : 0.1,
                ease: "easeIn"
              }
            }}
            className="flex items-center justify-between flex-1 overflow-hidden"
          >
            <span className="truncate">{link.label}</span>
            
            {link.badge && (
              <motion.span 
                className={cn(
                  "ml-auto px-1.5 py-0.5 rounded-full text-xs font-medium",
                  link.badge.variant === "secondary" && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100",
                  link.badge.variant === "destructive" && "bg-red-100 text-red-900 dark:bg-red-900/20 dark:text-red-300",
                  link.badge.variant === "outline" && "border border-gray-200 dark:border-gray-800",
                  !link.badge.variant && "bg-primary/10 text-primary dark:bg-primary/20"
                )}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {link.badge.content}
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.a>
  );
};

export const SidebarFooter = ({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { open } = useSidebar();
  
  return (
    <div 
      className={cn(
        "mt-auto pt-2 border-t border-gray-200 dark:border-gray-800",
        open ? "px-3" : "px-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const SidebarUser = ({
  avatar,
  fallback,
  name,
  role,
  onClick,
}: {
  avatar?: string;
  fallback: string;
  name: string;
  role?: string;
  onClick?: () => void;
}) => {
  const { open } = useSidebar();
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  
  const buttonVariants = {
    initial: { 
      backgroundColor: "rgba(0, 0, 0, 0)" 
    },
    hover: { 
      backgroundColor: "rgba(0, 0, 0, 0.05)",
      transition: { duration: 0.2 }
    }
  };
  
  const avatarVariants = {
    initial: { 
      borderColor: "rgba(var(--color-primary), 0.1)",
      scale: 1
    },
    hover: { 
      borderColor: "rgba(var(--color-primary), 0.3)",
      scale: 1.05,
      transition: { 
        duration: 0.2,
        type: "spring",
        stiffness: 400
      }
    }
  };
  
  return (
    <motion.button
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-md transition-all text-left relative",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "overflow-hidden"
      )}
      initial="initial"
      whileHover="hover"
      whileTap="hover"
      animate={isHovered ? "hover" : "initial"}
      variants={!shouldReduceMotion ? buttonVariants : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Subtle highlight effect on hover */}
      {isHovered && !shouldReduceMotion && (
        <motion.div 
          className="absolute inset-0 bg-primary/5 rounded-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          layoutId="profileHighlight"
        />
      )}
      
      <motion.div 
        className={cn(
          "rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden",
          "border-2 border-primary/10 relative",
          "h-9 w-9"
        )}
        variants={!shouldReduceMotion ? avatarVariants : {}}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={`${name}'s avatar`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs font-semibold">{fallback}</span>
        )}
        
        {/* Online status indicator */}
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white dark:ring-gray-900" />
      </motion.div>
      
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ 
              opacity: 1, 
              width: "auto",
              transition: { duration: shouldReduceMotion ? 0 : 0.2 }
            }}
            exit={{ 
              opacity: 0, 
              width: 0,
              transition: { duration: shouldReduceMotion ? 0 : 0.1 }
            }}
            className="overflow-hidden"
          >
            <div className="flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {name}
              </p>
              {role && (
                <div className="flex items-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {role}
                  </p>
                  <span className="ml-1 inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Online
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};