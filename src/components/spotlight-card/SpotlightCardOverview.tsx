import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/ui/magic-card";
import { NeonGradientCard } from "@/components/ui/neon-gradient-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { cn } from "@/lib/utils";
import type { Project } from '@/lib/types';
import { statusGradients, priorityColors } from './constants';
import { EditProjectDetailsDialog } from './EditProjectDetailsDialog';
import {
  Activity,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  UserPlus,
  Receipt,
  CheckCircle,
  Edit
} from "lucide-react";

interface SpotlightCardOverviewProps {
  project: Project;
  tasks: unknown[];
  documents: unknown[];
  expenseClaims: unknown[];
}

export function SpotlightCardOverview({ 
  project, 
  tasks, 
  documents, 
  expenseClaims 
}: SpotlightCardOverviewProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(project);

  const recentActivity = [
    { icon: FileText, text: "New document uploaded", time: "2 hours ago", color: "text-blue-500" },
    { icon: UserPlus, text: "Staff member added", time: "5 hours ago", color: "text-green-500" },
    { icon: Receipt, text: "Expense claim submitted", time: "1 day ago", color: "text-purple-500" },
    { icon: CheckCircle, text: "Task completed", time: "2 days ago", color: "text-emerald-500" },
  ];

  useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  const handleProjectUpdate = (updatedProject: Project) => {
    setCurrentProject(updatedProject);
  };

  return (
    <div className="rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Details Card */}
        <MagicCard
          className="bg-white dark:bg-slate-800 shadow-sm"
          gradientColor="rgba(147, 51, 234, 0.1)"
          gradientSize={200}
          borderRadius={12}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                Project Information
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={cn(
                  "mt-1",
                  "bg-gradient-to-r",
                  statusGradients[currentProject.status.toLowerCase().replace(/_/g, '-')] || statusGradients['pending']
                )}>{currentProject.status.replace(/_/g, '-')}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <Badge className={cn(
                  "mt-1",
                  "bg-gradient-to-r",
                  priorityColors[currentProject.priority.toLowerCase()] || priorityColors['medium']
                )}>{currentProject.priority}</Badge>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-sm mt-1">{(currentProject as unknown).description || 'No description available'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Event Type</p>
              <p className="text-sm mt-1">{currentProject.event_type || 'Standard'}</p>
            </div>
          </CardContent>
        </MagicCard>
        
        {/* Stats Card */}
        <MagicCard
          className="bg-white dark:bg-slate-800 shadow-sm"
          gradientColor="rgba(99, 102, 241, 0.1)"
          gradientSize={200}
          borderRadius={12}
        >
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Project Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Team Progress</span>
              </div>
              <span className="font-semibold">{currentProject.filled_positions}/{currentProject.crew_count}</span>
            </div>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500"
                initial={{ width: "0%" }}
                animate={{ width: `${(currentProject.filled_positions / currentProject.crew_count) * 100}%` }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-sm">Budget Utilization</span>
              </div>
              <span className="font-semibold">${expenseClaims.reduce((sum, claim) => sum + (claim.amount || 0), 0).toLocaleString()}/${currentProject.budget?.toLocaleString()}</span>
            </div>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500"
                initial={{ width: "0%" }}
                animate={{ width: `${(expenseClaims.reduce((sum, claim) => sum + (claim.amount || 0), 0) / (currentProject.budget || 1)) * 100}%` }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <NeonGradientCard
                className="text-center p-4"
                borderRadius={12}
                borderSize={1}
                neonColors={{ firstColor: "#34d399", secondColor: "#10b981" }}
              >
                <motion.p 
                  className="text-2xl font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {tasks.filter(t => t.status === 'done').length}
                </motion.p>
                <p className="text-sm text-gray-500">Tasks Completed</p>
              </NeonGradientCard>
              <NeonGradientCard
                className="text-center p-4"
                borderRadius={12}
                borderSize={1}
                neonColors={{ firstColor: "#6366f1", secondColor: "#a78bfa" }}
              >
                <motion.p 
                  className="text-2xl font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {documents.length}
                </motion.p>
                <p className="text-sm text-gray-500">Documents</p>
              </NeonGradientCard>
            </div>
          </CardContent>
        </MagicCard>
      </div>
      
      {/* Recent Activity */}
      <ShineBorder
        className="mt-6"
        color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
        borderRadius={12}
        borderWidth={1}
      >
        <Card className="border-0 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-pink-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <activity.icon className={cn("h-4 w-4", activity.color)} />
                  <span className="text-sm flex-1">{activity.text}</span>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </ShineBorder>

      <EditProjectDetailsDialog
        project={currentProject}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onProjectUpdate={handleProjectUpdate}
      />
    </div>
  );
}