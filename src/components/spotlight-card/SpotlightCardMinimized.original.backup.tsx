import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckSquare, 
  Users, 
  FileText
} from "lucide-react";
import { formatDate } from '@/lib/utils';
import type { Project } from '@/lib/types';

interface SpotlightCardMinimizedProps {
  project: Project;
  onClick: () => void;
  onMouseMove?: (event: React.MouseEvent<HTMLDivElement>) => void;
  mousePosition?: { x: number; y: number };
  tasks?: unknown[];
  expenseClaims?: unknown[];
}

export function SpotlightCardMinimized({ 
  project, 
  onClick,
  tasks = [],
  expenseClaims = []
}: SpotlightCardMinimizedProps) {
  // Format date range
  const startDate = new Date(project.start_date);
  const endDate = project.end_date ? new Date(project.end_date) : startDate;
  const dateRange = project.end_date 
    ? `${startDate.getDate()} ${startDate.toLocaleDateString('en-US', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleDateString('en-US', { month: 'short' })}`
    : formatDate(project.start_date);

  // Get logo from client or company
  const clientLogo = (project.client as unknown)?.logo || (project.brand_client as unknown)?.logo;
  const clientName = (project.client as unknown)?.name || (project.client as unknown)?.company_name || (project.brand_client as unknown)?.name || 'Brand';
  const clientInitial = clientName ? clientName.charAt(0).toUpperCase() : 'B';

  return (
    <motion.div
      className="max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
    >
      {/* Purple header bar */}
      <div className="h-2 bg-gradient-to-r from-purple-400 to-blue-500"></div>
      
      {/* Main content */}
      <div className="p-6">
        {/* Header section with brand and title */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Brand logo */}
            <div className="relative">
              {clientLogo ? (
                <img 
                  src={clientLogo} 
                  alt={clientName}
                  className="w-12 h-12 object-contain rounded-lg bg-gray-100"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 font-medium text-xs">Brand</span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{clientInitial}</span>
              </div>
            </div>
            
            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">{project.title}</h2>
            </div>
          </div>
        </div>
        
        {/* Event details */}
        <div className="space-y-3 mb-6 ml-4">
          {/* Date */}
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">{dateRange}</span>
          </div>
          
          {/* Time */}
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">{project.working_hours_start} - {project.working_hours_end}</span>
          </div>
          
          {/* Location */}
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-red-500" />
            <span className="text-gray-700 dark:text-gray-300 line-clamp-1">{project.venue_address}</span>
          </div>
        </div>
        
        {/* Bottom metrics */}
        <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          {/* Tasks */}
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-purple-500" />
            <span className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">{tasks.length}</span> Tasks
            </span>
          </div>
          
          {/* Crew */}
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">{project.filled_positions || 0}</span> Crew
            </span>
          </div>
          
          {/* Claims */}
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-500" />
            <span className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">{expenseClaims.length}</span> Claims
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}