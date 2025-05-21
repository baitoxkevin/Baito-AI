# Payment Queue System

A comprehensive system for managing staff payment workflows with approval processes.

## Overview

The Payment Queue System provides a complete solution for submitting, approving, and processing staff payments. It implements a structured workflow:

1. **Payment Submission** - Project managers submit payment batches for staff
2. **Approval Workflow** - Finance team reviews and approves/rejects payment batches
3. **Payment Processing** - Approved payments are exported and processed
4. **Completion Tracking** - Payments are tracked through the entire lifecycle

## Components

### Database Layer

- **Tables**
  - `payment_batches` - Stores batch metadata and status
  - `payment_items` - Individual payment entries within a batch
  - `payment_approval_history` - Audit trail of all actions

- **Functions**
  - `submit_payment_batch` - Creates a new payment batch with items
  - `approve_payment_batch` - Approves a pending payment batch
  - `reject_payment_batch` - Rejects a pending payment batch
  - `mark_payment_batch_exported` - Marks a batch as exported for processing
  - `mark_payment_batch_completed` - Marks a batch as completed

### Service Layer

The `payment-queue-service.ts` module provides TypeScript functions to interact with the database:

```typescript
// Submit a new payment batch
const result = await submitPaymentBatch(
  projectId,
  paymentDate,
  staffPayments,
  companyDetails,
  paymentMethod,
  notes
);

// Fetch payment batches with filtering
const { data, count } = await fetchPaymentBatches({
  status: 'pending',
  projectId: '123',
  limit: 10,
  offset: 0
});

// Get detailed batch information
const { data } = await getPaymentBatchDetails(batchId);

// Approve a batch
const result = await approvePaymentBatch(batchId, notes);
```

### UI Components

#### PaymentSubmissionDialog

Dialog component for submitting new payment batches:

```tsx
import { PaymentSubmissionDialog } from '@/components/project-payroll';

<PaymentSubmissionDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  projectId={project.id}
  projectName={project.title}
  staffPaymentSummaries={staffPaymentData}
  paymentDate={new Date()}
  onSuccess={(batchId) => console.log(`Batch ${batchId} submitted successfully`)}
/>
```

#### PaymentApprovalWorkflow

Admin interface for managing the payment approval workflow:

```tsx
import { PaymentApprovalWorkflow } from '@/components/payroll-manager/PaymentApprovalWorkflow';

<PaymentApprovalWorkflow
  initialStatus="pending"
  onSelectBatch={handleBatchSelected}
  showStatistics={true}
  allowApproval={true}
  allowRejection={true}
  allowExport={true}
  allowCompletion={true}
  defaultItemsPerPage={10}
/>
```

## How to Use

### Submitting a Payment Batch

1. Navigate to a project's payroll section
2. Enter all staff payment details
3. Click the "Submit Payment" button
4. Fill in the company details form
5. Review and confirm the payment details
6. The payment batch will be submitted for approval

### Approving Payments

1. Navigate to the Payment Queue page at `/payment-queue`
2. View pending payment batches in the list
3. Click on a batch to view its details
4. Review all staff payment entries
5. Enter approval notes
6. Click "Approve Payment" to approve the batch

### Exporting Payments

1. Navigate to the Payment Queue page
2. Switch to the "Approved" tab
3. Select an approved payment batch
4. Click "Download CSV" to get the payment file
5. Click "Mark as Exported" to update the status

### Completing Payments

1. Navigate to the Payment Queue page
2. Switch to the "Processing" tab
3. Select a payment batch that has been processed
4. Enter completion notes
5. Click "Mark as Completed" to finalize the payment

## Integration

### Adding the Payment Submission to Project Payroll

To integrate the payment submission into the project payroll component:

```tsx
import { useState } from 'react';
import { PaymentSubmissionDialog } from '@/components/project-payroll';

// Inside your component
const [showPaymentDialog, setShowPaymentDialog] = useState(false);

// Add button to open dialog
<Button onClick={() => setShowPaymentDialog(true)}>
  Submit Payment
</Button>

// Add dialog component
<PaymentSubmissionDialog
  open={showPaymentDialog}
  onOpenChange={setShowPaymentDialog}
  projectId={project.id}
  projectName={project.name}
  staffPaymentSummaries={staffPaymentData}
  paymentDate={new Date()}
  onSuccess={handlePaymentSuccess}
/>
```

### Adding the Approval Workflow

To add the payment approval workflow to an admin page:

```tsx
import { PaymentApprovalWorkflow } from '@/components/payroll-manager/PaymentApprovalWorkflow';

// Inside your component
<PaymentApprovalWorkflow 
  initialStatus="pending"
  showStatistics={true}
/>
```

## Payment Statuses

Payments flow through the following statuses:

1. **pending** - Initial state when submitted, awaiting approval
2. **approved** - Approved by finance team, ready for export
3. **rejected** - Rejected by finance team (terminal state)
4. **processing** - Exported and being processed by the bank
5. **completed** - Successfully processed and paid (terminal state)
6. **cancelled** - Cancelled before approval (terminal state)

## Workflow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Submit    │    │   Approve   │    │   Export    │    │  Complete   │
│   Payment   │───►│   Payment   │───►│  & Process  │───►│   Payment   │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     │                   │                   │                  │
     ▼                   ▼                   ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Pending   │    │  Approved   │    │ Processing  │    │ Completed   │
│   Status    │    │   Status    │    │   Status    │    │   Status    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Demo Page

A demo page has been created to showcase the complete payment workflow:

```
/payment-queue
```

## Data Export

The system supports exporting payment data in DuitNow CSV format:

```typescript
// Generate CSV data from a batch
const csvData = formatDuitNowCsvData(batchDetails, includeStaffWithoutBankDetails);
```

## Security

The payment queue system implements Row Level Security (RLS) at the database level to ensure:

1. Only authenticated users can view payment data
2. Users can only create batches
3. Only batch creators and approvers can update batches
4. All actions are logged in the approval history table

## Troubleshooting

**Problem**: Payment batch is not showing up after submission
**Solution**: Refresh the page or check if the batch was rejected

**Problem**: Cannot approve payment batch
**Solution**: Ensure you have the required permissions

**Problem**: Export file is empty or has missing staff
**Solution**: Staff with missing bank details are excluded from exports by default

## Testing the Workflow

To test the complete payment workflow:

1. Create a project with staff and salary data
2. Submit a payment batch using the PaymentSubmissionDialog
3. Navigate to the payment-queue page
4. Find your batch in the pending list
5. Approve the payment batch
6. Export the payment data
7. Mark the batch as processed
8. Complete the payment

This end-to-end testing ensures all components work together seamlessly.