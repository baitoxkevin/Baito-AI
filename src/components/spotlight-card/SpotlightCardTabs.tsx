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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update activeTabIndex when activeTab prop changes
  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.value === activeTab);
    if (index !== -1) {
      setActiveTabIndex(index);
    }
  }, [activeTab]);

  // Scroll active tab into view on mobile
  useEffect(() => {
    const activeButton = tabRefs.current[activeTabIndex];
    const scrollContainer = scrollContainerRef.current;

    if (activeButton && scrollContainer) {
      // Calculate the scroll position to center the active tab
      const containerWidth = scrollContainer.offsetWidth;
      const buttonLeft = activeButton.offsetLeft;
      const buttonWidth = activeButton.offsetWidth;
      const scrollPosition = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);

      scrollContainer.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [activeTabIndex]);

  return (
    <div className={cn("relative rounded-xl bg-white dark:bg-gray-900 p-1", className)}>
      {/* Scrollable container for mobile - horizontal scroll with snap */}
      <div
        ref={scrollContainerRef}
        className="flex items-center relative px-1 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
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

        {/* Tab buttons - flex-nowrap prevents wrapping on mobile */}
        <div className="flex flex-nowrap relative z-10 gap-1 sm:gap-2 mx-auto min-w-max">
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
                  "relative px-2 sm:px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-all whitespace-nowrap snap-center flex-shrink-0",
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
                  "relative z-10 h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-200 flex-shrink-0",
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