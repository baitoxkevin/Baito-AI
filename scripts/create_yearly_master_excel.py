#!/usr/bin/env python3
"""
Create Comprehensive Yearly Master Excel File
Processes all months (Jan-Sep 2025) and creates one master file with analytics.
"""

import os
import glob
import re
from pathlib import Path
from datetime import datetime
import pandas as pd
import numpy as np
from collections import defaultdict

# Import functions from the v2 script
import sys
sys.path.insert(0, os.path.dirname(__file__))

# Reuse functions from create_master_excel_v2.py
from create_master_excel_v2 import (
    clean_ic_number, clean_name, extract_alternate_name,
    clean_bank_name, clean_account, safe_float,
    extract_project_name, extract_project_metadata,
    find_header_rows, extract_date_columns, extract_section_data
)


def extract_month_from_path(csv_path):
    """Extract month name from file path."""
    path_str = str(csv_path).lower()
    months = ['jan', 'feb', 'march', 'april', 'may', 'june', 'july', 'aug', 'sep']
    for month in months:
        if f'/{month}/' in path_str or f'{month}_' in path_str:
            return month.capitalize()
    return 'Unknown'


def process_csv_file_with_month(csv_path):
    """Process a single CSV file and extract all candidate data with month info."""
    filename = Path(csv_path).name
    project_name = extract_project_name(filename)
    month = extract_month_from_path(csv_path)

    try:
        # Read raw CSV
        raw_df = pd.read_csv(csv_path, encoding='utf-8', header=None)

        # Extract project metadata
        metadata = extract_project_metadata(csv_path, raw_df)

        # Find header rows
        header_rows = find_header_rows(raw_df)

        if not header_rows:
            return []

        all_candidates = []

        # Process each section
        for section_idx, header_row_idx in enumerate(header_rows):
            next_header_idx = header_rows[section_idx + 1] if section_idx + 1 < len(header_rows) else len(raw_df)
            section_candidates = extract_section_data(csv_path, header_row_idx, next_header_idx, project_name, metadata)

            # Add month to each candidate
            for cand in section_candidates:
                cand['month'] = month

            all_candidates.extend(section_candidates)

        return all_candidates

    except Exception as e:
        print(f"  ✗ Error processing {filename}: {e}")
        return []


def main():
    """Main function to create comprehensive yearly master Excel file."""
    print("=" * 120)
    print("CREATING COMPREHENSIVE YEARLY MASTER EXCEL FILE (JAN - SEP 2025)")
    print("=" * 120)

    # Find all CSV files from all months
    base_path = "excel_imports/full_year_2025/"
    months = ['jan', 'feb', 'march', 'april', 'may', 'june', 'july', 'aug', 'sep']

    # Also check the payment_details_2025 folder for April
    csv_patterns = [
        f"{base_path}*/*.csv",
        "excel_imports/payment_details_2025/*.csv"
    ]

    all_csv_files = []
    for pattern in csv_patterns:
        all_csv_files.extend(glob.glob(pattern, recursive=True))

    all_csv_files = sorted(set(all_csv_files))  # Remove duplicates

    if not all_csv_files:
        print("\n❌ No CSV files found!")
        print(f"   Searched in: {csv_patterns}")
        print("\n💡 Tip: Run 'python3 scripts/process_full_year_2025.py' first to convert Excel files.")
        return

    # Group by month
    files_by_month = defaultdict(list)
    for csv_file in all_csv_files:
        month = extract_month_from_path(csv_file)
        files_by_month[month].append(csv_file)

    print(f"\n📊 Found {len(all_csv_files)} CSV file(s) across {len(files_by_month)} month(s):")
    for month in months:
        month_cap = month.capitalize()
        if month_cap in files_by_month:
            count = len(files_by_month[month_cap])
            print(f"   ✓ {month_cap:10} - {count:3} file(s)")

    print("\n" + "="*120)
    print("PROCESSING ALL FILES")
    print("="*120)

    all_data = []
    month_summary = {}

    # Process each month
    for month in months:
        month_cap = month.capitalize()
        if month_cap not in files_by_month:
            continue

        print(f"\n📅 Processing {month_cap} 2025...")
        month_files = files_by_month[month_cap]
        month_data = []

        for csv_file in month_files:
            filename = Path(csv_file).name
            print(f"   - {filename[:60]}...")
            candidates = process_csv_file_with_month(csv_file)
            month_data.extend(candidates)

        print(f"   ✓ Extracted {len(month_data)} candidate record(s) from {month_cap}")
        all_data.extend(month_data)
        month_summary[month_cap] = {
            'files': len(month_files),
            'records': len(month_data),
            'payment': sum(c['total_payment'] for c in month_data)
        }

    print(f"\n{'='*120}")
    print(f"Total candidate records extracted: {len(all_data)}")
    print(f"{'='*120}")

    # Convert to DataFrame
    df = pd.DataFrame(all_data)

    # Format list columns
    df['work_dates'] = df['work_dates'].apply(lambda x: ', '.join(x) if x else '')
    df['notes'] = df['notes'].apply(lambda x: '; '.join(x) if x else '')
    df['project_notes'] = df['project_notes'].apply(lambda x: '; '.join(x) if x else '')
    df['roster_info'] = df['roster_info'].apply(lambda x: '; '.join(x) if x else '')

    # Reorder columns (add month)
    column_order = [
        'month',
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

    # Sort by month, then project
    month_order = {m.capitalize(): i for i, m in enumerate(months)}
    df['month_order'] = df['month'].map(month_order)
    df = df.sort_values(['month_order', 'project_name', 'full_name']).drop('month_order', axis=1)

    # Save to Excel with multiple sheets
    output_file = 'baito_2025_full_year_master.xlsx'
    print(f"\n💾 Saving to: {output_file}")

    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        # Sheet 1: All Candidates
        df.to_excel(writer, sheet_name='All Candidates', index=False)

        # Sheet 2: Monthly Summary
        monthly_summary_df = pd.DataFrame([
            {
                'Month': month,
                'Projects': month_summary[month]['files'] if month in month_summary else 0,
                'Candidates': month_summary[month]['records'] if month in month_summary else 0,
                'Total Payment (RM)': month_summary[month]['payment'] if month in month_summary else 0
            }
            for month in [m.capitalize() for m in months] if month in month_summary
        ])
        monthly_summary_df.to_excel(writer, sheet_name='Monthly Summary', index=False)

        # Sheet 3: Candidate Summary (unique candidates with total earnings)
        candidate_summary = df.groupby(['ic_number', 'full_name']).agg({
            'month': lambda x: ', '.join(sorted(set(x))),
            'project_name': 'count',
            'days_worked': 'sum',
            'total_payment': 'sum',
            'bank_name': 'first',
            'account_number': 'first'
        }).rename(columns={
            'month': 'Months Active',
            'project_name': 'Total Projects',
            'days_worked': 'Total Days',
            'total_payment': 'Total Earnings (RM)',
            'bank_name': 'Bank',
            'account_number': 'Account'
        }).reset_index()
        candidate_summary = candidate_summary.sort_values('Total Earnings (RM)', ascending=False)
        candidate_summary.to_excel(writer, sheet_name='Candidate Summary', index=False)

        # Sheet 4: Project Summary
        project_summary = df.groupby(['month', 'project_name']).agg({
            'full_name': 'count',
            'total_payment': 'sum',
            'days_worked': 'sum',
            'payment_due_date': 'first',
            'location': 'first'
        }).rename(columns={
            'full_name': 'Candidates',
            'total_payment': 'Total Payment (RM)',
            'days_worked': 'Total Days',
            'payment_due_date': 'Payment Due',
            'location': 'Location'
        }).reset_index()
        project_summary.to_excel(writer, sheet_name='Project Summary', index=False)

        # Sheet 5: Data Issues
        issues = df[
            df['bank_name'].isna() |
            df['account_number'].isna() |
            (df['total_payment'] == 0)
        ].copy()
        issues.to_excel(writer, sheet_name='Data Issues', index=False)

        # Sheet 6: Top Earners
        top_earners = candidate_summary.head(50)
        top_earners.to_excel(writer, sheet_name='Top 50 Earners', index=False)

    # Print statistics
    print(f"\n{'='*120}")
    print("COMPREHENSIVE YEARLY MASTER FILE CREATED!")
    print(f"{'='*120}")
    print(f"\n📂 File: {output_file}")
    print(f"📊 Total Records: {len(df):,}")
    print(f"👥 Unique Candidates: {df['ic_number'].nunique():,}")
    print(f"📅 Months Covered: {len(month_summary)}")
    print(f"🎯 Total Projects: {df['project_name'].nunique():,}")

    print(f"\n💰 Financial Summary:")
    print(f"   Total Payments: RM {df['total_payment'].sum():,.2f}")
    print(f"   Average per Record: RM {df['total_payment'].mean():.2f}")
    print(f"   Average per Candidate: RM {df.groupby('ic_number')['total_payment'].sum().mean():.2f}")

    print(f"\n📈 Monthly Breakdown:")
    for month in [m.capitalize() for m in months]:
        if month in month_summary:
            info = month_summary[month]
            print(f"   {month:10} - {info['records']:4} records, RM {info['payment']:>12,.2f}")

    print(f"\n✅ Data Quality:")
    print(f"   With Bank Details: {df['bank_name'].notna().sum():,} ({df['bank_name'].notna().sum()/len(df)*100:.1f}%)")
    print(f"   With Account Numbers: {df['account_number'].notna().sum():,} ({df['account_number'].notna().sum()/len(df)*100:.1f}%)")
    print(f"   Data Issues: {len(issues):,} ({len(issues)/len(df)*100:.1f}%)")

    print(f"\n🏆 Top 5 Earners (Full Year):")
    for idx, row in top_earners.head(5).iterrows():
        print(f"   {idx+1}. {row['full_name']:30} - RM {row['Total Earnings (RM)']:>10,.2f} ({row['Total Projects']:2} projects)")

    print(f"\n{'='*120}")
    print("📋 File contains 6 sheets:")
    print("   1. All Candidates - Complete data (all records)")
    print("   2. Monthly Summary - Payment breakdown by month")
    print("   3. Candidate Summary - Unique candidates with total earnings")
    print("   4. Project Summary - All projects by month")
    print("   5. Data Issues - Records needing attention")
    print("   6. Top 50 Earners - Highest earning candidates")
    print()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Processing cancelled by user.")
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
