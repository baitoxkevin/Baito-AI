import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  FileText,
  Repeat,
  CheckCircle,
  Kanban,
  CalendarDays,
  Receipt,
  DollarSign,
  Package,
  Building,
  Star,
  Heart,
  MoreVertical,
  Minus
} from "lucide-react";
import { formatDate, formatRecurringDates, getGoogleMapsLink, getWazeLink } from '@/lib/utils';
import type { Project } from '@/lib/types';

interface ProjectCard3DProps {
  project: Project;
  onProjectUpdated: () => void;
  onViewDetails?: (project: Project) => void;
  tasks?: any[];
  documents?: any[];
  expenseClaims?: any[];
}

export function ProjectCard3D({ 
  project, 
  onProjectUpdated, 
  onViewDetails,
  tasks = [],
  documents = [],
  expenseClaims = []
}: ProjectCard3DProps) {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  
  // Format dates for display
  const startDate = formatDate(project.start_date);
  const endDate = project.end_date ? formatDate(project.end_date) : null;
  
  // Status badge color
  const statusColor = {
    'new': 'bg-blue-100 text-blue-800 border-blue-200',
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'in-progress': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'cancelled': 'bg-red-100 text-red-800 border-red-200',
  }[project.status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  
  // Calculate progress based on filled positions
  const progress = Math.round((project.filled_positions / project.crew_count) * 100);
  
  // Get contributors
  const contributors = project.contributors || [];
  
  // Get completed tasks count
  const completedTasks = tasks.filter(task => task.status === 'done' || task.completed_at).length;
  
  // Calculate budget used (if available)
  const expenseTotal = expenseClaims.reduce((sum, claim) => sum + (claim.amount || 0), 0);
  const budget = (project as any).budget || 0;
  const budgetUsedPercentage = budget > 0 ? Math.min(100, Math.round((expenseTotal / budget) * 100)) : 0;
  
  // Handle mouse move for spotlight effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setCursorPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };
  
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(project);
    }
  };
  
  return (
    <>
      <motion.div
        ref={cardRef}
        className="relative rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.005 }}
        onMouseMove={handleMouseMove}
      >
        <Card className={cn(
          "relative border shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden group",
          isMinimized && "lg:max-w-xs lg:mx-auto"
        )}>
          {/* Action buttons in expanded view */}
          {!isMinimized && (
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              {/* More options button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 p-1.5"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>More options</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Minimize button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 p-1.5"
                      onClick={() => setIsMinimized(true)}
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Minimize details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          {/* Top accent bar */}
          <motion.div 
            className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            initial={{ scaleX: 0.6, opacity: 0.7 }}
            whileHover={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ 
              transformOrigin: 'left',
              backgroundSize: '200% 100%',
              animation: 'gradient-shift 3s ease infinite'
            }}
          />
          
          <CardContent className="p-0">
            <div className={cn(
              "grid grid-cols-1 h-full transition-all duration-300",
              isMinimized ? "lg:grid-cols-1" : "lg:grid-cols-4"
            )}>
              {isMinimized ? (
                /* Minimized layout with details outside the box - entire container clickable */
                <div className="relative">
                  {/* Action button for minimized view */}
                  <div className="absolute top-3 right-3 z-20">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent expanding when clicking the button
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>More options</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div 
                    className="px-4 pt-6 pb-4 flex flex-col cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60" 
                    onClick={() => setIsMinimized(false)}
                  >
                  <div className="flex items-start gap-4">
                    {/* Logo section with centered logo */}
                    <div className="relative shrink-0">
                      {/* Square logo - Project/event/brand logo */}
                      <div className="h-16 w-16 rounded-xl border-2 border-white/20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-lg">
                        <img
                          src={(project as any).logo_url || 'https://placehold.co/80x80/EEE/999?text=Brand'}
                          alt={`${project.title} logo`}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/EEE/999?text=Brand';
                          }}
                        />
                      </div>
                      {/* Circle logo - Client's company logo */}
                      <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-800 shadow-md overflow-hidden flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                          <img
                            src={project.client_id && project.client ? 
                              ((project.client as any).logo_url || 'https://placehold.co/60x60/EEE/999?text=C')
                              : 
                              'https://placehold.co/60x60/EEE/999?text=C'
                            }
                            alt={project.client_id && project.client ?
                              `${(project.client as any).company_name || (project.client as any).name || 'Client'} logo`
                              :
                              'Client logo'
                            }
                            className="w-3/4 h-3/4 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/60x60/EEE/999?text=C';
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Project details in vertical layout */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold mb-1 truncate">{project.title}</h3>
                      {project.client && (
                        <div className="flex items-center text-slate-600 dark:text-slate-400 mb-2">
                          <Building className="h-3.5 w-3.5 mr-1 opacity-70" />
                          <span className="text-xs truncate">
                            {(project.client as any).name || (project.client as any).company_name}
                          </span>
                        </div>
                      )}
                      
                      {/* Inline details with icons */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {project.start_date === project.end_date
                              ? formatDate(project.start_date)
                              : project.end_date 
                                ? `${formatDate(project.start_date)} - ${formatDate(project.end_date)}`
                                : formatDate(project.start_date)
                            }
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {project.working_hours_start} - {project.working_hours_end}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{project.venue_address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom stats in horizontal layout */}
                  <div className="flex justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1">
                      <Kanban className="h-3.5 w-3.5 text-indigo-500" />
                      <span className="text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{tasks.length}</span>
                        <span className="text-slate-500 ml-1">Tasks</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{project.crew_count || 0}</span>
                        <span className="text-slate-500 ml-1">Crew</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Receipt className="h-3.5 w-3.5 text-purple-500" />
                      <span className="text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{expenseClaims.length}</span>
                        <span className="text-slate-500 ml-1">Claims</span>
                      </span>
                    </div>
                  </div>
                  </div>
                </div>
              ) : (
                // Original expanded layout with cards and sections
                <div className={cn(
                  "lg:col-span-1 p-6 lg:py-6 flex flex-col relative",
                  "border-r border-slate-200 dark:border-slate-700"
                )}>
                  {/* Centered Logo */}
                  <div className="flex flex-col items-center mb-6">
                    <motion.div 
                      className="relative mb-4"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {/* Square logo - Project/event/brand logo */}
                      <div className="h-20 w-20 rounded-xl border-2 border-white/20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-lg">
                        <img
                          src={(project as any).logo_url || 'https://placehold.co/80x80/EEE/999?text=Brand'}
                          alt={`${project.title} logo`}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/EEE/999?text=Brand';
                          }}
                        />
                      </div>
                      {/* Circle logo - Client's company logo */}
                      <div className="absolute -bottom-3 -right-3 h-12 w-12 rounded-full border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-800 shadow-md overflow-hidden flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                          <img
                            src={project.client_id && project.client ? 
                              ((project.client as any).logo_url || 'https://placehold.co/60x60/EEE/999?text=C')
                              : 
                              'https://placehold.co/60x60/EEE/999?text=C'
                            }
                            alt={project.client_id && project.client ?
                              `${(project.client as any).company_name || (project.client as any).name || 'Client'} logo`
                              :
                              'Client logo'
                            }
                            className="w-3/4 h-3/4 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/60x60/EEE/999?text=C';
                            }}
                          />
                        </div>
                      </div>
                      {/* Star icon in top-right */}
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                        <Sparkles className="w-5 h-5 text-amber-400 filter drop-shadow-lg" />
                      </span>
                    </motion.div>
                    
                    {/* Project Type Badges */}
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {/* Project type badge */}
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800 flex items-center gap-1.5">
                        <Package className="h-3 w-3" />
                        <span className="capitalize">{project.project_type || 'Custom'}</span>
                      </Badge>
                      
                      {/* Schedule type badge */}
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1.5">
                        {project.schedule_type === 'recurring' ? (
                          <Repeat className="h-3 w-3" />
                        ) : project.schedule_type === 'multiple' ? (
                          <CalendarDays className="h-3 w-3" />
                        ) : (
                          <Calendar className="h-3 w-3" />
                        )}
                        <span className="capitalize">{project.schedule_type || 'Single'}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Title & Client */}
                  <div className="text-center mb-5">
                    <h3 className="text-lg font-bold">{project.title}</h3>
                    {project.client && (
                      <div className="flex items-center justify-center text-slate-600 dark:text-slate-400 mt-1">
                        <Building className="h-4 w-4 mr-1.5 opacity-70" />
                        <span className="text-sm">
                          {(project.client as any).name || (project.client as any).company_name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Vertical Stack of Info Cards */}
                  <div className="space-y-4 mb-auto mx-auto w-full max-w-[240px]">
                    {/* Schedule Card - Minimal Version */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                      <h4 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-center mb-2">Schedule</h4>
                      
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-1.5 justify-center">
                          <Calendar className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">
                            {project.start_date === project.end_date
                              ? formatDate(project.start_date)
                              : project.end_date 
                                ? `${formatDate(project.start_date)} - ${formatDate(project.end_date)}`
                                : formatDate(project.start_date)
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 justify-center">
                          <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {project.working_hours_start} - {project.working_hours_end}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Location Card - Minimal Version */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                      <h4 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-center mb-2">Location</h4>
                      
                      <div className="flex items-center justify-center gap-1.5 mb-1.5">
                        <MapPin className="h-4 w-4 text-rose-500 flex-shrink-0" />
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{project.venue_address}</p>
                      </div>
                      
                      <div className="flex gap-2 justify-center">
                        <a 
                          href={getGoogleMapsLink(project.venue_address)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Maps
                        </a>
                        <a 
                          href={getWazeLink(project.venue_address)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Waze
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom Stats */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="flex justify-center">
                          <Kanban className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="text-xs mt-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{tasks.length}</span>
                          <span className="text-slate-500 ml-1">Tasks</span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex justify-center">
                          <Users className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="text-xs mt-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{project.crew_count || 0}</span>
                          <span className="text-slate-500 ml-1">Crew</span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex justify-center">
                          <Receipt className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="text-xs mt-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{expenseClaims.length}</span>
                          <span className="text-slate-500 ml-1">Claims</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* View Details Button */}
                  <motion.div
                    className="mt-4 max-w-[240px] mx-auto w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md border-0"
                      onClick={handleViewDetails}
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </motion.div>
                </div>
              )}
              
              {/* Right Content Section - 3/4 width */}
              {!isMinimized && (
                <div className="lg:col-span-3 relative">
                {/* Header with tabs */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                  <div className="flex items-center space-x-6">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Project Details</h4>
                    
                    {/* Horizontal Tab Menu */}
                    <div className="hidden sm:flex items-center">
                      <div className="border-r border-slate-200 dark:border-slate-700 h-6 mx-2"></div>
                      <div className="flex space-x-6 text-sm">
                        <button className="font-medium text-indigo-600 dark:text-indigo-400">Overview</button>
                        <button className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Schedule</button>
                        <button className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Team</button>
                        <button className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Budget</button>
                        <button className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Documents</button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons - Removed because we now have action buttons in top-right corner */}
                  <div className="flex items-center gap-1.5">
                    {/* Spacer to maintain layout */}
                  </div>
                </div>
                
                {/* Main Content Area */}
                <div className="p-6">
                  {/* Description */}
                  {project.description ? (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 flex items-center">
                        <FileText className="h-4 w-4 mr-1.5 text-blue-500" />
                        Description
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {project.description}
                      </p>
                    </div>
                  ) : null}
                  
                  {/* Project Stats / Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-medium text-slate-500">Tasks</h5>
                        <Badge className="text-xs bg-indigo-50 text-indigo-700">
                          {tasks.length}
                        </Badge>
                      </div>
                      <p className="text-lg font-semibold">{completedTasks} <span className="text-sm font-normal text-slate-500">completed</span></p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-medium text-slate-500">Documents</h5>
                        <Badge className="text-xs bg-blue-50 text-blue-700">
                          {documents.length}
                        </Badge>
                      </div>
                      <p className="text-lg font-semibold">{documents.length} <span className="text-sm font-normal text-slate-500">files</span></p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-medium text-slate-500">Expense Claims</h5>
                        <Badge className="text-xs bg-green-50 text-green-700">
                          {expenseClaims.length}
                        </Badge>
                      </div>
                      <p className="text-lg font-semibold">${expenseTotal.toFixed(0)} <span className="text-sm font-normal text-slate-500">total</span></p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-medium text-slate-500">Team</h5>
                        <Badge className="text-xs bg-purple-50 text-purple-700">
                          {contributors.length}
                        </Badge>
                      </div>
                      <p className="text-lg font-semibold">{contributors.length} <span className="text-sm font-normal text-slate-500">members</span></p>
                    </div>
                  </div>
                  
                  {/* Additional Content Area */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Progress Charts */}
                    <div className="lg:col-span-2 space-y-4">
                      {budget > 0 && (
                        <div className="bg-white dark:bg-slate-800/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 flex items-center">
                            <DollarSign className="h-4 w-4 text-green-500 mr-1.5" />
                            Budget Utilization
                          </h4>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-sm items-center">
                              <span>
                                <span className="font-medium">${expenseTotal.toFixed(0)}</span>
                                <span className="text-slate-500 ml-1">of ${budget}</span>
                              </span>
                              <span className="text-sm text-slate-500">{budgetUsedPercentage}%</span>
                            </div>
                            <Progress 
                              value={budgetUsedPercentage} 
                              className="h-2.5 bg-slate-100 dark:bg-slate-700"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-white dark:bg-slate-800/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 flex items-center">
                          <Users className="h-4 w-4 text-indigo-500 mr-1.5" />
                          Staffing Progress
                        </h4>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm items-center">
                            <span>
                              <span className="font-medium">{project.filled_positions}</span>
                              <span className="text-slate-500 ml-1">of {project.crew_count} positions</span>
                            </span>
                            <span className="text-sm text-slate-500">{progress}%</span>
                          </div>
                          <Progress 
                            value={progress} 
                            className="h-2.5 bg-slate-100 dark:bg-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Team Members Column */}
                    <div className="lg:col-span-1">
                      <div className="bg-white dark:bg-slate-800/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm h-full">
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 flex items-center justify-between">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 text-purple-500 mr-1.5" />
                            Team Members
                          </span>
                          <Badge className="text-xs bg-purple-50 text-purple-700">
                            {contributors.length}
                          </Badge>
                        </h4>
                        <div className="space-y-2">
                          {contributors.length > 0 ? 
                            contributors.slice(0, 4).map((contributor, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-700">
                                  <AvatarImage
                                    src={contributor.image || contributor.avatar}
                                    alt={contributor.name}
                                  />
                                  <AvatarFallback className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                    {contributor.name?.[0] || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium truncate">{contributor.name}</span>
                              </div>
                            )) : (
                              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No team members assigned</p>
                            )
                          }
                          {contributors.length > 4 && (
                            <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                              View All {contributors.length} Members
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bottom Progress Bar - Crew Filled */}
                <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-700 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Total budget: 
                      <span className="text-green-600 dark:text-green-400 ml-1">${budget || 0}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Status: 
                      </span>
                      <Badge className={cn("font-normal", statusColor)}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Subtle glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none" />
      </motion.div>
    </>
  );
}