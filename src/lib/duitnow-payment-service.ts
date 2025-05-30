import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';
import { format } from 'date-fns';

/**
 * Type definitions for DuitNow ECP payment export
 */
export interface PaymentRecipient {
  id: string;
  name: string;
  bankAccountNumber: string;
  bankCode: string;
  amount: number;
  email?: string;
  phone?: string;
  reference?: string;
  description?: string;
}

export interface DuitNowPaymentBatch {
  batchId: string;
  paymentDate: Date;
  recipients: PaymentRecipient[];
  totalAmount: number;
  companyName: string;
  companyRegistrationNumber: string;
  companyBankAccountNumber: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  remarks?: string;
}

/**
 * Bank codes for common Malaysian banks
 */
export const BankCodes = {
  MAYBANK: "MBBEMYKL",
  CIMB: "CIBBMYKL",
  PUBLIC_BANK: "PBBEMYKL",
  RHB: "RHBBMYKL",
  HONG_LEONG: "HLBBMYKL",
  AMBANK: "ARBKMYKL",
  BANK_RAKYAT: "BKRMMYKL",
  BANK_ISLAM: "BIMBMYKL",
  OCBC: "OCBCMYKL",
  STANDARD_CHARTERED: "SCBLMYKX",
  HSBC: "HBMBMYKL",
  UOB: "UOVBMYKL",
  ALLIANCE: "MFBBMYKL",
  BANK_MUAMALAT: "BMMBMYKL",
  AFFIN_BANK: "PHBMMYKL",
  AGROBANK: "BPMBMYKL",
  MBSB: "MBSBMYKL",
  CITIBANK: "CITIMYKL",
};

/**
 * Maps bank names to bank codes
 * @param bankName The bank name to map to a code
 * @returns The corresponding bank code or a default if not found
 */
export function getBankCodeFromName(bankName: string): string {
  const normalizedName = bankName.toUpperCase().trim();
  
  if (normalizedName.includes("MAYBANK")) return BankCodes.MAYBANK;
  if (normalizedName.includes("CIMB")) return BankCodes.CIMB;
  if (normalizedName.includes("PUBLIC")) return BankCodes.PUBLIC_BANK;
  if (normalizedName.includes("RHB")) return BankCodes.RHB;
  if (normalizedName.includes("HONG LEONG")) return BankCodes.HONG_LEONG;
  if (normalizedName.includes("AMBANK")) return BankCodes.AMBANK;
  if (normalizedName.includes("RAKYAT")) return BankCodes.BANK_RAKYAT;
  if (normalizedName.includes("ISLAM")) return BankCodes.BANK_ISLAM;
  if (normalizedName.includes("OCBC")) return BankCodes.OCBC;
  if (normalizedName.includes("STANDARD CHARTERED")) return BankCodes.STANDARD_CHARTERED;
  if (normalizedName.includes("HSBC")) return BankCodes.HSBC;
  if (normalizedName.includes("UOB")) return BankCodes.UOB;
  if (normalizedName.includes("ALLIANCE")) return BankCodes.ALLIANCE;
  if (normalizedName.includes("MUAMALAT")) return BankCodes.BANK_MUAMALAT;
  if (normalizedName.includes("AFFIN")) return BankCodes.AFFIN_BANK;
  if (normalizedName.includes("AGROBANK")) return BankCodes.AGROBANK;
  if (normalizedName.includes("MBSB")) return BankCodes.MBSB;
  if (normalizedName.includes("CITI")) return BankCodes.CITIBANK;
  
  return BankCodes.MAYBANK; // Default to Maybank if no match
}

/**
 * Creates a DuitNow ECP Excel file based on the payment batch data
 * @param paymentBatch The payment batch data to export
 * @returns An Excel workbook with the payment data formatted for DuitNow ECP
 */
export async function createDuitNowExcelTemplate(paymentBatch: DuitNowPaymentBatch): Promise<ExcelJS.Workbook> {
  // Create a new workbook
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('DuitNow Payment');
  
  // Format the payment date
  const formattedPaymentDate = format(paymentBatch.paymentDate, 'dd/MM/yyyy');
  
  // Header information
  const headerData = [
    ['DuitNow Electronic Credit Payment (ECP) Template'],
    [''],
    ['Company Information'],
    ['Company Name', paymentBatch.companyName],
    ['Company Registration Number', paymentBatch.companyRegistrationNumber],
    ['Company Bank Account Number', paymentBatch.companyBankAccountNumber],
    ['Contact Person', paymentBatch.contactPerson || ''],
    ['Contact Email', paymentBatch.contactEmail || ''],
    ['Contact Phone', paymentBatch.contactPhone || ''],
    ['Batch ID', paymentBatch.batchId],
    ['Payment Date', formattedPaymentDate],
    ['Total Amount', paymentBatch.totalAmount.toFixed(2)],
    ['Remarks', paymentBatch.remarks || ''],
    [''],
    ['Payment Details'],
    ['']
  ];
  
  // Add header data
  headerData.forEach(row => {
    ws.addRow(row);
  });
  
  // Column headers for payment details
  const columnHeaders = [
    'No.',
    'Recipient Name',
    'Bank Code',
    'Account Number',
    'Amount (RM)',
    'Reference',
    'Description',
    'Email',
    'Phone Number'
  ];
  
  ws.addRow(columnHeaders);
  
  // Prepare data rows
  paymentBatch.recipients.forEach((recipient, index) => {
    ws.addRow([
      index + 1,
      recipient.name,
      recipient.bankCode,
      recipient.bankAccountNumber,
      recipient.amount.toFixed(2),
      recipient.reference || '',
      recipient.description || '',
      recipient.email || '',
      recipient.phone || ''
    ]);
  });
  
  // Set column widths
  ws.columns = [
    { width: 6 },   // No.
    { width: 30 },  // Recipient Name
    { width: 12 },  // Bank Code
    { width: 20 },  // Account Number
    { width: 12 },  // Amount
    { width: 20 },  // Reference
    { width: 30 },  // Description
    { width: 25 },  // Email
    { width: 15 }   // Phone
  ];
  
  return wb;
}

/**
 * Exports the payment batch as an Excel file and triggers download
 * @param paymentBatch The payment batch to export
 */
export async function exportDuitNowPaymentFile(paymentBatch: DuitNowPaymentBatch): Promise<void> {
  const wb = await createDuitNowExcelTemplate(paymentBatch);
  
  // Format date for filename
  const dateStr = format(new Date(), 'yyyyMMdd_HHmmss');
  const filename = `DuitNow_Payment_${paymentBatch.batchId}_${dateStr}.xlsx`;
  
  // Convert workbook to binary
  const buffer = await wb.xlsx.writeBuffer();
  
  // Create blob and save file
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
}

/**
 * Converts payroll staff data to DuitNow payment recipients
 * @param staffPayrollEntries The staff payroll entries
 * @param defaultBankCode The default bank code to use if not specified for a staff member
 * @returns Array of payment recipients formatted for DuitNow ECP
 */
interface StaffPayrollEntry {
  id?: string;
  staffId?: string;
  name?: string;
  staffName?: string;
  bankCode?: string;
  bankName?: string;
  bankAccountNumber?: string;
  accountNumber?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  workingSummary?: {
    totalAmount?: number;
    totalBasicSalary?: number;
    totalDays?: number;
  };
}

export function convertStaffToPaymentRecipients(
  staffPayrollEntries: StaffPayrollEntry[], 
  defaultBankCode: string = BankCodes.MAYBANK
): PaymentRecipient[] {
  return staffPayrollEntries
    .filter(staff => {
      // Filter out staff with no payments
      const totalAmount = 
        (staff.workingSummary?.totalAmount || 0) > 0 ||
        (staff.workingSummary?.totalBasicSalary || 0) > 0;
      return totalAmount;
    })
    .map(staff => {
      // Get the bank code, either from staff data or use default
      const bankCode = staff.bankCode || 
        (staff.bankName ? getBankCodeFromName(staff.bankName) : defaultBankCode);
      
      // Calculate the total amount from the working summary
      const amount = staff.workingSummary?.totalAmount || 0;
      
      return {
        id: staff.staffId || staff.id || '',
        name: staff.staffName || staff.name || 'Unknown Staff',
        bankAccountNumber: staff.bankAccountNumber || staff.accountNumber || '',
        bankCode,
        amount,
        email: staff.email || '',
        phone: staff.phone || staff.phoneNumber || '',
        reference: `Payment for services: ${staff.staffName || staff.name || 'Staff'}`,
        description: `Staff payment for ${staff.workingSummary?.totalDays || 0} working days`
      };
    });
}

/**
 * Creates a DuitNow payment batch from payroll data
 * @param projectId The project ID
 * @param projectName The project name
 * @param staffPayrollEntries The staff payroll entries
 * @param companyDetails The company details
 * @returns A formatted DuitNow payment batch ready for export
 */
export function createDuitNowPaymentBatch(
  projectId: string,
  projectName: string,
  staffPayrollEntries: StaffPayrollEntry[],
  companyDetails: {
    name: string;
    registrationNumber: string;
    bankAccountNumber: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
  }
): DuitNowPaymentBatch {
  // Convert staff payroll entries to payment recipients
  const recipients = convertStaffToPaymentRecipients(staffPayrollEntries);
  
  // Calculate total amount
  const totalAmount = recipients.reduce((sum, recipient) => sum + recipient.amount, 0);
  
  // Create batch ID using project ID and date
  const batchId = `PRJ_${projectId.substring(0, 8)}_${format(new Date(), 'yyyyMMdd')}`;
  
  return {
    batchId,
    paymentDate: new Date(), // Default to today
    recipients,
    totalAmount,
    companyName: companyDetails.name,
    companyRegistrationNumber: companyDetails.registrationNumber,
    companyBankAccountNumber: companyDetails.bankAccountNumber,
    contactPerson: companyDetails.contactPerson,
    contactEmail: companyDetails.contactEmail,
    contactPhone: companyDetails.contactPhone,
    remarks: `Payment for project: ${projectName}`
  };
}

/**
 * Get default company information from the database
 * @returns Promise resolving to the company information
 */
export async function getDefaultCompanyInfo(): Promise<{
  name: string;
  registrationNumber: string;
  bankAccountNumber: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
}> {
  // In a real implementation, this would fetch from the database
  // For now, returning hardcoded defaults
  return {
    name: "Your Company Sdn Bhd",
    registrationNumber: "12345678901",
    bankAccountNumber: "1234567890",
    contactPerson: "Admin User",
    contactEmail: "admin@yourcompany.com",
    contactPhone: "0123456789"
  };
}