// Additional UI components needed for PayrollManager

import React from 'react';
import { WorkingDateWithSalary } from './types';

// Placeholder for working-date-picker component
export function WorkingDatePicker({ 
  dates, 
  onChange 
}: { 
  dates: WorkingDateWithSalary[]; 
  onChange: (dates: WorkingDateWithSalary[]) => void 
}) {
  return (
    <div className="space-y-2">
      {dates.map((date, index) => (
        <div key={index} className="flex items-center space-x-2">
          <span>{date.date.toLocaleDateString()}</span>
          <input
            type="text"
            value={date.basicSalary}
            onChange={(e) => {
              const newDates = [...dates];
              newDates[index] = { ...date, basicSalary: e.target.value };
              onChange(newDates);
            }}
            placeholder="Basic"
            className="w-24 px-2 py-1 border rounded"
          />
          <input
            type="text"
            value={date.claims}
            onChange={(e) => {
              const newDates = [...dates];
              newDates[index] = { ...date, claims: e.target.value };
              onChange(newDates);
            }}
            placeholder="Claims"
            className="w-24 px-2 py-1 border rounded"
          />
          <input
            type="text"
            value={date.commission}
            onChange={(e) => {
              const newDates = [...dates];
              newDates[index] = { ...date, commission: e.target.value };
              onChange(newDates);
            }}
            placeholder="Commission"
            className="w-24 px-2 py-1 border rounded"
          />
        </div>
      ))}
    </div>
  );
}

// Error boundary component
export class PayrollErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: unknown) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PayrollManager error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-semibold">Something went wrong</h3>
          <p className="text-red-600">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading skeleton component
export function PayrollSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-gray-200 rounded-lg"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

// Empty state component
export function PayrollEmptyState({ onAddStaff }: { onAddStaff?: () => void }) {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
      <p className="mt-1 text-sm text-gray-500">
        Add staff members to manage payroll
      </p>
      {onAddStaff && (
        <button
          onClick={onAddStaff}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Staff
        </button>
      )}
    </div>
  );
}