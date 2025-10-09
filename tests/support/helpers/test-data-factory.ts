/**
 * Test Data Factory
 * Generates realistic test data for all entities
 */

import { faker } from '@faker-js/faker';

export interface TestProject {
  id?: string;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  start_date: string;
  end_date?: string;
  venue_address: string;
  working_hours_start: string;
  working_hours_end: string;
  crew_count: number;
  filled_positions: number;
  color: string;
  created_by?: string;
}

export interface TestCandidate {
  id?: string;
  full_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  skills?: string[];
  availability?: string;
}

export interface TestExpense {
  id?: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  receipt_url?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface TestPayment {
  id?: string;
  amount: number;
  hourly_rate: number;
  hours_worked: number;
  tax_rate: number;
  overtime_hours?: number;
  overtime_multiplier: number;
  status: 'pending' | 'processing' | 'completed';
}

export interface TestGoal {
  id?: string;
  title: string;
  description?: string;
  progress: number;
  due_date?: string;
  status: 'active' | 'completed' | 'abandoned';
}

export interface TestWarehouseItem {
  id?: string;
  name: string;
  quantity: number;
  location?: string;
  category?: string;
  low_stock_threshold?: number;
}

export interface TestSickLeave {
  id?: string;
  start_date: string;
  end_date: string;
  days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  balance_before?: number;
  balance_after?: number;
}

/**
 * Project Factory
 */
export const createProject = (overrides: Partial<TestProject> = {}): TestProject => {
  const startDate = faker.date.future();
  const endDate = faker.date.future({ refDate: startDate });

  return {
    title: faker.company.catchPhrase(),
    status: faker.helpers.arrayElement(['draft', 'active', 'completed', 'cancelled']),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    venue_address: faker.location.streetAddress({ useFullAddress: true }),
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    crew_count: faker.number.int({ min: 5, max: 50 }),
    filled_positions: faker.number.int({ min: 0, max: 50 }),
    color: faker.color.rgb(),
    ...overrides,
  };
};

/**
 * Candidate Factory
 */
export const createCandidate = (overrides: Partial<TestCandidate> = {}): TestCandidate => {
  return {
    full_name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
    skills: faker.helpers.arrayElements(['Photography', 'Videography', 'Sound', 'Lighting', 'Stage Management'], 3),
    availability: faker.helpers.arrayElement(['Full-time', 'Part-time', 'Weekends', 'Flexible']),
    ...overrides,
  };
};

/**
 * Expense Factory
 */
export const createExpense = (overrides: Partial<TestExpense> = {}): TestExpense => {
  return {
    amount: parseFloat(faker.finance.amount({ min: 10, max: 1000, dec: 2 })),
    currency: 'USD',
    category: faker.helpers.arrayElement(['Travel', 'Food', 'Equipment', 'Supplies', 'Other']),
    description: faker.commerce.productDescription(),
    date: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
    status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
    ...overrides,
  };
};

/**
 * Payment Factory
 */
export const createPayment = (overrides: Partial<TestPayment> = {}): TestPayment => {
  const hourlyRate = faker.number.int({ min: 15, max: 50 });
  const hoursWorked = faker.number.int({ min: 1, max: 40 });
  const overtimeHours = faker.number.int({ min: 0, max: 10 });
  const overtimeMultiplier = 1.5;
  const taxRate = 0.15;

  const regularPay = hourlyRate * hoursWorked;
  const overtimePay = hourlyRate * overtimeMultiplier * overtimeHours;
  const grossPay = regularPay + overtimePay;
  const amount = grossPay * (1 - taxRate);

  return {
    amount: parseFloat(amount.toFixed(2)),
    hourly_rate: hourlyRate,
    hours_worked: hoursWorked,
    tax_rate: taxRate,
    overtime_hours: overtimeHours,
    overtime_multiplier: overtimeMultiplier,
    status: faker.helpers.arrayElement(['pending', 'processing', 'completed']),
    ...overrides,
  };
};

/**
 * Goal Factory
 */
export const createGoal = (overrides: Partial<TestGoal> = {}): TestGoal => {
  return {
    title: faker.company.buzzPhrase(),
    description: faker.lorem.sentence(),
    progress: faker.number.int({ min: 0, max: 100 }),
    due_date: faker.date.future().toISOString().split('T')[0],
    status: faker.helpers.arrayElement(['active', 'completed', 'abandoned']),
    ...overrides,
  };
};

/**
 * Warehouse Item Factory
 */
export const createWarehouseItem = (overrides: Partial<TestWarehouseItem> = {}): TestWarehouseItem => {
  return {
    name: faker.commerce.productName(),
    quantity: faker.number.int({ min: 0, max: 100 }),
    location: faker.helpers.arrayElement(['Warehouse A', 'Warehouse B', 'Storage Room 1', 'Mobile Unit']),
    category: faker.helpers.arrayElement(['Audio', 'Video', 'Lighting', 'Staging', 'Safety', 'Misc']),
    low_stock_threshold: faker.number.int({ min: 5, max: 20 }),
    ...overrides,
  };
};

/**
 * Sick Leave Factory
 */
export const createSickLeave = (overrides: Partial<TestSickLeave> = {}): TestSickLeave => {
  const startDate = faker.date.recent({ days: 30 });
  const days = faker.number.int({ min: 1, max: 5 });
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    days,
    reason: faker.lorem.sentence(),
    status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
    balance_before: faker.number.int({ min: 10, max: 30 }),
    balance_after: faker.number.int({ min: 5, max: 25 }),
    ...overrides,
  };
};

/**
 * Batch Creation Helpers
 */
export const createProjects = (count: number, overrides: Partial<TestProject> = {}): TestProject[] => {
  return Array.from({ length: count }, () => createProject(overrides));
};

export const createCandidates = (count: number, overrides: Partial<TestCandidate> = {}): TestCandidate[] => {
  return Array.from({ length: count }, () => createCandidate(overrides));
};

export const createExpenses = (count: number, overrides: Partial<TestExpense> = {}): TestExpense[] => {
  return Array.from({ length: count }, () => createExpense(overrides));
};

export const createPayments = (count: number, overrides: Partial<TestPayment> = {}): TestPayment[] => {
  return Array.from({ length: count }, () => createPayment(overrides));
};

export const createGoals = (count: number, overrides: Partial<TestGoal> = {}): TestGoal[] => {
  return Array.from({ length: count }, () => createGoal(overrides));
};

export const createWarehouseItems = (count: number, overrides: Partial<TestWarehouseItem> = {}): TestWarehouseItem[] => {
  return Array.from({ length: count }, () => createWarehouseItem(overrides));
};

export const createSickLeaves = (count: number, overrides: Partial<TestSickLeave> = {}): TestSickLeave[] => {
  return Array.from({ length: count }, () => createSickLeave(overrides));
};

/**
 * Seeding Helper (for database setup in tests)
 */
export const seedTestData = {
  minimal: {
    projects: 5,
    candidates: 10,
    expenses: 5,
  },
  standard: {
    projects: 20,
    candidates: 50,
    expenses: 30,
    goals: 10,
    warehouseItems: 50,
  },
  large: {
    projects: 100,
    candidates: 200,
    expenses: 100,
    goals: 50,
    warehouseItems: 200,
  },
};
