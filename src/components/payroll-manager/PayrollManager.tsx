import React, { useState, useMemo, useEffect } from 'react';
import { format, isSameDay, isWeekend } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  PayrollManagerProps,
  StaffMember,
  PayrollData,
  StaffPayrollEntry,
  WorkingDateWithSalary,
  StaffWorkingSummary
} from "./types";
import { calculateStaffWorkingSummaries } from "./services";
import { saveStaffPaymentDetails, saveProjectPayroll } from "./services";
import { useToast } from "./adapter";
import { supabase } from "./adapter";
import {
  formatCurrency,
  parseAmount,
  validatePayrollData,
  validatePayrollDataWithDetails,
  calculateTotalPayroll,
  sortDates,
  findDateEntry,
  updateDateEntry,
  removeEmptyDateEntries,
  getInitials,
  ValidationError
} from './utils';
import {
  CalendarDays,
  Pencil,
  DollarSign,
  Calendar as CalendarIcon,
  Calendar as CalendarLucide,
  BarChart3,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  User,
  Users,
  CreditCard,
  Clock,
  Plus,
  Check,
  Info,
  HelpCircle,
  AlertCircle,
  Trash2,
  Minus,
  MinusSquare,
  X as XIcon,
  Save,
  Loader,
  Sparkles,
  TrendingUp,
  MoreHorizontal,
  Eye,
  X,
  Download,
  FileText
} from "lucide-react";

import { DuitNowPaymentExport } from '@/components/duitnow-payment-export';

// Magic Card component with spotlight effect
const MagicCard = ({ children, className = "", ...props }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = React.useState(0);

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

// Helper function for keyboard navigation in table
const handleTableNavigation = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const input = e.currentTarget;
  const currentRow = input.closest('tr');
  const currentCell = input.closest('td');
  
  if (!currentRow || !currentCell) return;
  
  const cellIndex = Array.from(currentRow.cells).indexOf(currentCell as HTMLTableCellElement);
  
  if (e.key === 'ArrowRight' || e.key === 'Tab') {
    if (e.key === 'Tab' && e.shiftKey) return; // Let default shift+tab behavior work
    if (e.key === 'ArrowRight') e.preventDefault();
    
    const nextCell = currentCell.nextElementSibling as HTMLTableCellElement;
    if (nextCell) {
      const nextInput = nextCell.querySelector('input');
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
        (nextInput as HTMLInputElement).select();
      }
    } else if (currentRow.nextElementSibling) {
      // Move to first input of next row
      const nextRow = currentRow.nextElementSibling;
      const firstCell = nextRow.cells[1]; // Skip date column
      const firstInput = firstCell?.querySelector('input');
      if (firstInput) {
        (firstInput as HTMLInputElement).focus();
        (firstInput as HTMLInputElement).select();
      }
    }
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    const prevCell = currentCell.previousElementSibling as HTMLTableCellElement;
    if (prevCell) {
      const prevInput = prevCell.querySelector('input');
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
        (prevInput as HTMLInputElement).select();
      }
    } else if (currentRow.previousElementSibling) {
      // Move to last input of previous row
      const prevRow = currentRow.previousElementSibling;
      const lastCell = prevRow.cells[prevRow.cells.length - 2]; // Skip total column
      const lastInput = lastCell?.querySelector('input');
      if (lastInput) {
        (lastInput as HTMLInputElement).focus();
        (lastInput as HTMLInputElement).select();
      }
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    
    const nextRow = currentRow.nextElementSibling;
    if (nextRow) {
      const targetCell = nextRow.cells[cellIndex];
      const targetInput = targetCell?.querySelector('input');
      if (targetInput) {
        (targetInput as HTMLInputElement).focus();
        (targetInput as HTMLInputElement).select();
      }
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    
    // Save the data and move to the next row
    try {
      // First save the data
      savePayroll();
      
      // Then move to the next row (if available)
      const nextRow = currentRow.nextElementSibling;
      if (nextRow) {
        const targetCell = nextRow.cells[cellIndex];
        const targetInput = targetCell?.querySelector('input');
        if (targetInput) {
          (targetInput as HTMLInputElement).focus();
          (targetInput as HTMLInputElement).select();
        }
      }
    } catch (error) {
      console.error('Error handling Enter key press:', error);
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prevRow = currentRow.previousElementSibling;
    if (prevRow && prevRow.tagName === 'TR') {
      const targetCell = prevRow.cells[cellIndex];
      const targetInput = targetCell?.querySelector('input');
      if (targetInput) {
        (targetInput as HTMLInputElement).focus();
        (targetInput as HTMLInputElement).select();
      }
    }
  }
};

export default function PayrollManager({
  confirmedStaff,
  setConfirmedStaff,
  projectStartDate,
  projectEndDate,
  projectId,
  onSave,
  disableAutoSave = false
}: PayrollManagerProps) {
  const [effectiveProjectId, setEffectiveProjectId] = useState<string>(projectId);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [currentEditDate, setCurrentEditDate] = useState<WorkingDateWithSalary | null>(null);
  const [tempBasicSalary, setTempBasicSalary] = useState<string>("");
  const [tempClaims, setTempClaims] = useState<string>("");
  const [tempCommission, setTempCommission] = useState<string>("");
  const [showCommissionColumn, setShowCommissionColumn] = useState(false);
  // Initialize the dialog state - this controls whether the "Set Basic Salary" dialog is open
  const [isSetBasicDialogOpen, setIsSetBasicDialogOpen] = useState(false);
  
  // Debug logging for dialog state
  useEffect(() => {
    console.log('Dialog state changed:', isSetBasicDialogOpen);
  }, [isSetBasicDialogOpen]);
  const [tempBasicValue, setTempBasicValue] = useState("");
  const [selectedStaffForBasic, setSelectedStaffForBasic] = useState<string[]>([]);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAllStaff, setShowAllStaff] = useState(false);
  const [sortColumn, setSortColumn] = useState<'staff' | 'position' | 'days' | 'perDay' | 'totalAmount'>('totalAmount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  
  // DuitNow Payment Export dialog state
  const [showDuitNowExport, setShowDuitNowExport] = useState(false);
  
  // Adding debug logging for dialog state changes
  useEffect(() => {
    console.log('DuitNow Export dialog state changed:', showDuitNowExport);
  }, [showDuitNowExport]);

  // Project ID validation and fallback logic
  useEffect(() => {
    const validateProjectId = async () => {
      if (!projectId || projectId === "undefined") {
        console.warn('Invalid project ID provided:', projectId);
        
        // Try to find a valid project ID from confirmed staff
        if (confirmedStaff.length > 0) {
          try {
            const { data } = await supabase
              .from('project_staff')
              .select('project_id')
              .eq('id', confirmedStaff[0].id)
              .limit(1);
            
            if (data && data[0]?.project_id) {
              setEffectiveProjectId(data[0].project_id);
              return;
            }
          } catch (error) {
            console.error('Error finding project ID:', error);
          }
        }
        
        // If no valid project ID found, use a placeholder
        setEffectiveProjectId('direct_update_only');
      } else {
        setEffectiveProjectId(projectId);
      }
    };
    
    validateProjectId();
  }, [projectId, confirmedStaff]);

  // Sync working dates with salary data
  useEffect(() => {
    const updatedStaff = confirmedStaff.map(staff => {
      if (!staff.workingDates || staff.workingDates.length === 0) {
        return staff;
      }

      let workingDatesWithSalary = staff.workingDatesWithSalary || [];
      
      // Check if every workingDate has a corresponding workingDatesWithSalary entry
      const needsUpdate = staff.workingDates.some(workingDate => {
        return !workingDatesWithSalary.some(wdws => {
          if (workingDate instanceof Date && wdws.date instanceof Date) {
            return workingDate.getTime() === wdws.date.getTime();
          }
          const dateA = workingDate instanceof Date ? workingDate.toISOString() : workingDate.toString();
          const dateB = wdws.date instanceof Date ? wdws.date.toISOString() : wdws.date.toString();
          return dateA === dateB;
        });
      });
      
      if (needsUpdate) {
        const existingDates = new Set(
          workingDatesWithSalary.map(wdws => 
            wdws.date instanceof Date ? wdws.date.toISOString() : wdws.date.toString()
          )
        );
        
        staff.workingDates.forEach(workingDate => {
          const dateKey = workingDate instanceof Date ? workingDate.toISOString() : workingDate.toString();
          if (!existingDates.has(dateKey)) {
            workingDatesWithSalary.push({
              date: workingDate,
              basicSalary: "",
              claims: "",
              commission: ""
            });
          }
        });
        
        return {
          ...staff,
          workingDatesWithSalary: workingDatesWithSalary.sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : new Date(a.date);
            const dateB = b.date instanceof Date ? b.date : new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          })
        };
      }
      
      return staff;
    });
    
    const hasChanges = JSON.stringify(updatedStaff) !== JSON.stringify(confirmedStaff);
    
    if (hasChanges) {
      setConfirmedStaff(updatedStaff);
    }
  }, [confirmedStaff, setConfirmedStaff]);

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
          comparison = (a.position || '').localeCompare(b.position || '');
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

  const handleSort = (column: 'staff' | 'position' | 'days' | 'perDay' | 'totalAmount') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

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

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Save payroll data with enhanced validation and error handling
  const savePayroll = async () => {
    // Run detailed validation
    const errors = validatePayrollDataWithDetails(confirmedStaff);
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      // Count actual errors (not warnings)
      const actualErrors = errors.filter(e => e.type === 'error').length;
      const warningCount = errors.length - actualErrors;
      
      // Show detailed validation errors dialog
      setShowValidationErrors(true);
      
      // Also show toast notification
      toast({
        title: actualErrors > 0 ? "Validation Errors" : "Validation Warnings",
        description: actualErrors > 0 
          ? `Found ${actualErrors} errors and ${warningCount} warnings. Please fix before saving.` 
          : `Found ${warningCount} warnings. You can still save, but please review.`,
        variant: actualErrors > 0 ? "destructive" : "warning"
      });
      
      // If there are actual errors (not just warnings), don't proceed
      if (actualErrors > 0) {
        return;
      }
    }

    setIsSaving(true);

    try {
      // Prepare payroll data
      const payrollData: PayrollData = {
        projectId: effectiveProjectId,
        staffPayroll: confirmedStaff.map(staff => {
          const staffName = staff.name || 'Unknown Staff';
          return {
            staffId: staff.id,
            staff_id: staff.id, // Include staff_id for backend compatibility
            staffName: staffName,
            workingSummary: staffSummaries.find(s => s.name === staffName) || {
              name: staffName,
              totalDays: 0,
              totalBasicSalary: 0,
              totalClaims: 0,
              totalCommission: 0,
              totalAmount: 0,
              workingDates: [],
              workingDatesWithSalary: []
            },
            workingDatesWithSalary: staff.workingDatesWithSalary || []
          };
        }),
        totalAmount: projectSummary.totalAmount,
        paymentDate: new Date()
      };

      let saveResult;
      
      if (onSave) {
        // Custom save handler
        saveResult = await onSave(payrollData);
      } else if (!disableAutoSave) {
        // Default save to database
        saveResult = await saveProjectPayroll(payrollData);
      }

      if (saveResult?.success === false) {
        throw new Error(saveResult.message || 'Unknown error during save');
      }

      toast({
        title: "Success",
        description: "Payroll data saved successfully",
      });
    } catch (error) {
      console.error('Error saving payroll:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save payroll data",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle individual date editing
  const handleEditDate = (staffId: string, date: WorkingDateWithSalary) => {
    setEditingStaffId(staffId);
    setCurrentEditDate(date);
    setTempBasicSalary(date.basicSalary);
    setTempClaims(date.claims);
    setTempCommission(date.commission);
    setIsEditingDate(true);
  };

  // Update date entry
  const updateDateEntry = () => {
    if (!editingStaffId || !currentEditDate) return;

    const updatedStaff = confirmedStaff.map(staff => {
      if (staff.id === editingStaffId) {
        const updatedDates = staff.workingDatesWithSalary?.map(wdws => {
          if (isSameDay(wdws.date, currentEditDate.date)) {
            return {
              ...wdws,
              basicSalary: tempBasicSalary,
              claims: tempClaims,
              commission: tempCommission
            };
          }
          return wdws;
        }) || [];

        return {
          ...staff,
          workingDatesWithSalary: updatedDates
        };
      }
      return staff;
    });

    setConfirmedStaff(updatedStaff);
    setIsEditingDate(false);
    setCurrentEditDate(null);
    setEditingStaffId(null);
  };

  // Set basic salary for selected staff dates
  const setBasicSalaryForAllDates = () => {
    try {
      // Capture the current state values (in case they change during processing)
      const currentBasicValue = tempBasicValue;
      const currentSelectedStaff = [...selectedStaffForBasic];
      
      console.log('setBasicSalaryForAllDates executing', { 
        currentBasicValue, 
        staffCount: currentSelectedStaff.length 
      });
      
      // Parse amount and validate
      const basicAmount = parseAmount(currentBasicValue);
      if (basicAmount <= 0) {
        console.error('Invalid basic salary amount:', basicAmount);
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount",
          variant: "destructive"
        });
        return;
      }

      if (currentSelectedStaff.length === 0) {
        console.error('No staff selected for basic salary update');
        toast({
          title: "No Staff Selected",
          description: "Please select at least one staff member",
          variant: "destructive"
        });
        return;
      }

      // Update staff data with new basic salary
      console.log('Updating staff salary data for', currentSelectedStaff.length, 'staff members');
      setConfirmedStaff(prevStaff => {
        return prevStaff.map(staff => {
          // Only update if this staff is selected
          if (currentSelectedStaff.includes(staff.id)) {
            console.log('Updating salary for staff:', staff.name || staff.id);
            
            const updatedDates = staff.workingDatesWithSalary?.map(date => ({
              ...date,
              basicSalary: currentBasicValue
            })) || [];

            return {
              ...staff,
              workingDatesWithSalary: updatedDates
            };
          }
          return staff;
        });
      });
      
      // Show success message
      console.log('Basic salary update completed');
      toast({
        title: "Success",
        description: `Basic salary of RM ${basicAmount.toLocaleString()} set for ${currentSelectedStaff.length} staff member(s)`,
      });
      
      console.log('setBasicSalaryForAllDates completed successfully');
    } catch (error) {
      console.error('Error in setBasicSalaryForAllDates:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating basic salary.",
        variant: "destructive"
      });
    }
  };

  // Prepare payment data for export
  const handleExportDuitNowPayment = () => {
    // First validate the data
    const errors = validatePayrollDataWithDetails(confirmedStaff);
    const actualErrors = errors.filter(e => e.type === 'error').length;
    
    if (actualErrors > 0) {
      setValidationErrors(errors);
      setShowValidationErrors(true);
      toast({
        title: "Validation Errors",
        description: `Found ${actualErrors} errors. Please fix before exporting payment file.`,
        variant: "destructive"
      });
      return;
    }
    
    // Prepare payroll data for export
    const payrollData: PayrollData = {
      projectId: effectiveProjectId,
      staffPayroll: confirmedStaff.map(staff => {
        const staffName = staff.name || 'Unknown Staff';
        return {
          staffId: staff.id,
          staff_id: staff.id,
          staffName: staffName,
          workingSummary: staffSummaries.find(s => s.name === staffName) || {
            name: staffName,
            totalDays: 0,
            totalBasicSalary: 0,
            totalClaims: 0,
            totalCommission: 0,
            totalAmount: 0,
            workingDates: [],
            workingDatesWithSalary: []
          },
          workingDatesWithSalary: staff.workingDatesWithSalary || []
        };
      }),
      totalAmount: projectSummary.totalAmount,
      paymentDate: new Date()
    };
    
    // Open the DuitNow payment export dialog
    setShowDuitNowExport(true);
  };

  // Render staff summary card with enhanced readability

  return (
    <div className="px-3 pt-0 pb-4 max-w-7xl mx-auto">
      {/* Header with total summary - enhanced with animations */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <motion.div 
            className="bg-white dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex flex-col items-center text-center">
              <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Total Sessions</Label>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {projectSummary.totalDays}
              </p>
            </div>
          </motion.div>
          <motion.div 
            className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 p-2 rounded-md border border-indigo-200 dark:border-indigo-800 shadow-sm"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex flex-col items-center text-center">
              <Label className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">Total Basic</Label>
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 leading-tight">
                RM {projectSummary.totalBasicSalary.toLocaleString()}
              </p>
            </div>
          </motion.div>
          <motion.div 
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-2 rounded-md border border-purple-200 dark:border-purple-800 shadow-sm"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex flex-col items-center text-center">
              <Label className="text-[10px] font-semibold text-purple-700 dark:text-purple-300">Claims</Label>
              <p className="text-sm font-bold text-purple-700 dark:text-purple-300 leading-tight">
                RM {projectSummary.totalClaims.toLocaleString()}
              </p>
            </div>
          </motion.div>
          <motion.div 
            className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 p-2 rounded-md border border-orange-200 dark:border-orange-800 shadow-sm"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex flex-col items-center text-center">
              <Label className="text-[10px] font-semibold text-orange-700 dark:text-orange-300">Commission</Label>
              <p className="text-sm font-bold text-orange-700 dark:text-orange-300 leading-tight">
                RM {projectSummary.totalCommission?.toLocaleString() || 0}
              </p>
            </div>
          </motion.div>
          <motion.div 
            className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-2 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-sm"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex flex-col items-center text-center">
              <Label className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Total Amount</Label>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 leading-tight">
                RM {projectSummary.totalAmount.toLocaleString()}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mt-6"
      >
        <MagicCard>
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-lg border border-indigo-200/50 dark:border-purple-700/50 shadow-sm overflow-hidden">
            <div className="p-4">
              
              {/* Keyboard Instructions Removed */}
              
              {/* NEW: Direct Action Button Bar */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg border border-blue-100 dark:border-blue-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-blue-800 dark:text-blue-300">Bulk Actions</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Apply changes to multiple staff members at once</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      console.log("New Set Basic Salary button clicked!");
                      // Set default selections
                      setSelectedStaffForBasic(confirmedStaff.map(s => s.id));
                      // Force open the dialog
                      setTimeout(() => {
                        setIsSetBasicDialogOpen(true);
                      }, 0);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md hover:shadow-lg"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Set Basic Salary
                  </Button>
                  <Button
                    onClick={() => {
                      console.log("DuitNow Payment button clicked");
                      handleExportDuitNowPayment();
                      console.log("showDuitNowExport set to:", true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg"
                    disabled={projectSummary.totalAmount <= 0}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    DuitNow Payment
                  </Button>
                  <Button
                    onClick={savePayroll}
                    className="save-payroll-button bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md hover:shadow-lg"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => handleSort('staff')}>
                      Staff
                    </TableHead>
                    <TableHead className="font-bold text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => handleSort('position')}>
                      Position
                    </TableHead>
                    <TableHead className="font-bold text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => handleSort('days')}>
                      Days
                    </TableHead>
                    <TableHead className="font-bold text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => handleSort('perDay')}>
                      Per Day
                    </TableHead>
                    <TableHead className="font-bold text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => handleSort('totalAmount')}>
                      Total Amount
                    </TableHead>
                    <TableHead className="font-bold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStaffData.map(staff => {
                    const staffName = staff.name || 'Unknown Staff';
                    const summary = staffSummaries.find(s => s.name === staffName);
                    if (!summary) return null;

                    return (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-7 w-7">
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
                        <TableCell className="text-center">RM {summary.totalDays > 0 ? Math.round(summary.totalBasicSalary / summary.totalDays).toLocaleString() : 0}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-0">
                            RM {summary.totalAmount.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                // Explicitly set the ID with a dedicated function call
                                setEditingStaffId(staff.id);
                              }}
                              title="View Details"
                              className="hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Details</span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingStaffId(staff.id);
                                  }}
                                >
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </MagicCard>
        
        {/* Add main save button at bottom */}
        <div className="flex justify-end mt-8">
          <Button 
            onClick={savePayroll}
            className="save-payroll-button bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-md font-medium text-base shadow-md"
          >
            Save Changes
          </Button>
        </div>
      </motion.div>

      {/* Individual Staff Details Dialog */}
      <Dialog open={editingStaffId !== null} onOpenChange={(open) => !open && setEditingStaffId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
          {editingStaffId && (() => {
            const staff = confirmedStaff.find(s => s.id === editingStaffId);
            if (!staff) return null;
            
            // Check if any commission values exist
            const hasCommissionValues = staff.workingDatesWithSalary?.some(
              date => date.commission && parseFloat(date.commission) > 0
            ) || false;
            
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
                          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {staff.name || 'Unknown Staff'}
                          </DialogTitle>
                          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                            {staff.designation || "Staff Member"}
                          </DialogDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {staff.workingDatesWithSalary?.length || 0} Working Days
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            RM {staffSummaries.find(s => s.name === (staff.name || 'Unknown Staff'))?.totalBasicSalary.toLocaleString() || 0} Basic
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            RM {staffSummaries.find(s => s.name === (staff.name || 'Unknown Staff'))?.totalClaims.toLocaleString() || 0} Claims
                          </span>
                        </div>
                        {(showCommissionColumn || hasCommissionValues) && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-orange-600" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              RM {staffSummaries.find(s => s.name === (staff.name || 'Unknown Staff'))?.totalCommission.toLocaleString() || 0} Comm.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 self-stretch flex items-center">
                      <div className="text-center w-full">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Amount</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          RM {staffSummaries.find(s => s.name === (staff.name || 'Unknown Staff'))?.totalAmount.toLocaleString() || 0}
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
                              <TableHead colSpan={5} className="py-2">
                                <div className="flex justify-between items-center px-2">
                                  <div className="flex gap-3 items-center">
                                    <label htmlFor="show-commission" className="flex items-center gap-1.5 cursor-pointer">
                                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Show Commission
                                      </span>
                                      <div className="relative">
                                        <input
                                          id="show-commission"
                                          type="checkbox"
                                          checked={showCommissionColumn || hasCommissionValues}
                                          onChange={(e) => {
                                            // Only allow toggling off if there are no commission values
                                            if (hasCommissionValues && !e.target.checked) {
                                              toast({
                                                title: "Cannot hide commission",
                                                description: "Commission values exist. Clear all commission values first.",
                                                variant: "destructive"
                                              });
                                              return;
                                            }
                                            setShowCommissionColumn(e.target.checked);
                                          }}
                                          className="sr-only"
                                        />
                                        <div className={`block w-10 h-5 rounded-full transition-colors ${(showCommissionColumn || hasCommissionValues) ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                          <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${(showCommissionColumn || hasCommissionValues) ? 'translate-x-5' : ''}`} />
                                        </div>
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              </TableHead>
                            </TableRow>
                            <TableRow className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
                              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-sm py-2 w-4/12">Date</TableHead>
                              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-sm text-center w-2/12">Basic</TableHead>
                              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-sm text-center w-2/12">Claims</TableHead>
                              {(showCommissionColumn || hasCommissionValues) && <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-sm text-center w-2/12">Comm</TableHead>}
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
                            const isWeekendDay = isWeekend(date);
                            const basicAmount = parseAmount(dateEntry.basicSalary);
                            const claimsAmount = parseAmount(dateEntry.claims);
                            const commissionAmount = parseAmount(dateEntry.commission);
                            const totalAmount = basicAmount + claimsAmount + commissionAmount;

                            return (
                              <motion.tr 
                                key={index} 
                                className={isWeekendDay ? "bg-purple-50 dark:bg-purple-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 even:bg-slate-50/50 dark:even:bg-slate-800/20"}
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
                                    {isWeekendDay && (
                                      <Badge className="text-[10px] bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-0 px-2 py-1 ml-1">
                                        Weekend
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="p-1 w-2/12">
                                  <Input
                                    type="text"
                                    value={dateEntry.basicSalary}
                                    onChange={(e) => {
                                      const updatedStaff = confirmedStaff.map(s => {
                                        if (s.id === staff.id) {
                                          const updatedDates = s.workingDatesWithSalary?.map(wdws => {
                                            if (isSameDay(wdws.date, dateEntry.date)) {
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
                                    onKeyDown={handleTableNavigation}
                                    placeholder="0"
                                    className="h-8 text-sm text-center font-medium w-full px-1"
                                  />
                                </TableCell>
                                <TableCell className="p-1 w-2/12">
                                  <Input
                                    type="text"
                                    value={dateEntry.claims}
                                    onChange={(e) => {
                                      const updatedStaff = confirmedStaff.map(s => {
                                        if (s.id === staff.id) {
                                          const updatedDates = s.workingDatesWithSalary?.map(wdws => {
                                            if (isSameDay(wdws.date, dateEntry.date)) {
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
                                    onKeyDown={handleTableNavigation}
                                    placeholder="0"
                                    disabled={dateEntry.isExpenseApproved === true}
                                    className={`h-8 text-sm text-center font-medium w-full px-1 ${
                                      dateEntry.isExpenseApproved ? 'bg-gray-100 cursor-not-allowed' : ''
                                    }`}
                                  />
                                </TableCell>
                                {(showCommissionColumn || hasCommissionValues) && (
                                  <TableCell className="p-1 w-2/12">
                                    <Input
                                      type="text"
                                      value={dateEntry.commission}
                                      onChange={(e) => {
                                        const updatedStaff = confirmedStaff.map(s => {
                                          if (s.id === staff.id) {
                                            const updatedDates = s.workingDatesWithSalary?.map(wdws => {
                                              if (isSameDay(wdws.date, dateEntry.date)) {
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
                                      onKeyDown={handleTableNavigation}
                                      placeholder="0"
                                      className="h-8 text-sm text-center font-medium w-full px-1"
                                    />
                                  </TableCell>
                                )}
                                <TableCell className="font-bold text-sm text-emerald-700 dark:text-emerald-300 text-center px-2 w-2/12">
                                  RM {totalAmount.toLocaleString()}
                                </TableCell>
                              </motion.tr>
                            );
                          })}
                      </TableBody>
                      <tfoot>
                        <TableRow className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700">
                          <TableCell colSpan={(showCommissionColumn || hasCommissionValues) ? 4 : 3} className="font-semibold text-sm text-slate-900 dark:text-slate-100 py-2 text-right pr-4">
                            Grand Total
                          </TableCell>
                          <TableCell className="font-bold text-sm text-emerald-700 dark:text-emerald-300 text-center px-2 w-2/12">
                            RM {staffSummaries.find(s => s.name === (staff.name || 'Unknown Staff'))?.totalAmount.toLocaleString() || 0}
                          </TableCell>
                        </TableRow>
                      </tfoot>
                    </Table>
                  </div>
                </div>
                
                {/* Add footer with Save Changes button */}
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={savePayroll}
                    className="save-payroll-button bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium shadow-md"
                  >
                    Save Changes
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>


      {/* Edit Date Dialog */}
      <Dialog open={isEditingDate} onOpenChange={setIsEditingDate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              Edit Payment Details
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
              Update payment details for {currentEditDate && format(currentEditDate.date, 'EEEE, dd MMMM yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="basicSalary" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Basic Salary
              </Label>
              <Input
                id="basicSalary"
                type="text"
                value={tempBasicSalary}
                onChange={(e) => setTempBasicSalary(e.target.value)}
                placeholder="0.00"
                className="focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="claims" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Claims {currentEditDate?.dateEntry.isExpenseApproved && '(Approved)'}
              </Label>
              <Input
                id="claims"
                type="text"
                value={tempClaims}
                onChange={(e) => setTempClaims(e.target.value)}
                placeholder="0.00"
                disabled={currentEditDate?.dateEntry.isExpenseApproved === true}
                className={`focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 ${
                  currentEditDate?.dateEntry.isExpenseApproved ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
            
            {showCommissionColumn && (
              <div className="space-y-2">
                <Label htmlFor="commission" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Commission
                </Label>
                <Input
                  id="commission"
                  type="text"
                  value={tempCommission}
                  onChange={(e) => setTempCommission(e.target.value)}
                  placeholder="0.00"
                  className="focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditingDate(false)}
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={updateDateEntry}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Errors Dialog */}
      <Dialog open={showValidationErrors} onOpenChange={setShowValidationErrors}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0 flex flex-col">
          <DialogHeader className="p-4 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Validation Issues
            </DialogTitle>
            <DialogDescription>
              Please address the following issues before saving payroll data
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {validationErrors.length === 0 ? (
                <p className="text-center text-green-600 py-6">No validation issues found</p>
              ) : (
                validationErrors.map((error, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${
                      error.type === 'error' 
                        ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/50' 
                        : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {error.type === 'error' ? (
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`font-semibold ${
                            error.type === 'error' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
                          }`}>
                            {error.staffName}
                          </p>
                          <Badge className={`px-2 text-xs ${
                            error.type === 'error' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}>
                            {error.type === 'error' ? 'Error' : 'Warning'}
                          </Badge>
                          {error.date && (
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {format(error.date, 'dd MMM yyyy')}
                            </span>
                          )}
                          {error.field && (
                            <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-2 text-xs">
                              {error.field}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1 text-slate-700 dark:text-slate-300">
                          {error.message}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 rounded-full p-0"
                        onClick={() => {
                          const staff = confirmedStaff.find(s => s.id === error.staffId);
                          if (staff) {
                            setEditingStaffId(staff.id);
                            setShowValidationErrors(false);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <DialogFooter className="p-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={() => setShowValidationErrors(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowValidationErrors(false);
                // If there are only warnings (no errors), we can still save
                if (validationErrors.every(e => e.type !== 'error')) {
                  savePayroll();
                }
              }}
              disabled={validationErrors.some(e => e.type === 'error')}
            >
              {validationErrors.some(e => e.type === 'error') 
                ? 'Fix Errors to Continue' 
                : 'Save Anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW SIMPLIFIED Set Basic Salary Dialog */}
      {isSetBasicDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 border-b border-indigo-100 dark:border-indigo-900">
              <h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-300">Set Basic Salary</h2>
              <p className="text-sm text-indigo-600 dark:text-indigo-500">Set the same basic salary for multiple staff members</p>
            </div>
            
            {/* Body */}
            <div className="p-6 flex-1 overflow-auto">
              <div className="space-y-6">
                {/* Staff selection section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Staff Members ({selectedStaffForBasic.length}/{confirmedStaff.length} selected)
                    </label>
                    <button
                      onClick={() => {
                        if (selectedStaffForBasic.length === confirmedStaff.length) {
                          setSelectedStaffForBasic([]);
                        } else {
                          setSelectedStaffForBasic(confirmedStaff.map(s => s.id));
                        }
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                    >
                      {selectedStaffForBasic.length === confirmedStaff.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 max-h-[200px] overflow-y-auto">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {confirmedStaff.map((staff) => (
                        <label key={staff.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
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
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {staff.name || "Unnamed Staff"} ({staff.workingDatesWithSalary?.length || 0} days)
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Basic salary input section */}
                <div>
                  <label htmlFor="basicSalary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Basic Salary Amount (RM)
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">RM</span>
                    </div>
                    <input
                      type="text"
                      name="basicSalary"
                      id="basicSalary"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-4 py-3 text-lg sm:text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md"
                      placeholder="0.00"
                      value={tempBasicValue}
                      onChange={(e) => setTempBasicValue(e.target.value)}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    This amount will be applied to all working dates for the selected staff members.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => {
                  console.log("Cancel button clicked");
                  setIsSetBasicDialogOpen(false);
                  setSelectedStaffForBasic([]);
                  setTempBasicValue("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
                  selectedStaffForBasic.length === 0 || !tempBasicValue
                    ? 'bg-indigo-300 dark:bg-indigo-800 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700'
                }`}
                disabled={selectedStaffForBasic.length === 0 || !tempBasicValue}
                onClick={() => {
                  console.log("Apply button clicked");
                  
                  // Process data and close dialog
                  try {
                    // First close the dialog
                    setIsSetBasicDialogOpen(false);
                    
                    // Then update the data
                    setBasicSalaryForAllDates();
                  } catch (error) {
                    console.error("Error applying basic salary:", error);
                    toast({
                      title: "Error",
                      description: "Failed to apply basic salary. See console for details.",
                      variant: "destructive"
                    });
                  }
                }}
              >
                Apply to Selected Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DuitNow Payment Export Dialog */}
      <DuitNowPaymentExport
        open={showDuitNowExport}
        onOpenChange={setShowDuitNowExport}
        projectId={effectiveProjectId}
        projectName="Project Name" // You may need to pass the actual project name
        staffPayrollEntries={confirmedStaff.map(staff => {
          const staffName = staff.name || 'Unknown Staff';
          return {
            staffId: staff.id,
            staff_id: staff.id,
            staffName: staffName,
            workingSummary: staffSummaries.find(s => s.name === staffName),
            workingDatesWithSalary: staff.workingDatesWithSalary || []
          };
        })}
        paymentDate={new Date()}
      />
    </div>
  );
}