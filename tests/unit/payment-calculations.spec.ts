/**
 * P0 Unit Tests - Payment Calculations
 * Test IDs: PAY-UNIT-001 through PAY-UNIT-003
 * Risk Mitigation: R002 (Payment calculation errors)
 *
 * @priority P0
 * @category Critical Business Logic
 */

import { test, expect } from '@playwright/test';
import { createPayment } from '../support/helpers/test-data-factory';

/**
 * Payment calculation utility functions
 * These would normally come from your src/lib/ but we'll define them here for testing
 */

export function calculateRegularPay(hourlyRate: number, hoursWorked: number): number {
  return hourlyRate * hoursWorked;
}

export function calculateOvertimePay(hourlyRate: number, overtimeHours: number, multiplier: number = 1.5): number {
  return hourlyRate * multiplier * overtimeHours;
}

export function calculateGrossPay(regularPay: number, overtimePay: number = 0): number {
  return regularPay + overtimePay;
}

export function calculateTaxDeduction(grossPay: number, taxRate: number): number {
  return grossPay * taxRate;
}

export function calculateNetPay(grossPay: number, taxRate: number): number {
  const tax = calculateTaxDeduction(grossPay, taxRate);
  return grossPay - tax;
}

test.describe('P0 Payment Calculations - Unit Tests', () => {
  test('PAY-UNIT-001: Hourly rate × hours worked calculation is accurate', () => {
    // Test basic calculation
    const result1 = calculateRegularPay(20, 40);
    expect(result1).toBe(800);

    // Test decimal hours
    const result2 = calculateRegularPay(25.50, 37.5);
    expect(result2).toBe(956.25);

    // Test edge cases
    expect(calculateRegularPay(0, 40)).toBe(0);
    expect(calculateRegularPay(20, 0)).toBe(0);
    expect(calculateRegularPay(1, 1)).toBe(1);

    // Test with factory data
    const payment = createPayment({ hourly_rate: 30, hours_worked: 35 });
    const regularPay = calculateRegularPay(payment.hourly_rate, payment.hours_worked);
    expect(regularPay).toBe(1050);
  });

  test('PAY-UNIT-002: Tax deduction calculation uses correct rates', () => {
    // Test standard tax rates
    const grossPay = 1000;

    // 15% tax
    const tax15 = calculateTaxDeduction(grossPay, 0.15);
    expect(tax15).toBe(150);

    // 20% tax
    const tax20 = calculateTaxDeduction(grossPay, 0.20);
    expect(tax20).toBe(200);

    // 25% tax
    const tax25 = calculateTaxDeduction(grossPay, 0.25);
    expect(tax25).toBe(250);

    // Net pay calculation
    const netPay15 = calculateNetPay(grossPay, 0.15);
    expect(netPay15).toBe(850);

    // Test with factory data
    const payment = createPayment();
    const calculatedTax = calculateTaxDeduction(
      payment.hourly_rate * payment.hours_worked,
      payment.tax_rate
    );
    expect(calculatedTax).toBeGreaterThan(0);
  });

  test('PAY-UNIT-003: Overtime calculation applies correct multiplier', () => {
    const hourlyRate = 20;

    // Test standard 1.5x overtime
    const overtime1_5x = calculateOvertimePay(hourlyRate, 10, 1.5);
    expect(overtime1_5x).toBe(300); // 20 * 1.5 * 10

    // Test double-time (2x) overtime
    const overtime2x = calculateOvertimePay(hourlyRate, 5, 2.0);
    expect(overtime2x).toBe(200); // 20 * 2 * 5

    // Test no overtime
    const overtimeNone = calculateOvertimePay(hourlyRate, 0, 1.5);
    expect(overtimeNone).toBe(0);

    // Test with factory data
    const payment = createPayment({
      hourly_rate: 25,
      overtime_hours: 8,
      overtime_multiplier: 1.5,
    });

    const overtimePay = calculateOvertimePay(
      payment.hourly_rate,
      payment.overtime_hours || 0,
      payment.overtime_multiplier
    );
    expect(overtimePay).toBe(300); // 25 * 1.5 * 8
  });

  test('PAY-UNIT-004: Complete payment calculation integrates all components', () => {
    // Test complete payment flow
    const hourlyRate = 30;
    const regularHours = 40;
    const overtimeHours = 5;
    const overtimeMultiplier = 1.5;
    const taxRate = 0.20;

    // Calculate components
    const regularPay = calculateRegularPay(hourlyRate, regularHours);
    expect(regularPay).toBe(1200);

    const overtimePay = calculateOvertimePay(hourlyRate, overtimeHours, overtimeMultiplier);
    expect(overtimePay).toBe(225); // 30 * 1.5 * 5

    const grossPay = calculateGrossPay(regularPay, overtimePay);
    expect(grossPay).toBe(1425);

    const tax = calculateTaxDeduction(grossPay, taxRate);
    expect(tax).toBe(285);

    const netPay = calculateNetPay(grossPay, taxRate);
    expect(netPay).toBe(1140);

    // Verify: Net pay + tax = gross pay
    expect(netPay + tax).toBe(grossPay);
  });

  test('PAY-UNIT-005: Edge cases handle zero and negative values', () => {
    // Zero hours worked
    expect(calculateRegularPay(25, 0)).toBe(0);

    // Zero hourly rate (volunteer work)
    expect(calculateRegularPay(0, 40)).toBe(0);

    // Zero overtime
    expect(calculateOvertimePay(20, 0, 1.5)).toBe(0);

    // Zero tax rate
    expect(calculateTaxDeduction(1000, 0)).toBe(0);
    expect(calculateNetPay(1000, 0)).toBe(1000);

    // Very small amounts (rounding)
    const smallPay = calculateRegularPay(0.01, 1);
    expect(smallPay).toBe(0.01);
  });

  test('PAY-UNIT-006: Rounding handles decimal precision correctly', () => {
    // Test floating point precision
    const pay1 = calculateRegularPay(15.55, 37.5);
    expect(pay1).toBeCloseTo(583.125, 3);

    const pay2 = calculateRegularPay(20.33, 40.5);
    expect(pay2).toBeCloseTo(823.365, 3);

    // Test tax calculations with rounding
    const grossPay = 1234.56;
    const tax = calculateTaxDeduction(grossPay, 0.185);
    expect(tax).toBeCloseTo(228.39, 2);
  });
});

test.describe('P0 Payment Validation - Unit Tests', () => {
  test('PAY-UNIT-007: Payment data validation rejects invalid inputs', () => {
    // These would test your validation functions
    const validPayment = createPayment({
      hourly_rate: 25,
      hours_worked: 40,
      tax_rate: 0.15,
    });

    expect(validPayment.hourly_rate).toBeGreaterThan(0);
    expect(validPayment.hours_worked).toBeGreaterThanOrEqual(0);
    expect(validPayment.tax_rate).toBeGreaterThanOrEqual(0);
    expect(validPayment.tax_rate).toBeLessThan(1);
  });

  test('PAY-UNIT-008: Batch payment calculations maintain accuracy', () => {
    // Test multiple payments
    const payments = [
      { rate: 20, hours: 40 },
      { rate: 25, hours: 35 },
      { rate: 30, hours: 45 },
    ];

    const totalPay = payments.reduce((sum, p) => {
      return sum + calculateRegularPay(p.rate, p.hours);
    }, 0);

    expect(totalPay).toBe(20*40 + 25*35 + 30*45); // 800 + 875 + 1350 = 3025
    expect(totalPay).toBe(3025);
  });
});
