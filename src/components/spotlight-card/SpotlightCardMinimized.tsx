import React from 'react';
import { motion } from 'framer-motion';
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MagicCard } from "@/components/ui/magic-card";
import { NeonGradientCard } from "@/components/ui/neon-gradient-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ShineBorder } from "@/components/ui/shine-border";
import { TextAnimate } from "@/components/ui/text-animate";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign,
  Sparkles,
  Eye
} from "lucide-react";
import { formatDate } from '@/lib/utils';
import type { Project } from '@/lib/types';
import { statusGradients, priorityColors } from './constants';

interface SpotlightCardMinimizedProps {
  project: Project;
  onClick: () => void;
  onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  mousePosition: { x: number; y: number };
}

export function SpotlightCardMinimized({ 
  project, 
  onClick, 
  onMouseMove,
  mousePosition
}: SpotlightCardMinimizedProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  
  return (
    <motion.div
      ref={cardRef}
      className="relative rounded-2xl overflow-hidden cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.3 }}
      onMouseMove={onMouseMove}
      onClick={onClick}
    >
      <ShineBorder
        className="relative shadow-2xl"
        color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
        borderRadius={16}
        borderWidth={2}
      >
        <MagicCard
          className="transition-all duration-500 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden"
          gradientColor={priorityColors[project.priority] ? `rgba(${priorityColors[project.priority].replace('from-', '').replace('-400', '')}, 0.1)` : "rgba(147, 51, 234, 0.1)"}
          gradientSize={300}
          borderRadius={16}
        >
          {/* Animated gradient border */}
          <motion.div 
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            initial={{ scaleX: 0.3, opacity: 0 }}
            animate={{ scaleX: 0.6, opacity: 0.7 }}
            whileHover={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ 
              transformOrigin: 'left',
              backgroundSize: '200% 100%',
              animation: 'gradient-shift 3s ease infinite'
            }}
          />
          
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <TextAnimate
                      text={project.title}
                      type="fadeIn"
                      className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
                    />
                    <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {(project.client as any)?.name || (project.client as any)?.company_name}
                  </p>
                </div>
                
                <ShimmerButton
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "text-white font-medium",
                    `bg-gradient-to-r ${statusGradients[project.status] || statusGradients['pending']}`
                  )}
                >
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </ShimmerButton>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NeonGradientCard
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  borderRadius={12}
                  borderSize={1}
                  neonColors={{ firstColor: "#6366f1", secondColor: "#a78bfa" }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <span className="text-xs text-gray-500">Start</span>
                    </div>
                    <p className="font-semibold text-sm">{formatDate(project.start_date)}</p>
                  </div>
                </NeonGradientCard>
                
                <NeonGradientCard
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  borderRadius={12}
                  borderSize={1}
                  neonColors={{ firstColor: "#a78bfa", secondColor: "#e879f9" }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="h-5 w-5 text-purple-500" />
                      <span className="text-xs text-gray-500">Hours</span>
                    </div>
                    <p className="font-semibold text-sm">{project.working_hours_start} - {project.working_hours_end}</p>
                  </div>
                </NeonGradientCard>
                
                <NeonGradientCard
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  borderRadius={12}
                  borderSize={1}
                  neonColors={{ firstColor: "#34d399", secondColor: "#10b981" }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="h-5 w-5 text-green-500" />
                      <span className="text-xs text-gray-500">Staff</span>
                    </div>
                    <p className="font-semibold text-sm">{project.filled_positions || 0}/{project.crew_count || 0}</p>
                  </div>
                </NeonGradientCard>
                
                <NeonGradientCard
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  borderRadius={12}
                  borderSize={1}
                  neonColors={{ firstColor: "#10b981", secondColor: "#34d399" }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-5 w-5 text-emerald-500" />
                      <span className="text-xs text-gray-500">Budget</span>
                    </div>
                    <p className="font-semibold text-sm">${project.budget?.toLocaleString() || 0}</p>
                  </div>
                </NeonGradientCard>
              </div>
              
              {/* Location */}
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="h-5 w-5 text-rose-500" />
                <span className="text-sm line-clamp-1">{project.venue_address}</span>
              </div>
              
              {/* Progress bar with shimmer effect */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Project Progress</span>
                  <span className="font-medium">{Math.round((project.filled_positions / project.crew_count) * 100)}%</span>
                </div>
                <div className="relative h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(project.filled_positions / project.crew_count) * 100}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                  </motion.div>
                </div>
              </div>
              
              {/* Action hints */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </motion.div>
                  <span>Click to view details</span>
                </div>
              </div>
            </div>
          </CardContent>
        </MagicCard>
      </ShineBorder>
      
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </motion.div>
  );
}