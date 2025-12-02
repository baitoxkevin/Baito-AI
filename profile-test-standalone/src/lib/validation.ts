// Validation and formatting utilities

export function formatICNumber(value: string): string {
  const cleaned = value.replace(/[^0-9]/g, '');
  if (cleaned.length <= 6) return cleaned;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 12)}`;
}

export function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/[^0-9]/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
}

export function validateICNumber(ic: string): boolean {
  if (!ic) return false;
  const cleaned = ic.replace(/[^0-9]/g, '');
  return cleaned.length === 12 && /^\d{6}\d{2}\d{4}$/.test(cleaned);
}

export function validateEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}

export function calculateProfileCompletion(data: any): number {
  const fields = [
    'full_name', 'nationality', 'ic_number', 'gender', 'date_of_birth',
    'phone', 'email', 'address', 'city', 'state', 'postcode', 'country',
    'bank_name', 'bank_account_number', 'bank_account_holder_name'
  ];

  const filledFields = fields.filter(field => data[field] && data[field].trim()).length;
  return Math.round((filledFields / fields.length) * 100);
}

export function getCompletionColor(percentage: number): string {
  if (percentage < 50) return '#ef4444'; // red
  if (percentage < 75) return '#f59e0b'; // orange
  if (percentage < 100) return '#3b82f6'; // blue
  return '#10b981'; // green
}
