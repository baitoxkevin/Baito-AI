// Constants and configuration for PayrollManager

export const CURRENCY_CONFIG = {
  code: 'MYR',
  symbol: 'RM',
  locale: 'en-MY',
  decimalPlaces: 2
};

export const DATE_FORMATS = {
  display: 'dd MMM yyyy',
  dayMonth: 'dd MMM',
  full: 'EEEE, dd MMMM yyyy',
  short: 'EEE, dd MMM',
  input: 'yyyy-MM-dd'
};

export const PAYROLL_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  CANCELLED: 'cancelled'
} as const;

export const AMOUNT_LIMITS = {
  MIN_AMOUNT: 0,
  MAX_AMOUNT: 999999.99,
  MIN_SALARY: 0,
  MAX_SALARY: 9999.99,
  MIN_CLAIMS: 0,
  MAX_CLAIMS: 9999.99,
  MIN_COMMISSION: 0,
  MAX_COMMISSION: 9999.99
};

export const VALIDATION_MESSAGES = {
  INVALID_AMOUNT: 'Please enter a valid amount',
  AMOUNT_TOO_LARGE: 'Amount exceeds maximum limit',
  NEGATIVE_AMOUNT: 'Amount cannot be negative',
  NO_STAFF: 'No staff members to process',
  NO_WORKING_DATES: 'No working dates selected',
  SAVE_SUCCESS: 'Payroll data saved successfully',
  SAVE_ERROR: 'Failed to save payroll data',
  VALIDATION_ERROR: 'Please enter valid amounts for all working dates'
};

export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  MAX_VISIBLE_STAFF: 50,
  PAGE_SIZE: 25,
  TOAST_DURATION: 5000
};

export const KEYBOARD_SHORTCUTS = {
  SAVE: 'ctrl+s',
  CANCEL: 'esc',
  NEXT_FIELD: 'tab',
  PREV_FIELD: 'shift+tab',
  TOGGLE_VIEW: 'ctrl+v'
};

export const DEFAULT_VALUES = {
  BASIC_SALARY: '',
  CLAIMS: '',
  COMMISSION: '',
  PROJECT_ID: 'default',
  STAFF_NAME: 'Unknown Staff'
};