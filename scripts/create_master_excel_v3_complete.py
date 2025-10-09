#!/usr/bin/env python3
"""
Complete Master Excel Creator - V3.1
Combines V2 rich metadata + V3 validation + source tracking
"""

import os
import glob
import re
from pathlib import Path
from datetime import datetime
import pandas as pd
import numpy as np
from collections import defaultdict
import openpyxl


def clean_ic_number(ic):
    """Clean and normalize IC number."""
    if pd.isna(ic):
        return None
    ic_str = str(ic).strip().split('\n')[0].split('(')[0].strip()
    ic_clean = ic_str.replace(' ', '').replace('-', '')
    return ic_clean if ic_clean and len(ic_clean) >= 6 else None


def clean_name(name):
    """Clean and normalize name."""
    if pd.isna(name):
        return None
    name_str = str(name).strip()
    name_str = ' '.join(name_str.split())
    name_str = re.sub(r'\([^)]*\)', '', name_str).strip()
    name_str = ' '.join(word.capitalize() for word in name_str.split())
    return name_str if name_str else None


def extract_alternate_name(name):
    """Extract alternate name from parentheses."""
    if pd.isna(name):
        return None
    name_str = str(name)
    match = re.search(r'\(([^)]+)\)', name_str)
    if match:
        alt = match.group(1).strip()
        return ' '.join(word.capitalize() for word in alt.split())
    return None


def clean_bank_name(bank):
    """Clean and normalize bank name."""
    if pd.isna(bank):
        return None
    return str(bank).strip() if str(bank).strip() else None


def clean_account(account):
    """Clean and normalize account number - NO .0"""
    if pd.isna(account):
        return None

    account_str = str(account).strip()

    # Handle scientific notation
    try:
        if 'e' in account_str.lower() or '.' in account_str:
            account_num = float(account_str)
            account_str = str(int(account_num))
    except:
        pass

    # Remove spaces, hyphens, .0
    account_str = account_str.replace(' ', '').replace('-', '')
    account_str = account_str.replace('.0', '').replace('.', '')

    return account_str if account_str and account_str.isdigit() else None


def safe_float(value):
    """Safely convert to float."""
    if pd.isna(value):
        return 0.0
    try:
        return float(value)
    except:
        return 0.0


def extract_project_metadata(excel_path, sheet_name):
    """Extract project-level metadata from sheet."""
    try:
        df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None, nrows=10)

        metadata = {
            'project_date_range': None,
            'payment_due_date': None,
            'location': None,
            'time_schedule': None
        }

        for idx in range(min(10, len(df))):
            row = df.iloc[idx]
            row_str = ' '.join([str(val) for val in row if pd.notna(val)])
            row_str_lower = row_str.lower()

            # Extract date range
            if 'date:' in row_str_lower and not metadata['project_date_range']:
                date_match = re.search(r'date:\s*(.+?)(?:payment|time|$)', row_str, re.IGNORECASE)
                if date_match:
                    metadata['project_date_range'] = date_match.group(1).strip().strip(',')

            # Extract payment due date
            if 'payment' in row_str_lower and not metadata['payment_due_date']:
                payment_match = re.search(r'payment\s+(?:by\s+)?(.+?)(?:\s{2,}|$)', row_str, re.IGNORECASE)
                if payment_match:
                    metadata['payment_due_date'] = payment_match.group(1).strip().strip(',')

            # Extract location
            if 'location:' in row_str_lower and not metadata['location']:
                loc_match = re.search(r'location:\s*(.+?)(?:\s{2,}|$)', row_str, re.IGNORECASE)
                if loc_match:
                    metadata['location'] = loc_match.group(1).strip().strip(',')

            # Extract time
            if 'time:' in row_str_lower and not metadata['time_schedule']:
                time_match = re.search(r'time:\s*(.+?)(?:payment|$)', row_str, re.IGNORECASE)
                if time_match:
                    metadata['time_schedule'] = time_match.group(1).strip().strip(',')

        return metadata
    except:
        return {
            'project_date_range': None,
            'payment_due_date': None,
            'location': None,
            'time_schedule': None
        }


def extract_month_from_path(path):
    """Extract month from file path."""
    path_str = str(path).lower()
    months = ['jan', 'feb', 'march', 'april', 'may', 'june', 'july', 'aug', 'sep', 'oct', 'nov', 'dec']
    for month in months:
        if month in path_str:
            return month.capitalize()
    return 'Unknown'


def process_excel_complete(excel_path):
    """
    Process Excel file with ALL metadata extraction.
    """
    print(f"\n📂 Processing: {Path(excel_path).name}")

    month = extract_month_from_path(excel_path)
    all_data = []

    try:
        wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
        sheet_names = wb.sheetnames
        wb.close()

        print(f"   Found {len(sheet_names)} sheet(s)")

        for sheet_name in sheet_names:
            try:
                # Get project metadata
                metadata = extract_project_metadata(excel_path, sheet_name)

                # Read sheet
                df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)

                # Find header rows
                header_rows = []
                for idx, row in df.iterrows():
                    row_str = ' '.join([str(val) for val in row if pd.notna(val)]).lower()
                    if 'name' in row_str and 'ic' in row_str:
                        header_rows.append(idx)

                if not header_rows:
                    continue

                # Process each section
                for idx_pos, header_row_idx in enumerate(header_rows):
                    # Only read until next header row (not 200 rows blindly)
                    if idx_pos < len(header_rows) - 1:
                        nrows = header_rows[idx_pos + 1] - header_row_idx - 1
                    else:
                        nrows = 200  # Last section, read up to 200 rows

                    section_df = pd.read_excel(
                        excel_path,
                        sheet_name=sheet_name,
                        skiprows=header_row_idx,
                        nrows=nrows
                    )

                    section_df.columns = [str(col).strip() for col in section_df.columns]

                    # Identify columns
                    name_cols = [col for col in section_df.columns if 'name' in col.lower() and 'bank' not in col.lower()]
                    ic_cols = [col for col in section_df.columns if 'ic' in col.lower()]
                    bank_cols = [col for col in section_df.columns if 'bank name' in col.lower() or col.lower() == 'bank']
                    account_cols = [col for col in section_df.columns if 'account' in col.lower()]
                    position_cols = [col for col in section_df.columns if col.lower() in ['position', 'role']]

                    # Payment columns
                    day_cols = [col for col in section_df.columns if col.lower() in ['day', 'days']]
                    date_cols = [col for col in section_df.columns if col.lower() == 'date']
                    wage_cols = [col for col in section_df.columns if col.lower() in ['wages', 'wage']]
                    ot_cols = [col for col in section_df.columns if col.lower() in ['ot', 'overtime']]
                    allowance_cols = [col for col in section_df.columns if 'allowance' in col.lower()]
                    claim_cols = [col for col in section_df.columns if col.lower() in ['claim', 'claims']]
                    payment_cols = [col for col in section_df.columns if col.lower() in ['payment']]
                    total_cols = [col for col in section_df.columns if col.lower() in ['total', 'total wages']]

                    # Date columns (for roster)
                    date_pattern_cols = [col for col in section_df.columns if re.match(r'\d{4}-\d{2}-\d{2}', str(col))]

                    if not name_cols or not ic_cols:
                        continue

                    # Extract candidates
                    current_candidate = None
                    candidates = {}

                    for idx, row in section_df.iterrows():
                        # New candidate row (has Name AND IC)
                        if pd.notna(row.get(name_cols[0])) and pd.notna(row.get(ic_cols[0])):
                            if str(row[name_cols[0]]).strip().lower() in ['no', 'name', '']:
                                continue

                            ic_number = clean_ic_number(row[ic_cols[0]])
                            if not ic_number or len(ic_number) < 6:
                                continue

                            full_name = clean_name(row[name_cols[0]])
                            if not full_name:
                                continue

                            # Skip obvious non-person entries (headers, labels, etc.)
                            full_name_lower = full_name.lower()
                            skip_keywords = ['pax', 'day', 'payment', 'total', 'claim', 'allowance',
                                           'team', 'roving', 'instore', 'roadshow', 'activation',
                                           'launching', 'crew', 'staff', 'position', 'name']
                            if full_name_lower in skip_keywords or any(kw in full_name_lower for kw in ['redoxon', 'softlan', 'brands']):
                                continue

                            # Key WITHOUT row index - same person in same sheet = ONE record
                            key = f"{ic_number}_{sheet_name}"
                            current_candidate = key

                            # Only create NEW candidate if not already exists
                            if key not in candidates:
                                candidates[key] = {
                                    'month': month,
                                    'source_file': Path(excel_path).name,
                                    'source_sheet': sheet_name,
                                    'project_name': sheet_name,
                                    'full_name': full_name,
                                    'alternate_name': extract_alternate_name(row[name_cols[0]]),
                                    'ic_number': ic_number,
                                    'bank_name': clean_bank_name(row.get(bank_cols[0])) if bank_cols else None,
                                    'account_number': clean_account(row.get(account_cols[0])) if account_cols else None,
                                    'position': str(row.get(position_cols[0])).strip() if position_cols and pd.notna(row.get(position_cols[0])) else None,
                                    'days_worked': 0,
                                    'total_wages': 0.0,
                                    'total_ot': 0.0,
                                    'total_allowance': 0.0,
                                    'total_claim': 0.0,
                                    'total_payment': 0.0,
                                    'work_dates': [],
                                    'project_date_range': metadata['project_date_range'],
                                    'payment_due_date': metadata['payment_due_date'],
                                    'location': metadata['location'],
                                    'time_schedule': metadata['time_schedule'],
                                    'roster_info': [],
                                    'notes': [],
                                    'project_notes': []
                                }
                            # If already exists, just update current_candidate to aggregate data
                            else:
                                current_candidate = key

                        # Aggregate data for current candidate
                        # Skip rows that:
                        # 1. Have Name but no IC (roster/schedule sections)
                        # 2. Have ONLY Total value (summary/grand total rows)
                        has_name_no_ic = (
                            pd.notna(row.get(name_cols[0])) and
                            pd.isna(row.get(ic_cols[0]))
                        )

                        # Check if this is a summary row (subtotal/grand total)
                        # Summary rows are CONTINUATION rows (empty Name/IC) with totals
                        # First rows (with Name/IC) are legitimate even if they only have Total
                        is_summary_row = False

                        # Only check for summary rows in CONTINUATION rows (no Name/IC)
                        is_continuation = pd.isna(row.get(name_cols[0])) and pd.isna(row.get(ic_cols[0]))

                        if is_continuation:
                            # Check for abnormally high days (likely a sum, not individual work)
                            if day_cols and pd.notna(row.get(day_cols[0])):
                                days_val = safe_float(row[day_cols[0]])
                                if days_val > 50:  # No single person works 50+ days in one project entry
                                    is_summary_row = True

                            # Check if row has ONLY Total/Payment but no other payment data
                            if not is_summary_row and (payment_cols or total_cols):
                                payment_val = 0
                                if payment_cols and pd.notna(row.get(payment_cols[0])):
                                    payment_val = safe_float(row[payment_cols[0]])
                                if total_cols and pd.notna(row.get(total_cols[0])):
                                    total_val = safe_float(row[total_cols[0]])
                                    payment_val = max(payment_val, total_val)

                                if payment_val > 0:
                                    # Check if this row has ANY other payment-related data
                                    has_other_payment_data = False
                                    if day_cols and pd.notna(row.get(day_cols[0])):
                                        has_other_payment_data = True
                                    if wage_cols and pd.notna(row.get(wage_cols[0])):
                                        has_other_payment_data = True
                                    if allowance_cols and pd.notna(row.get(allowance_cols[0])):
                                        has_other_payment_data = True
                                    if claim_cols and pd.notna(row.get(claim_cols[0])):
                                        has_other_payment_data = True

                                    # If continuation row has Payment/Total but NO other data, it's a summary row
                                    if not has_other_payment_data:
                                        is_summary_row = True
                                    # OR if payment > 2000 with minimal other data (wages < 500)
                                    elif payment_val > 2000:
                                        wage_val = safe_float(row.get(wage_cols[0])) if wage_cols and pd.notna(row.get(wage_cols[0])) else 0
                                        if wage_val < 500:
                                            is_summary_row = True

                        if current_candidate and current_candidate in candidates and not has_name_no_ic and not is_summary_row:
                            # Add days with sanity check (max 50 days per project entry)
                            if day_cols and pd.notna(row.get(day_cols[0])):
                                days_val = safe_float(row[day_cols[0]])
                                if days_val <= 50:
                                    # Normal days value
                                    candidates[current_candidate]['days_worked'] += days_val
                                elif days_val > 50:
                                    # Likely payment value in wrong column (e.g., 800 in Day column)
                                    # Check if there's NO other payment data
                                    has_payment = (
                                        (wage_cols and pd.notna(row.get(wage_cols[0]))) or
                                        (payment_cols and pd.notna(row.get(payment_cols[0]))) or
                                        (total_cols and pd.notna(row.get(total_cols[0])))
                                    )
                                    if not has_payment:
                                        # Treat this as payment, not days
                                        candidates[current_candidate]['total_payment'] = max(
                                            candidates[current_candidate]['total_payment'], days_val
                                        )

                            if wage_cols and pd.notna(row.get(wage_cols[0])):
                                candidates[current_candidate]['total_wages'] += safe_float(row[wage_cols[0]])

                            if ot_cols and pd.notna(row.get(ot_cols[0])):
                                candidates[current_candidate]['total_ot'] += safe_float(row[ot_cols[0]])

                            if allowance_cols and pd.notna(row.get(allowance_cols[0])):
                                candidates[current_candidate]['total_allowance'] += safe_float(row[allowance_cols[0]])

                            if claim_cols and pd.notna(row.get(claim_cols[0])):
                                candidates[current_candidate]['total_claim'] += safe_float(row[claim_cols[0]])

                            # Handle "Payment" column intelligently:
                            # - If BOTH "Payment" AND "Total" exist → Payment is per-row wages (sum it)
                            # - If ONLY "Payment" exists → Payment is final total (use max)
                            if payment_cols and pd.notna(row.get(payment_cols[0])):
                                val = safe_float(row[payment_cols[0]])
                                if total_cols:
                                    # Payment is per-row wages, add to total_wages
                                    candidates[current_candidate]['total_wages'] += val
                                else:
                                    # Payment is final total, use max
                                    if val > candidates[current_candidate]['total_payment']:
                                        candidates[current_candidate]['total_payment'] = val

                            # Handle "Total" column (always final total, use max)
                            if total_cols and pd.notna(row.get(total_cols[0])):
                                val = safe_float(row[total_cols[0]])
                                if val > candidates[current_candidate]['total_payment']:
                                    candidates[current_candidate]['total_payment'] = val

                            if date_cols and pd.notna(row.get(date_cols[0])):
                                date_str = str(row[date_cols[0]])
                                if date_str not in candidates[current_candidate]['work_dates']:
                                    candidates[current_candidate]['work_dates'].append(date_str)

                            # Roster info from date columns
                            for date_col in date_pattern_cols:
                                if pd.notna(row.get(date_col)):
                                    roster_val = str(row[date_col]).strip()
                                    if roster_val and len(roster_val) < 50:
                                        info = f"{date_col}: {roster_val}"
                                        if info not in candidates[current_candidate]['roster_info']:
                                            candidates[current_candidate]['roster_info'].append(info)

                    # Post-process candidates
                    for key, candidate in candidates.items():
                        # Calculate total if missing
                        component_sum = (
                            candidate['total_wages'] +
                            candidate['total_ot'] +
                            candidate['total_allowance'] +
                            candidate['total_claim']
                        )

                        if candidate['total_payment'] == 0 and component_sum > 0:
                            candidate['total_payment'] = component_sum

                        if component_sum > candidate['total_payment']:
                            candidate['total_payment'] = component_sum

                        # Limit roster info
                        candidate['roster_info'] = candidate['roster_info'][:5]

                        all_data.append(candidate)

            except Exception as e:
                print(f"   ⚠️  Error in sheet '{sheet_name}': {e}")
                continue

        print(f"   ✓ Extracted {len(all_data)} record(s)")
        return all_data

    except Exception as e:
        print(f"   ✗ Error: {e}")
        return []


def main():
    """Main function."""
    print("="*120)
    print(" "*30 + "COMPLETE EXTRACTION V3.1 - ALL FIELDS + VALIDATION")
    print("="*120)

    source_dir = "/Users/baito.kevin/Downloads/PROMOTER PAYMENT & CLAIMS 2025/Baito Promoter 2025/"

    months_ordered = [
        ('jan', 'Baito Jan Payment Details 2025.xlsx'),
        ('feb', 'Baito Feb Payment Details 2025.xlsx'),
        ('march', 'Baito March Payment Details 2025.xlsx'),
        ('april', 'Baito April Payment Details 2025.xlsx'),
        ('may', 'Baito May Payment Details 2025.xlsx'),
        ('june', 'Baito June Payment Details 2025.xlsx'),
        ('july', 'Baito July Payment Details 2025.xlsx'),
        ('aug', 'Baito Aug Payment Details 2025.xlsx'),
        ('sep', 'Baito Sep Payment Details 2025.xlsx')
    ]

    all_data = []

    for month_name, filename in months_ordered:
        excel_path = Path(source_dir) / filename

        if not excel_path.exists():
            print(f"\n⊘ {month_name.capitalize()}: File not found")
            continue

        data = process_excel_complete(str(excel_path))
        all_data.extend(data)

    print(f"\n{'='*120}")
    print(f"Total records extracted: {len(all_data)}")
    print(f"{'='*120}")

    # Create DataFrame
    df = pd.DataFrame(all_data)

    # Format list columns
    df['work_dates'] = df['work_dates'].apply(lambda x: ', '.join(x) if x else '')
    df['roster_info'] = df['roster_info'].apply(lambda x: '; '.join(x) if x else '')
    df['notes'] = df['notes'].apply(lambda x: '; '.join(x) if x else '')
    df['project_notes'] = df['project_notes'].apply(lambda x: '; '.join(x) if x else '')

    # Month ordering for sorting
    month_order = {m.capitalize(): i for i, (m, _) in enumerate(months_ordered)}
    df['month_order'] = df['month'].map(month_order)

    # Sort by month (Jan to Dec), then file, then sheet
    df = df.sort_values(['month_order', 'source_file', 'source_sheet', 'full_name'])
    df = df.drop('month_order', axis=1)

    # Column order (ALL FIELDS)
    column_order = [
        'month',
        'source_file',
        'source_sheet',
        'project_name',
        'full_name',
        'alternate_name',
        'ic_number',
        'bank_name',
        'account_number',
        'position',
        'days_worked',
        'total_wages',
        'total_ot',
        'total_allowance',
        'total_claim',
        'total_payment',
        'work_dates',
        'project_date_range',
        'payment_due_date',
        'location',
        'time_schedule',
        'roster_info',
        'notes',
        'project_notes'
    ]

    df = df[column_order]

    # Save
    output_file = 'baito_2025_COMPLETE_v3.xlsx'
    print(f"\n💾 Saving to: {output_file}")

    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='All Candidates', index=False)

        # Monthly summary
        monthly = df.groupby('month').agg({
            'project_name': 'nunique',
            'full_name': 'count',
            'total_payment': 'sum'
        }).rename(columns={
            'project_name': 'Projects',
            'full_name': 'Records',
            'total_payment': 'Total Payment (RM)'
        })
        monthly.to_excel(writer, sheet_name='Monthly Summary')

    print(f"\n✅ COMPLETE!")
    print(f"   File: {output_file}")
    print(f"   Records: {len(df):,}")
    print(f"   Columns: {len(df.columns)} (ALL metadata included)")
    print(f"   Sorted: Jan → Sep")
    print()


if __name__ == '__main__':
    main()
