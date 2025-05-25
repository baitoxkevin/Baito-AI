import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DollarSign,
  Eye,
  Loader2,
  Users,
  CalendarDays,
  MoreHorizontal,
  Pencil,
  FileText,
  Download,
  Calendar as CalendarIcon,
  Receipt,
  TrendingUp,
  Check,
  Plus,
  Calculator,
  Info
} from "lucide-react";
import type { Project } from '@/lib/types';
import { DuitNowPaymentExport } from '@/components/duitnow-payment-export';
import PaymentSubmissionDialog from './PaymentSubmissionDialog';
import { logUtils } from '@/lib/activity-logger';

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
  paymentStatus?: 'pending' | 'pushed' | 'paid';
  paymentDate?: Date;
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
  onEditDialogOpenChange?: (open: boolean) => void;
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
  loadingStaff = false,
  onEditDialogOpenChange
}: ProjectPayrollProps) {
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<'staff' | 'position' | 'days' | 'perDay' | 'totalAmount'>('totalAmount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showCommissionColumn, setShowCommissionColumn] = useState(false);
  const [isSetBasicDialogOpen, setIsSetBasicDialogOpen] = useState(false);
  const [tempBasicValue, setTempBasicValue] = useState("");
  const [selectedStaffForBasic, setSelectedStaffForBasic] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  // Keyboard navigation state
  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; column: 'basic' | 'claims' | 'commission' } | null>(null);
  const { toast } = useToast();
  // DuitNow Payment Export dialog state
  const [showDuitNowExport, setShowDuitNowExport] = useState(false);
  // Payment Submission dialog state
  const [showPaymentSubmission, setShowPaymentSubmission] = useState(false);
  // Payment date selector state
  const [selectedPaymentDate, setSelectedPaymentDate] = useState<Date>(new Date());
  // State for staff expense claims
  const [staffExpenseClaims, setStaffExpenseClaims] = useState<Record<string, any[]>>({});
  
  // Remove the automatic focus effect to prevent selection issues

  // Fetch expense claims for staff when dialog opens
  useEffect(() => {
    const fetchStaffExpenseClaims = async () => {
      if (editingStaffId && project.id) {
        try {
          const { getStaffExpenseClaimsForProject } = await import('@/lib/expense-payroll-sync-service');
          const claims = await getStaffExpenseClaimsForProject(editingStaffId, project.id);
          setStaffExpenseClaims(prev => ({
            ...prev,
            [editingStaffId]: claims
          }));
        } catch (error) {
          console.error('Error fetching staff expense claims:', error);
        }
      }
    };
    
    fetchStaffExpenseClaims();
  }, [editingStaffId, project.id]);

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
    
    const input = e.currentTarget;
    const selectionStart = input.selectionStart || 0;
    const selectionEnd = input.selectionEnd || 0;
    const valueLength = input.value.length;

    // Navigation logic
    switch (e.key) {
      case 'ArrowUp':
        newRowIndex = Math.max(0, rowIndex - 1);
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'ArrowDown':
        newRowIndex = Math.min(totalRows - 1, rowIndex + 1);
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'ArrowLeft':
        // Only navigate to previous cell if cursor is at the start
        if (selectionStart === 0 && selectionEnd === 0) {
          if (column === 'claims') newColumn = 'basic';
          else if (column === 'commission' && showCommissionColumn) newColumn = 'claims';
          e.preventDefault();
          e.stopPropagation();
        }
        break;
      case 'ArrowRight':
        // Only navigate to next cell if cursor is at the end
        if (selectionStart === valueLength && selectionEnd === valueLength) {
          if (column === 'basic') newColumn = 'claims';
          else if (column === 'claims' && showCommissionColumn) newColumn = 'commission';
          e.preventDefault();
          e.stopPropagation();
        }
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
        const newInput = document.getElementById(`${staff.id}-${newColumn}-${newRowIndex}`) as HTMLInputElement;
        if (newInput) {
          // Focus without selecting
          newInput.focus({ preventScroll: true });
          
          // Don't set selection - let onFocus handler manage it
        }
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
    // Check if any unpushed staff are selected
    const unpushedSelectedStaff = confirmedStaff.filter(s => selectedStaff.includes(s.id) && s.paymentStatus !== 'pushed');
    
    if (unpushedSelectedStaff.length === 0) {
      toast({
        title: "No Staff Selected",
        description: "Please select at least one unpushed staff member",
        variant: "warning"
      });
      return;
    }
    
    // Calculate total amount for selected unpushed staff
    const selectedStaffAmount = staffSummaries
      .filter(summary => {
        const staff = confirmedStaff.find(s => s.name === summary.name);
        return staff && selectedStaff.includes(staff.id) && staff.paymentStatus !== 'pushed';
      })
      .reduce((sum, summary) => sum + summary.totalAmount, 0);
    
    // Validate there's payment amount
    if (selectedStaffAmount <= 0) {
      toast({
        title: "No Payment Data",
        description: "Selected staff have no payment amounts",
        variant: "warning"
      });
      return;
    }
    
    // Open the payment submission dialog
    setShowPaymentSubmission(true);
  };
  
  // Handle successful payment push
  const handlePaymentPushed = (batchId: string) => {
    // Mark selected staff as pushed with the payment date
    const updatedStaff = confirmedStaff.map(staff => {
      if (selectedStaff.includes(staff.id) && staff.paymentStatus !== 'pushed') {
        return {
          ...staff,
          paymentStatus: 'pushed' as const,
          paymentDate: selectedPaymentDate
        };
      }
      return staff;
    });
    
    setConfirmedStaff(updatedStaff);
    
    // Clear selection of pushed staff
    setSelectedStaff(selectedStaff.filter(id => {
      const staff = confirmedStaff.find(s => s.id === id);
      return staff && staff.paymentStatus === 'pushed';
    }));
    
    toast({
      title: "Payment Pushed",
      description: `Payment successfully pushed for ${updatedStaff.filter(s => s.paymentStatus === 'pushed' && s.paymentDate?.getTime() === selectedPaymentDate.getTime()).length} staff members`,
      variant: "default"
    });
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
    
    // Log the export action
    logUtils.action('export_payment_data', true, {
      export_type: 'duitnow',
      staff_count: staffWithMissingDetails.length,
      total_amount: totalAmount,
      project_id: project.id,
      project_title: project.title
    });
    
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-indigo-600" />
            <span>Staff Payroll Management</span>
            <Badge className="bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs font-normal">
              {confirmedStaff.length}
            </Badge>
          </h3>
          
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
        
        {/* Payment Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Date:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedPaymentDate, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedPaymentDate}
                    onSelect={(date) => date && setSelectedPaymentDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Selected: {confirmedStaff.filter(s => selectedStaff.includes(s.id) && s.paymentStatus !== 'pushed').length} staff ready for payment
            </div>
          </div>
          <Button
            onClick={handlePaymentSubmission}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg"
            disabled={
              projectSummary.totalAmount <= 0 || 
              confirmedStaff.filter(s => selectedStaff.includes(s.id) && s.paymentStatus !== 'pushed').length === 0
            }
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Push Payment
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
              <TableHead className="pl-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={confirmedStaff.length > 0 && confirmedStaff.filter(s => s.paymentStatus !== 'pushed').every(s => selectedStaff.includes(s.id))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        // Only select staff that haven't been pushed
                        setSelectedStaff(confirmedStaff.filter(s => s.paymentStatus !== 'pushed').map(s => s.id));
                      } else {
                        setSelectedStaff([]);
                      }
                    }}
                    className="mr-2"
                  />
                  <span 
                    className="font-semibold cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSort('staff');
                    }}
                  >
                    Staff
                  </span>
                </div>
              </TableHead>
              <TableHead className="text-center font-semibold cursor-pointer" onClick={() => handleSort('position')}>Position</TableHead>
              <TableHead className="text-center font-semibold cursor-pointer" onClick={() => handleSort('days')}>Days</TableHead>
              <TableHead className="text-center font-semibold cursor-pointer" onClick={() => handleSort('perDay')}>Per Day</TableHead>
              <TableHead className="text-center font-semibold cursor-pointer" onClick={() => handleSort('totalAmount')}>Total Amount</TableHead>
              <TableHead className="text-center font-semibold">Payment Status</TableHead>
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
                      <Checkbox
                        checked={selectedStaff.includes(staff.id)}
                        disabled={staff.paymentStatus === 'pushed'}
                        onCheckedChange={(checked) => {
                          if (staff.paymentStatus === 'pushed') return;
                          if (checked) {
                            setSelectedStaff([...selectedStaff, staff.id]);
                          } else {
                            setSelectedStaff(selectedStaff.filter(id => id !== staff.id));
                          }
                        }}
                        className="mr-2"
                      />
                      <Avatar className="h-8 w-8">
                        {staff.photo ? (
                          <AvatarImage src={staff.photo} alt={staff.name || 'Staff'} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold">
                            {getInitials(staff.name || 'Unknown')}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className={staff.paymentStatus === 'pushed' ? 'text-gray-500' : ''}>
                        {staff.name || 'Unknown'}
                      </span>
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
                  <TableCell className="text-center">
                    {staff.paymentStatus === 'pushed' ? (
                      <div className="flex flex-col items-center gap-1">
                        <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0">
                          Pushed
                        </Badge>
                        {staff.paymentDate && (
                          <span className="text-xs text-gray-500">
                            {format(staff.paymentDate, "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge className="bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border-0">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingStaffId(staff.id);
                          // Don't set focused cell to prevent auto-selection
                          // Notify parent component about dialog state
                          onEditDialogOpenChange?.(true);
                        }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/20"
                        onClick={() => {
                          setEditingStaffId(staff.id);
                          onEditDialogOpenChange?.(true);
                        }}
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
        // Notify parent component about dialog state
        onEditDialogOpenChange?.(open);
      }}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] p-0 flex flex-col"
          onOpenAutoFocus={(e) => {
            // Prevent auto-focus which causes text selection
            e.preventDefault();
          }}
          onKeyDown={(e) => {
            // Stop propagation of arrow keys to prevent tab switching
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
              e.stopPropagation();
            }
          }}
        >
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
                            {staffExpenseClaims[editingStaffId]?.length > 0 && (
                              <span className="text-xs text-purple-500 ml-1">
                                (incl. {staffExpenseClaims[editingStaffId].length} expense claim{staffExpenseClaims[editingStaffId].length > 1 ? 's' : ''})
                              </span>
                            )}
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
                  <div className="overflow-auto rounded-xl bg-white dark:bg-slate-900 flex-1 min-h-0 shadow-sm border border-slate-200 dark:border-slate-700">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider py-4 pl-6 w-[29%]">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-slate-500" />
                              Date
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider text-center py-4 w-[16%]">
                            <div className="flex items-center justify-center gap-2">
                              <DollarSign className="w-4 h-4 text-emerald-500" />
                              Basic
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider text-center py-4 w-[16%]">
                            <div className="flex items-center justify-center gap-2">
                              <Receipt className="w-4 h-4 text-purple-500" />
                              Claims
                            </div>
                          </TableHead>
                          <TableHead 
                            className={`text-center py-4 w-[16%] cursor-pointer transition-colors ${showCommissionColumn ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}
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
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs uppercase tracking-wider">
                                Comm
                              </span>
                              {showCommissionColumn ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider text-right py-4 pr-6 w-[23%]">
                            <div className="flex items-center justify-end gap-2">
                              <Calculator className="w-4 h-4 text-indigo-500" />
                              Total
                            </div>
                          </TableHead>
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
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.02 }}
                              >
                                <TableCell className="py-3 pl-6 w-[29%]">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
                                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                        {format(date, 'd')}
                                      </span>
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {format(date, 'EEEE')}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {format(date, 'MMMM yyyy')}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="p-2 w-[16%]">
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">RM</span>
                                    <input
                                      id={`${staff.id}-basic-${index}`}
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      maxLength={4}
                                      value={dateEntry.basicSalary}
                                      onChange={(e) => {
                                        const input = e.target;
                                        const value = input.value;
                                        const cursorPosition = input.selectionStart;
                                        
                                        // Only allow digits and limit to 4 characters
                                        const newValue = value.replace(/[^\d]/g, '').slice(0, 4);
                                        
                                        // Calculate new cursor position
                                        const diff = value.length - newValue.length;
                                        const newCursorPos = Math.max(0, cursorPosition - diff);
                                        
                                        const updatedStaff = confirmedStaff.map(s => {
                                          if (s.id === staff.id) {
                                            const updatedDates = s.workingDatesWithSalary?.map(wdws => {
                                              if (isSameDay(new Date(wdws.date), new Date(dateEntry.date))) {
                                                return { ...wdws, basicSalary: newValue };
                                              }
                                              return wdws;
                                            }) || [];
                                            return { ...s, workingDatesWithSalary: updatedDates };
                                          }
                                          return s;
                                        });
                                        setConfirmedStaff(updatedStaff);
                                        
                                        // Restore cursor position after React re-renders
                                        setTimeout(() => {
                                          if (input === document.activeElement) {
                                            input.setSelectionRange(newCursorPos, newCursorPos);
                                          }
                                        }, 0);
                                      }}
                                      onFocus={(e) => {
                                        // Prevent auto-selection on focus
                                        const input = e.target;
                                        const value = input.value;
                                        const length = value.length;
                                        // Use requestAnimationFrame to ensure it happens after browser's default behavior
                                        requestAnimationFrame(() => {
                                          if (input === document.activeElement) {
                                            input.setSelectionRange(length, length);
                                          }
                                        });
                                      }}
                                      onKeyDown={(e) => handleKeyDown(e, index, 'basic', staff)}
                                      placeholder="0"
                                      className={`h-10 text-sm text-center font-semibold w-full pl-8 pr-2 rounded-lg border transition-all ${
                                        focusedCell?.rowIndex === index && focusedCell.column === 'basic' 
                                          ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' 
                                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                                      }`}
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="p-2 w-[16%]">
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">RM</span>
                                    {parseAmount(dateEntry.claims) > 0 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Info className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-purple-500 cursor-help" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs">May include expense claims</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    <input
                                      id={`${staff.id}-claims-${index}`}
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      maxLength={4}
                                      value={dateEntry.claims}
                                      onChange={(e) => {
                                        const input = e.target;
                                        const value = input.value;
                                        const cursorPosition = input.selectionStart;
                                        
                                        // Only allow digits and limit to 4 characters
                                        const newValue = value.replace(/[^\d]/g, '').slice(0, 4);
                                        
                                        // Calculate new cursor position
                                        const diff = value.length - newValue.length;
                                        const newCursorPos = Math.max(0, cursorPosition - diff);
                                        
                                        const updatedStaff = confirmedStaff.map(s => {
                                          if (s.id === staff.id) {
                                            const updatedDates = s.workingDatesWithSalary?.map(wdws => {
                                              if (isSameDay(new Date(wdws.date), new Date(dateEntry.date))) {
                                                return { ...wdws, claims: newValue };
                                              }
                                              return wdws;
                                            }) || [];
                                            return { ...s, workingDatesWithSalary: updatedDates };
                                          }
                                          return s;
                                        });
                                        setConfirmedStaff(updatedStaff);
                                        
                                        // Restore cursor position after React re-renders
                                        setTimeout(() => {
                                          if (input === document.activeElement) {
                                            input.setSelectionRange(newCursorPos, newCursorPos);
                                          }
                                        }, 0);
                                      }}
                                      onFocus={(e) => {
                                        // Prevent auto-selection on focus
                                        const input = e.target;
                                        const value = input.value;
                                        const length = value.length;
                                        // Use requestAnimationFrame to ensure it happens after browser's default behavior
                                        requestAnimationFrame(() => {
                                          if (input === document.activeElement) {
                                            input.setSelectionRange(length, length);
                                          }
                                        });
                                      }}
                                      onKeyDown={(e) => handleKeyDown(e, index, 'claims', staff)}
                                      placeholder="0"
                                      className={`h-10 text-sm text-center font-semibold w-full pl-8 pr-2 rounded-lg border transition-all ${
                                        focusedCell?.rowIndex === index && focusedCell.column === 'claims' 
                                          ? 'ring-2 ring-purple-500 dark:ring-purple-400 border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                                      }`}
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="p-2 w-[16%]">
                                  {showCommissionColumn ? (
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">RM</span>
                                      <input
                                        id={`${staff.id}-commission-${index}`}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={4}
                                        value={dateEntry.commission}
                                        onChange={(e) => {
                                          const input = e.target;
                                          const value = input.value;
                                          const cursorPosition = input.selectionStart;
                                          
                                          // Only allow digits and limit to 4 characters
                                          const newValue = value.replace(/[^\d]/g, '').slice(0, 4);
                                          
                                          // Calculate new cursor position
                                          const diff = value.length - newValue.length;
                                          const newCursorPos = Math.max(0, cursorPosition - diff);
                                          
                                          const updatedStaff = confirmedStaff.map(s => {
                                            if (s.id === staff.id) {
                                              const updatedDates = s.workingDatesWithSalary?.map(wdws => {
                                                if (isSameDay(new Date(wdws.date), new Date(dateEntry.date))) {
                                                  return { ...wdws, commission: newValue };
                                                }
                                                return wdws;
                                              }) || [];
                                              return { ...s, workingDatesWithSalary: updatedDates };
                                            }
                                            return s;
                                          });
                                          setConfirmedStaff(updatedStaff);
                                          
                                          // Restore cursor position after React re-renders
                                          setTimeout(() => {
                                            if (input === document.activeElement) {
                                              input.setSelectionRange(newCursorPos, newCursorPos);
                                            }
                                          }, 0);
                                        }}
                                        onFocus={(e) => {
                                          // Prevent auto-selection on focus
                                          const input = e.target;
                                          const value = input.value;
                                          const length = value.length;
                                          // Use requestAnimationFrame to ensure it happens after browser's default behavior
                                          requestAnimationFrame(() => {
                                            if (input === document.activeElement) {
                                              input.setSelectionRange(length, length);
                                            }
                                          });
                                        }}
                                        onKeyDown={(e) => handleKeyDown(e, index, 'commission', staff)}
                                        placeholder="0"
                                        className={`h-10 text-sm text-center font-semibold w-full pl-8 pr-2 rounded-lg border transition-all ${
                                          focusedCell?.rowIndex === index && focusedCell.column === 'commission' 
                                            ? 'ring-2 ring-amber-500 dark:ring-amber-400 border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20' 
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                                        }`}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center h-10">
                                      <span className="text-slate-300 dark:text-slate-600 text-lg">—</span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 pr-6 w-[23%]">
                                  <div className="flex items-center justify-end">
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-3 py-1.5 rounded-lg">
                                      <span className="font-bold text-sm text-indigo-700 dark:text-indigo-300">
                                        RM {totalAmount.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            );
                          })}
                      </TableBody>
                      <tfoot>
                        <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-t-2 border-slate-300 dark:border-slate-600">
                          <TableCell colSpan={3} className="py-4 pl-6">
                            <div className="flex items-center justify-end gap-3">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Grand Total</span>
                            </div>
                          </TableCell>
                          {!showCommissionColumn && (
                            <TableCell className="py-4">
                              {/* Empty cell to fill commission column space when hidden */}
                            </TableCell>
                          )}
                          <TableCell className="py-4 pr-6">
                            <div className="flex items-center justify-end">
                              <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
                                <span className="font-bold text-base">
                                  RM {summary.totalAmount.toLocaleString()}
                                </span>
                              </div>
                            </div>
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
        staffPayrollEntries={staffSummaries
          .filter(summary => {
            const staff = confirmedStaff.find(s => s.name === summary.name);
            return staff && selectedStaff.includes(staff.id);
          })
          .map(summary => {
            const staff = confirmedStaff.find(s => s.name === summary.name);
            return {
              staffId: staff?.id || '',
              staff_id: staff?.id || '',
              staffName: summary.name,
              workingSummary: summary,
              workingDatesWithSalary: staff?.workingDatesWithSalary || []
            };
          })
        }
        paymentDate={new Date()}
      />

      {/* Payment Submission Dialog */}
      <PaymentSubmissionDialog
        open={showPaymentSubmission}
        onOpenChange={setShowPaymentSubmission}
        projectId={project.id}
        projectName={project.title || project.name || 'Project'}
        staffPaymentSummaries={staffSummaries
          .filter(summary => {
            const staff = confirmedStaff.find(s => s.name === summary.name);
            return staff && selectedStaff.includes(staff.id) && staff.paymentStatus !== 'pushed';
          })
          .map(summary => {
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
          })
        }
        paymentDate={selectedPaymentDate}
        onSuccess={handlePaymentPushed}
      />
    </div>
  );
}