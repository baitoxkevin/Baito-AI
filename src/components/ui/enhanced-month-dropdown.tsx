import React from 'react';
import { 
  Calendar, 
  ChevronDown, 
  CheckIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

interface EnhancedMonthDropdownProps {
  months: string[];
  activeMonth: number;
  onMonthChange: (monthIndex: number) => void;
  className?: string;
}

export function EnhancedMonthDropdown({ 
  months, 
  activeMonth, 
  onMonthChange,
  className
}: EnhancedMonthDropdownProps) {
  const currentMonth = new Date().getMonth();
  
  // Dropdown animation variants
  const dropdownVariants = {
    hidden: { opacity: 0, y: -5, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.15, 
        ease: "easeOut" 
      }
    },
    exit: { 
      opacity: 0, 
      y: -5, 
      scale: 0.95,
      transition: { 
        duration: 0.1, 
        ease: "easeIn" 
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "pr-3 font-medium border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 transition-all rounded-lg",
            className
          )}
        >
          <div className="flex items-center">
            <span className={`
              w-6 h-6 flex items-center justify-center mr-1.5
              rounded-full text-[9px] font-bold 
              ${activeMonth === currentMonth ? 
                'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 
                'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}
            `}>
              {months[activeMonth].substring(0, 1)}
            </span>
            <span className="mr-1">{months[activeMonth].substring(0, 3)}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 ml-1" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <AnimatePresence>
        <DropdownMenuContent
          align="start" 
          sideOffset={4}
          className="w-52 p-0 overflow-hidden border-slate-200 dark:border-slate-800 shadow-lg"
          asChild
        >
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-0">Select Month</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Viewing projects by month</p>
            </div>
            
            <DropdownMenuRadioGroup 
              value={activeMonth.toString()} 
              onValueChange={(value) => onMonthChange(parseInt(value))}
              className="max-h-64 overflow-y-auto py-1"
            >
              <div className="grid grid-cols-3 gap-1 p-1">
                {months.map((month, index) => {
                  const isCurrentMonth = index === currentMonth;
                  const isActiveMonth = index === activeMonth;
                  
                  return (
                    <DropdownMenuRadioItem 
                      key={month} 
                      value={index.toString()}
                      className={cn(
                        "justify-center text-xs rounded-md py-2 px-1 focus:bg-slate-100 dark:focus:bg-slate-800 relative",
                        isCurrentMonth && "font-medium",
                        isActiveMonth && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      )}
                    >
                      {month.substring(0, 3)}
                      {isCurrentMonth && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      )}
                    </DropdownMenuRadioItem>
                  );
                })}
              </div>
            </DropdownMenuRadioGroup>
          </motion.div>
        </DropdownMenuContent>
      </AnimatePresence>
    </DropdownMenu>
  );
}