import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar as CalendarIcon,
  Download,
  Users,
  Info,
  AlertCircle,
  CheckCircle,
  Copy,
  Calendar as CalendarLucide,
  DollarSign,
  Building2 as Bank, // Using Building2 instead of Bank
  CreditCard
} from "lucide-react";

// Types
import { StaffWorkingSummary } from "../payroll-manager/types";
import { supabase } from "../payroll-manager/adapter";

// Define bank codes for DuitNow
const BANK_CODES = {
  "MAYBANK": "MBB0228",
  "CIMB": "BCBB0235",
  "PUBLIC_BANK": "PBB0233",
  "RHB_BANK": "RHBB0000",
  "BANK_ISLAM": "BIMBMYKL",
  "HONG_LEONG_BANK": "HLB0224",
  "BANK_RAKYAT": "BKRM0602",
  "AMBANK": "ARBKMYKL",
  "ALLIANCE_BANK": "MFBBMYKL",
  "HSBC_BANK": "HBMBMYKL",
  "OCBC_BANK": "OCBCMYKL",
  "STANDARD_CHARTERED": "SCBLMYKL",
  "UOB_BANK": "UOVBMYKL",
  "BANK_MUAMALAT": "BMMBMYKL",
  "AFFIN_BANK": "PHBMMYKL",
  "CITIBANK": "CITIMYKL",
  "MBSB_BANK": "AFBQMYKL",
  "AL_RAJHI_BANK": "RJHIMYKL",
  "DEUTSCHE_BANK": "DEUTMYKL",
};

// Friendly bank names mapping
const BANK_FRIENDLY_NAMES = {
  "MBB0228": "Maybank",
  "BCBB0235": "CIMB Bank",
  "PBB0233": "Public Bank",
  "RHBB0000": "RHB Bank",
  "BIMBMYKL": "Bank Islam",
  "HLB0224": "Hong Leong Bank",
  "BKRM0602": "Bank Rakyat",
  "ARBKMYKL": "AmBank",
  "MFBBMYKL": "Alliance Bank",
  "HBMBMYKL": "HSBC Bank",
  "OCBCMYKL": "OCBC Bank",
  "SCBLMYKL": "Standard Chartered",
  "UOVBMYKL": "UOB Bank",
  "BMMBMYKL": "Bank Muamalat",
  "PHBMMYKL": "Affin Bank",
  "CITIMYKL": "Citibank",
  "AFBQMYKL": "MBSB Bank",
  "RJHIMYKL": "Al-Rajhi Bank",
  "DEUTMYKL": "Deutsche Bank",
};

// Helper function to get friendly bank name
const getFriendlyBankName = (bankCode: string) => {
  return BANK_FRIENDLY_NAMES[bankCode] || bankCode;
};

// Helper function to format account number (add spaces every 4 characters)
const formatAccountNumber = (accountNumber: string) => {
  if (!accountNumber) return "";
  return accountNumber.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || accountNumber;
};

// Define interfaces for component props
interface StaffPaymentEntry {
  staffId: string;
  staff_id: string;
  staffName: string;
  workingSummary: StaffWorkingSummary;
  accountNumber?: string;
  bankCode?: string;
  email?: string;
  phone?: string;
  workingDatesWithSalary: any[];
}

export interface DuitNowPaymentExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  staffPayrollEntries: StaffPaymentEntry[];
  paymentDate: Date;
}

export function DuitNowPaymentExport({
  open,
  onOpenChange,
  projectId,
  projectName,
  staffPayrollEntries,
  paymentDate
}: DuitNowPaymentExportProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [staffPaymentDetails, setStaffPaymentDetails] = useState<StaffPaymentEntry[]>([]);
  const [includeAllStaff, setIncludeAllStaff] = useState(false);
  const [defaultBankCode, setDefaultBankCode] = useState<string>('MBB0228');
  const [effectivePaymentDate, setEffectivePaymentDate] = useState<Date>(paymentDate || new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hasCopiedBatchId, setHasCopiedBatchId] = useState(false);
  const [hasCopiedProjectName, setHasCopiedProjectName] = useState(false);
  
  // Effect to generate batch ID on open
  useEffect(() => {
    if (open) {
      // Generate a batch ID based on date and project ID
      const dateStr = format(new Date(), 'yyyyMMddHHmmss');
      const projectHash = projectId?.substring(0, 6) || 'unknown';
      setBatchId(`DuitNow-${dateStr}-${projectHash}`);
      
      // Reset copied states
      setHasCopiedBatchId(false);
      setHasCopiedProjectName(false);
    }
  }, [open, projectId]);
  
  // Effect to load staff details
  useEffect(() => {
    const loadStaffDetails = async () => {
      setIsLoading(true);
      try {
        // Create initial staff payment details from provided entries
        const initialDetails = await Promise.all(staffPayrollEntries.map(async (entry) => {
          // Attempt to fetch additional staff details from database
          let bankCode = entry.bankCode;
          let accountNumber = entry.accountNumber;
          let email = entry.email;
          let phone = entry.phone;
          
          if (!bankCode || !accountNumber) {
            try {
              // Try to fetch from staff profiles or candidates table
              const { data: staffData } = await supabase
                .from('staff_profiles')
                .select('bank_code, account_number, email, phone')
                .eq('id', entry.staffId)
                .single();
                
              if (staffData) {
                bankCode = staffData.bank_code || bankCode;
                accountNumber = staffData.account_number || accountNumber;
                email = staffData.email || email;
                phone = staffData.phone || phone;
              } else {
                // Try candidates table as fallback
                const { data: candidateData } = await supabase
                  .from('candidates')
                  .select('bank_code, account_number, email, phone')
                  .eq('id', entry.staffId)
                  .single();
                  
                if (candidateData) {
                  bankCode = candidateData.bank_code || bankCode;
                  accountNumber = candidateData.account_number || accountNumber;
                  email = candidateData.email || email;
                  phone = candidateData.phone || phone;
                }
              }
            } catch (error) {
              console.warn('Error fetching staff bank details:', error);
              // We'll continue with missing details
            }
          }
          
          return {
            ...entry,
            bankCode,
            accountNumber,
            email,
            phone,
            selected: true // Default all to selected
          };
        }));
        
        setStaffPaymentDetails(initialDetails);
      } catch (error) {
        console.error('Error loading staff payment details:', error);
        toast({
          title: "Error",
          description: "Failed to load staff payment details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (open && staffPayrollEntries.length > 0) {
      loadStaffDetails();
    }
  }, [open, staffPayrollEntries, toast]);
  
  // Calculate staff with missing bank details
  const staffWithMissingDetails = useMemo(() => {
    return staffPaymentDetails.filter(staff => 
      !staff.bankCode || !staff.accountNumber || staff.accountNumber.trim() === '');
  }, [staffPaymentDetails]);
  
  // Calculate total payment amount
  const totalPaymentAmount = useMemo(() => {
    return staffPaymentDetails
      .filter(staff => staff.selected)
      .reduce((sum, staff) => sum + (staff.workingSummary?.totalAmount || 0), 0);
  }, [staffPaymentDetails]);
  
  // Handle applying default bank code to all missing entries
  const applyDefaultBankToAll = () => {
    if (!defaultBankCode) return;
    
    setStaffPaymentDetails(prev => 
      prev.map(staff => {
        if (!staff.bankCode) {
          return { ...staff, bankCode: defaultBankCode };
        }
        return staff;
      })
    );
    
    toast({
      title: "Bank Code Applied",
      description: `Default bank code applied to ${staffWithMissingDetails.length} staff members`,
    });
  };
  
  // Handle toggling staff selection
  const toggleStaffSelection = (staffId: string) => {
    setStaffPaymentDetails(prev => 
      prev.map(staff => {
        if (staff.staffId === staffId) {
          return { ...staff, selected: !staff.selected };
        }
        return staff;
      })
    );
  };
  
  // Handle updating bank code for a specific staff
  const updateStaffBankCode = (staffId: string, bankCode: string) => {
    setStaffPaymentDetails(prev => 
      prev.map(staff => {
        if (staff.staffId === staffId) {
          return { ...staff, bankCode };
        }
        return staff;
      })
    );
  };
  
  // Handle updating account number for a specific staff
  const updateStaffAccountNumber = (staffId: string, accountNumber: string) => {
    setStaffPaymentDetails(prev => 
      prev.map(staff => {
        if (staff.staffId === staffId) {
          return { ...staff, accountNumber };
        }
        return staff;
      })
    );
  };
  
  // Toggle including all staff regardless of bank details
  const toggleIncludeAllStaff = () => {
    setIncludeAllStaff(!includeAllStaff);
  };
  
  // Generate CSV data for DuitNow payment format
  const generateCsvData = () => {
    // Check for any staff with missing bank details
    const staffWithErrors = staffPaymentDetails.filter(staff => 
      staff.selected && (!staff.bankCode || !staff.accountNumber || staff.accountNumber.trim() === '')
    );
    
    if (staffWithErrors.length > 0 && !includeAllStaff) {
      toast({
        title: "Missing Bank Details",
        description: `${staffWithErrors.length} staff members are missing bank details. Please complete the information or enable "Include staff without bank details".`,
        variant: "destructive"
      });
      return null;
    }
    
    // Filter staff based on selection and bank details
    const eligibleStaff = staffPaymentDetails.filter(staff => 
      staff.selected && (includeAllStaff || (staff.bankCode && staff.accountNumber))
    );
    
    if (eligibleStaff.length === 0) {
      toast({
        title: "No Eligible Staff",
        description: "No staff members are eligible for payment export",
        variant: "destructive"
      });
      return null;
    }
    
    // Format the payment date
    const formattedPaymentDate = format(effectivePaymentDate, 'yyyyMMdd');
    
    // Header row for DuitNow CSV
    const header = [
      'PAYMENT_TYPE',
      'PAYMENT_CURRENCY',
      'PAYMENT_AMOUNT',
      'PAYMENT_DATE',
      'BENEFICIARY_NAME',
      'BENEFICIARY_ID_TYPE',
      'BENEFICIARY_ID',
      'PAYMENT_DETAILS1',
      'PAYMENT_DETAILS2',
      'PAYMENT_DETAILS3',
      'PAYMENT_DETAILS4',
      'EMAIL',
      'MOBILE_NO'
    ].join(',');
    
    // Generate data rows
    const dataRows = eligibleStaff.map((staff, index) => {
      const paymentDetails1 = `Salary for ${projectName || 'Project'} - ${format(effectivePaymentDate, 'MMM yyyy')}`;
      const paymentDetails2 = staff.workingSummary?.totalDays ? `${staff.workingSummary.totalDays} days worked` : '';
      
      // Format bank account ID based on bank code
      let beneficiaryId = staff.accountNumber ? staff.accountNumber.replace(/\s+/g, '') : '';
      
      // Check if bank code is available, otherwise use a placeholder
      const bankCode = staff.bankCode || (includeAllStaff ? 'MISSING' : '');
      
      return [
        'IBG', // PAYMENT_TYPE: Interbank GIRO
        'MYR', // PAYMENT_CURRENCY: Malaysian Ringgit
        staff.workingSummary?.totalAmount.toFixed(2) || '0.00', // PAYMENT_AMOUNT
        formattedPaymentDate, // PAYMENT_DATE in YYYYMMDD format
        staff.staffName, // BENEFICIARY_NAME
        'A', // BENEFICIARY_ID_TYPE: A for Account Number
        beneficiaryId ? `${bankCode}${beneficiaryId}` : '', // BENEFICIARY_ID
        paymentDetails1, // PAYMENT_DETAILS1
        paymentDetails2, // PAYMENT_DETAILS2
        '', // PAYMENT_DETAILS3
        '', // PAYMENT_DETAILS4
        staff.email || '', // EMAIL
        staff.phone || '' // MOBILE_NO
      ].join(',');
    });
    
    // Combine header and data rows
    return [header, ...dataRows].join('\n');
  };
  
  // Handle downloading the CSV file
  const handleDownloadCsv = () => {
    try {
      const csvData = generateCsvData();
      if (!csvData) return;
      
      // Create a blob with the CSV data
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      const filename = `${batchId.replace(/\s+/g, '_')}.csv`;
      
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "CSV Generated",
        description: `Generated ${staffPaymentDetails.filter(s => s.selected).length} payment entries`,
      });
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast({
        title: "Error",
        description: "Failed to generate CSV file",
        variant: "destructive"
      });
    }
  };
  
  // Handle copying text to clipboard
  const copyToClipboard = (text: string, type: 'batchId' | 'projectName') => {
    navigator.clipboard.writeText(text).then(
      () => {
        if (type === 'batchId') {
          setHasCopiedBatchId(true);
          setTimeout(() => setHasCopiedBatchId(false), 2000);
        } else {
          setHasCopiedProjectName(true);
          setTimeout(() => setHasCopiedProjectName(false), 2000);
        }
      },
      (err) => {
        console.error('Failed to copy text: ', err);
        toast({
          title: "Copy Failed",
          description: "Failed to copy to clipboard",
          variant: "destructive"
        });
      }
    );
  };
  
  // Use proper Dialog component for consistent behavior
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 border-b border-blue-100 dark:border-blue-900/50">
          <DialogTitle className="text-xl font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Bank className="w-5 h-5" />
            DuitNow Payment Export
          </DialogTitle>
          <DialogDescription className="text-blue-600 dark:text-blue-400">
            Export staff payments in DuitNow bulk payment format
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Payment Details Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-700 dark:text-slate-300 text-sm">
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="relative">
                      <Label className="text-xs text-slate-500 dark:text-slate-400">Project Name</Label>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{projectName}</p>
                        <button 
                          onClick={() => copyToClipboard(projectName, 'projectName')}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="Copy project name"
                        >
                          {hasCopiedProjectName ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <Label className="text-xs text-slate-500 dark:text-slate-400">Batch ID</Label>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{batchId}</p>
                        <button 
                          onClick={() => copyToClipboard(batchId, 'batchId')}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="Copy batch ID"
                        >
                          {hasCopiedBatchId ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 dark:text-slate-400">Payment Date</Label>
                      <div className="relative mt-1">
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal flex justify-between items-center border-slate-200 dark:border-slate-700"
                            >
                              <span>{format(effectivePaymentDate, 'PPP')}</span>
                              <CalendarIcon className="h-4 w-4 opacity-70" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={effectivePaymentDate}
                              onSelect={(date) => {
                                if (date) {
                                  setEffectivePaymentDate(date);
                                  setIsCalendarOpen(false);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-sm border border-blue-100 dark:border-blue-900/50 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-700 dark:text-blue-300 text-sm">
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-blue-500 dark:text-blue-400">Total Staff</Label>
                      <p className="font-semibold text-blue-800 dark:text-blue-200">
                        {staffPaymentDetails.filter(s => s.selected).length} selected of {staffPaymentDetails.length}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-500 dark:text-blue-400">Total Amount</Label>
                      <p className="font-bold text-lg text-blue-800 dark:text-blue-200">
                        RM {totalPaymentAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {staffWithMissingDetails.length > 0 && (
                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 shadow-sm border border-orange-100 dark:border-orange-900/50 overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-orange-700 dark:text-orange-300 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Missing Bank Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">
                          {staffWithMissingDetails.length} staff members are missing bank details
                        </p>
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <Switch
                            id="include-all"
                            checked={includeAllStaff}
                            onCheckedChange={toggleIncludeAllStaff}
                          />
                          <Label htmlFor="include-all" className="text-xs text-orange-700 dark:text-orange-300">
                            Include staff without bank details
                          </Label>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <Label htmlFor="default-bank" className="text-xs text-orange-700 dark:text-orange-300">
                            Set default bank for missing entries
                          </Label>
                          <div className="flex gap-2">
                            <Select 
                              value={defaultBankCode} 
                              onValueChange={setDefaultBankCode}
                            >
                              <SelectTrigger className="w-full border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-900">
                                <SelectValue placeholder="Select bank" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(BANK_CODES).map(([key, code]) => (
                                  <SelectItem key={code} value={code}>
                                    {key.replace(/_/g, ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={applyDefaultBankToAll}
                              className="border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Staff List Table */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="py-3 px-4 bg-slate-50 dark:bg-slate-900">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  Staff Payment Details
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <TableHead className="w-12 px-4">
                        <Checkbox 
                          checked={staffPaymentDetails.length > 0 && staffPaymentDetails.every(s => s.selected)}
                          onCheckedChange={(checked) => {
                            setStaffPaymentDetails(prev => 
                              prev.map(staff => ({ ...staff, selected: !!checked }))
                            );
                          }}
                        />
                      </TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {staffPaymentDetails.map((staff, index) => {
                        const hasMissingDetails = !staff.bankCode || !staff.accountNumber;
                        
                        return (
                          <motion.tr
                            key={staff.staffId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                            className={
                              hasMissingDetails
                                ? "bg-orange-50 dark:bg-orange-950/10 hover:bg-orange-100 dark:hover:bg-orange-950/20"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            }
                          >
                            <TableCell className="w-12 px-4">
                              <Checkbox 
                                checked={staff.selected}
                                onCheckedChange={() => toggleStaffSelection(staff.staffId)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                                    {staff.staffName.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{staff.staffName}</p>
                                  <p className="text-xs text-slate-500">
                                    {staff.workingSummary?.totalDays || 0} days
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={staff.bankCode || ""} 
                                onValueChange={(value) => updateStaffBankCode(staff.staffId, value)}
                              >
                                <SelectTrigger 
                                  className={`w-full h-9 px-3 ${
                                    !staff.bankCode 
                                      ? "border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-400" 
                                      : ""
                                  }`}
                                >
                                  <SelectValue placeholder="Select bank">
                                    {staff.bankCode ? getFriendlyBankName(staff.bankCode) : "Select bank"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(BANK_CODES).map(([key, code]) => (
                                    <SelectItem key={code} value={code}>
                                      {key.replace(/_/g, ' ')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={staff.accountNumber || ""}
                                onChange={(e) => updateStaffAccountNumber(staff.staffId, e.target.value)}
                                placeholder="Enter account number"
                                className={`h-9 ${
                                  !staff.accountNumber 
                                    ? "border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-400" 
                                    : ""
                                }`}
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              RM {staff.workingSummary?.totalAmount.toLocaleString() || 0}
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
              {staffPaymentDetails.length === 0 && (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <p>No staff payment data available</p>
                </div>
              )}
            </Card>
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {staffPaymentDetails.filter(s => s.selected).length} staff selected for payment
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This will generate a CSV file in DuitNow format</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleDownloadCsv}
                  disabled={staffPaymentDetails.filter(s => s.selected).length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export DuitNow CSV
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DuitNowPaymentExport;