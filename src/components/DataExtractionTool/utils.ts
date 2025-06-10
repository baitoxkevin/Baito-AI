import * as ExcelJS from 'exceljs';

import { logger } from '../../lib/logger';
interface LocationData {
  date: string;
  location: string;
  time?: string;
  staff?: string;
  region?: string;
  state?: string;
  notes?: string;
  isPrimary: boolean;
}

interface ValidationResult {
  rowIndex: number;
  isValid: boolean;
  errors: string[];
  data: unknown;
}

interface ValidationSummary {
  valid: boolean;
  results: ValidationResult[];
  validCount: number;
  invalidCount: number;
}

/**
 * Extract data from a spreadsheet file (Excel or CSV)
 */
export async function extractDataFromSpreadsheet(file: File): Promise<unknown[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        // For Excel files using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = data as ArrayBuffer;
        workbook.xlsx.load(arrayBuffer).then(() => {
          const worksheet = workbook.worksheets[0];
          const rawData: unknown[][] = [];
          
          worksheet.eachRow((row, rowNumber) => {
            const rowData: unknown[] = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              rowData[colNumber - 1] = cell.value;
            });
            rawData.push(rowData);
          });
          
          resolve(rawData);
        }).catch(reject);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Process schedule data from spreadsheet into structured location data
 */
export function processScheduleData(rawData: unknown[][]): { 
  locations: LocationData[]; 
  validation: ValidationSummary; 
} {
  // Skip empty sheets
  if (!rawData || rawData.length < 2) {
    return { 
      locations: [], 
      validation: {
        valid: false,
        results: [],
        validCount: 0,
        invalidCount: 0
      }
    };
  }
  
  // Get headers (first row)
  const headers = rawData[0].map(h => String(h).trim().toLowerCase());
  
  // Define column mappings
  const columnIndexes = {
    date: headers.indexOf('date'),
    location: Math.max(
      headers.indexOf('location'), 
      headers.indexOf('venue')
    ),
    time: headers.indexOf('time'),
    staff: Math.max(
      headers.indexOf('manpower'),
      headers.indexOf('staff')
    ),
    region: headers.indexOf('region'),
    state: headers.indexOf('state')
  };
  
  // Fall back to positional columns if headers are not found
  if (columnIndexes.date < 0) columnIndexes.date = 1; // Assume second column is date
  if (columnIndexes.location < 0) columnIndexes.location = 6; // Assume 7th column is location
  if (columnIndexes.time < 0 && headers.length > 7) columnIndexes.time = 7; // Assume 8th column is time
  if (columnIndexes.staff < 0 && headers.length > 8) columnIndexes.staff = 8; // Assume 9th column is staff
  
  // Process data rows
  const locations: LocationData[] = [];
  const validationResults: ValidationResult[] = [];
  
  // Skip header row
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    const errors: string[] = [];
    
    // Skip empty rows
    if (!row || row.length === 0 || row.every(cell => !cell)) {
      continue;
    }
    
    // Get date (required)
    let date = row[columnIndexes.date];
    if (!date) {
      // If date is empty, look for it in previous rows (week structure)
      for (let j = i - 1; j > 0; j--) {
        if (rawData[j] && rawData[j][columnIndexes.date]) {
          date = rawData[j][columnIndexes.date];
          break;
        }
      }
    }
    
    // Format date - attempt to standardize various formats
    let formattedDate = '';
    if (date) {
      // If date is a date object, format it
      if (date instanceof Date) {
        formattedDate = formatDate(date);
      } 
      // If date is a string like "10-Mar-2025", convert it
      else if (typeof date === 'string' && date.includes('-')) {
        const parts = date.split('-');
        if (parts.length === 3) {
          // Try to parse month name
          const monthNames = [
            'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
            'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
          ];
          
          const day = parseInt(parts[0]);
          const monthIndex = monthNames.indexOf(parts[1].toLowerCase().substring(0, 3));
          const year = parseInt(parts[2]);
          
          if (!isNaN(day) && monthIndex >= 0 && !isNaN(year)) {
            const dateObj = new Date(year, monthIndex, day);
            formattedDate = formatDate(dateObj);
          } else {
            formattedDate = date; // Keep original if parsing fails
          }
        } else {
          formattedDate = date; // Keep original
        }
      } else {
        formattedDate = String(date);
      }
    }
    
    // Get location (required)
    const location = row[columnIndexes.location];
    if (!location) {
      errors.push('Missing location');
    }
    
    // Get optional fields
    const time = row[columnIndexes.time] ? String(row[columnIndexes.time]) : undefined;
    const staff = row[columnIndexes.staff] ? String(row[columnIndexes.staff]) : undefined;
    const region = columnIndexes.region >= 0 ? String(row[columnIndexes.region] || '') : undefined;
    const state = columnIndexes.state >= 0 ? String(row[columnIndexes.state] || '') : undefined;
    
    // Create location object
    const locationData: LocationData = {
      date: formattedDate,
      location: location ? String(location) : 'Unknown location',
      time,
      staff,
      region,
      state,
      isPrimary: i === 1 // Make first location primary
    };
    
    // Validate required fields
    if (!formattedDate) {
      errors.push('Missing date');
    }
    
    // Add validation result
    validationResults.push({
      rowIndex: i,
      isValid: errors.length === 0,
      errors,
      data: locationData
    });
    
    // Add to locations
    locations.push(locationData);
  }
  
  // Return processed data and validation summary
  return {
    locations,
    validation: {
      valid: validationResults.every(r => r.isValid),
      results: validationResults,
      validCount: validationResults.filter(r => r.isValid).length,
      invalidCount: validationResults.filter(r => !r.isValid).length
    }
  };
}

/**
 * Format a date object to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extract spreadsheet ID from Google Sheets URL
 */
export function extractSpreadsheetId(url: string): string {
  const matches = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (matches && matches[1]) {
    return matches[1];
  }
  throw new Error('Invalid Google Sheets URL');
}

/**
 * Fetch data from Google Sheets using backend API
 */
export async function fetchGoogleSheetsData(spreadsheetId: string): Promise<any[][]> {
  try {
    const response = await fetch(`/api/fetch-google-sheet?id=${spreadsheetId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
    }
    const data = await response.json();
    return data.values;
  } catch (error) {
    logger.error('Error fetching Google Sheets data:', error);
    throw error;
  }
}