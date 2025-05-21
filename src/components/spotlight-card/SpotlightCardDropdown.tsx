import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Layers,
  FileText,
  Users,
  CalendarDays,
  Receipt,
  DollarSign,
  History,
  ChevronDown
} from "lucide-react";

interface SpotlightCardDropdownProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

const tabs = [
  { value: "schedule", label: "Schedule", icon: CalendarDays },
  { value: "staffing", label: "Staffing", icon: Users },
  { value: "payroll", label: "Payroll", icon: DollarSign },
  { value: "expenses", label: "Expenses", icon: Receipt },
  { value: "documents", label: "Documents", icon: FileText },
  { value: "history", label: "History", icon: History },
];

export function SpotlightCardDropdown({ activeTab, onTabChange, className }: SpotlightCardDropdownProps) {
  // Find the active tab details
  const activeTabDetails = tabs.find(tab => tab.value === activeTab) || tabs[0];
  const ActiveIcon = activeTabDetails.icon;

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 px-4 text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md rounded-xl font-medium transition-all hover:scale-105 focus:outline-none"
          >
            <ActiveIcon className="h-4 w-4 mr-1.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-medium">{activeTabDetails.label}</span>
            <ChevronDown className="h-3.5 w-3.5 ml-1.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-[150px] p-1 bg-white dark:bg-gray-800 shadow-md rounded-lg"
        >
          <DropdownMenuLabel className="px-2 py-1 text-sm font-medium">View</DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1" />
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.value === activeTab;
            
            return (
              <DropdownMenuItem 
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={`px-2 py-1.5 text-sm ${isActive ? 
                  "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 font-medium" : 
                  ""}`}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                <span>{tab.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}