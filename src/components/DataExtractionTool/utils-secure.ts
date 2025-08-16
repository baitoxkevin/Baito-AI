import * as ExcelJS from 'exceljs';

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
  data: any;
}

interface ValidationSummary {
  valid: boolean;
  results: ValidationResult[];
  validCount: number;
  invalidCount: number;
}

// Security: Input validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const MAX_ROWS = 10000; // Prevent excessive memory usage
const MAX_COLUMNS = 100; // Prevent excessive memory usage
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv'
];

/**
 * Security check: Validate file before processing
 * Prevents: File size DoS, malicious file types
 */
function validateFile(file: File): void {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only Excel and CSV files are allowed.');
  }

  // Check file extension as additional validation
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    throw new Error('Invalid file extension. Only .xlsx, .xls, and .csv files are allowed.');
  }
}

/**
 * Security: Sanitize string input to prevent injection attacks
 * Removes potentially dangerous characters and limits length
 */
function sanitizeString(input: any, maxLength: number = 1000): string {
  if (input === null || input === undefined) {
    return '';
  }

  // Convert to string and limit length
  let str = String(input).substring(0, maxLength);

  // Remove null bytes and other control characters except tabs and newlines
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Escape HTML entities to prevent XSS if data is displayed in HTML
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return str.trim();
}

/**
 * Extract data from a spreadsheet file (Excel or CSV) with security measures
 * Security features:
 * - File validation before processing
 * - Memory limits to prevent DoS
 * - Input sanitization
 * - Error handling that doesn't leak sensitive information
 */
export async function extractDataFromSpreadsheet(file: File): Promise<any[][]> {
  // Security: Validate file before processing
  validateFile(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        // Create workbook with security options
        const workbook = new ExcelJS.Workbook();
        
        // Set security options to prevent formula injection
        const options = {
          // Disable automatic calculation of formulas to prevent formula injection
          properties: {
            calcMode: 'manual',
            calcOnSave: false
          }
        };

        // For Excel files - use ArrayBuffer
        if (file.type !== 'text/csv') {
          await workbook.xlsx.load(data as ArrayBuffer, options);
        } else {
          // For CSV files, convert to string and parse
          const text = new TextDecoder().decode(data as ArrayBuffer);
          // Basic CSV parsing with security checks
          const lines = text.split('\n').slice(0, MAX_ROWS);
          const rawData = lines.map(line => {
            // Simple CSV parsing - for production, consider using a secure CSV parser
            return line.split(',').slice(0, MAX_COLUMNS).map(cell => 
              sanitizeString(cell.replace(/^"|"$/g, ''))
            );
          });
          resolve(rawData);
          return;
        }

        // Get first worksheet
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          reject(new Error('No worksheet found in file'));
          return;
        }

        // Security: Limit number of rows and columns to prevent memory exhaustion
        const maxRow = Math.min(worksheet.rowCount, MAX_ROWS);
        const maxCol = Math.min(worksheet.columnCount, MAX_COLUMNS);

        // Convert to array of arrays with sanitization
        const rawData: any[][] = [];
        
        for (let rowNumber = 1; rowNumber <= maxRow; rowNumber++) {
          const row = worksheet.getRow(rowNumber);
          const rowData: any[] = [];
          
          for (let colNumber = 1; colNumber <= maxCol; colNumber++) {
            const cell = row.getCell(colNumber);
            
            // Security: Sanitize cell values and prevent formula injection
            let cellValue = cell.value;
            
            // Handle different cell value types
            if (cellValue === null || cellValue === undefined) {
              cellValue = '';
            } else if (typeof cellValue === 'object') {
              // Handle formula results, rich text, etc.
              if ('result' in cellValue) {
                // Formula cell - use result, not formula to prevent injection
                cellValue = sanitizeString(cellValue.result);
              } else if ('richText' in cellValue) {
                // Rich text - extract plain text
                cellValue = sanitizeString(cellValue.richText?.map((rt: any) => rt.text).join(''));
              } else if (cellValue instanceof Date) {
                // Keep dates as Date objects for proper processing
                cellValue = cellValue;
              } else {
                // Other object types - convert to string safely
                cellValue = sanitizeString(JSON.stringify(cellValue));
              }
            } else {
              // Regular values - sanitize strings
              if (typeof cellValue === 'string') {
                cellValue = sanitizeString(cellValue);
              }
            }
            
            rowData.push(cellValue);
          }
          
          rawData.push(rowData);
        }

        resolve(rawData);
      } catch (error) {
        // Security: Don't leak internal error details
        console.error('Error processing spreadsheet:', error);
        reject(new Error('Failed to process spreadsheet file. Please ensure the file is valid.'));
      }
    };
    
    reader.onerror = () => {
      // Security: Generic error message
      reject(new Error('Failed to read file'));
    };
    
    // Read as ArrayBuffer for both Excel and CSV
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Process schedule data from spreadsheet into structured location data
 * Security: Input validation and sanitization for all fields
 */
export function processScheduleData(rawData: any[][]): { 
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
  
  // Security: Limit processing to prevent DoS
  const dataToProcess = rawData.slice(0, MAX_ROWS);
  
  // Get headers (first row) with sanitization
  const headers = dataToProcess[0]
    .slice(0, MAX_COLUMNS)
    .map(h => sanitizeString(h, 100).toLowerCase());
  
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
  if (columnIndexes.date < 0) columnIndexes.date = 1;
  if (columnIndexes.location < 0) columnIndexes.location = 6;
  if (columnIndexes.time < 0 && headers.length > 7) columnIndexes.time = 7;
  if (columnIndexes.staff < 0 && headers.length > 8) columnIndexes.staff = 8;
  
  // Process data rows
  const locations: LocationData[] = [];
  const validationResults: ValidationResult[] = [];
  
  // Skip header row
  for (let i = 1; i < dataToProcess.length; i++) {
    const row = dataToProcess[i];
    const errors: string[] = [];
    
    // Skip empty rows
    if (!row || row.length === 0 || row.every(cell => !cell)) {
      continue;
    }
    
    // Get date (required) with validation
    let date = row[columnIndexes.date];
    if (!date) {
      // If date is empty, look for it in previous rows (week structure)
      for (let j = i - 1; j > 0; j--) {
        if (dataToProcess[j] && dataToProcess[j][columnIndexes.date]) {
          date = dataToProcess[j][columnIndexes.date];
          break;
        }
      }
    }
    
    // Format and validate date
    let formattedDate = '';
    if (date) {
      try {
        if (date instanceof Date) {
          // Validate date is within reasonable range (1900-2100)
          const year = date.getFullYear();
          if (year < 1900 || year > 2100) {
            errors.push('Invalid date year');
          } else {
            formattedDate = formatDate(date);
          }
        } else if (typeof date === 'string') {
          // Sanitize and parse string date
          const sanitizedDate = sanitizeString(date, 50);
          formattedDate = parseStringDate(sanitizedDate);
          
          if (!formattedDate) {
            errors.push('Invalid date format');
          }
        }
      } catch (error) {
        errors.push('Invalid date');
      }
    }
    
    // Get and sanitize location (required)
    const location = row[columnIndexes.location];
    const sanitizedLocation = sanitizeString(location, 500);
    
    if (!sanitizedLocation) {
      errors.push('Missing location');
    }
    
    // Get and sanitize optional fields
    const time = sanitizeString(row[columnIndexes.time], 50);
    const staff = sanitizeString(row[columnIndexes.staff], 100);
    const region = columnIndexes.region >= 0 ? sanitizeString(row[columnIndexes.region], 100) : undefined;
    const state = columnIndexes.state >= 0 ? sanitizeString(row[columnIndexes.state], 100) : undefined;
    
    // Create location object with sanitized data
    const locationData: LocationData = {
      date: formattedDate,
      location: sanitizedLocation || 'Unknown location',
      time: time || undefined,
      staff: staff || undefined,
      region: region || undefined,
      state: state || undefined,
      isPrimary: i === 1 // Make first location primary
    };
    
    // Validate required fields
    if (!formattedDate) {
      errors.push('Missing or invalid date');
    }
    
    // Add validation result
    validationResults.push({
      rowIndex: i,
      isValid: errors.length === 0,
      errors,
      data: locationData
    });
    
    // Add to locations only if valid
    if (errors.length === 0) {
      locations.push(locationData);
    }
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
 * Parse string date with validation
 * Security: Validates date format and range
 */
function parseStringDate(dateStr: string): string {
  // Handle DD-MMM-YYYY format (e.g., "10-Mar-2025")
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthNames = [
        'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
      ];
      
      const day = parseInt(parts[0]);
      const monthIndex = monthNames.indexOf(parts[1].toLowerCase().substring(0, 3));
      const year = parseInt(parts[2]);
      
      // Validate parsed values
      if (!isNaN(day) && day >= 1 && day <= 31 &&
          monthIndex >= 0 && monthIndex <= 11 &&
          !isNaN(year) && year >= 1900 && year <= 2100) {
        const dateObj = new Date(year, monthIndex, day);
        // Validate the date object is valid
        if (!isNaN(dateObj.getTime())) {
          return formatDate(dateObj);
        }
      }
    }
  }
  
  // Try parsing as ISO date
  try {
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      const year = dateObj.getFullYear();
      if (year >= 1900 && year <= 2100) {
        return formatDate(dateObj);
      }
    }
  } catch {
    // Invalid date
  }
  
  return '';
}

/**
 * Format a date object to YYYY-MM-DD string
 * Security: Validates date before formatting
 */
function formatDate(date: Date): string {
  // Validate date object
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Additional validation
  if (year < 1900 || year > 2100) {
    return '';
  }
  
  return `${year}-${month}-${day}`;
}

/**
 * Extract spreadsheet ID from Google Sheets URL
 * Security: Validates URL format and sanitizes ID
 */
export function extractSpreadsheetId(url: string): string {
  // Sanitize URL input
  const sanitizedUrl = sanitizeString(url, 500);
  
  // Validate it's a Google Sheets URL
  if (!sanitizedUrl.includes('docs.google.com/spreadsheets')) {
    throw new Error('Invalid Google Sheets URL');
  }
  
  // Extract ID with strict pattern matching
  const matches = sanitizedUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (matches && matches[1]) {
    // Additional validation: Google Sheets IDs are typically 44 characters
    const id = matches[1];
    if (id.length > 0 && id.length <= 100) {
      return id;
    }
  }
  
  throw new Error('Invalid Google Sheets URL format');
}

/**
 * Fetch data from Google Sheets using backend API
 * Security: Uses backend proxy to avoid exposing API keys
 */
export async function fetchGoogleSheetsData(spreadsheetId: string): Promise<any[][]> {
  try {
    // Validate spreadsheet ID format
    if (!/^[a-zA-Z0-9-_]+$/.test(spreadsheetId)) {
      throw new Error('Invalid spreadsheet ID format');
    }
    
    // Use backend proxy for secure API access
    const response = await fetch(`/api/fetch-google-sheet?id=${encodeURIComponent(spreadsheetId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    if (!response.ok) {
      // Don't expose detailed error messages
      throw new Error('Failed to fetch spreadsheet data');
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!Array.isArray(data.values)) {
      throw new Error('Invalid response format');
    }
    
    // Sanitize the returned data
    const sanitizedData = data.values.slice(0, MAX_ROWS).map((row: any[]) => 
      row.slice(0, MAX_COLUMNS).map((cell: any) => {
        if (cell instanceof Date) {
          return cell;
        }
        return sanitizeString(cell);
      })
    );
    
    return sanitizedData;
  } catch (error) {
    // Security: Log error internally but don't expose details to user
    console.error('Error fetching Google Sheets data:', error);
    throw new Error('Unable to fetch spreadsheet data. Please check the URL and try again.');
  }
}