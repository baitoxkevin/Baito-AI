import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { NeonGradientCard } from "@/components/ui/neon-gradient-card";
import { 
  ClipboardCheck, 
  Users, 
  Receipt, 
  Calendar, 
  DollarSign, 
  FileText, 
  Clock,
  History
} from "lucide-react";

interface ProjectStatsCardProps {
  staffCount: number;
  tasksCount: number;
  claimsCount: number;
}

export function ProjectStatsTabCard({ staffCount, tasksCount, claimsCount }: ProjectStatsCardProps) {
  const [activeTab, setActiveTab] = React.useState<'schedule' | 'staffing' | 'tasks' | 'payroll' | 'expenses' | 'documents' | 'history'>('staffing');

  // Tab configuration with icons and labels
  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'staffing', label: 'Staffing', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: ClipboardCheck },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <div className="space-y-4">
      {/* Tabs Card */}
      <NeonGradientCard
        className="p-4 bg-white dark:bg-gray-800/90 overflow-hidden"
        borderRadius={12}
        borderSize={1}
        neonColors={{ firstColor: "#A07CFE", secondColor: "#FE8FB5" }}
      >
        {/* Tab Navigation - Scrollable for many tabs */}
        <div className="flex overflow-x-auto pb-1 scrollbar-hide border-b border-gray-200 dark:border-gray-700 mb-4 relative">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`flex-shrink-0 py-2 px-3 mr-2 text-xs font-medium text-center transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-purple-600 dark:text-purple-400 relative'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id as unknown)}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="tab-highlight"
                  className="absolute bottom-[-5px] left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              <div className={`flex items-center justify-center gap-1.5 ${
                activeTab === tab.id ? 'scale-105' : ''
              }`}>
                {React.createElement(tab.icon, { 
                  className: `h-3.5 w-3.5 ${activeTab === tab.id ? 'text-purple-500' : ''}` 
                })}
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div className="min-h-[200px]">
          {/* Staffing Tab Content */}
          {activeTab === 'staffing' && (
            <div className="grid grid-cols-2 gap-3">
              {/* Confirmed Staff */}
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-2 text-center border border-gray-100 dark:border-gray-800">
                <div className="font-semibold text-lg text-blue-600 dark:text-blue-400">{staffCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Confirmed Staff</div>
              </div>
              
              {/* Required Positions */}
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-2 text-center border border-gray-100 dark:border-gray-800">
                <div className="font-semibold text-lg text-indigo-600 dark:text-indigo-400">21</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Required Positions</div>
              </div>
              
              {/* Staff Progress */}
              <div className="col-span-2 mt-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Staffing Progress</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {staffCount}/21
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (staffCount / 21) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Role Breakdown */}
              <div className="col-span-2 mt-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Role Breakdown</div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Event Coordinators</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">2/3</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Sound Engineers</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">1/2</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Stage Crew</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">1/3</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Schedule Tab Content */}
          {activeTab === 'schedule' && (
            <div className="space-y-3 py-2">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dec 15, 2023 - Dec 20, 2023</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">9:00 AM - 5:00 PM</span>
                </div>
                
                {/* Schedule Timeline */}
                <div className="mt-2">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Daily Schedule</div>
                  <div className="space-y-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => (
                      <div key={day} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-500 dark:text-gray-400">{day}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">9:00 AM - 5:00 PM</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Tasks Tab Content */}
          {activeTab === 'tasks' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Recent Tasks</span>
                <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
                  {tasksCount} Total
                </Badge>
              </div>
              
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-white dark:bg-gray-900/50 p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      Complete venue setup inspection
                    </span>
                    <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 text-xs px-1">
                      Todo
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Due in 2 days</div>
                </div>
                
                <div className="bg-white dark:bg-gray-900/50 p-2">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      Finalize equipment list
                    </span>
                    <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 text-xs px-1">
                      Done
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed yesterday</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Payroll Tab Content */}
          {activeTab === 'payroll' && (
            <div className="space-y-3 py-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Payroll Summary</span>
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 text-xs">
                  Active
                </Badge>
              </div>
              
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Total Budget</span>
                  <span className="font-medium text-sm text-gray-700 dark:text-gray-300">$12,500</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Allocated</span>
                  <span className="font-medium text-sm text-gray-700 dark:text-gray-300">$9,200</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Remaining</span>
                  <span className="font-medium text-sm text-green-600 dark:text-green-400">$3,300</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Expenses Tab Content */}
          {activeTab === 'expenses' && (
            <div className="space-y-3 py-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Expense Claims</span>
                <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
                  {claimsCount} Total
                </Badge>
              </div>
              
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-white dark:bg-gray-900/50 p-2">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      Event supplies
                    </span>
                    <span className="font-medium text-xs text-gray-700 dark:text-gray-300">$245.00</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Submitted by Alex</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Total expenses</span>
                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">$245.00</span>
              </div>
            </div>
          )}
          
          {/* Documents Tab Content */}
          {activeTab === 'documents' && (
            <div className="space-y-3 py-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Project Documents</span>
                <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
                  3 Files
                </Badge>
              </div>
              
              <div className="space-y-2">
                {["Event Brief.pdf", "Equipment List.xlsx", "Venue Layout.jpg"].map(file => (
                  <div key={file} className="flex items-center justify-between bg-white dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{file}</span>
                    </div>
                    <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* History Tab Content */}
          {activeTab === 'history' && (
            <div className="space-y-3 py-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Recent Activity</span>
              </div>
              
              <div className="space-y-3">
                {[
                  { action: "Staff added", user: "Maria", time: "2 hours ago" },
                  { action: "Document uploaded", user: "John", time: "Yesterday" },
                  { action: "Budget updated", user: "Admin", time: "2 days ago" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <div>
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.action}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        by {item.user} · {item.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </NeonGradientCard>
      
      {/* Stats Summary Card */}
      <NeonGradientCard
        className="py-4 px-2 bg-white dark:bg-gray-800/80 overflow-hidden"
        borderRadius={10}
        borderSize={1}
        neonColors={{ firstColor: "#3B82F6", secondColor: "#8B5CF6" }}
      >
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex flex-1 justify-center items-center flex-col"
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-2 mb-1.5">
              <ClipboardCheck className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{tasksCount}</span>
              <span className="text-xs text-gray-500">Tasks</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex flex-1 justify-center items-center flex-col"
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 mb-1.5">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{staffCount}</span>
              <span className="text-xs text-gray-500">Crew</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex flex-1 justify-center items-center flex-col"
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2 mb-1.5">
              <Receipt className="h-4 w-4 text-purple-500" />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg text-purple-600 dark:text-purple-400">{claimsCount}</span>
              <span className="text-xs text-gray-500">Claims</span>
            </div>
          </motion.div>
        </div>
      </NeonGradientCard>
    </div>
  );
}