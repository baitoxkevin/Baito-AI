import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Users, Calendar, DollarSign, BarChart3, Download, Printer, Share2, Edit, Save, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Import original components so they can still be used separately
import StaffingTab from '@/components/project-form/StaffingTab';
import { ProjectPayroll } from '@/components/project-payroll';

interface StaffMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  designation: string;
  position?: string;
  photo?: string;
  status: 'confirmed' | 'pending' | 'rejected' | 'hold';
  bank_name?: string;
  bank_account_number?: string;
  bankName?: string;
  bankAccountNumber?: string;
  workingDates: Date[];
  workingDatesWithSalary: WorkingDateWithSalary[];
}

interface WorkingDateWithSalary {
  date: Date;
  basicSalary?: string;
  claims?: string;
  commission?: string;
}

interface IntegratedStaffingPayrollProps {
  projectId: string;
  projectStartDate: Date;
  projectEndDate: Date;
  budget?: number;
  showSeparateViews?: boolean; // To toggle between integrated and separate views
}

export function IntegratedStaffingPayroll({
  projectId,
  projectStartDate,
  projectEndDate,
  budget = 10000,
  showSeparateViews = true
}: IntegratedStaffingPayrollProps) {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('staff-list');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  
  // For separate view toggle
  const [viewMode, setViewMode] = useState<'integrated' | 'separate'>('integrated');
  
  // Fetch staff members for the project
  useEffect(() => {
    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const { data, error } = await supabase
          .from('project_staff')
          .select(`
            *,
            candidate:candidates(
              id,
              full_name,
              profile_photo,
              email,
              phone_number,
              bank_name,
              bank_account_number,
              bank_account_name
            )
          `)
          .eq('project_id', projectId);
          
        if (error) throw error;
        
        // Transform to our internal format
        const transformedStaff = data?.map(staff => ({
          id: staff.id,
          name: staff.candidate?.full_name || staff.name || 'Unknown',
          email: staff.candidate?.email,
          phone: staff.candidate?.phone_number,
          designation: staff.position || 'Crew',
          position: staff.position,
          photo: staff.candidate?.profile_photo,
          status: (staff.status as any) || 'confirmed',
          bank_name: staff.candidate?.bank_name,
          bank_account_number: staff.candidate?.bank_account_number,
          bankName: staff.candidate?.bank_name,
          bankAccountNumber: staff.candidate?.bank_account_number,
          workingDates: (staff.working_dates || []).map(d => new Date(d)),
          workingDatesWithSalary: (staff.working_dates_with_salary || []).map(item => ({
            date: new Date(item.date),
            basicSalary: item.basicSalary || item.day_rate || '0',
            claims: item.claims || '0',
            commission: item.commission || '0'
          }))
        })) || [];
        
        // Use dummy data if no staff found
        setStaffMembers(transformedStaff.length > 0 ? transformedStaff : getDummyStaffData());
      } catch (error) {
        console.error('Error fetching staff:', error);
        setStaffMembers(getDummyStaffData());
        toast({
          title: "Error loading staff data",
          description: "Using sample data instead",
          variant: "destructive"
        });
      } finally {
        setLoadingStaff(false);
      }
    };
    
    fetchStaff();
  }, [projectId, toast]);
  
  // Calculate financial summaries
  const financialSummary = useMemo(() => {
    let totalWages = 0;
    let totalClaims = 0;
    let totalCommission = 0;
    let totalDays = 0;
    
    staffMembers.forEach(staff => {
      staff.workingDatesWithSalary.forEach(day => {
        totalWages += parseFloat(day.basicSalary || '0');
        totalClaims += parseFloat(day.claims || '0');
        totalCommission += parseFloat(day.commission || '0');
        totalDays++;
      });
    });
    
    const totalCost = totalWages + totalClaims + totalCommission;
    
    return {
      totalWages,
      totalClaims,
      totalCommission,
      totalCost,
      budgetUtilization: budget > 0 ? (totalCost / budget) * 100 : 0,
      costPerDay: totalDays > 0 ? totalCost / totalDays : 0,
      totalDays
    };
  }, [staffMembers, budget]);
  
  // Toggle staff selection for bulk operations
  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaff(prev => {
      if (prev.includes(staffId)) {
        return prev.filter(id => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
  };
  
  // Calculate staff totals
  const getStaffTotals = (staff: StaffMember) => {
    let totalBasic = 0;
    let totalClaims = 0;
    let totalCommission = 0;
    
    staff.workingDatesWithSalary.forEach(day => {
      totalBasic += parseFloat(day.basicSalary || '0');
      totalClaims += parseFloat(day.claims || '0');
      totalCommission += parseFloat(day.commission || '0');
    });
    
    return {
      totalBasic,
      totalClaims,
      totalCommission,
      grandTotal: totalBasic + totalClaims + totalCommission,
      days: staff.workingDatesWithSalary.length
    };
  };
  
  // Get unique dates from all staff schedules
  const allWorkingDates = useMemo(() => {
    const dates = new Set<string>();
    
    staffMembers.forEach(staff => {
      staff.workingDatesWithSalary.forEach(day => {
        dates.add(format(day.date, 'yyyy-MM-dd'));
      });
    });
    
    return Array.from(dates)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());
  }, [staffMembers]);
  
  // Calculate daily totals for all staff
  const dailyTotals = useMemo(() => {
    const totals: Record<string, {basic: number, claims: number, commission: number, total: number}> = {};
    
    allWorkingDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      totals[dateStr] = {basic: 0, claims: 0, commission: 0, total: 0};
      
      staffMembers.forEach(staff => {
        const dayData = staff.workingDatesWithSalary.find(
          day => format(day.date, 'yyyy-MM-dd') === dateStr
        );
        
        if (dayData) {
          totals[dateStr].basic += parseFloat(dayData.basicSalary || '0');
          totals[dateStr].claims += parseFloat(dayData.claims || '0');
          totals[dateStr].commission += parseFloat(dayData.commission || '0');
          totals[dateStr].total = totals[dateStr].basic + totals[dateStr].claims + totals[dateStr].commission;
        }
      });
    });
    
    return totals;
  }, [staffMembers, allWorkingDates]);
  
  // Mock function for saving changes
  const handleSaveChanges = () => {
    toast({
      title: "Changes saved",
      description: "Staff and payroll information has been updated",
      variant: "default"
    });
  };
  
  // Mock function for exporting data
  const handleExport = (type: 'excel' | 'pdf' | 'csv') => {
    toast({
      title: `Export as ${type.toUpperCase()}`,
      description: "Your file is being prepared for download",
      variant: "default"
    });
  };
  
  if (loadingStaff) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
        <p className="text-purple-700">Loading staff and payroll data...</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {/* View Mode Toggle */}
      {showSeparateViews && (
        <div className="flex justify-end mb-4">
          <Tabs 
            value={viewMode} 
            onValueChange={(v) => setViewMode(v as 'integrated' | 'separate')}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="integrated" className="px-4">
                Integrated View
              </TabsTrigger>
              <TabsTrigger value="separate" className="px-4">
                Separate Views
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
      
      {/* Integrated Staff & Payroll View */}
      {(!showSeparateViews || viewMode === 'integrated') && (
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-500" />
              Staff & Payroll
            </CardTitle>
            <CardDescription>
              Manage team members and payroll in one seamless interface
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4">
            {/* View type navigation */}
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div className="flex gap-2">
                <Button 
                  variant={activeView === 'staff-list' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveView('staff-list')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Staff List
                </Button>
                <Button 
                  variant={activeView === 'calendar' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveView('calendar')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
                <Button 
                  variant={activeView === 'payment-matrix' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveView('payment-matrix')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Payment Matrix
                </Button>
                <Button 
                  variant={activeView === 'financial-summary' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveView('financial-summary')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Financial Summary
                </Button>
              </div>
              
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </div>
            
            {/* Staff List View */}
            {activeView === 'staff-list' && (
              <div className="space-y-4">
                {staffMembers.map(staff => {
                  const totals = getStaffTotals(staff);
                  
                  return (
                    <div 
                      key={staff.id} 
                      className={cn(
                        "border rounded-lg p-4 transition-colors",
                        selectedStaff.includes(staff.id) ? "border-purple-500 bg-purple-50" : "hover:border-purple-200"
                      )}
                    >
                      <div className="flex justify-between">
                        <div className="flex gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={staff.photo} alt={staff.name} />
                            <AvatarFallback className="bg-purple-200 text-purple-700">
                              {staff.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="font-medium text-lg">{staff.name}</div>
                            <div className="text-gray-500 text-sm">{staff.email}</div>
                            <div className="mt-1 flex gap-2">
                              <Badge variant="outline">{staff.designation}</Badge>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                                {staff.status === 'confirmed' ? 'Confirmed' : staff.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-right">
                          <div>Working Dates: {totals.days} days</div>
                          <div>
                            {staff.workingDatesWithSalary.length > 0 && 
                              `${format(staff.workingDatesWithSalary[0].date, 'MMM d')} - 
                               ${format(staff.workingDatesWithSalary[staff.workingDatesWithSalary.length-1].date, 'MMM d, yyyy')}`
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <div className="text-sm text-gray-500">Day Rate</div>
                            <div className="font-medium">${totals.totalBasic.toFixed(0)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Claims</div>
                            <div className="font-medium">${totals.totalClaims.toFixed(0)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Commission</div>
                            <div className="font-medium">${totals.totalCommission.toFixed(0)}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Total Payment</div>
                            <div className="font-medium text-lg">${totals.grandTotal.toFixed(0)}</div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">View Details</Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit Salary
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => toggleStaffSelection(staff.id)}
                              className="h-8 w-8"
                            >
                              {selectedStaff.includes(staff.id) ? 
                                <CheckCircle2 className="h-5 w-5 text-purple-500" /> : 
                                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                              }
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="font-medium">
                    Project Totals: ${financialSummary.totalCost.toFixed(0)}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" disabled={selectedStaff.length === 0}>
                      Bulk Edit
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button onClick={handleSaveChanges}>
                      <Save className="h-4 w-4 mr-2" />
                      Save All
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Calendar View */}
            {activeView === 'calendar' && (
              <div className="border rounded-lg p-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium">March 2025</h3>
                  <div className="flex justify-center gap-2 mt-1">
                    <Button variant="ghost" size="icon">
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">Today</Button>
                    <Button variant="ghost" size="icon">
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days - simplified mock data */}
                  {Array.from({ length: 35 }).map((_, index) => {
                    const day = index + 1;
                    const isInMonth = day <= 31;
                    const hasStaff = isInMonth && day >= 10 && day <= 14;
                    const isWeekend = index % 7 === 0 || index % 7 === 6;
                    
                    return (
                      <div 
                        key={`day-${index}`} 
                        className={cn(
                          "border rounded-md p-2 min-h-[80px] relative",
                          isInMonth ? "bg-white" : "bg-gray-50 opacity-50",
                          hasStaff ? "bg-purple-50" : "",
                          isWeekend ? "bg-gray-50" : ""
                        )}
                      >
                        <div className="text-right text-sm">{isInMonth ? day : ''}</div>
                        
                        {/* Staff avatars for days with assignments */}
                        {hasStaff && day === 10 && (
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex justify-center">
                              <AvatarGroup>
                                <Avatar className="h-6 w-6 border-2 border-white">
                                  <AvatarFallback className="text-[8px] bg-blue-100">SJ</AvatarFallback>
                                </Avatar>
                                <Avatar className="h-6 w-6 border-2 border-white">
                                  <AvatarFallback className="text-[8px] bg-green-100">MC</AvatarFallback>
                                </Avatar>
                              </AvatarGroup>
                            </div>
                            <div className="text-xs text-center font-medium mt-1">$1,100</div>
                          </div>
                        )}
                        
                        {hasStaff && day === 11 && (
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex justify-center">
                              <AvatarGroup>
                                <Avatar className="h-6 w-6 border-2 border-white">
                                  <AvatarFallback className="text-[8px] bg-blue-100">SJ</AvatarFallback>
                                </Avatar>
                                <Avatar className="h-6 w-6 border-2 border-white">
                                  <AvatarFallback className="text-[8px] bg-green-100">MC</AvatarFallback>
                                </Avatar>
                              </AvatarGroup>
                            </div>
                            <div className="text-xs text-center font-medium mt-1">$1,100</div>
                          </div>
                        )}
                        
                        {hasStaff && day === 12 && (
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex justify-center">
                              <AvatarGroup>
                                <Avatar className="h-6 w-6 border-2 border-white">
                                  <AvatarFallback className="text-[8px] bg-blue-100">SJ</AvatarFallback>
                                </Avatar>
                                <Avatar className="h-6 w-6 border-2 border-white">
                                  <AvatarFallback className="text-[8px] bg-green-100">MC</AvatarFallback>
                                </Avatar>
                              </AvatarGroup>
                            </div>
                            <div className="text-xs text-center font-medium mt-1">$1,100</div>
                          </div>
                        )}
                        
                        {hasStaff && day === 13 && (
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex justify-center">
                              <Avatar className="h-6 w-6 border-2 border-white">
                                <AvatarFallback className="text-[8px] bg-blue-100">SJ</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="text-xs text-center font-medium mt-1">$500</div>
                          </div>
                        )}
                        
                        {hasStaff && day === 14 && (
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex justify-center">
                              <Avatar className="h-6 w-6 border-2 border-white">
                                <AvatarFallback className="text-[8px] bg-blue-100">SJ</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="text-xs text-center font-medium mt-1">$500</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Day View</Button>
                    <Button variant="outline" size="sm">Week View</Button>
                    <Button variant="default" size="sm">Month View</Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Calendar
                    </Button>
                    <Button size="sm" onClick={handleSaveChanges}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Payment Matrix View */}
            {activeView === 'payment-matrix' && (
              <div className="border rounded-lg p-4">
                <ScrollArea className="h-[500px]">
                  <div className="w-max min-w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px] bg-gray-50 sticky left-0 z-10">Staff Member</TableHead>
                          {allWorkingDates.map(date => (
                            <TableHead key={date.toISOString()} className="text-center min-w-[100px]">
                              {format(date, 'MMM d')}
                            </TableHead>
                          ))}
                          <TableHead className="text-center bg-purple-50">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffMembers.map(staff => {
                          const totals = getStaffTotals(staff);
                          
                          return (
                            <React.Fragment key={staff.id}>
                              {/* Staff name row */}
                              <TableRow className="bg-gray-50">
                                <TableCell className="font-medium sticky left-0 z-10 bg-gray-50">
                                  {staff.name}
                                </TableCell>
                                {allWorkingDates.map(date => (
                                  <TableCell 
                                    key={`${staff.id}-${date.toISOString()}-header`}
                                    className="text-center"
                                  ></TableCell>
                                ))}
                                <TableCell className="bg-purple-50"></TableCell>
                              </TableRow>
                              
                              {/* Day rate row */}
                              <TableRow>
                                <TableCell className="text-sm text-gray-500 pl-6 sticky left-0 z-10 bg-white">
                                  Day Rate
                                </TableCell>
                                {allWorkingDates.map(date => {
                                  const dateStr = format(date, 'yyyy-MM-dd');
                                  const dayData = staff.workingDatesWithSalary.find(
                                    day => format(day.date, 'yyyy-MM-dd') === dateStr
                                  );
                                  
                                  return (
                                    <TableCell 
                                      key={`${staff.id}-${date.toISOString()}-basic`}
                                      className="text-center"
                                    >
                                      {dayData ? `$${dayData.basicSalary}` : '-'}
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-center font-medium bg-purple-50">
                                  ${totals.totalBasic.toFixed(0)}
                                </TableCell>
                              </TableRow>
                              
                              {/* Claims row */}
                              <TableRow>
                                <TableCell className="text-sm text-gray-500 pl-6 sticky left-0 z-10 bg-white">
                                  Claims
                                </TableCell>
                                {allWorkingDates.map(date => {
                                  const dateStr = format(date, 'yyyy-MM-dd');
                                  const dayData = staff.workingDatesWithSalary.find(
                                    day => format(day.date, 'yyyy-MM-dd') === dateStr
                                  );
                                  
                                  return (
                                    <TableCell 
                                      key={`${staff.id}-${date.toISOString()}-claims`}
                                      className="text-center"
                                    >
                                      {dayData && parseFloat(dayData.claims || '0') > 0 ? 
                                        `$${dayData.claims}` : '-'}
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-center font-medium bg-purple-50">
                                  ${totals.totalClaims.toFixed(0)}
                                </TableCell>
                              </TableRow>
                              
                              {/* Commission row */}
                              <TableRow>
                                <TableCell className="text-sm text-gray-500 pl-6 sticky left-0 z-10 bg-white">
                                  Commission
                                </TableCell>
                                {allWorkingDates.map(date => {
                                  const dateStr = format(date, 'yyyy-MM-dd');
                                  const dayData = staff.workingDatesWithSalary.find(
                                    day => format(day.date, 'yyyy-MM-dd') === dateStr
                                  );
                                  
                                  return (
                                    <TableCell 
                                      key={`${staff.id}-${date.toISOString()}-commission`}
                                      className="text-center"
                                    >
                                      {dayData && parseFloat(dayData.commission || '0') > 0 ? 
                                        `$${dayData.commission}` : '-'}
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-center font-medium bg-purple-50">
                                  ${totals.totalCommission.toFixed(0)}
                                </TableCell>
                              </TableRow>
                              
                              {/* Daily total row */}
                              <TableRow className="border-b-2 border-gray-200">
                                <TableCell className="font-medium pl-6 sticky left-0 z-10 bg-white">
                                  Daily Total
                                </TableCell>
                                {allWorkingDates.map(date => {
                                  const dateStr = format(date, 'yyyy-MM-dd');
                                  const dayData = staff.workingDatesWithSalary.find(
                                    day => format(day.date, 'yyyy-MM-dd') === dateStr
                                  );
                                  
                                  let total = 0;
                                  if (dayData) {
                                    total += parseFloat(dayData.basicSalary || '0');
                                    total += parseFloat(dayData.claims || '0');
                                    total += parseFloat(dayData.commission || '0');
                                  }
                                  
                                  return (
                                    <TableCell 
                                      key={`${staff.id}-${date.toISOString()}-total`}
                                      className="text-center font-medium"
                                    >
                                      {total > 0 ? `$${total}` : '-'}
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-center font-medium bg-purple-50">
                                  ${totals.grandTotal.toFixed(0)}
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                        
                        {/* Project daily totals */}
                        <TableRow className="bg-purple-50 font-medium">
                          <TableCell className="sticky left-0 z-10 bg-purple-50">
                            Daily Project Total
                          </TableCell>
                          {allWorkingDates.map(date => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const dayTotal = dailyTotals[dateStr]?.total || 0;
                            
                            return (
                              <TableCell 
                                key={`daily-total-${date.toISOString()}`}
                                className="text-center"
                              >
                                ${dayTotal.toFixed(0)}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center bg-purple-100">
                            ${financialSummary.totalCost.toFixed(0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
                
                <div className="flex justify-between items-center mt-4">
                  <Button variant="outline" size="sm">
                    Apply Bulk Rates
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export to Excel
                    </Button>
                    <Button onClick={handleSaveChanges}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Financial Summary View */}
            {activeView === 'financial-summary' && (
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Staff Costs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Wages:</span>
                        <span className="font-medium">${financialSummary.totalWages.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Claims:</span>
                        <span className="font-medium">${financialSummary.totalClaims.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Commissions:</span>
                        <span className="font-medium">${financialSummary.totalCommission.toFixed(0)}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between font-medium">
                        <span>Total Staff Cost:</span>
                        <span>${financialSummary.totalCost.toFixed(0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Financial Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Budget:</span>
                        <span className="font-medium">${budget.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Balance:</span>
                        <span className="font-medium">${(budget - financialSummary.totalCost).toFixed(0)}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Budget Utilization:</span>
                          <span className="font-medium">
                            {financialSummary.budgetUtilization.toFixed(0)}%
                          </span>
                        </div>
                        <Progress 
                          value={financialSummary.budgetUtilization} 
                          className="h-2"
                          indicatorClassName={cn(
                            financialSummary.budgetUtilization > 90 ? "bg-red-500" :
                            financialSummary.budgetUtilization > 75 ? "bg-yellow-500" :
                            "bg-green-500"
                          )}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cost Per Day:</span>
                        <span className="font-medium">
                          ${financialSummary.costPerDay.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[200px] flex items-center justify-center">
                    {/* Mock pie chart - in a real implementation, use a chart library */}
                    <div className="w-[180px] h-[180px] rounded-full relative bg-gray-100 flex items-center justify-center">
                      <div 
                        className="absolute inset-0 rounded-full bg-blue-400"
                        style={{ 
                          clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)'
                        }}
                      ></div>
                      <div 
                        className="absolute inset-0 rounded-full bg-green-400"
                        style={{ 
                          clipPath: 'polygon(50% 50%, 100% 0%, 100% 25%, 50% 25%)'
                        }}
                      ></div>
                      <div 
                        className="absolute inset-0 rounded-full bg-purple-400"
                        style={{ 
                          clipPath: 'polygon(50% 50%, 100% 25%, 100% 35%, 50% 35%)'
                        }}
                      ></div>
                      <div className="w-[120px] h-[120px] rounded-full bg-white flex items-center justify-center">
                        <div className="text-sm text-center">
                          <div className="font-medium">Total</div>
                          <div>${financialSummary.totalCost.toFixed(0)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-12 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-400 rounded"></div>
                        <div>
                          <div className="text-sm">Wages</div>
                          <div className="font-medium">
                            {((financialSummary.totalWages / financialSummary.totalCost) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-400 rounded"></div>
                        <div>
                          <div className="text-sm">Claims</div>
                          <div className="font-medium">
                            {((financialSummary.totalClaims / financialSummary.totalCost) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-400 rounded"></div>
                        <div>
                          <div className="text-sm">Commission</div>
                          <div className="font-medium">
                            {((financialSummary.totalCommission / financialSummary.totalCost) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-end border-t pt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print Summary
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
      
      {/* Separate Views */}
      {showSeparateViews && viewMode === 'separate' && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-500" />
                Staffing Tab (Original)
              </CardTitle>
              <CardDescription>
                Staff management only, separate from payroll
              </CardDescription>
            </CardHeader>
            <CardContent className="border-t pt-6">
              <StaffingTab
                confirmedStaff={staffMembers}
                setConfirmedStaff={() => {}}
                applicants={[]}
                setApplicants={() => {}}
                showAddStaffForm={false}
                setShowAddStaffForm={() => {}}
                handleRemoveStaff={() => {}}
                projectStartDate={projectStartDate}
                projectEndDate={projectEndDate}
                projectId={projectId}
                isAutosaving={false}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-purple-500" />
                Payroll Tab (Original)
              </CardTitle>
              <CardDescription>
                Payroll management only, separate from staffing
              </CardDescription>
            </CardHeader>
            <CardContent className="border-t pt-6">
              <ProjectPayroll
                project={{ id: projectId, start_date: projectStartDate.toISOString() }}
                confirmedStaff={staffMembers}
                setConfirmedStaff={() => {}}
                loadingStaff={false}
                projectStartDate={projectStartDate}
                projectEndDate={projectEndDate}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Helper components for the mock UI
function AvatarGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex -space-x-2">
      {children}
    </div>
  );
}

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// Dummy data generator
function getDummyStaffData(): StaffMember[] {
  return [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      designation: 'Event Coordinator',
      position: 'Manager',
      status: 'confirmed',
      workingDates: [
        new Date('2025-03-10'),
        new Date('2025-03-11'),
        new Date('2025-03-12'),
        new Date('2025-03-13'),
        new Date('2025-03-14'),
      ],
      workingDatesWithSalary: [
        { date: new Date('2025-03-10'), basicSalary: '500', claims: '75', commission: '0' },
        { date: new Date('2025-03-11'), basicSalary: '500', claims: '0', commission: '0' },
        { date: new Date('2025-03-12'), basicSalary: '500', claims: '0', commission: '0' },
        { date: new Date('2025-03-13'), basicSalary: '500', claims: '0', commission: '0' },
        { date: new Date('2025-03-14'), basicSalary: '500', claims: '0', commission: '0' },
      ]
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@example.com',
      designation: 'Sound Engineer',
      position: 'Tech',
      status: 'confirmed',
      workingDates: [
        new Date('2025-03-10'),
        new Date('2025-03-11'),
        new Date('2025-03-12'),
      ],
      workingDatesWithSalary: [
        { date: new Date('2025-03-10'), basicSalary: '600', claims: '50', commission: '0' },
        { date: new Date('2025-03-11'), basicSalary: '600', claims: '0', commission: '0' },
        { date: new Date('2025-03-12'), basicSalary: '600', claims: '50', commission: '50' },
      ]
    },
    {
      id: '3',
      name: 'Emily Wong',
      email: 'emily@example.com',
      designation: 'Lighting Designer',
      position: 'Tech',
      status: 'confirmed',
      workingDates: [
        new Date('2025-03-12'),
        new Date('2025-03-13'),
        new Date('2025-03-14'),
      ],
      workingDatesWithSalary: [
        { date: new Date('2025-03-12'), basicSalary: '550', claims: '0', commission: '0' },
        { date: new Date('2025-03-13'), basicSalary: '550', claims: '35', commission: '0' },
        { date: new Date('2025-03-14'), basicSalary: '550', claims: '0', commission: '0' },
      ]
    }
  ];
}