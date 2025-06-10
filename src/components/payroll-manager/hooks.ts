// Custom hooks for PayrollManager

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StaffMember, WorkingDateWithSalary } from './types';
import { parseAmount, formatCurrency } from './utils';
import { UI_CONSTANTS } from './constants';

import { logger } from '../../lib/logger';
// Hook for debouncing input values
export function useDebounce<T>(value: T, delay: number = UI_CONSTANTS.DEBOUNCE_DELAY): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for managing payroll calculations
export function usePayrollCalculations(staff: StaffMember[]) {
  return useMemo(() => {
    const calculations = staff.map(member => {
      const workingDatesWithSalary = member.workingDatesWithSalary || [];
      
      const totalDays = workingDatesWithSalary.length;
      const totalBasicSalary = workingDatesWithSalary.reduce((sum, date) => 
        sum + parseAmount(date.basicSalary), 0);
      const totalClaims = workingDatesWithSalary.reduce((sum, date) => 
        sum + parseAmount(date.claims), 0);
      const totalCommission = workingDatesWithSalary.reduce((sum, date) => 
        sum + parseAmount(date.commission), 0);
      const totalAmount = totalBasicSalary + totalClaims + totalCommission;
      
      return {
        staffId: member.id,
        name: member.name,
        totalDays,
        totalBasicSalary,
        totalClaims,
        totalCommission,
        totalAmount
      };
    });
    
    const projectTotals = {
      totalStaff: staff.length,
      totalDays: calculations.reduce((sum, calc) => sum + calc.totalDays, 0),
      totalBasicSalary: calculations.reduce((sum, calc) => sum + calc.totalBasicSalary, 0),
      totalClaims: calculations.reduce((sum, calc) => sum + calc.totalClaims, 0),
      totalCommission: calculations.reduce((sum, calc) => sum + calc.totalCommission, 0),
      totalAmount: calculations.reduce((sum, calc) => sum + calc.totalAmount, 0)
    };
    
    return { calculations, projectTotals };
  }, [staff]);
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = `${event.ctrlKey ? 'ctrl+' : ''}${event.shiftKey ? 'shift+' : ''}${event.key.toLowerCase()}`;
      
      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [shortcuts]);
}

// Hook for persisting state to localStorage
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      logger.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// Hook for managing form state
export function usePayrollForm(initialStaff: StaffMember[]) {
  const [staff, setStaff] = useState(initialStaff);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateStaffMember = useCallback((staffId: string, updates: Partial<StaffMember>) => {
    setStaff(prevStaff => 
      prevStaff.map(member => 
        member.id === staffId ? { ...member, ...updates } : member
      )
    );
    setIsDirty(true);
  }, []);

  const updateWorkingDate = useCallback((
    staffId: string, 
    dateIndex: number, 
    updates: Partial<WorkingDateWithSalary>
  ) => {
    setStaff(prevStaff => 
      prevStaff.map(member => {
        if (member.id !== staffId) return member;
        
        const workingDatesWithSalary = [...(member.workingDatesWithSalary || [])];
        workingDatesWithSalary[dateIndex] = { ...workingDatesWithSalary[dateIndex], ...updates };
        
        return { ...member, workingDatesWithSalary };
      })
    );
    setIsDirty(true);
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    staff.forEach(member => {
      if (!member.workingDatesWithSalary || member.workingDatesWithSalary.length === 0) {
        return;
      }
      
      member.workingDatesWithSalary.forEach((date, index) => {
        const basicSalary = parseAmount(date.basicSalary);
        const claims = parseAmount(date.claims);
        const commission = parseAmount(date.commission);
        
        if (basicSalary < 0 || claims < 0 || commission < 0) {
          newErrors[`${member.id}-${index}`] = 'Amounts cannot be negative';
        }
      });
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [staff]);

  return {
    staff,
    setStaff,
    isDirty,
    errors,
    updateStaffMember,
    updateWorkingDate,
    validateForm
  };
}

// Hook for pagination
export function usePagination<T>(items: T[], pageSize: number = UI_CONSTANTS.PAGE_SIZE) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = items.slice(startIndex, endIndex);
  
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);
  
  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);
  
  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
}