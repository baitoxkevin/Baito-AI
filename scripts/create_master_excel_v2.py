#!/usr/bin/env python3
"""
Enhanced Master Excel Creator - V2
Extracts comprehensive data including project dates, payment dates, roster info, and more.
"""

import os
import glob
import re
from pathlib import Path
from datetime import datetime
import pandas as pd
import numpy as np
from collections import defaultdict


def clean_ic_number(ic):
    """Clean and normalize IC number."""
    if pd.isna(ic):
        return None
    ic_str = str(ic).strip()
    # Handle multi-line IC (some have multiple ICs in brackets)
    ic_str = ic_str.split('\n')[0].strip()
    ic_str = ic_str.split('(')[0].strip()
    # Remove spaces and hyphens
    ic_clean = ic_str.replace(' ', '').replace('-', '')
    return ic_clean if ic_clean and len(ic_clean) >= 6 else None


def clean_name(name):
    """Clean and normalize name."""
    if pd.isna(name):
        return None
    name_str = str(name).strip()
    # Remove extra whitespace and newlines
    name_str = ' '.join(name_str.split())
    # Remove text in parentheses (alternate names)
    name_str = re.sub(r'\([^)]*\)', '', name_str).strip()
    # Capitalize properly
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
    bank_str = str(bank).strip()
    return bank_str if bank_str else None


def clean_account(account):
    """Clean and normalize account number."""
    if pd.isna(account):
        return None
    account_str = str(account).strip().replace(' ', '').replace('-', '')
    # Handle scientific notation
    try:
        if 'e' in account_str.lower():
            account_str = str(int(float(account_str)))
    except:
        pass
    return account_str if account_str else None


def safe_float(value):
    """Safely convert to float."""
    if pd.isna(value):
        return 0.0
    try:
        return float(value)
    except:
        return 0.0


def extract_project_name(filename):
    """Extract project name from filename."""
    match = re.search(r'2025_(.+)\.csv$', filename)
    if match:
        return match.group(1).strip()
    return filename.replace('.csv', '')


def extract_project_metadata(csv_path, raw_df):
    """Extract project-level metadata from the first few rows."""
    metadata = {
        'project_date_range': None,
        'payment_due_date': None,
        'location': None,
        'time': None,
        'locations_list': []
    }

    # Look at first 10 rows for metadata
    for idx in range(min(10, len(raw_df))):
        row = raw_df.iloc[idx]
        row_str = ' '.join([str(val) for val in row if pd.notna(val)])
        row_str_lower = row_str.lower()

        # Extract date range
        if 'date:' in row_str_lower and not metadata['project_date_range']:
            # Pattern: "Date: 12 March- 6 April" or "Date: 20th April 2025"
            date_match = re.search(r'date:\s*(.+?)(?:payment|$)', row_str, re.IGNORECASE)
            if date_match:
                metadata['project_date_range'] = date_match.group(1).strip().strip(',')

        # Extract payment due date
        if 'payment' in row_str_lower:
            payment_match = re.search(r'payment\s+(?:by\s+)?(.+?)(?:\s+|$)', row_str, re.IGNORECASE)
            if payment_match:
                metadata['payment_due_date'] = payment_match.group(1).strip().strip(',')

        # Extract location
        if 'location:' in row_str_lower:
            loc_match = re.search(r'location:\s*(.+?)(?:\s{2,}|$)', row_str, re.IGNORECASE)
            if loc_match:
                metadata['location'] = loc_match.group(1).strip().strip(',')

        # Extract time
        if 'time:' in row_str_lower:
            time_match = re.search(r'time:\s*(.+?)(?:payment|$)', row_str, re.IGNORECASE)
            if time_match:
                metadata['time'] = time_match.group(1).strip().strip(',')

        # Extract multiple locations from header row (like "KL", "Kuantan", "JB")
        locations = [str(val).strip() for val in row if pd.notna(val) and len(str(val).strip()) < 20 and str(val).strip().isalpha()]
        if len(locations) > 2 and all(len(loc) < 15 for loc in locations):
            metadata['locations_list'] = locations

    return metadata


def find_header_rows(df_raw):
    """Find all rows that contain 'Name' and 'IC' (headers)."""
    header_rows = []
    for idx, row in df_raw.iterrows():
        row_str = ' '.join([str(val) for val in row if pd.notna(val)]).lower()
        if ('name' in row_str and 'ic' in row_str) or ('name' in row_str and 'account' in row_str):
            header_rows.append(idx)
    return header_rows


def extract_date_columns(df):
    """Identify columns that contain dates (for roster/schedule info)."""
    date_cols = []
    for col in df.columns:
        col_str = str(col)
        # Check if column name looks like a date
        if re.match(r'\d{4}-\d{2}-\d{2}', col_str):
            date_cols.append(col)
        elif 'date' in col_str.lower() and 'unnamed' not in col_str.lower():
            # Check if values in this column are dates
            sample = df[col].dropna().head()
            if len(sample) > 0:
                try:
                    pd.to_datetime(sample)
                    date_cols.append(col)
                except:
                    pass
    return date_cols


def extract_section_data(csv_path, header_row_idx, next_header_idx, project_name, metadata):
    """Extract data from a section of the CSV with enhanced fields."""
    try:
        # Read section with proper header
        section_df = pd.read_csv(
            csv_path,
            encoding='utf-8',
            skiprows=header_row_idx,
            nrows=next_header_idx - header_row_idx - 1 if next_header_idx else None,
            na_values=['', 'nan', 'NaN', 'None']
        )

        # Clean column names
        section_df.columns = [str(col).strip() for col in section_df.columns]

        # Identify columns
        name_cols = [col for col in section_df.columns if 'name' in col.lower() and 'bank' not in col.lower()]
        ic_cols = [col for col in section_df.columns if 'ic' in col.lower() and ('number' in col.lower() or col.lower() == 'ic')]
        bank_cols = [col for col in section_df.columns if 'bank name' in col.lower() or col.lower() == 'bank']
        # Fix: Look for "Bank Account" or "Account" columns
        account_cols = [col for col in section_df.columns if 'account' in col.lower()]
        # If we found both "Bank Name" and "Bank Account", use "Bank Account"
        if len(account_cols) > 1:
            account_cols = [col for col in account_cols if 'bank account' in col.lower()]
        position_cols = [col for col in section_df.columns if col.lower() in ['position', 'role']]

        # Payment columns
        day_cols = [col for col in section_df.columns if col.lower() in ['day', 'days']]
        date_cols = [col for col in section_df.columns if col.lower() == 'date']
        wage_cols = [col for col in section_df.columns if col.lower() in ['wages', 'wage']]
        ot_cols = [col for col in section_df.columns if col.lower() in ['ot', 'overtime']]
        allowance_cols = [col for col in section_df.columns if 'allowance' in col.lower()]
        claim_cols = [col for col in section_df.columns if col.lower() in ['claim', 'claims']]
        total_cols = [col for col in section_df.columns if col.lower() in ['total', 'payment', 'total wages']]

        # Roster/date columns (columns that are dates)
        roster_date_cols = extract_date_columns(section_df)

        if not name_cols or not ic_cols:
            return []

        name_col = name_cols[0]
        ic_col = ic_cols[0]
        bank_col = bank_cols[0] if bank_cols else None
        account_col = account_cols[0] if account_cols else None
        position_col = position_cols[0] if position_cols else None
        day_col = day_cols[0] if day_cols else None
        date_col = date_cols[0] if date_cols else None
        wage_col = wage_cols[0] if wage_cols else None
        ot_col = ot_cols[0] if ot_cols else None
        allowance_col = allowance_cols[0] if allowance_cols else None
        claim_col = claim_cols[0] if claim_cols else None
        total_col = total_cols[0] if total_cols else None

        # Extract candidate records
        candidates = {}
        current_candidate = None

        for idx, row in section_df.iterrows():
            # Check if this row has candidate info
            if pd.notna(row[name_col]) and pd.notna(row[ic_col]):
                # Skip header remnants
                name_val = str(row[name_col]).strip().lower()
                if name_val in ['no', 'name', '']:
                    continue

                ic_number = clean_ic_number(row[ic_col])
                if not ic_number or len(ic_number) < 6:
                    continue

                full_name = clean_name(row[name_col])
                if not full_name:
                    continue

                # Create unique key
                key = f"{ic_number}_{project_name}"

                if key not in candidates:
                    candidates[key] = {
                        'project_name': project_name,
                        'full_name': full_name,
                        'alternate_name': extract_alternate_name(row[name_col]),
                        'ic_number': ic_number,
                        'bank_name': None,
                        'account_number': None,
                        'account_holder_name': None,  # Will try to detect if different
                        'position': None,
                        'days_worked': 0,
                        'total_wages': 0.0,
                        'total_ot': 0.0,
                        'total_allowance': 0.0,
                        'total_claim': 0.0,
                        'total_payment': 0.0,
                        'work_dates': [],
                        'project_date_range': metadata.get('project_date_range'),
                        'payment_due_date': metadata.get('payment_due_date'),
                        'location': metadata.get('location'),
                        'time_schedule': metadata.get('time'),
                        'notes': [],
                        'project_notes': [],
                        'roster_info': []
                    }

                current_candidate = key

                # Update bank details
                if bank_col and pd.notna(row[bank_col]):
                    bank_value = str(row[bank_col]).strip()
                    if bank_value.lower() not in ['sammy claim', 'claim']:
                        candidates[key]['bank_name'] = clean_bank_name(bank_value)
                    else:
                        candidates[key]['project_notes'].append(bank_value)

                if account_col and pd.notna(row[account_col]):
                    candidates[key]['account_number'] = clean_account(row[account_col])

                if position_col and pd.notna(row[position_col]):
                    candidates[key]['position'] = str(row[position_col]).strip()

                # Extract roster information from date columns
                for date_col_name in roster_date_cols:
                    if pd.notna(row[date_col_name]):
                        roster_val = str(row[date_col_name]).strip()
                        if roster_val and roster_val != full_name and not roster_val.replace('.', '').isdigit():
                            candidates[key]['roster_info'].append(f"{date_col_name}: {roster_val}")

            # Aggregate payment data (continuation rows)
            if current_candidate and current_candidate in candidates:
                if day_col and pd.notna(row[day_col]):
                    candidates[current_candidate]['days_worked'] += safe_float(row[day_col])

                if wage_col and pd.notna(row[wage_col]):
                    candidates[current_candidate]['total_wages'] += safe_float(row[wage_col])

                if ot_col and pd.notna(row[ot_col]):
                    candidates[current_candidate]['total_ot'] += safe_float(row[ot_col])

                if allowance_col and pd.notna(row[allowance_col]):
                    candidates[current_candidate]['total_allowance'] += safe_float(row[allowance_col])

                if claim_col and pd.notna(row[claim_col]):
                    candidates[current_candidate]['total_claim'] += safe_float(row[claim_col])

                if total_col and pd.notna(row[total_col]):
                    total_val = safe_float(row[total_col])
                    if total_val > candidates[current_candidate]['total_payment']:
                        candidates[current_candidate]['total_payment'] = total_val

                if date_col and pd.notna(row[date_col]):
                    date_str = str(row[date_col])
                    if date_str not in candidates[current_candidate]['work_dates']:
                        candidates[current_candidate]['work_dates'].append(date_str)

                # Collect notes from various columns
                for col in section_df.columns:
                    if col not in [name_col, ic_col, bank_col, account_col, position_col, day_col,
                                   date_col, wage_col, ot_col, allowance_col, claim_col, total_col] + roster_date_cols:
                        if pd.notna(row[col]):
                            val = str(row[col]).strip()
                            if val and len(val) < 100 and not val.replace('.', '').replace(',', '').isdigit():
                                # Check if it looks like a note
                                if any(char.isalpha() for char in val):
                                    candidates[current_candidate]['notes'].append(f"{col}: {val}")

        # Post-process: Calculate total payment if not set (fix for 0 payment issue)
        for key, cand in candidates.items():
            if cand['total_payment'] == 0:
                cand['total_payment'] = cand['total_wages'] + cand['total_ot'] + cand['total_allowance'] + cand['total_claim']

            # Deduplicate notes
            cand['notes'] = list(set(cand['notes']))
            cand['roster_info'] = list(set(cand['roster_info']))[:5]  # Limit to 5 roster entries

        return list(candidates.values())

    except Exception as e:
        print(f"    Error extracting section: {e}")
        import traceback
        traceback.print_exc()
        return []


def process_csv_file(csv_path):
    """Process a single CSV file and extract all candidate data with enhanced fields."""
    print(f"\nProcessing: {Path(csv_path).name}")

    filename = Path(csv_path).name
    project_name = extract_project_name(filename)

    try:
        # Read raw CSV
        raw_df = pd.read_csv(csv_path, encoding='utf-8', header=None)

        # Extract project metadata
        metadata = extract_project_metadata(csv_path, raw_df)
        print(f"  Metadata: {metadata['project_date_range'] or 'N/A'} | Payment: {metadata['payment_due_date'] or 'N/A'}")

        # Find header rows
        header_rows = find_header_rows(raw_df)

        if not header_rows:
            print(f"  ⚠️  No header rows found")
            return []

        print(f"  Found {len(header_rows)} section(s)")

        all_candidates = []

        # Process each section
        for section_idx, header_row_idx in enumerate(header_rows):
            next_header_idx = header_rows[section_idx + 1] if section_idx + 1 < len(header_rows) else len(raw_df)
            section_candidates = extract_section_data(csv_path, header_row_idx, next_header_idx, project_name, metadata)
            all_candidates.extend(section_candidates)

        print(f"  ✓ Extracted {len(all_candidates)} candidate record(s)")
        return all_candidates

    except Exception as e:
        print(f"  ✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return []


def main():
    """Main function to create enhanced master Excel file."""
    print("=" * 100)
    print("CREATING ENHANCED MASTER EXCEL FILE V2")
    print("=" * 100)

    # Find all CSV files
    csv_pattern = "excel_imports/**/*.csv"
    csv_files = sorted(glob.glob(csv_pattern, recursive=True))

    if not csv_files:
        print("\nNo CSV files found in excel_imports folder.")
        return

    print(f"\nFound {len(csv_files)} CSV file(s) to process")

    all_data = []

    # Process each CSV file
    for csv_file in csv_files:
        candidates = process_csv_file(csv_file)
        all_data.extend(candidates)

    print(f"\n{'=' * 100}")
    print(f"Total candidate records extracted: {len(all_data)}")

    # Convert to DataFrame
    df = pd.DataFrame(all_data)

    # Format list columns
    df['work_dates'] = df['work_dates'].apply(lambda x: ', '.join(x) if x else '')
    df['notes'] = df['notes'].apply(lambda x: '; '.join(x) if x else '')
    df['project_notes'] = df['project_notes'].apply(lambda x: '; '.join(x) if x else '')
    df['roster_info'] = df['roster_info'].apply(lambda x: '; '.join(x) if x else '')

    # Reorder columns
    column_order = [
        'project_name',
        'full_name',
        'alternate_name',
        'ic_number',
        'bank_name',
        'account_number',
        'account_holder_name',
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

    # Sort by project, then name
    df = df.sort_values(['project_name', 'full_name'])

    # Save to Excel with multiple sheets
    output_file = 'master_candidate_data_v2.xlsx'
    print(f"\nSaving to: {output_file}")

    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        # Sheet 1: All Candidates
        df.to_excel(writer, sheet_name='All Candidates', index=False)

        # Sheet 2: Summary by Project
        summary = df.groupby('project_name').agg({
            'full_name': 'count',
            'total_payment': 'sum',
            'days_worked': 'sum',
            'payment_due_date': 'first',
            'project_date_range': 'first'
        }).rename(columns={
            'full_name': 'Total Candidates',
            'total_payment': 'Total Payment (RM)',
            'days_worked': 'Total Days',
            'payment_due_date': 'Payment Due',
            'project_date_range': 'Project Dates'
        })
        summary.to_excel(writer, sheet_name='Project Summary')

        # Sheet 3: Candidates with Issues
        issues = df[
            df['bank_name'].isna() |
            df['account_number'].isna() |
            (df['total_payment'] == 0)
        ].copy()
        issues.to_excel(writer, sheet_name='Data Issues', index=False)

        # Auto-adjust column widths for main sheet
        worksheet = writer.sheets['All Candidates']
        for idx, col in enumerate(df.columns):
            max_length = min(
                max(df[col].astype(str).apply(len).max(), len(col)) + 2,
                50
            )
            col_letter = chr(65 + idx) if idx < 26 else chr(65 + idx // 26 - 1) + chr(65 + idx % 26)
            worksheet.column_dimensions[col_letter].width = max_length

    print(f"\n{'=' * 100}")
    print("ENHANCED MASTER EXCEL FILE CREATED!")
    print(f"{'=' * 100}")
    print(f"\nFile: {output_file}")
    print(f"Total records: {len(df)}")
    print(f"Unique candidates (by IC): {df['ic_number'].nunique()}")
    print(f"Projects covered: {df['project_name'].nunique()}")
    print(f"\nData Quality:")
    print(f"  - Records with bank details: {df['bank_name'].notna().sum()} ({df['bank_name'].notna().sum()/len(df)*100:.1f}%)")
    print(f"  - Records with account numbers: {df['account_number'].notna().sum()} ({df['account_number'].notna().sum()/len(df)*100:.1f}%)")
    print(f"  - Records with position: {df['position'].notna().sum()} ({df['position'].notna().sum()/len(df)*100:.1f}%)")
    print(f"  - Records with payment dates: {df['payment_due_date'].notna().sum()} ({df['payment_due_date'].notna().sum()/len(df)*100:.1f}%)")
    print(f"  - Records with 0 payment (FIXED): {(df['total_payment'] == 0).sum()}")
    print(f"\nFinancial Summary:")
    print(f"  - Total payment amount: RM {df['total_payment'].sum():,.2f}")
    print(f"  - Average per candidate: RM {df['total_payment'].mean():.2f}")
    print(f"  - Total days worked: {df['days_worked'].sum():.0f}")
    print()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
    except Exception as e:
        print(f"\nFatal error: {e}")
        import traceback
        traceback.print_exc()
