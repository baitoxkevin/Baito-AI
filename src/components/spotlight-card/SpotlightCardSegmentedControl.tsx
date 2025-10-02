import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FileText,
  Users,
  CalendarDays,
  Receipt,
  DollarSign,
  History,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface SpotlightCardSegmentedControlProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

// Main tabs to display in the toggle group
const primaryTabs = [
  { value: "schedule", label: "Schedule", icon: CalendarDays },
  { value: "staffing", label: "Staffing", icon: Users },
  { value: "payroll", label: "Payroll", icon: DollarSign }
];

// Secondary tabs to put in the overflow menu
const secondaryTabs = [
  { value: "expenses", label: "Expenses", icon: Receipt },
  { value: "documents", label: "Documents", icon: FileText },
  { value: "history", label: "History", icon: History }
];

// All tabs combined
const allTabs = [...primaryTabs, ...secondaryTabs];

export function SpotlightCardSegmentedControl({ 
  activeTab, 
  onTabChange, 
  className 
}: SpotlightCardSegmentedControlProps) {
  // Check if the active tab is in the secondary menu
  const isSecondaryTabActive = secondaryTabs.some(tab => tab.value === activeTab);
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Main toggle group for primary tabs */}
      <ToggleGroup type="single" value={isSecondaryTabActive ? undefined : activeTab}>
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <ToggleGroupItem 
              key={tab.value} 
              value={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "px-3 py-1.5 gap-1.5 data-[state=on]:bg-gradient-to-r data-[state=on]:from-indigo-600 data-[state=on]:to-purple-600 data-[state=on]:text-white",
                "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{tab.label}</span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      
      {/* Overflow menu for secondary tabs */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isSecondaryTabActive ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 px-2",
              isSecondaryTabActive 
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" 
                : "bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            {isSecondaryTabActive ? (
              <>
                {(() => {
                  const activeTabInfo = secondaryTabs.find(tab => tab.value === activeTab);
                  if (!activeTabInfo) return <MoreHorizontal className="h-4 w-4" />;
                  
                  const ActiveIcon = activeTabInfo.icon;
                  return (
                    <>
                      <ActiveIcon className="h-3.5 w-3.5 mr-1.5" />
                      <span className="text-sm font-medium">{activeTabInfo.label}</span>
                      <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                    </>
                  );
                })()}
              </>
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[150px]">
          {secondaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.value === activeTab;
            
            return (
              <DropdownMenuItem 
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={isActive ? 
                  "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 font-medium" : 
                  ""}
              >
                <Icon className="h-4 w-4 mr-2" />
                <span>{tab.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}