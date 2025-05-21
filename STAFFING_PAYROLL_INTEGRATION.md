# Integrated Staffing & Payroll System

This document outlines a comprehensive workflow for integrating staffing and payroll management into a unified interface, eliminating redundant work and creating a seamless experience.

## Overview

Currently, staff management and payroll exist as separate tabs with overlapping functionality, causing:
- Duplicate data entry
- Inconsistent information
- Separate workflows for related tasks
- Disconnected experience for project managers

The proposed integration creates a seamless workflow from staff assignment to payment processing.

## Unified Workflow Design

### 1. Staff Assignment & Scheduling Flow

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│                         │     │                         │     │                         │
│    STAFF SELECTION      │────▶│  CALENDAR ASSIGNMENT    │────▶│  SALARY CONFIGURATION   │
│                         │     │                         │     │                         │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
         │                                                                    │
         │                                                                    │
         │                                                                    ▼
         │                      ┌─────────────────────────┐     ┌─────────────────────────┐
         │                      │                         │     │                         │
         └─────────────────────▶│    STAFF DASHBOARD      │◀────│    PAYMENT MANAGEMENT   │
                                │                         │     │                         │
                                └─────────────────────────┘     └─────────────────────────┘
```

### 2. Interface Components

#### Main Navigation Tabs
- **Staff & Payroll** (Combined tab - replaces separate Staffing and Payroll tabs)
- Schedule
- Expenses
- Documents
- Tasks
- History

#### Staff & Payroll Tab Views
1. **Staff List View** (Default)
2. **Calendar View**
3. **Payment Matrix View**
4. **Financial Summary View**

## Visual Mockup

### Staff List View (Combined Staff & Salary Information)

```
┌─ Staff & Payroll ───────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│  [Staff List ▼] [Calendar] [Payment Matrix] [Financial Summary]       [+ Add Staff]      │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │ ┌─────────┐ Sarah Johnson         Event Coordinator           Status: Confirmed   │   │
│  │ │   SJ    │ sarah@example.com     Working Dates: Mar 10-14    Position: Manager   │   │
│  │ └─────────┘                                                                       │   │
│  │                                                                                   │   │
│  │             Day Rate: $500         Claims: $75        Commission: $0              │   │
│  │                                                                                   │   │
│  │             Total: $2,575 (5 days)           [View Details] [Edit Salary] [✓]     │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │ ┌─────────┐ Mike Chen              Sound Engineer             Status: Confirmed   │   │
│  │ │   MC    │ mike@example.com       Working Dates: Mar 10-12   Position: Tech      │   │
│  │ └─────────┘                                                                       │   │
│  │                                                                                   │   │
│  │             Day Rate: $600         Claims: $100       Commission: $50             │   │
│  │                                                                                   │   │
│  │             Total: $1,950 (3 days)           [View Details] [Edit Salary] [✓]     │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│  Project Totals: $6,500                         [Bulk Edit] [Export] [Save All]         │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Calendar View (With Salary Information)

```
┌─ Staff & Payroll ───────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│  [Staff List] [Calendar ▼] [Payment Matrix] [Financial Summary]      [+ Add Staff]       │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │                           March 2025                     [◄] [Today] [►]         │   │
│  │                                                                                  │   │
│  │    Sun     Mon     Tue     Wed     Thu     Fri     Sat                          │   │
│  │                                                                                  │   │
│  │     3       4       5       6       7       8       9                           │   │
│  │                                                                                  │   │
│  │    10      11      12      13      14      15      16                           │   │
│  │    SJ      SJ      SJ      SJ      SJ                                           │   │
│  │    MC      MC      MC                                                           │   │
│  │   $1100   $1100   $1100    $500    $500                                         │   │
│  │                                                                                  │   │
│  │    17      18      19      20      21      22      23                           │   │
│  │                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│  [Day View] [Week View] [Month View]                   [Export Calendar] [Save]          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Payment Matrix View (Daily Breakdown)

```
┌─ Staff & Payroll ───────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│  [Staff List] [Calendar] [Payment Matrix ▼] [Financial Summary]    [+ Add Staff]         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐        │
│  │ Staff Member    │ Mar 10  │ Mar 11  │ Mar 12  │ Mar 13  │ Mar 14  │ Total  │        │
│  │─────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────│        │
│  │ Sarah Johnson   │         │         │         │         │         │        │        │
│  │   Day Rate      │  $500   │  $500   │  $500   │  $500   │  $500   │ $2,500 │        │
│  │   Claims        │   $75   │   $0    │   $0    │   $0    │   $0    │   $75  │        │
│  │   Commission    │   $0    │   $0    │   $0    │   $0    │   $0    │   $0   │        │
│  │   Daily Total   │  $575   │  $500   │  $500   │  $500   │  $500   │ $2,575 │        │
│  │─────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────│        │
│  │ Mike Chen       │         │         │         │         │         │        │        │
│  │   Day Rate      │  $600   │  $600   │  $600   │    -    │    -    │ $1,800 │        │
│  │   Claims        │   $50   │   $0    │   $50   │    -    │    -    │  $100  │        │
│  │   Commission    │   $0    │   $0    │   $50   │    -    │    -    │   $50  │        │
│  │   Daily Total   │  $650   │  $600   │  $700   │    -    │    -    │ $1,950 │        │
│  │─────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────│        │
│  │ Daily Project   │ $1,225  │ $1,100  │ $1,200  │  $500   │  $500   │ $4,525 │        │
│  │ Total           │         │         │         │         │         │        │        │
│  └─────────────────────────────────────────────────────────────────────────────┘        │
│                                                                                          │
│  [Apply Bulk Rates] [Export to Excel] [Save Changes]                                     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Financial Summary View

```
┌─ Staff & Payroll ───────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│  [Staff List] [Calendar] [Payment Matrix] [Financial Summary ▼]    [+ Add Staff]         │
│  ┌────────────────────────────────────────────────────────────────────────────┐         │
│  │                                                                            │         │
│  │  ┌─────────────────────────┐    ┌─────────────────────────┐               │         │
│  │  │    Staff Costs          │    │    Financial Metrics    │               │         │
│  │  │                         │    │                         │               │         │
│  │  │  Total Wages: $4,300    │    │  Budget: $10,000        │               │         │
│  │  │  Total Claims: $175     │    │  Balance: $5,475        │               │         │
│  │  │  Commissions: $50       │    │  Budget Utilization: 55%│               │         │
│  │  │                         │    │                         │               │         │
│  │  │  Total Staff Cost: $4,525│    │  Cost Per Day: $905    │               │         │
│  │  └─────────────────────────┘    └─────────────────────────┘               │         │
│  │                                                                            │         │
│  │  ┌─────────────────────────────────────────────────────────────┐          │         │
│  │  │  Cost Breakdown                                             │          │         │
│  │  │                                                             │          │         │
│  │  │  [PIE CHART: Wages 95%, Claims 4%, Commissions 1%]         │          │         │
│  │  │                                                             │          │         │
│  │  └─────────────────────────────────────────────────────────────┘          │         │
│  │                                                                            │         │
│  └────────────────────────────────────────────────────────────────────────────┘         │
│                                                                                          │
│  [Export Report] [Print Summary] [Share]                                                 │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

## Key User Flows

### 1. Adding New Staff with Salary Information

1. User clicks "+ Add Staff" button
2. Staff selection dialog appears with candidate list
3. User selects a candidate and assigns a position
4. Calendar date selection appears for working days
5. Each selected day shows salary configuration
6. User sets day rate, claims, commission
7. User clicks "Add to Project" to complete

### 2. Bulk Salary Editing

1. User selects multiple staff using checkboxes
2. User clicks "Bulk Edit" button
3. Dialog appears with options:
   - Set day rate for all selected staff
   - Apply day rate to specific dates
   - Add fixed claim amount
4. User makes selections and clicks "Apply"
5. Changes are previewed before confirmation

### 3. Payment Summary and Export

1. User navigates to "Financial Summary" view
2. Reviews total project costs and breakdown
3. Clicks "Export Report" to generate:
   - Excel spreadsheet with all payment details
   - PDF report with financial summary
   - CSV file for accounting system import

## Implementation Benefits

This integrated approach provides several advantages:

1. **Data Consistency**: Staff and payment information remain in sync
2. **Workflow Efficiency**: Complete staffing and payment tasks in one interface
3. **Financial Overview**: See real-time cost implications of staffing decisions
4. **Reduced Errors**: Single source of truth for staff scheduling and payment
5. **Time Savings**: Eliminate duplicate data entry and cross-checking

## Technical Implementation Notes

The integration requires:

1. Merging the current StaffingTab and PayrollManager components
2. Creating a unified data model for staff scheduling and payment
3. Implementing view switching within the combined tab
4. Adding financial calculation and reporting functionality

This integration represents a significant UX improvement while leveraging existing components in a more cohesive way.