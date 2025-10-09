#!/usr/bin/env python3
"""
Create a master Excel file from all payment detail CSV files.
Analyzes different formats and consolidates into standardized columns.
"""

import os
import glob
import re
from pathlib import Path
from datetime import datetime
import pandas as pd
import numpy as np


def clean_ic_number(ic):
    """Clean and normalize IC number."""
    if pd.isna(ic):
        return None
    ic_str = str(ic).strip()
    # Remove spaces and hyphens for comparison
    ic_clean = ic_str.replace(' ', '').replace('-', '')
    return ic_clean if ic_clean else None


def clean_name(name):
    """Clean and normalize name."""
    if pd.isna(name):
        return None
    name_str = str(name).strip()
    # Remove extra whitespace and newlines
    name_str = ' '.join(name_str.split())
    # Capitalize properly
    name_str = ' '.join(word.capitalize() for word in name_str.split())
    return name_str if name_str else None


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
    # Remove "Baito April Payment Details 2025_" prefix
    match = re.search(r'2025_(.+)\.csv$', filename)
    if match:
        return match.group(1).strip()
    return filename.replace('.csv', '')


def find_header_rows(df_raw):
    """Find all rows that contain 'Name' and 'IC' (headers)."""
    header_rows = []
    for idx, row in df_raw.iterrows():
        row_str = ' '.join([str(val) for val in row if pd.notna(val)]).lower()
        if 'name' in row_str and 'ic' in row_str:
            header_rows.append(idx)
    return header_rows


def extract_section_data(csv_path, header_row_idx, next_header_idx, project_name):
    """Extract data from a section of the CSV."""
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
        ic_cols = [col for col in section_df.columns if 'ic' in col.lower() and 'number' in col.lower()]
        if not ic_cols:
            ic_cols = [col for col in section_df.columns if col.lower() == 'ic']
        bank_cols = [col for col in section_df.columns if 'bank name' in col.lower() or col.lower() == 'bank']
        account_cols = [col for col in section_df.columns if 'account' in col.lower()]
        position_cols = [col for col in section_df.columns if 'position' in col.lower() or 'role' in col.lower()]

        # Payment columns
        day_cols = [col for col in section_df.columns if col.lower() in ['day', 'days']]
        date_cols = [col for col in section_df.columns if 'date' in col.lower() and 'w.' not in col.lower()]
        wage_cols = [col for col in section_df.columns if col.lower() in ['wages', 'wage']]
        ot_cols = [col for col in section_df.columns if col.lower() in ['ot', 'overtime']]
        allowance_cols = [col for col in section_df.columns if 'allowance' in col.lower()]
        claim_cols = [col for col in section_df.columns if col.lower() in ['claim', 'claims']]
        total_cols = [col for col in section_df.columns if col.lower() in ['total', 'payment', 'total wages']]

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
        candidates = {}  # Use dict to aggregate multiple rows per candidate

        current_candidate = None
        for idx, row in section_df.iterrows():
            # Check if this row has candidate info
            if pd.notna(row[name_col]) and pd.notna(row[ic_col]):
                # New candidate or skip if it's a header remnant
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
                        'ic_number': ic_number,
                        'bank_name': None,
                        'account_number': None,
                        'position': None,
                        'days_worked': 0,
                        'total_wages': 0.0,
                        'total_ot': 0.0,
                        'total_allowance': 0.0,
                        'total_claim': 0.0,
                        'total_payment': 0.0,
                        'work_dates': [],
                        'notes': []
                    }

                current_candidate = key

                # Update bank details
                if bank_col and pd.notna(row[bank_col]):
                    bank_value = str(row[bank_col]).strip()
                    if bank_value.lower() not in ['sammy claim', 'claim']:
                        candidates[key]['bank_name'] = clean_bank_name(bank_value)
                    else:
                        candidates[key]['notes'].append(bank_value)

                if account_col and pd.notna(row[account_col]):
                    candidates[key]['account_number'] = clean_account(row[account_col])

                if position_col and pd.notna(row[position_col]):
                    candidates[key]['position'] = str(row[position_col]).strip()

            # Aggregate payment data (even if name is missing - continuation row)
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

        return list(candidates.values())

    except Exception as e:
        print(f"    Error extracting section: {e}")
        return []


def process_csv_file(csv_path):
    """Process a single CSV file and extract all candidate data."""
    print(f"\nProcessing: {Path(csv_path).name}")

    filename = Path(csv_path).name
    project_name = extract_project_name(filename)

    try:
        # Read raw CSV to find headers
        raw_df = pd.read_csv(csv_path, encoding='utf-8', header=None)

        # Find all header rows
        header_rows = find_header_rows(raw_df)

        if not header_rows:
            print(f"  ⚠️  No header rows found")
            return []

        print(f"  Found {len(header_rows)} section(s)")

        all_candidates = []

        # Process each section
        for section_idx, header_row_idx in enumerate(header_rows):
            next_header_idx = header_rows[section_idx + 1] if section_idx + 1 < len(header_rows) else len(raw_df)
            section_candidates = extract_section_data(csv_path, header_row_idx, next_header_idx, project_name)
            all_candidates.extend(section_candidates)

        print(f"  ✓ Extracted {len(all_candidates)} candidate record(s)")
        return all_candidates

    except Exception as e:
        print(f"  ✗ Error: {e}")
        return []


def main():
    """Main function to create master Excel file."""
    print("=" * 80)
    print("CREATING MASTER EXCEL FILE FROM PAYMENT DETAILS")
    print("=" * 80)

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

    print(f"\n{'=' * 80}")
    print(f"Total candidate records extracted: {len(all_data)}")

    # Convert to DataFrame
    df = pd.DataFrame(all_data)

    # Format columns
    df['work_dates'] = df['work_dates'].apply(lambda x: ', '.join(x) if x else '')
    df['notes'] = df['notes'].apply(lambda x: '; '.join(x) if x else '')

    # Reorder columns
    column_order = [
        'project_name',
        'full_name',
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
        'notes'
    ]

    df = df[column_order]

    # Sort by project, then name
    df = df.sort_values(['project_name', 'full_name'])

    # Save to Excel
    output_file = 'master_candidate_data.xlsx'
    print(f"\nSaving to: {output_file}")

    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='All Candidates', index=False)

        # Auto-adjust column widths
        worksheet = writer.sheets['All Candidates']
        for idx, col in enumerate(df.columns):
            max_length = max(
                df[col].astype(str).apply(len).max(),
                len(col)
            )
            worksheet.column_dimensions[chr(65 + idx)].width = min(max_length + 2, 50)

    print(f"\n{'=' * 80}")
    print("MASTER EXCEL FILE CREATED SUCCESSFULLY!")
    print(f"{'=' * 80}")
    print(f"\nFile: {output_file}")
    print(f"Total records: {len(df)}")
    print(f"Unique candidates (by IC): {df['ic_number'].nunique()}")
    print(f"Projects covered: {df['project_name'].nunique()}")
    print("\nColumn Summary:")
    print(f"  - Records with bank details: {df['bank_name'].notna().sum()}")
    print(f"  - Records with account numbers: {df['account_number'].notna().sum()}")
    print(f"  - Records with position: {df['position'].notna().sum()}")
    print(f"  - Total payment amount: RM {df['total_payment'].sum():,.2f}")
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
