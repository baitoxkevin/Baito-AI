import React, { useState, useMemo, useRef } from 'react';
import { format, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  DollarSign,
  Eye,
  Loader2,
  Users,
  CalendarDays,
  MoreHorizontal,
  Pencil,
  FileText,
  Download
} from "lucide-react";
import type { Project } from '@/lib/types';
import { DuitNowPaymentExport } from '@/components/duitnow-payment-export';
import PaymentSubmissionDialog from './PaymentSubmissionDialog';

// Types
interface WorkingDateWithSalary {
  date: Date | string;
  basicSalary: string;
  claims: string;
  commission: string;
  included?: boolean; // Not used for include/exclude but kept for compatibility
}

interface StaffMember {
  id: string;
  name: string;
  photo?: string | null;
  designation?: string; 
  status?: string;
  workingDates?: (Date | string)[];
  workingDatesWithSalary?: WorkingDateWithSalary[];
}

interface StaffWorkingSummary {
  name: string;
  totalDays: number;
  totalBasicSalary: number;
  totalClaims: number;
  totalCommission: number;
  totalAmount: number;
}

interface ProjectPayrollProps {
  project: Project;
  confirmedStaff: StaffMember[];
  setConfirmedStaff: (staff: StaffMember[]) => void;
  loadingStaff?: boolean;
  projectStartDate?: Date;
  projectEndDate?: Date;
}

// Helper functions
const parseAmount = (value: string | undefined | null): number => {
  if (!value) return 0;
  const sanitized = value.toString().replace(/[^0-9.]/g, '');
  const amount = parseFloat(sanitized);
  return isNaN(amount) ? 0 : amount;
};

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-MY', { style: 'currency', currency: 'MYR' })
    .replace('MYR', 'RM');
};

const getInitials = (name: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

// Magic Card component with spotlight effect
const MagicCard = ({ children, className = "", ...props }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPosition({ x, y });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,.06), transparent 40%)`
        }}
      />
      {children}
    </div>
  );
};

// Helper function to calculate summaries for each staff member
const calculateStaffWorkingSummaries = (confirmedStaff: StaffMember[]): StaffWorkingSummary[] => {
  return confirmedStaff.map(staff => {
    const name = staff.name || 'Unknown Staff';
    const totalDays = staff.workingDatesWithSalary?.length || 0;
    
    let totalBasicSalary = 0;
    let totalClaims = 0;
    let totalCommission = 0;
    
    staff.workingDatesWithSalary?.forEach(date => {
      totalBasicSalary += parseAmount(date.basicSalary);
      totalClaims += parseAmount(date.claims);
      totalCommission += parseAmount(date.commission);
    });
    
    const totalAmount = totalBasicSalary + totalClaims + totalCommission;
    
    return {
      name,
      totalDays,
      totalBasicSalary,
      totalClaims,
      totalCommission,
      totalAmount
    };
  });
};

export default function ProjectPayroll({
  project,
  confirmedStaff,
  setConfirmedStaff,
  loadingStaff = false
}: ProjectPayrollProps) {
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<'staff' | 'position' | 'days' | 'perDay' | 'totalAmount'>('totalAmount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showCommissionColumn, setShowCommissionColumn] = useState(false);
  const [isSetBasicDialogOpen, setIsSetBasicDialogOpen] = useState(false);
  const [tempBasicValue, setTempBasicValue] = useState("");
  const [selectedStaffForBasic, setSelectedStaffForBasic] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  // Keyboard navigation state
  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; column: 'basic' | 'claims' | 'commission' } | null>(null);
  const { toast } = useToast();
  // DuitNow Payment Export dialog state
  const [showDuitNowExport, setShowDuitNowExport] = useState(false);
  // Payment Submission dialog state
  const [showPaymentSubmission, setShowPaymentSubmission] = useState(false);

  // Calculate summaries
  const staffSummaries = useMemo(() => {
    return calculateStaffWorkingSummaries(confirmedStaff);
  }, [confirmedStaff]);

  // Sorting function for staff data
  const sortedStaffData = useMemo(() => {
    return [...confirmedStaff].sort((a, b) => {
      const aSummary = staffSummaries.find(s => s.name === (a.name || 'Unknown Staff'));
      const bSummary = staffSummaries.find(s => s.name === (b.name || 'Unknown Staff'));
      
      if (!aSummary || !bSummary) return 0;
      
      let comparison = 0;
      
      switch (sortColumn) {
        case 'staff':
          comparison = (a.name || 'Unknown Staff').localeCompare(b.name || 'Unknown Staff');
          break;
        case 'position':
          comparison = (a.designation || '').localeCompare(b.designation || '');
          break;
        case 'days':
          comparison = aSummary.totalDays - bSummary.totalDays;
          break;
        case 'perDay':
          const aPerDay = aSummary.totalDays > 0 ? aSummary.totalBasicSalary / aSummary.totalDays : 0;
          const bPerDay = bSummary.totalDays > 0 ? bSummary.totalBasicSalary / bSummary.totalDays : 0;
          comparison = aPerDay - bPerDay;
          break;
        case 'totalAmount':
          comparison = aSummary.totalAmount - bSummary.totalAmount;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [confirmedStaff, staffSummaries, sortColumn, sortDirection]);

  // Handle keyboard navigation between cells
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, column: 'basic' | 'claims' | 'commission', staff: StaffMember) => {
    if (!staff || !staff.workingDatesWithSalary) return;
    
    const totalRows = staff.workingDatesWithSalary.length;
    let newRowIndex = rowIndex;
    let newColumn = column;

    // Navigation logic
    switch (e.key) {
      case 'ArrowUp':
        newRowIndex = Math.max(0, rowIndex - 1);
        break;
      case 'ArrowDown':
        newRowIndex = Math.min(totalRows - 1, rowIndex + 1);
        break;
      case 'ArrowLeft':
        if (column === 'claims') newColumn = 'basic';
        else if (column === 'commission' && showCommissionColumn) newColumn = 'claims';
        break;
      case 'ArrowRight':
        if (column === 'basic') newColumn = 'claims';
        else if (column === 'claims' && showCommissionColumn) newColumn = 'commission';
        break;
      case 'Tab':
        if (!e.shiftKey) {
          // Forward tab
          if (column === 'basic') newColumn = 'claims';
          else if (column === 'claims') {
            if (showCommissionColumn) newColumn = 'commission';
            else if (rowIndex < totalRows - 1) {
              newColumn = 'basic';
              newRowIndex = rowIndex + 1;
            }
          } else if (column === 'commission' && rowIndex < totalRows - 1) {
            newColumn = 'basic';
            newRowIndex = rowIndex + 1;
          }
          e.preventDefault(); // Prevent default tab behavior
        } else {
          // Backward tab (Shift+Tab)
          if (column === 'commission') newColumn = 'claims';
          else if (column === 'claims') {
            newColumn = 'basic';
          } else if (column === 'basic' && rowIndex > 0) {
            if (showCommissionColumn) newColumn = 'commission';
            else newColumn = 'claims';
            newRowIndex = rowIndex - 1;
          }
          e.preventDefault(); // Prevent default tab behavior
        }
        break;
      case 'Enter':
        // When Enter is pressed, do the same as clicking the Save Changes button
        try {
          // Simulate a click on the Save Changes button
          const saveButton = document.querySelector('.dialog-save-button') as HTMLButtonElement;
          if (saveButton) {
            saveButton.click();
          } else {
            // Fallback in case button isn't found - save directly
            const saveData = async () => {
              try {
                setIsSaving(true);
                // Update staff data in database
                const { data, error } = await supabase
                  .from('projects')
                  .update({ 
                    confirmed_staff: confirmedStaff.map(s => ({
                      candidate_id: s.id,
                      name: s.name,
                      photo: s.photo,
                      position: s.designation,
                      status: s.status,
                      working_dates: s.workingDates,
                      working_dates_with_salary: s.workingDatesWithSalary
                    }))
                  })
                  .eq('id', project.id);
                  
                if (error) throw error;
                
                toast({
                  title: "Success",
                  description: "Staff payment details updated successfully",
                });
                
                setEditingStaffId(null);
              } catch (error) {
                console.error('Error saving payroll details:', error);
                toast({
                  title: "Error",
                  description: "Failed to save payroll details",
                  variant: "destructive"
                });
              } finally {
                setIsSaving(false);
              }
            };
            
            saveData();
          }
          
          // Also move to the next row if possible
          if (rowIndex < totalRows - 1) {
            newRowIndex = rowIndex + 1;
          }
        } catch (error) {
          console.error('Error on Enter key action:', error);
        }
        break;
      default:
        return; // Return for other keys without any action
    }

    // Update focusedCell state
    if (newRowIndex !== rowIndex || newColumn !== column) {
      setFocusedCell({ rowIndex: newRowIndex, column: newColumn });
      // Focus the new input element
      setTimeout(() => {
        const newInput = document.getElementById(`${staff.id}-${newColumn}-${newRowIndex}`);
        if (newInput) (newInput as HTMLInputElement).focus();
      }, 10);
    }
  };

  const handleSort = (column: 'staff' | 'position' | 'days' | 'perDay' | 'totalAmount') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Project summary calculations
  const projectSummary = useMemo(() => {
    const totalDays = staffSummaries.reduce((sum, staff) => sum + staff.totalDays, 0);
    const totalBasicSalary = staffSummaries.reduce((sum, staff) => sum + staff.totalBasicSalary, 0);
    const totalClaims = staffSummaries.reduce((sum, staff) => sum + staff.totalClaims, 0);
    const totalCommission = staffSummaries.reduce((sum, staff) => sum + staff.totalCommission, 0);
    const totalAmount = totalBasicSalary + totalClaims + totalCommission;
    
    return {
      totalStaff: confirmedStaff.length,
      totalDays,
      totalBasicSalary,
      totalClaims,
      totalCommission,
      totalAmount
    };
  }, [staffSummaries, confirmedStaff]);

  // Set basic salary for all staff - opens the dialog
  const setBasicSalaryForAll = () => {
    // First, select all staff by default
    setSelectedStaffForBasic(confirmedStaff.map(s => s.id));
    
    // Open the dialog for user input
    setIsSetBasicDialogOpen(true);
    
    // Set a reasonable default value
    setTempBasicValue("500");
  };

  // Set basic salary for selected staff dates (via dialog)
  const setBasicSalaryForSelectedStaff = () => {
    const basicAmount = parseAmount(tempBasicValue);
    if (basicAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    if (selectedStaffForBasic.length === 0) {
      toast({
        title: "No Staff Selected",
        description: "Please select at least one staff member",
        variant: "destructive"
      });
      return;
    }

    const updatedStaff = confirmedStaff.map(staff => {
      // Only update if this staff is selected
      if (selectedStaffForBasic.includes(staff.id)) {
        // Ensure staff has workingDatesWithSalary
        let workingDatesWithSalary = staff.workingDatesWithSalary || [];
        
        // If no workingDatesWithSalary, create from workingDates
        if (workingDatesWithSalary.length === 0 && staff.workingDates && staff.workingDates.length > 0) {
          workingDatesWithSalary = staff.workingDates.map(date => ({
            date,
            basicSalary: tempBasicValue,
            claims: "0",
            commission: "0"
          }));
        } else {
          // Update existing entries
          workingDatesWithSalary = workingDatesWithSalary.map(date => ({
            ...date,
            basicSalary: tempBasicValue
          }));
        }

        return {
          ...staff,
          workingDatesWithSalary
        };
      }
      return staff;
    });

    setConfirmedStaff(updatedStaff);
    setIsSetBasicDialogOpen(false);
    setTempBasicValue("");
    setSelectedStaffForBasic([]);
    
    // Update the database
    const updateProject = async () => {
      try {
        setIsSaving(true);
        const { error } = await supabase
          .from('projects')
          .update({ 
            confirmed_staff: updatedStaff.map(staff => ({
              candidate_id: staff.id,
              name: staff.name,
              photo: staff.photo,
              position: staff.designation,
              status: staff.status,
              working_dates: staff.workingDates,
              working_dates_with_salary: staff.workingDatesWithSalary
            }))
          })
          .eq('id', project.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: `Basic salary of RM ${basicAmount.toLocaleString()} set for ${selectedStaffForBasic.length} staff member(s)`,
        });
      } catch (error) {
        console.error('Error updating staff salaries:', error);
        toast({
          title: "Error",
          description: "Failed to update basic salaries",
          variant: "destructive"
        });
      } finally {
        setIsSaving(false);
      }
    };
    
    updateProject();
  };

  // Handle payment submission
  const handlePaymentSubmission = () => {
    // Validate there's payment amount
    if (projectSummary.totalAmount <= 0) {
      toast({
        title: "No Payment Data",
        description: "There are no payment amounts to submit",
        variant: "warning"
      });
      return;
    }
    
    // Open the payment submission dialog
    setShowPaymentSubmission(true);
  };

  // Handle export to DuitNow payment file
  const handleExportDuitNowPayment = () => {
    const totalAmount = projectSummary.totalAmount;
    
    // Validate there's payment amount
    if (totalAmount <= 0) {
      toast({
        title: "No Payment Data",
        description: "There are no payment amounts to export",
        variant: "warning"
      });
      return;
    }
    
    // Validate staff have bank details before opening
    const staffWithMissingDetails = confirmedStaff.filter(staff => {
      // Check if this staff has any payment amount
      const summary = staffSummaries.find(s => s.name === (staff.name || 'Unknown Staff'));
      return summary && summary.totalAmount > 0;
    });
    
    if (staffWithMissingDetails.length === 0) {
      toast({
        title: "No Staff to Pay",
        description: "There are no staff members with payment amounts",
        variant: "warning"
      });
      return;
    }
    
    // Open the DuitNow payment export dialog
    setShowDuitNowExport(true);
  };

  if (loadingStaff) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2">Loading staff details...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-indigo-600" />
          <span>Staff Payroll Management</span>
          <Badge className="bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs font-normal">
            {confirmedStaff.length}
          </Badge>
        </h3>
        
        <div className="flex gap-3">
          <Button
            onClick={handlePaymentSubmission}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg"
            disabled={projectSummary.totalAmount <= 0}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Submit Payment
          </Button>

          <Button
            onClick={handleExportDuitNowPayment}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg"
            disabled={projectSummary.totalAmount <= 0}
          >
            <FileText className="w-4 h-4 mr-2" />
            DuitNow Export
          </Button>
          
          <Button
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-md px-4 py-2 hover:opacity-90 transition"
            onClick={setBasicSalaryForAll}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4" />
                <span>Set Basic Salary</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Total Sessions</p>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">{projectSummary.totalDays}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Total Basic</p>
            <p className="text-base font-bold text-indigo-700 dark:text-indigo-400">RM {projectSummary.totalBasicSalary.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800/50 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">Claims</p>
            <p className="text-base font-bold text-purple-700 dark:text-purple-400">RM {projectSummary.totalClaims.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Commission</p>
            <p className="text-base font-bold text-amber-700 dark:text-amber-400">RM {projectSummary.totalCommission.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Total Amount</p>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">RM {projectSummary.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>


      {/* Staff Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex-grow">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
              <TableHead className="font-semibold cursor-pointer pl-6" onClick={() => handleSort('staff')}>Staff</TableHead>
              <TableHead className="text-center font-semibold cursor-pointer" onClick={() => handleSort('position')}>Position</TableHead>
              <TableHead className="text-center font-semibold cursor-pointer" onClick={() => handleSort('days')}>Days</TableHead>
              <TableHead className="text-center font-semibold cursor-pointer" onClick={() => handleSort('perDay')}>Per Day</TableHead>
              <TableHead className="text-center font-semibold cursor-pointer" onClick={() => handleSort('totalAmount')}>Total Amount</TableHead>
              <TableHead className="text-center font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStaffData.map(staff => {
              const staffName = staff.name || 'Unknown Staff';
              const summary = staffSummaries.find(s => s.name === staffName);
              if (!summary) return null;

              return (
                <TableRow key={staff.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell className="font-medium pl-6">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {staff.photo ? (
                          <AvatarImage src={staff.photo} alt={staff.name || 'Staff'} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold">
                            {getInitials(staff.name || 'Unknown')}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span>{staff.name || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{staff.designation || '-'}</TableCell>
                  <TableCell className="text-center">{summary.totalDays}</TableCell>
                  <TableCell className="text-center">
                    RM {summary.totalDays > 0 
                      ? Math.round(summary.totalBasicSalary / summary.totalDays).toLocaleString() 
                      : 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      RM {summary.totalAmount.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingStaffId(staff.id);
                          // Reset focused cell when opening dialog
                          setFocusedCell({ rowIndex: 0, column: 'basic' });
                        }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/20"
                        onClick={() => setEditingStaffId(staff.id)}
                        title="More Actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
        
      {/* Budget Summary */}
      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-col sm:flex-row justify-between items-center">
        <div className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
          Budget: <span className="text-indigo-600 dark:text-indigo-400">RM 20,000.00</span>
        </div>
        <div className="text-gray-800 dark:text-gray-200 text-sm mt-2 sm:mt-0">
          <span>Spent: <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            RM {projectSummary.totalAmount.toLocaleString()}
          </span></span>
          <span className="mx-2">|</span>
          <span>Remaining: <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            RM {(20000 - projectSummary.totalAmount).toLocaleString()}
          </span></span>
        </div>
      </div>

      {/* Individual Staff Details Dialog */}
      <Dialog open={editingStaffId !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingStaffId(null);
          // Reset focused cell when closing dialog
          setFocusedCell(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
          {editingStaffId && (() => {
            const staff = confirmedStaff.find(s => s.id === editingStaffId);
            if (!staff) return null;
            
            const summary = staffSummaries.find(s => s.name === (staff.name || 'Unknown Staff'));
            if (!summary) return null;
            
            return (
              <>
                <DialogHeader className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-purple-950/20 p-4 rounded-t-lg flex-shrink-0">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-slate-800 shadow-lg">
                          {staff.photo ? (
                            <AvatarImage src={staff.photo} alt={staff.name || 'Staff'} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-base font-bold shadow-inner">
                              {getInitials(staff.name || 'Unknown')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            {staff.name || 'Unknown Staff'}
                            {isSaving && (
                              <div className="inline-flex text-xs items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Saving...</span>
                              </div>
                            )}
                          </DialogTitle>
                          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                            {staff.designation || "Staff Member"}
                          </DialogDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {staff.workingDatesWithSalary?.length || 0} Working Days
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            RM {summary.totalBasicSalary.toLocaleString()} Basic
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            RM {summary.totalClaims.toLocaleString()} Claims
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 self-stretch flex items-center">
                      <div className="text-center w-full">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Amount</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          RM {summary.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <div className="flex-1 p-3 overflow-hidden flex flex-col min-h-0">
                  <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-1 min-h-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-sm py-2 w-4/12">Date</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-sm text-center w-2/12">Basic</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-sm text-center w-2/12">Claims</TableHead>
                          <TableHead 
                            className={`text-center py-2 w-2/12 cursor-pointer ${showCommissionColumn ? 'text-purple-700 dark:text-purple-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}
                            onClick={() => {
                              // Check if any staff member has commission values
                              const hasCommissionValues = staff.workingDatesWithSalary?.some(
                                date => date.commission && parseFloat(String(date.commission)) > 0
                              ) || false;
                              
                              // Only allow toggling off if there are no commission values
                              if (hasCommissionValues && showCommissionColumn) {
                                toast({
                                  title: "Cannot hide commission",
                                  description: "Commission values exist. Clear all commission values first.",
                                  variant: "destructive"
                                });
                                return;
                              }
                              setShowCommissionColumn(!showCommissionColumn);
                            }}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-sm font-medium">
                                Comm
                              </span>
                              {showCommissionColumn ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 opacity-70"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-5"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 opacity-50"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-sm text-center w-2/12">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staff.workingDatesWithSalary
                          ?.sort((a, b) => {
                            const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                            const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                            return dateA.getTime() - dateB.getTime();
                          })
                          .map((dateEntry, index) => {
                            const date = dateEntry.date instanceof Date 
                              ? dateEntry.date 
                              : new Date(dateEntry.date);
                            const basicAmount = parseAmount(dateEntry.basicSalary);
                            const claimsAmount = parseAmount(dateEntry.claims);
                            const commissionAmount = parseAmount(dateEntry.commission);
                            const totalAmount = basicAmount + claimsAmount + commissionAmount;

                            return (
                              <motion.tr 
                                key={index} 
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.02 }}
                              >
                                <TableCell className="py-2 w-4/12">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="space-y-0.5">
                                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {format(date, 'EEEE')}
                                      </p>
                                      <p className="text-xs text-slate-600 dark:text-slate-400">
                                        {format(date, 'dd MMM yyyy')}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="p-1 w-2/12">
                                  <Input
                                    id={`${staff.id}-basic-${index}`}
                                    type="text"
                                    value={dateEntry.basicSalary}
                                    onChange={(e) => {
                                      const updatedStaff = confirmedStaff.map(s => {
                                        if (s.id === staff.id) {
                                          const updatedDates = s.workingDatesWithSalary?.map(wdws => {
                                            if (isSameDay(new Date(wdws.date), new Date(dateEntry.date))) {
                                              return { ...wdws, basicSalary: e.target.value };
                                            }
                                            return wdws;
                                          }) || [];
                                          return { ...s, workingDatesWithSalary: updatedDates };
                                        }
                                        return s;
                                      });
                                      setConfirmedStaff(updatedStaff);
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, index, 'basic', staff)}
                                    placeholder="0"
                                    className={`h-8 text-sm text-center font-medium w-full px-1 ${focusedCell?.rowIndex === index && focusedCell.column === 'basic' ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}
                                    autoFocus={focusedCell?.rowIndex === index && focusedCell.column === 'basic'}
                                  />
                                </TableCell>
                                <TableCell className="p-1 w-2/12">
                                  <Input
                                    id={`${staff.id}-claims-${index}`}
                                    type="text"
                                    value={dateEntry.claims}
                                    onChange={(e) => {
                                      const updatedStaff = confirmedStaff.map(s => {
                                        if (s.id === staff.id) {
                                          const updatedDates = s.workingDatesWithSalary?.map(wdws => {
                                            if (isSameDay(new Date(wdws.date), new Date(dateEntry.date))) {
                                              return { ...wdws, claims: e.target.value };
                                            }
                                            return wdws;
                                          }) || [];
                                          return { ...s, workingDatesWithSalary: updatedDates };
                                        }
                                        return s;
                                      });
                                      setConfirmedStaff(updatedStaff);
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, index, 'claims', staff)}
                                    placeholder="0"
                                    className={`h-8 text-sm text-center font-medium w-full px-1 ${focusedCell?.rowIndex === index && focusedCell.column === 'claims' ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}
                                    autoFocus={focusedCell?.rowIndex === index && focusedCell.column === 'claims'}
                                  />
                                </TableCell>
                                <TableCell className="p-1 w-2/12">
                                  {showCommissionColumn ? (
                                    <Input
                                      id={`${staff.id}-commission-${index}`}
                                      type="text"
                                      value={dateEntry.commission}
                                      onChange={(e) => {
                                        const updatedStaff = confirmedStaff.map(s => {
                                          if (s.id === staff.id) {
                                            const updatedDates = s.workingDatesWithSalary?.map(wdws => {
                                              if (isSameDay(new Date(wdws.date), new Date(dateEntry.date))) {
                                                return { ...wdws, commission: e.target.value };
                                              }
                                              return wdws;
                                            }) || [];
                                            return { ...s, workingDatesWithSalary: updatedDates };
                                          }
                                          return s;
                                        });
                                        setConfirmedStaff(updatedStaff);
                                      }}
                                      onKeyDown={(e) => handleKeyDown(e, index, 'commission', staff)}
                                      placeholder="0"
                                      className={`h-8 text-sm text-center font-medium w-full px-1 ${focusedCell?.rowIndex === index && focusedCell.column === 'commission' ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}
                                      autoFocus={focusedCell?.rowIndex === index && focusedCell.column === 'commission'}
                                    />
                                  ) : (
                                    <span className="text-center block text-gray-400 text-sm">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-bold text-sm text-emerald-700 dark:text-emerald-300 text-center px-2 w-2/12">
                                  RM {totalAmount.toLocaleString()}
                                </TableCell>
                              </motion.tr>
                            );
                          })}
                      </TableBody>
                      <tfoot>
                        <TableRow className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700">
                          <TableCell colSpan={4} className="font-semibold text-sm text-slate-900 dark:text-slate-100 py-2 text-right pr-4">
                            Grand Total
                          </TableCell>
                          <TableCell className="font-bold text-sm text-emerald-700 dark:text-emerald-300 text-center px-2 w-2/12">
                            RM {summary.totalAmount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </tfoot>
                    </Table>
                  </div>
                </div>
                <DialogFooter className="p-4 flex-shrink-0 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={async () => {
                      try {
                        setIsSaving(true);
                        const { error } = await supabase
                          .from('projects')
                          .update({ 
                            confirmed_staff: confirmedStaff.map(s => ({
                              candidate_id: s.id,
                              name: s.name,
                              photo: s.photo,
                              position: s.designation,
                              status: s.status,
                              working_dates: s.workingDates,
                              working_dates_with_salary: s.workingDatesWithSalary
                            }))
                          })
                          .eq('id', project.id);
                          
                        if (error) throw error;
                        
                        toast({
                          title: "Success",
                          description: "Staff payment details updated successfully",
                        });
                        
                        setEditingStaffId(null);
                      } catch (error) {
                        console.error('Error updating staff payment details:', error);
                        toast({
                          title: "Error",
                          description: "Failed to update staff payment details",
                          variant: "destructive"
                        });
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    className="dialog-save-button bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Set Basic Salary Dialog */}
      <Dialog open={isSetBasicDialogOpen} onOpenChange={(open) => {
        setIsSetBasicDialogOpen(open);
        if (!open) {
          setSelectedStaffForBasic([]);
          setTempBasicValue("");
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              Set Basic Salary
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
              Select staff members and set their basic salary for all working dates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Staff Selection */}
            <div className="space-y-2">
              <div className="space-y-2 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <button
                    onClick={() => {
                      if (selectedStaffForBasic.length === confirmedStaff.length) {
                        setSelectedStaffForBasic([]);
                      } else {
                        setSelectedStaffForBasic(confirmedStaff.map(s => s.id));
                      }
                    }}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {selectedStaffForBasic.length === confirmedStaff.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="ml-2 text-sm text-slate-500">
                    ({selectedStaffForBasic.length}/{confirmedStaff.length} selected)
                  </span>
                </div>
                {confirmedStaff.map((staff) => (
                  <label key={staff.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-md">
                    <input
                      type="checkbox"
                      checked={selectedStaffForBasic.includes(staff.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStaffForBasic([...selectedStaffForBasic, staff.id]);
                        } else {
                          setSelectedStaffForBasic(selectedStaffForBasic.filter(id => id !== staff.id));
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center space-x-2 flex-1">
                      <Avatar className="h-6 w-6">
                        {staff.photo ? (
                          <AvatarImage src={staff.photo} alt={staff.name || 'Staff'} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs">
                            {getInitials(staff.name || 'Unknown')}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{staff.name || 'Unknown'}</p>
                        {staff.designation && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">{staff.designation}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {staff.workingDatesWithSalary?.length || 0} days
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Basic Salary Input */}
            <div className="space-y-2 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <label htmlFor="basicAmount" className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                Basic Salary Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 font-medium">
                  RM
                </span>
                <Input
                  id="basicAmount"
                  type="text"
                  value={tempBasicValue}
                  onChange={(e) => setTempBasicValue(e.target.value)}
                  placeholder="0.00"
                  className="pl-10 h-12 text-lg font-medium"
                />
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                Enter the daily rate for selected staff members
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsSetBasicDialogOpen(false);
                setSelectedStaffForBasic([]);
                setTempBasicValue("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={setBasicSalaryForSelectedStaff}
              disabled={selectedStaffForBasic.length === 0 || !tempBasicValue || isSaving}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Apply to Selected'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DuitNow Payment Export Dialog */}
      <DuitNowPaymentExport
        open={showDuitNowExport}
        onOpenChange={setShowDuitNowExport}
        projectId={project.id}
        projectName={project.title || project.name || 'Project'}
        staffPayrollEntries={staffSummaries.map(summary => {
          const staff = confirmedStaff.find(s => s.name === summary.name);
          return {
            staffId: staff?.id || '',
            staff_id: staff?.id || '',
            staffName: summary.name,
            workingSummary: summary,
            workingDatesWithSalary: staff?.workingDatesWithSalary || []
          };
        })}
        paymentDate={new Date()}
      />

      {/* Payment Submission Dialog */}
      <PaymentSubmissionDialog
        open={showPaymentSubmission}
        onOpenChange={setShowPaymentSubmission}
        projectId={project.id}
        projectName={project.title || project.name || 'Project'}
        staffPaymentSummaries={staffSummaries.map(summary => {
          const staff = confirmedStaff.find(s => s.name === summary.name);
          return {
            staffId: staff?.id || '',
            staffName: summary.name,
            amount: summary.totalAmount,
            totalDays: summary.totalDays,
            workingDates: staff?.workingDatesWithSalary?.map(wdws => 
              typeof wdws.date === 'string' ? wdws.date : wdws.date.toISOString()
            ),
            payrollDetails: {
              basicSalary: summary.totalBasicSalary,
              claims: summary.totalClaims,
              commission: summary.totalCommission
            }
          };
        })}
        paymentDate={new Date()}
        onSuccess={(batchId) => {
          toast({
            title: "Payment Submitted",
            description: `Payment batch has been submitted with ID: ${batchId}`,
          });
        }}
      />
    </div>
  );
}