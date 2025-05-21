import { WorkingDateWithSalary } from "@/components/ui/working-date-picker";

interface StaffWorkingSummary {
  staffId: string;
  name: string;
  totalWorkingDays: number; // Calendar days (days between start and end)
  totalWorkingSessions: number; // Actual sessions/shifts worked
  totalBasicSalary: number;
  totalClaims: number;
  totalCommission: number;
  totalAmount: number;
  startDate: Date | null;
  endDate: Date | null;
  workingDateDetails: WorkingDateWithSalary[];
}

/**
 * Calculate working summary for a staff member based on their working dates with salary
 */
export function calculateStaffWorkingSummary(
  staffId: string,
  name: string,
  workingDatesWithSalary?: WorkingDateWithSalary[]
): StaffWorkingSummary {
  // Handle missing data
  if (!workingDatesWithSalary || workingDatesWithSalary.length === 0) {
    return {
      staffId,
      name,
      totalWorkingDays: 0,
      totalWorkingSessions: 0,
      totalBasicSalary: 0,
      totalClaims: 0,
      totalCommission: 0,
      totalAmount: 0,
      startDate: null,
      endDate: null,
      workingDateDetails: []
    };
  }

  // Sort dates for better reporting
  const sortedDates = [...workingDatesWithSalary].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate totals
  let totalBasicSalary = 0;
  let totalClaims = 0;
  let totalCommission = 0;

  sortedDates.forEach(dateEntry => {
    // Handle string or number values appropriately
    const basicSalary = typeof dateEntry.basicSalary === 'number'
      ? dateEntry.basicSalary
      : parseFloat(dateEntry.basicSalary || '0');

    const claims = typeof dateEntry.claims === 'number'
      ? dateEntry.claims
      : parseFloat(dateEntry.claims || '0');

    const commission = typeof dateEntry.commission === 'number'
      ? dateEntry.commission
      : parseFloat(dateEntry.commission || '0');

    totalBasicSalary += basicSalary;
    totalClaims += claims;
    totalCommission += commission;
  });

  const totalAmount = totalBasicSalary + totalClaims + totalCommission;

  // Get start and end dates for calendar day calculation
  const dates = sortedDates.map(d => new Date(d.date));
  const startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
  const endDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

  // Calculate actual calendar days (from start to end inclusive)
  let totalWorkingDays = 0;
  if (startDate && endDate) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    totalWorkingDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  }

  return {
    staffId,
    name,
    totalWorkingDays, // Calendar days (days between start and end inclusive)
    totalWorkingSessions: sortedDates.length, // Actual shifts/sessions worked
    totalBasicSalary,
    totalClaims,
    totalCommission,
    totalAmount,
    startDate,
    endDate,
    workingDateDetails: sortedDates
  };
}

/**
 * Calculate working summaries for multiple staff members
 */
export function calculateStaffWorkingSummaries(
  staffMembers: Array<{
    id: string;
    name: string;
    workingDatesWithSalary?: WorkingDateWithSalary[];
  }>
): StaffWorkingSummary[] {
  return staffMembers.map(staff => 
    calculateStaffWorkingSummary(staff.id, staff.name, staff.workingDatesWithSalary)
  );
}

/**
 * Calculate total payroll amount for a project
 */
export function calculateProjectPayroll(staffSummaries: StaffWorkingSummary[]): number {
  return staffSummaries.reduce((total, staff) => total + staff.totalAmount, 0);
}