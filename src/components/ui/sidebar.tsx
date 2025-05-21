"use client";

import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  
  // Ensure width changes on open state change
  useEffect(() => {
    // This is a no-op side effect to force re-render when open changes
    // It ensures child components update properly
  }, [open]);
  
  return (
    <div
      className={cn(
        "h-full px-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 transition-all duration-300 border-r border-neutral-200 dark:border-neutral-700 rounded-tl-xl rounded-bl-xl overflow-hidden",
        open ? "w-[180px]" : "w-[70px]",
        className
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      data-state={open ? "open" : "closed"}
    >
      {children}
    </div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-neutral-800 dark:text-neutral-200 cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-4 sm:p-6 md:p-10 z-[100] flex flex-col justify-between overflow-y-auto",
                className
              )}
            >
              <div
                className="absolute right-4 sm:right-6 md:right-10 top-4 sm:top-6 md:top-10 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  open: openProp,
}: React.PropsWithChildren<{
  link: {
    label: string;
    href: string;
    icon: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    "aria-label"?: string;
    "aria-current"?: string;
    "aria-disabled"?: boolean;
  };
  className?: string;
  open: boolean;
}>) => {
  const { open: contextOpen, animate } = useSidebar();
  
  // Use the prop if provided, otherwise use the context
  const isOpen = openProp !== undefined ? openProp : contextOpen;
  
  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2 relative rounded-md",
        link.className,
        className
      )}
      onClick={link.onClick}
      aria-label={link["aria-label"]}
      aria-current={link["aria-current"]}
      aria-disabled={link["aria-disabled"]}
    >
      <span className="flex-shrink-0">{link.icon}</span>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.span
            key="label"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-neutral-700 dark:text-neutral-200 whitespace-nowrap overflow-hidden"
          >
            {link.label}
          </motion.span>
        )}
      </AnimatePresence>
    </a>
  );
};