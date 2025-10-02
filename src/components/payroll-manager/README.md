# PayrollManager Component

A standalone, exportable payroll management component for project staff payments. This component handles salary calculations, claims, commissions, and provides a comprehensive UI for managing payroll data.

## Features

- **Summary View**: Overview of all staff payments with totals
- **Detailed View**: Individual date-wise payment breakdown
- **Flexible Data Handling**: Supports basic salary, claims, and optional commissions
- **Validation**: Built-in validation for payment data
- **Export Ready**: Fully encapsulated with all dependencies
- **Customizable Save Logic**: Option to provide custom save handlers

## Installation

1. Copy the `payroll-manager` directory to your project's components folder
2. Ensure you have the required dependencies:

```bash
npm install date-fns lucide-react
```

3. Ensure you have the required UI components from shadcn/ui:
- Table
- Card
- Button
- Input
- Label
- Badge
- Avatar
- Dialog
- Accordion
- Calendar
- Tabs

## Usage

### Basic Usage

```tsx
import { PayrollManager } from '@/components/payroll-manager';

function ProjectPayroll() {
  const [confirmedStaff, setConfirmedStaff] = useState<StaffMember[]>([]);

  return (
    <PayrollManager
      confirmedStaff={confirmedStaff}
      setConfirmedStaff={setConfirmedStaff}
      projectStartDate={new Date('2024-01-01')}
      projectEndDate={new Date('2024-01-31')}
      projectId="project-123"
    />
  );
}
```

### With Custom Save Handler

```tsx
import { PayrollManager, PayrollData } from '@/components/payroll-manager';

function ProjectPayroll() {
  const [confirmedStaff, setConfirmedStaff] = useState<StaffMember[]>([]);

  const handleSavePayroll = async (payrollData: PayrollData) => {
    // Custom save logic
    console.log('Saving payroll:', payrollData);
    
    // Call your API or perform custom operations
    await myCustomAPI.savePayroll(payrollData);
  };

  return (
    <PayrollManager
      confirmedStaff={confirmedStaff}
      setConfirmedStaff={setConfirmedStaff}
      projectStartDate={new Date('2024-01-01')}
      projectEndDate={new Date('2024-01-31')}
      projectId="project-123"
      onSave={handleSavePayroll}
      disableAutoSave={true}
    />
  );
}
```

## Props

### PayrollManagerProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `confirmedStaff` | `StaffMember[]` | Yes | Array of staff members with working dates |
| `setConfirmedStaff` | `(staff: StaffMember[]) => void` | Yes | Function to update staff array |
| `projectStartDate` | `Date` | Yes | Project start date |
| `projectEndDate` | `Date` | Yes | Project end date |
| `projectId` | `string` | Yes | Unique project identifier |
| `onSave` | `(payrollData: PayrollData) => void` | No | Custom save handler |
| `disableAutoSave` | `boolean` | No | Disable automatic database saving |

## Types

### StaffMember
```typescript
interface StaffMember {
  id: string;
  name: string;
  designation?: string;
  photo?: string;
  workingDates?: Date[];
  workingDatesWithSalary?: WorkingDateWithSalary[];
}
```

### WorkingDateWithSalary
```typescript
interface WorkingDateWithSalary {
  date: Date;
  basicSalary: string;
  claims: string;
  commission: string;
}
```

### PayrollData
```typescript
interface PayrollData {
  projectId: string;
  staffPayroll: StaffPayrollEntry[];
  totalAmount: number;
  paymentDate?: Date;
}
```

## Utility Functions

The component exports several utility functions for payroll calculations:

- `formatCurrency(amount)`: Format number to currency string
- `parseAmount(value)`: Parse currency string to number
- `validatePayrollData(staff)`: Validate payroll data
- `calculateTotalPayroll(staff)`: Calculate total payroll amount
- `sortDates(dates)`: Sort working dates chronologically
- `findDateEntry(dates, targetDate)`: Find specific date entry
- `updateDateEntry(dates, targetDate, updates)`: Update date entry
- `removeEmptyDateEntries(dates)`: Remove entries with zero amounts
- `getInitials(name)`: Get initials from name

## Customization

### Styling

The component uses Tailwind CSS classes and can be customized by:
1. Modifying the component directly
2. Using className props on parent elements
3. Overriding CSS variables used by shadcn/ui components

### Features

To extend functionality:
1. Add new props to PayrollManagerProps
2. Implement additional validation rules in utils.ts
3. Add new tabs or views to the main component
4. Create custom dialogs for specific workflows

## Dependencies

- React
- date-fns
- lucide-react
- @/components/ui/* (shadcn/ui components)
- @/lib/calculate-staff-working-time
- @/lib/staff-payroll-service
- @/hooks/use-toast
- @/lib/supabase

## Example Integration

```tsx
// In your project management component
import { PayrollManager } from '@/components/payroll-manager';

export function ProjectManagementDialog({ project }) {
  const [confirmedStaff, setConfirmedStaff] = useState(project.staff || []);

  return (
    <Tabs>
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="payroll">Payroll</TabsTrigger>
      </TabsList>
      
      <TabsContent value="payroll">
        <PayrollManager
          confirmedStaff={confirmedStaff}
          setConfirmedStaff={setConfirmedStaff}
          projectStartDate={project.start_date}
          projectEndDate={project.end_date}
          projectId={project.id}
        />
      </TabsContent>
    </Tabs>
  );
}
```

## Troubleshooting

### Common Issues

1. **Invalid Project ID**: The component handles invalid project IDs gracefully and will attempt to find a valid one from the staff data.

2. **Missing Dependencies**: Ensure all UI components and utilities are properly imported.

3. **Type Errors**: Make sure your staff data matches the StaffMember interface.

4. **Save Failures**: Check console for specific error messages and ensure your save handler is properly implemented.

## License

This component is part of the project management system and follows the same license as the parent project.