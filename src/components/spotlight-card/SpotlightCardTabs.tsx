import React, { useRef, useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Layers,
  FileText,
  Users,
  CalendarDays,
  Receipt,
  DollarSign,
  History
} from "lucide-react";

interface SpotlightCardTabsProps {
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

export function SpotlightCardTabs({ activeTab, onTabChange, className }: SpotlightCardTabsProps) {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(
    tabs.findIndex((tab) => tab.value === activeTab) || 0
  );
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Update activeTabIndex when activeTab prop changes
  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.value === activeTab);
    if (index !== -1) {
      setActiveTabIndex(index);
    }
  }, [activeTab]);

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-1", className)}>
      <div className="flex items-center justify-center relative px-1">
        {/* Background glow effect */}
        {tabRefs.current[activeTabIndex] && (
          <motion.div
            className="absolute inset-0 z-0 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-pink-500/20 rounded-lg blur-sm"
            initial={false}
            animate={{
              x: tabRefs.current[activeTabIndex]?.offsetLeft || 0,
              y: 0,
              width: tabRefs.current[activeTabIndex]?.offsetWidth || 0,
              height: tabRefs.current[activeTabIndex]?.offsetHeight || 0,
              opacity: 1,
            }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
          />
        )}

        {/* Tab buttons */}
        <div className="flex justify-center relative z-10 gap-2 mx-auto">
          {tabs.map((tab, index) => {
            const isActive = activeTabIndex === index;
            const isHovered = hoveredTab === index;
            
            return (
              <button
                key={tab.value}
                ref={(el) => (tabRefs.current[index] = el)}
                onClick={() => {
                  setActiveTabIndex(index);
                  onTabChange(tab.value);
                }}
                onMouseEnter={() => setHoveredTab(index)}
                onMouseLeave={() => setHoveredTab(null)}
                className={cn(
                  "relative px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all",
                  isActive 
                    ? "text-white" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
                style={{
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {/* Selected/hovered background */}
                {isActive && (
                  <motion.div
                    layoutId="spotlight-tab-bg"
                    className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 rounded-md z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                
                {/* Hover glow effect */}
                {isHovered && !isActive && (
                  <motion.div
                    layoutId="spotlight-tab-hover"
                    className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-md z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  />
                )}
                
                <tab.icon className={cn(
                  "relative z-10 h-3.5 w-3.5 transition-transform duration-200",
                  isActive && "text-white"
                )} />
                
                <span className="relative z-10 transition-all duration-200">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}