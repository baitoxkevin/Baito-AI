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
  // Format date - just month and day
  const startDate = new Date(project.start_date);
  const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Get logo from client or company
  const clientLogo = (project.client as unknown)?.logo || (project.brand_client as unknown)?.logo;
  const clientName = (project.client as unknown)?.name || (project.client as unknown)?.company_name || (project.brand_client as unknown)?.name || 'Brand';

  // Calculate progress percentage
  const progressPercentage = project.crew_count > 0 
    ? Math.round((project.filled_positions / project.crew_count) * 100) 
    : 0;

  // Status colors
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-700'
  };

  return (
    <motion.div
      className="w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md overflow-hidden cursor-pointer border border-gray-100 dark:border-gray-800"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      {/* Compact content */}
      <div className="p-4">
        {/* Logo section with embedded info */}
        <div className="relative mb-3">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-2xl flex items-center justify-center shadow-sm">
            {clientLogo ? (
              <img 
                src={clientLogo} 
                alt={clientName}
                className="w-12 h-12 object-contain rounded-xl"
              />
            ) : (
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {project.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {/* Date badge */}
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full px-2 py-0.5 shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{dateStr}</span>
          </div>
        </div>
        
        {/* Title and venue */}
        <div className="text-center mb-3">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1 mb-1">
            {project.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" />
            {project.venue_address?.split(',')[0] || 'No venue'}
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Crew</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {project.filled_positions}/{project.crew_count}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Compact stats */}
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{project.working_hours_start}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <FileText className="w-3 h-3" />
              <span>{expenseClaims.length}</span>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status] || statusColors.draft}`}>
            {project.status}
          </div>
        </div>
      </div>
    </motion.div>
  );
}