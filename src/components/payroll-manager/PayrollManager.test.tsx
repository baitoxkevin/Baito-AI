import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PayrollManager from './PayrollManager';
import { StaffMember, PayrollData } from './types';

// Mock data
const mockStaff: StaffMember[] = [
  {
    id: '1',
    name: 'John Doe',
    designation: 'Developer',
    workingDates: [new Date('2024-01-01'), new Date('2024-01-02')],
    workingDatesWithSalary: [
      { date: new Date('2024-01-01'), basicSalary: '100', claims: '20', commission: '10' },
      { date: new Date('2024-01-02'), basicSalary: '100', claims: '20', commission: '10' }
    ]
  }
];

// Mock props
const mockProps = {
  confirmedStaff: mockStaff,
  setConfirmedStaff: jest.fn(),
  projectStartDate: new Date('2024-01-01'),
  projectEndDate: new Date('2024-01-31'),
  projectId: 'test-project-123'
};

describe('PayrollManager Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<PayrollManager {...mockProps} />);
    expect(screen.getByText(/Payroll Summary/i)).toBeInTheDocument();
  });

  test('displays staff summary correctly', () => {
    render(<PayrollManager {...mockProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  test('calculates totals correctly', () => {
    render(<PayrollManager {...mockProps} />);
    // Total amount should be (100+20+10) * 2 days = 260
    expect(screen.getByText('MYR 260.00')).toBeInTheDocument();
  });

  test('switches between tabs', () => {
    render(<PayrollManager {...mockProps} />);
    
    // Click on Details tab
    fireEvent.click(screen.getByText('Detailed View'));
    expect(screen.getByText('Detailed Payment Records')).toBeInTheDocument();
  });

  test('handles custom save', async () => {
    const mockSave = jest.fn();
    render(
      <PayrollManager 
        {...mockProps} 
        onSave={mockSave}
        disableAutoSave={true}
      />
    );

    fireEvent.click(screen.getByText('Save Payroll'));
    
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'test-project-123',
          totalAmount: 260
        })
      );
    });
  });

  test('validates empty payroll data', async () => {
    const emptyStaff: StaffMember[] = [{
      id: '1',
      name: 'Jane Doe',
      workingDatesWithSalary: [
        { date: new Date('2024-01-01'), basicSalary: '', claims: '', commission: '' }
      ]
    }];

    render(
      <PayrollManager 
        {...mockProps}
        confirmedStaff={emptyStaff}
      />
    );

    fireEvent.click(screen.getByText('Save Payroll'));
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Please enter valid amounts/i)).toBeInTheDocument();
    });
  });

  test('handles staff with no working dates', () => {
    const staffNoDate: StaffMember[] = [{
      id: '1',
      name: 'Empty Staff',
      workingDates: []
    }];

    render(
      <PayrollManager 
        {...mockProps}
        confirmedStaff={staffNoDate}
      />
    );

    expect(screen.getByText('Empty Staff')).toBeInTheDocument();
    expect(screen.getByText('0 days')).toBeInTheDocument();
  });
});

// Integration tests
describe('PayrollManager Integration', () => {
  test('edits payment details', async () => {
    render(<PayrollManager {...mockProps} />);
    
    // Switch to details view
    fireEvent.click(screen.getByText('Detailed View'));
    
    // Click on a staff member to expand
    fireEvent.click(screen.getByText('John Doe'));
    
    // Find and click edit button
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);
    
    // Update basic salary
    const basicInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(basicInput, { target: { value: '150' } });
    
    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Verify the update was called
    expect(mockProps.setConfirmedStaff).toHaveBeenCalled();
  });
});

// Snapshot test
describe('PayrollManager Snapshots', () => {
  test('matches snapshot', () => {
    const { container } = render(<PayrollManager {...mockProps} />);
    expect(container).toMatchSnapshot();
  });
});