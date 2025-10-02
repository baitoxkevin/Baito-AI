export interface StaffMember {
  id: string;
  name?: string;
  designation?: string;
  photo?: string;
  workingDates?: Date[];
  workingDatesWithSalary?: WorkingDateWithSalary[];
  paymentStatus?: 'pending' | 'pushed' | 'paid';
  paymentDate?: Date;
  selected?: boolean;
}

export interface WorkingDateWithSalary {
  date: Date;
  basicSalary: string | number;
  claims: string | number;
  commission: string | number;
}

export interface PayrollManagerProps {
  confirmedStaff: StaffMember[];
  setConfirmedStaff: (staff: StaffMember[]) => void;
  projectStartDate: Date;
  projectEndDate: Date;
  projectId: string;
  onSave?: (payrollData: PayrollData) => void;
  disableAutoSave?: boolean;
}

export interface PayrollData {
  projectId: string;
  staffPayroll: StaffPayrollEntry[];
  totalAmount: number;
  paymentDate?: Date;
}

export interface StaffWorkingSummary {
  name: string;
  totalDays: number;
  totalBasicSalary: number;
  totalClaims: number;
  totalCommission: number;
  totalAmount: number;
  workingDates: Date[];
  workingDatesWithSalary: WorkingDateWithSalary[];
}

export interface StaffPayrollEntry {
  staffId: string;
  staff_id?: string; // Backward compatibility with database schema
  staffName: string;
  workingSummary: StaffWorkingSummary;
  workingDatesWithSalary: WorkingDateWithSalary[];
}