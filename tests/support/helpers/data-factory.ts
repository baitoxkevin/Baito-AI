/**
 * Data Factory Helpers
 *
 * Generate test data with parallel-safe identifiers.
 * Follows factory pattern with overrides for flexibility.
 */

import { randomUUID } from 'crypto';

export type ProjectData = {
  id?: string;
  title: string;
  client_id: string;
  manager_id: string;
  start_date: string;
  end_date?: string;
  venue_address: string;
  crew_count: number;
  status: 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  event_type: string;
  working_hours_start: string;
  working_hours_end: string;
  color: string;
};

export type UserData = {
  id?: string;
  email: string;
  full_name: string;
  role: 'staff' | 'manager' | 'admin' | 'super_admin';
  is_active?: boolean;
};

export type CandidateData = {
  id?: string;
  full_name: string;
  email: string;
  phone: string;
  status?: 'pending' | 'approved' | 'rejected' | 'interviewing';
  position?: string;
  experience_years?: number;
};

/**
 * Generate a unique timestamp-based identifier
 */
function generateUniqueId(prefix = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}_${random}`;
}

/**
 * Create project with overrides
 * @param overrides - Partial project data to override defaults
 */
export function createProject(overrides: Partial<ProjectData> = {}): ProjectData {
  const uniqueId = generateUniqueId('test_project_');
  const today = new Date().toISOString().split('T')[0];

  return {
    id: randomUUID(),
    title: `Test Project ${uniqueId}`,
    client_id: randomUUID(),
    manager_id: randomUUID(),
    start_date: today,
    venue_address: `123 Test Street, Test City`,
    crew_count: 5,
    status: 'planning',
    priority: 'medium',
    event_type: 'Conference',
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    color: '#3B82F6',
    ...overrides,
  };
}

/**
 * Create user with overrides
 * @param overrides - Partial user data to override defaults
 */
export function createUser(overrides: Partial<UserData> = {}): UserData {
  const uniqueId = generateUniqueId('test_user_');

  return {
    id: randomUUID(),
    email: `${uniqueId}@example.com`,
    full_name: `Test User ${uniqueId}`,
    role: 'staff',
    is_active: true,
    ...overrides,
  };
}

/**
 * Create candidate with overrides
 * @param overrides - Partial candidate data to override defaults
 */
export function createCandidate(overrides: Partial<CandidateData> = {}): CandidateData {
  const uniqueId = generateUniqueId('test_candidate_');

  return {
    id: randomUUID(),
    full_name: `Test Candidate ${uniqueId}`,
    email: `${uniqueId}@example.com`,
    phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
    status: 'pending',
    position: 'Event Staff',
    experience_years: Math.floor(Math.random() * 5) + 1,
    ...overrides,
  };
}

/**
 * Create multiple projects at once
 */
export function createProjects(count: number, overrides: Partial<ProjectData> = {}): ProjectData[] {
  return Array.from({ length: count }, () => createProject(overrides));
}

/**
 * Create multiple users at once
 */
export function createUsers(count: number, overrides: Partial<UserData> = {}): UserData[] {
  return Array.from({ length: count }, () => createUser(overrides));
}
