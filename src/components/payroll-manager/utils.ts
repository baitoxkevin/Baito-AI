import { StaffMember, WorkingDateWithSalary } from './types';
import { format, isSameDay } from 'date-fns';

export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

export const parseAmount = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
  }
  return 0;
};

export interface ValidationError {
  staffId: string;
  staffName: string;
  date: Date;
  message: string;
  type: 'error' | 'warning';
  field?: 'basicSalary' | 'claims' | 'commission';
}

export const validatePayrollData = (staff: StaffMember[]): boolean => {
  return staff.every(member => {
    if (!member.workingDatesWithSalary || member.workingDatesWithSalary.length === 0) {
      return true; // No working dates to validate
    }
    
    return member.workingDatesWithSalary.every(date => {
      const basicSalary = parseAmount(date.basicSalary);
      const claims = parseAmount(date.claims);
      const commission = parseAmount(date.commission);
      
      // At least one amount should be greater than 0
      return basicSalary > 0 || claims > 0 || commission > 0;
    });
  });
};

export const validatePayrollDataWithDetails = (staff: StaffMember[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  staff.forEach(member => {
    if (!member.workingDatesWithSalary || member.workingDatesWithSalary.length === 0) {
      // No working dates - add warning
      errors.push({
        staffId: member.id,
        staffName: member.name || 'Unknown Staff',
        date: new Date(), // No specific date
        message: 'Staff has no working dates assigned',
        type: 'warning'
      });
      return;
    }
    
    member.workingDatesWithSalary.forEach(date => {
      const basicSalary = parseAmount(date.basicSalary);
      const claims = parseAmount(date.claims);
      const commission = parseAmount(date.commission);
      
      // Validate basic salary
      if (basicSalary <= 0) {
        errors.push({
          staffId: member.id,
          staffName: member.name || 'Unknown Staff',
          date: date.date instanceof Date ? date.date : new Date(date.date),
          message: 'Basic salary must be greater than 0',
          type: 'error',
          field: 'basicSalary'
        });
      }
      
      // Validate claims (optional, only if entered)
      if (date.claims && parseAmount(date.claims) < 0) {
        errors.push({
          staffId: member.id,
          staffName: member.name || 'Unknown Staff',
          date: date.date instanceof Date ? date.date : new Date(date.date),
          message: 'Claims cannot be negative',
          type: 'error',
          field: 'claims'
        });
      }
      
      // Validate commission (optional, only if entered)
      if (date.commission && parseAmount(date.commission) < 0) {
        errors.push({
          staffId: member.id,
          staffName: member.name || 'Unknown Staff',
          date: date.date instanceof Date ? date.date : new Date(date.date),
          message: 'Commission cannot be negative',
          type: 'error',
          field: 'commission'
        });
      }
      
      // Check if any amount is set
      if (basicSalary <= 0 && claims <= 0 && commission <= 0) {
        errors.push({
          staffId: member.id,
          staffName: member.name || 'Unknown Staff',
          date: date.date instanceof Date ? date.date : new Date(date.date),
          message: 'At least one payment amount must be greater than 0',
          type: 'error'
        });
      }
    });
  });
  
  return errors;
};

export const calculateTotalPayroll = (staff: StaffMember[]): number => {
  return staff.reduce((total, member) => {
    if (!member.workingDatesWithSalary) return total;
    
    const memberTotal = member.workingDatesWithSalary.reduce((sum, date) => {
      const basicSalary = parseAmount(date.basicSalary);
      const claims = parseAmount(date.claims);
      const commission = parseAmount(date.commission);
      return sum + basicSalary + claims + commission;
    }, 0);
    
    return total + memberTotal;
  }, 0);
};

export const sortDates = (dates: WorkingDateWithSalary[]): WorkingDateWithSalary[] => {
  return [...dates].sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
};

export const findDateEntry = (
  dates: WorkingDateWithSalary[],
  targetDate: Date
): WorkingDateWithSalary | undefined => {
  return dates.find(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    return isSameDay(entryDate, targetDate);
  });
};

export const updateDateEntry = (
  dates: WorkingDateWithSalary[],
  targetDate: Date,
  updates: Partial<WorkingDateWithSalary>
): WorkingDateWithSalary[] => {
  return dates.map(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    if (isSameDay(entryDate, targetDate)) {
      return { ...entry, ...updates };
    }
    return entry;
  });
};

export const removeEmptyDateEntries = (
  dates: WorkingDateWithSalary[]
): WorkingDateWithSalary[] => {
  return dates.filter(date => {
    const basicSalary = parseAmount(date.basicSalary);
    const claims = parseAmount(date.claims);
    const commission = parseAmount(date.commission);
    return basicSalary > 0 || claims > 0 || commission > 0;
  });
};

export const getInitials = (name: string): string => {
  if (!name) return 'U';
  
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};