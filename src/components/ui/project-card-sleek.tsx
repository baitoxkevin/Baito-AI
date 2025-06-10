import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ChartBar,
  FileText,
  MoreVertical,
  ArrowUpRight
} from "lucide-react";
import { formatDate } from '@/lib/utils';
import type { Project } from '@/lib/types';

interface ProjectCardSleekProps {
  project: Project;
  onProjectUpdated: () => void;
  onViewDetails?: (project: Project) => void;
  tasks?: unknown[];
  documents?: unknown[];
  expenseClaims?: unknown[];
}

export function ProjectCardSleek({ 
  project, 
  onProjectUpdated, 
  onViewDetails,
  tasks = [],
  documents = [],
  expenseClaims = []
}: ProjectCardSleekProps) {
  
  // Format dates for display
  const startDate = formatDate(project.start_date);
  const endDate = project.end_date ? formatDate(project.end_date) : null;
  
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(project);
    }
  };
  
  // Get initials for brand logo placeholder
  const getInitials = (text: string) => {
    return text
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 1);
  };
  
  // Get logos
  const brandLogo = (project as any).brand_logo || null;
  const clientLogo = project.client && (project.client as any).logo_url || null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="relative border shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden cursor-pointer"
        onClick={handleViewDetails}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            {/* Header with Logo and Title */}
            <div className="flex items-center gap-3">
              {/* Brand Logo with Client Logo overlay */}
              <div className="relative shrink-0">
                {/* Main square for brand logo */}
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center overflow-hidden shadow-sm">
                  {brandLogo ? (
                    <img
                      src={brandLogo}
                      alt={`${project.title} logo`}
                      className="w-full h-full object-contain p-1.5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={cn(
                    "text-lg font-bold text-slate-600 dark:text-slate-300",
                    brandLogo ? "hidden" : ""
                  )}>
                    {getInitials(project.title)}
                  </span>
                </div>
                
                {/* Client logo overlay - bottom right corner (always shown) */}
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white dark:bg-slate-800 p-0.5 shadow-sm transition-all duration-200 hover:h-8 hover:w-8 hover:-bottom-2 hover:-right-2 hover:z-10 cursor-pointer group">
                  <div className="h-full w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                    {clientLogo ? (
                      <img
                        src={clientLogo}
                        alt={`${(project.client as any)?.company_name || 'Client'} logo`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={cn(
                      "text-[8px] font-bold text-slate-600 dark:text-slate-300 transition-all group-hover:text-[10px]",
                      clientLogo ? "hidden" : ""
                    )}>
                      {project.client ? 
                        getInitials((project.client as any)?.company_name || (project.client as any)?.name || 'C').charAt(0) 
                        : 'C'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Title and PICs */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate text-left mb-2">
                  {project.title}
                </h3>
                
                {/* PIC Badges below title */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="px-2 py-0.5 text-xs bg-slate-50 dark:bg-slate-800">
                    {(project.client as any)?.pic_name || (project as any).client_pic || 'Not assigned'}
                  </Badge>
                  
                  <Badge variant="outline" className="px-2 py-0.5 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
                    {(project as any).baito_pic || (project as any).manager_name || 'Not assigned'}
                  </Badge>
                </div>
              </div>
              
              {/* Action Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails();
                }}
              >
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Divider */}
            <div className="h-px bg-slate-200 dark:bg-slate-700" />
            
            {/* Date, Time and Location with additional details */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  {startDate} - {endDate || startDate}
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  {project.filled_positions || 0} / {project.crew_count || 0} filled
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  {project.working_hours_start} - {project.working_hours_end}
                </span>
              </div>
              
              {project.budget && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-green-600 font-semibold">RM {(project as any).budget?.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex items-center gap-3 text-sm col-span-2">
                <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 truncate">
                  {project.venue_address || 'To be confirmed'}
                </span>
              </div>
            </div>
            
            {/* Divider */}
            <div className="h-px bg-slate-200 dark:bg-slate-700" />
            
            {/* Stats - Centered */}
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <ChartBar className="h-4 w-4 text-blue-500" />
                <div className="text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">{tasks.length}</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">Tasks</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                <div className="text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">{project.crew_count || 0}</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">Crew</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                <div className="text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">{expenseClaims.length}</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">Claims</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}