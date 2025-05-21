import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FilterPillProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function FilterPill({ 
  label, 
  isActive, 
  onClick, 
  icon,
  className 
}: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative text-xs px-3 h-8 rounded-full transition-all",
        "font-medium flex items-center justify-center gap-1.5",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/40",
        isActive 
          ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent",
        className
      )}
    >
      {isActive && (
        <motion.span
          layoutId="activePillBackground"
          className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/30 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        />
      )}
      
      {icon && (
        <span className={cn(
          "z-10",
          isActive ? "text-blue-500 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
        )}>
          {icon}
        </span>
      )}
      
      <span className="z-10">{label}</span>
    </button>
  );
}