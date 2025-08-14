// Utility functions for project forms
import { format } from "date-fns";

import { logger } from '../../lib/logger';
/**
 * Compares two arrays for equality, handles date objects properly
 */
export const arraysAreEqual = (arr1: unknown[], arr2: unknown[]) => {
  if (arr1.length !== arr2.length) return false;
  
  const processArrayForComparison = (arr: unknown[]) => {
    return arr.map(item => {
      if (item instanceof Date) {
        return format(item, 'yyyy-MM-dd');
      } else if (typeof item === 'object' && item !== null) {
        const processedItem = { ...item };
        for (const key in processedItem) {
          if (processedItem[key] instanceof Date) {
            processedItem[key] = format(processedItem[key], 'yyyy-MM-dd');
          } else if (Array.isArray(processedItem[key])) {
            processedItem[key] = processArrayForComparison(processedItem[key]);
          }
        }
        return processedItem;
      }
      return item;
    });
  };
  
  const normalizedArr1 = processArrayForComparison(arr1);
  const normalizedArr2 = processArrayForComparison(arr2);
  
  return JSON.stringify(normalizedArr1) === JSON.stringify(normalizedArr2);
};

/**
 * Converts date objects to ISO strings in an array of objects
 */
export const convertDatesToStrings = (staff: unknown[]) => {
  return staff.map(member => {
    const processedMember = { ...member };
    
    // Handle regular workingDates
    if (processedMember.workingDates) {
      processedMember.workingDates = processedMember.workingDates.map((date: Date) => 
        date instanceof Date ? format(date, 'yyyy-MM-dd') : date
      );
    }
    
    // Handle workingDatesWithSalary
    if (processedMember.workingDatesWithSalary) {
      processedMember.workingDatesWithSalary = processedMember.workingDatesWithSalary.map((entry: unknown) => ({
        ...entry,
        date: entry.date instanceof Date ? format(entry.date, 'yyyy-MM-dd') : entry.date
      }));
    }
    
    return processedMember;
  });
};

/**
 * Prepares staff data for saving to backend
 */
export const prepareStaffForSaving = (staffArray: unknown[]) => {
  return staffArray.map(member => {
    const processedMember = { ...member };
    
    // Convert date objects to formatted strings for backend
    if (Array.isArray(processedMember.workingDates)) {
      processedMember.workingDates = processedMember.workingDates.map((date: unknown) => {
        if (date instanceof Date) {
          return format(date, 'yyyy-MM-dd');
        }
        return date;
      });
    } else {
      // Initialize with an empty array to prevent errors
      processedMember.workingDates = [];
    }
    
    // Handle workingDatesWithSalary
    if (Array.isArray(processedMember.workingDatesWithSalary)) {
      processedMember.workingDatesWithSalary = processedMember.workingDatesWithSalary.map((entry: unknown) => ({
        ...entry,
        date: entry.date instanceof Date ? format(entry.date, 'yyyy-MM-dd') : entry.date,
        basicSalary: parseFloat(entry.basicSalary) || 0,
        claims: parseFloat(entry.claims) || 0,
        commission: parseFloat(entry.commission) || 0
      }));
    } else {
      // Initialize with an empty array
      processedMember.workingDatesWithSalary = [];
    }
    
    return processedMember;
  });
};

/**
 * Converts string dates to Date objects in staff array
 */
export const convertStringsToDates = (staff: unknown[]) => {
  return staff.map(member => {
    const processedMember = { ...member };
    
    // Handle regular workingDates
    if (processedMember.workingDates) {
      processedMember.workingDates = processedMember.workingDates.map((dateString: string) => {
        try {
          return dateString ? new Date(dateString) : null;
        } catch (e) {
          logger.error("Error parsing date:", dateString, e);
          return null;
        }
      }).filter(Boolean);
    }
    
    // Handle workingDatesWithSalary
    if (processedMember.workingDatesWithSalary) {
      processedMember.workingDatesWithSalary = processedMember.workingDatesWithSalary.map((entry: unknown) => {
        try {
          return {
            ...entry,
            date: entry.date ? new Date(entry.date) : new Date(),
            basicSalary: parseFloat(entry.basicSalary) || 0,
            claims: parseFloat(entry.claims) || 0,
            commission: parseFloat(entry.commission) || 0
          };
        } catch (e) {
          logger.error("Error parsing working date with salary:", entry, e);
          return null;
        }
      }).filter(Boolean);
    }
    
    return processedMember;
  });
};

/**
 * Styles for status badges
 */
export const getStatusBadgeStyle = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30";
    case "completed":
      return "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30";
    case "planning":
      return "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30";
    case "cancelled":
      return "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30";
    default:
      return "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700";
  }
};

/**
 * Styles for priority badges
 */
export const getPriorityBadgeStyle = (priority: string): string => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30";
    case "medium":
      return "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30";
    case "low":
      return "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30";
    default:
      return "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700";
  }
};