import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ShineBorder } from "@/components/ui/shine-border";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  Receipt,
  DollarSign,
  Minus,
  CheckCircle,
  X,
  Plus,
  Eye,
  Banknote,
  Shield,
  MoreVertical,
  ClipboardCheck
} from "lucide-react";

interface ExpenseClaimsViewProps {
  project: any;
  onMinimize: () => void;
  onViewDetails: () => void;
}

export function ExpenseClaimsView({ project, onMinimize, onViewDetails }: ExpenseClaimsViewProps) {
  const [activeTab, setActiveTab] = React.useState('claims');

  return (
    <div className="max-w-[1200px] mx-auto rounded-xl bg-white dark:bg-slate-800 shadow-md flex flex-col md:flex-row overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-full md:w-[280px] border-r border-gray-200 dark:border-gray-700 flex flex-col p-6 space-y-6">
        <div className="relative flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl shadow-md flex items-center justify-center text-gray-400 dark:text-gray-500 font-semibold text-lg relative">
            Brand
            <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400" />
          </div>
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center text-3xl font-bold text-gray-600 dark:text-gray-300">
            {(project.client as any)?.name?.charAt(0) || 'C'}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 rounded-full"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex justify-center gap-3 mt-12">
          <Badge className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-5 py-2 rounded-full font-medium">
            <Shield className="h-4 w-4 mr-2" />
            Recruitment
          </Badge>
          <Badge className="bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-5 py-2 rounded-full font-medium">
            <Calendar className="h-4 w-4 mr-2" />
            Single
          </Badge>
        </div>
        
        <h3 className="text-center font-bold text-lg leading-tight">
          {project.title}
        </h3>
        
        <div className="bg-[#f9faff] dark:bg-gray-900/50 rounded-xl p-5 text-center space-y-2">
          <h4 className="font-semibold text-purple-600 text-lg">Schedule</h4>
          <div className="flex justify-center items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{project.start_date} - {project.end_date || project.start_date}</span>
          </div>
          <div className="flex justify-center items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
            <Clock className="h-4 w-4" />
            <span>{project.working_hours_start} - {project.working_hours_end}</span>
          </div>
        </div>
        
        <div className="bg-[#f9faff] dark:bg-gray-900/50 rounded-xl p-5 text-center space-y-2">
          <h4 className="font-semibold text-purple-600 text-lg">Location</h4>
          <div className="flex justify-center items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
            <MapPin className="h-4 w-4 text-red-500" />
            <span>{project.venue_address}</span>
          </div>
          <div className="flex justify-center gap-2 mt-1">
            <Button variant="ghost" size="sm" className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
              <MapPin className="h-4 w-4 mr-1" />
              Maps
            </Button>
            <Button variant="ghost" size="sm" className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
              <ExternalLink className="h-4 w-4 mr-1" />
              Waze
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="flex flex-col items-center gap-1">
              <ClipboardCheck className="h-5 w-5 text-indigo-600" />
              <span className="text-xl font-bold text-gray-800 dark:text-white">0</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Tasks</p>
          </div>
          <div className="text-center">
            <div className="flex flex-col items-center gap-1">
              <Users className="h-5 w-5 text-indigo-600" />
              <span className="text-xl font-bold text-gray-800 dark:text-white">3</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Crew</p>
          </div>
          <div className="text-center">
            <div className="flex flex-col items-center gap-1">
              <Receipt className="h-5 w-5 text-purple-600" />
              <span className="text-xl font-bold text-gray-800 dark:text-white">9</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Claims</p>
          </div>
        </div>
        
        <Button
          className="w-full bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 text-white font-medium h-14 rounded-2xl shadow-lg"
          onClick={onViewDetails}
        >
          <ArrowUpRight className="h-5 w-5 mr-2" />
          View Details
        </Button>
      </aside>

      {/* Right Content */}
      <main className="flex-1 p-6 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700 flex items-center gap-6 pb-3">
          <h2 className="font-bold text-gray-900 dark:text-white">Project Details</h2>
          <nav className="flex gap-6 text-gray-600 dark:text-gray-400 text-sm font-semibold">
            <button className="hover:text-gray-900 dark:hover:text-white">Overview</button>
            <button className="hover:text-gray-900 dark:hover:text-white">Schedule</button>
            <button className="hover:text-gray-900 dark:hover:text-white">Staffing</button>
            <button className="hover:text-gray-900 dark:hover:text-white">Tasks</button>
            <button className="hover:text-gray-900 dark:hover:text-white">Documents</button>
            <button className="text-indigo-700 dark:text-indigo-400 font-semibold">Expenses</button>
          </nav>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMinimize}
            className="ml-auto rounded-full"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-sm w-auto">
              <TabsTrigger 
                value="payroll" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-md data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400 transition-all duration-200 font-medium rounded-md"
              >
                <div className="relative">
                  <Banknote className="h-4 w-4" />
                  {activeTab !== 'payroll' && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span>Staff Payroll</span>
              </TabsTrigger>
              <TabsTrigger 
                value="claims"
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-md data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 transition-all duration-200 font-medium rounded-md"
              >
                <div className="relative">
                  <Receipt className="h-4 w-4" />
                  {activeTab !== 'claims' && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span>Expense Claims</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payroll" className="mt-4">
              <div className="text-center py-8 text-gray-500">
                Staff Payroll content goes here
              </div>
            </TabsContent>

            <TabsContent value="claims" className="mt-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                  <Receipt className="h-5 w-5 text-emerald-500" />
                  <span>Expense Claims</span>
                  <Badge variant="secondary">9</Badge>
                </h3>
                <ShimmerButton>
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Claim
                  </>
                </ShimmerButton>
              </div>

              <div className="overflow-x-auto min-h-[300px] border border-gray-100 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900">
                {/* Table content would go here */}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-col sm:flex-row justify-between items-center text-gray-800 dark:text-gray-200 font-semibold text-sm">
                <div>
                  Budget:
                  <span className="text-green-600 dark:text-green-400 ml-2">${project.budget?.toLocaleString() || 0}</span>
                  <span className="mx-2">·</span>
                  Cost:
                  <span className="text-red-600 dark:text-red-400">$29,911.00</span>
                </div>
                <div className="mt-2 sm:mt-0">
                  Status:
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {project.status}
                  </Badge>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default ExpenseClaimsView;