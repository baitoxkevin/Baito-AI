import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthSelectorDropdownProps {
  selectedMonths: number[];
  pendingMonths: number[];
  onMonthClick: (month: number) => void;
  onConfirm: () => void;
  onReset: () => void;
  showAll: boolean;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
  displayLabel: string;
}

export function MonthSelectorDropdown({
  selectedMonths,
  pendingMonths,
  onMonthClick,
  onConfirm,
  onReset,
  showAll,
  selectedYear: propSelectedYear,
  onYearChange,
  displayLabel
}: MonthSelectorDropdownProps) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const [localSelectedYear, setLocalSelectedYear] = useState((propSelectedYear || currentYear).toString());
  const [open, setOpen] = useState(false);
  
  const handleYearChange = (year: string) => {
    setLocalSelectedYear(year);
    if (onYearChange) {
      onYearChange(parseInt(year));
    }
  };

  // Determine which months to highlight
  const getMonthStatus = (monthIndex: number) => {
    if (pendingMonths.includes(monthIndex)) {
      return 'pending';
    }
    if (selectedMonths.includes(monthIndex) && !showAll) {
      return 'selected';
    }
    return 'none';
  };

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  const handleReset = () => {
    onReset();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-w-32 h-10 font-medium border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        >
          <Calendar className="h-4 w-4 mr-2" />
          <span>{displayLabel}</span>
          {!showAll && pendingMonths.length > 0 && (
            <div className="ml-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Filter Date</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Viewing projects by month
          </p>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Year Selector */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Select Year
            </label>
            <Select value={localSelectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {months.map((month, index) => {
              const status = getMonthStatus(index);
              const isCurrentMonth = index === currentMonth && localSelectedYear === currentYear.toString();
              
              return (
                <button
                  key={month}
                  onClick={() => onMonthClick(index)}
                  className={cn(
                    "relative px-2 py-2 text-xs font-medium rounded transition-all",
                    "border border-slate-200 dark:border-slate-700",
                    "hover:bg-slate-50 dark:hover:bg-slate-800",
                    status === 'pending' && "bg-blue-500 text-white hover:bg-blue-600 border-blue-500",
                    status === 'selected' && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-400",
                    !status && "bg-white dark:bg-slate-900",
                    isCurrentMonth && "font-semibold"
                  )}
                >
                  {month}
                </button>
              );
            })}
          </div>

          {/* Quick Range Selection */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                // Clear and select Jan-Aug range
                for (let i = 0; i <= 7; i++) {
                  if (!pendingMonths.includes(i)) {
                    onMonthClick(i);
                  }
                }
              }}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              Jan - Aug
            </button>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 dark:text-slate-400">8 months</span>
          </div>

          {/* Reset to Current Month Link */}
          <button
            onClick={() => {
              handleYearChange(currentYear.toString());
              // Clear and select only current month
              onReset();
              setTimeout(() => {
                onMonthClick(currentMonth);
              }, 50);
            }}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
          >
            Reset to Current Month
          </button>
        </div>

        <div className="flex justify-between p-4 border-t bg-slate-50 dark:bg-slate-900/50">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="w-20 h-8 text-xs"
          >
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            className="w-20 h-8 text-xs bg-blue-500 hover:bg-blue-600"
          >
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}