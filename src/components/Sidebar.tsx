import { useState, createContext, useContext } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { AnimatePresence, motion } from 'framer-motion';
import { IconMenu2, IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  BriefcaseIcon,
  UsersIcon,
  CalendarIcon,
  ListTodoIcon,
  Settings2Icon,
  UserIcon,
  MailIcon,
  FolderIcon,
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';

const SidebarContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  animate: boolean;
} | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
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
  setOpen?: (open: boolean) => void;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp || setOpenState;

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
  setOpen?: (open: boolean) => void;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        'h-full px-3 py-4 hidden md:flex md:flex-col bg-card border-r w-[220px] flex-shrink-0',
        className
      )}
      animate={{
        width: animate ? (open ? '220px' : '56px') : '220px',
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
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
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          'h-16 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-card border-b w-full'
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-foreground h-5 w-5 cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
              className={cn(
                'fixed h-full w-full inset-0 bg-background p-10 z-[100] flex flex-col justify-between',
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-foreground cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <IconX className="h-5 w-5" />
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
  active,
  ...props
}: {
  link: {
    to: string;
    icon: React.ReactNode;
    label: string;
  };
  className?: string;
  active?: boolean;
} & Omit<React.ComponentProps<typeof Link>, 'to'>) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      to={link.to}
      className={cn(
        'flex items-center justify-start gap-3 group/sidebar py-2 w-full',
        active && 'bg-primary/10 text-primary',
        'hover:bg-primary/5 rounded-md px-2 transition-colors',
        !open && 'justify-center',
        className
      )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm whitespace-pre inline-block"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

const SidebarContent = () => {
  const { open } = useSidebar();
  const { user } = useUser();
  const location = useLocation();
  const currentPath = location.pathname.split('/')[1] || '';
  
  const links = [
    {
      to: '/',
      icon: <LayoutDashboardIcon className="h-4 w-4" />,
      label: 'Dashboard',
      id: '',
    },
    {
      to: '/projects',
      icon: <BriefcaseIcon className="h-4 w-4" />,
      label: 'Projects',
      id: 'projects',
    },
    {
      to: '/calendar',
      icon: <CalendarIcon className="h-4 w-4" />,
      label: 'Calendar',
      id: 'calendar',
    },
    {
      to: '/todo',
      icon: <ListTodoIcon className="h-4 w-4" />,
      label: 'To-Do List',
      id: 'todo',
    },
    {
      to: '/email',
      icon: <MailIcon className="h-4 w-4" />,
      label: 'Email',
      id: 'email',
    },
    {
      to: '/documents',
      icon: <FolderIcon className="h-4 w-4" />,
      label: 'Documents',
      id: 'documents',
    },
    {
      to: '/candidates',
      icon: <UserIcon className="h-4 w-4" />,
      label: 'Candidates',
      id: 'candidates',
    },
  ];

  if (user?.role === 'admin') {
    links.push({
      to: '/admin',
      icon: <Settings2Icon className="h-4 w-4" />,
      label: 'Admin',
      id: 'admin',
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <motion.h2
          animate={{
            opacity: open ? 1 : 0,
            display: open ? 'block' : 'none',
          }}
          className="text-lg font-bold"
        >
          RecruitPro
        </motion.h2>
        <NotificationBell />
      </div>
      <nav className="space-y-1">
        {links.map((link) => (
          <SidebarLink
            key={link.id}
            link={link}
            active={currentPath === link.id}
          />
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t text-center text-xs text-muted-foreground">
        <span>v0.0.1</span>
      </div>
    </div>
  );
};

const SidebarComponent = () => {
  return (
    <Sidebar>
      <SidebarBody>
        <SidebarContent />
      </SidebarBody>
    </Sidebar>
  );
};

export default SidebarComponent;
