#!/usr/bin/env python3
"""
Visual Validation Report
Shows extracted data alongside RAW Excel data for human verification.
"""

import pandas as pd
import numpy as np
from pathlib import Path


def create_visual_validation_report(masterlist_path, source_dir, sample_size=None):
    """
    Create a visual validation report showing extracted vs raw Excel data.
    """
    print("="*120)
    print(" "*35 + "VISUAL VALIDATION REPORT GENERATOR")
    print("="*120)

    # Read masterlist
    print(f"\n📂 Loading masterlist: {masterlist_path}")
    df = pd.read_excel(masterlist_path, sheet_name='All Candidates', dtype={'account_number': str})

    if sample_size:
        df = df.head(sample_size)
        print(f"   Processing SAMPLE: {len(df)} records")
    else:
        print(f"   Processing ALL: {len(df):,} records")

    source_path = Path(source_dir)
    report_data = []

    print(f"\n{'─'*120}")
    print("EXTRACTING RAW EXCEL DATA...")
    print(f"{'─'*120}\n")

    for idx, record in df.iterrows():
        if idx > 0 and idx % 100 == 0:
            print(f"  Progress: {idx}/{len(df)}...")

        excel_file = source_path / record['source_file']

        if not excel_file.exists():
            report_data.append({
                'Row': idx + 1,
                'Name': record['full_name'],
                'IC': record['ic_number'],
                'Sheet': record['source_sheet'],
                'Month': record['month'],
                'Status': 'FILE_NOT_FOUND',
                'Extracted_Days': record['days_worked'],
                'Extracted_Wages': record['total_wages'],
                'Extracted_Payment': record['total_payment'],
                'Raw_Excel_Data': f"File not found: {excel_file.name}"
            })
            continue

        try:
            # Read sheet
            sheet_df = pd.read_excel(excel_file, sheet_name=record['source_sheet'], header=None)

            # Search for IC
            target_ic = str(record['ic_number']).replace('-', '').replace(' ', '')

            found_rows = []
            for row_idx, row in sheet_df.iterrows():
                row_str = ' '.join([str(val) for val in row if pd.notna(val)])
                row_str_clean = row_str.replace('-', '').replace(' ', '')

                if target_ic in row_str_clean:
                    # Get this row and next 2 rows (for continuation)
                    rows_context = []
                    for i in range(row_idx, min(row_idx + 3, len(sheet_df))):
                        row_data = sheet_df.iloc[i, :12].to_list()  # First 12 columns
                        # Clean up the data for display
                        row_clean = [str(v) if pd.notna(v) else '' for v in row_data]
                        rows_context.append(f"R{i}: {row_clean}")

                    found_rows = rows_context
                    break

            if found_rows:
                status = 'FOUND'
                raw_data = ' || '.join(found_rows)
            else:
                status = 'NOT_FOUND_IN_SHEET'
                raw_data = f"IC {target_ic} not found in {record['source_sheet']}"

            report_data.append({
                'Row': idx + 1,
                'Name': record['full_name'],
                'IC': record['ic_number'],
                'Sheet': record['source_sheet'],
                'Month': record['month'],
                'Status': status,
                'Extracted_Days': record['days_worked'],
                'Extracted_Wages': record['total_wages'],
                'Extracted_OT': record['total_ot'],
                'Extracted_Allowance': record['total_allowance'],
                'Extracted_Claim': record['total_claim'],
                'Extracted_Payment': record['total_payment'],
                'Raw_Excel_Data': raw_data
            })

        except Exception as e:
            report_data.append({
                'Row': idx + 1,
                'Name': record['full_name'],
                'IC': record['ic_number'],
                'Sheet': record['source_sheet'],
                'Month': record['month'],
                'Status': 'ERROR',
                'Extracted_Days': record['days_worked'],
                'Extracted_Wages': record['total_wages'],
                'Extracted_Payment': record['total_payment'],
                'Raw_Excel_Data': f"Error: {str(e)}"
            })

    # Create report
    report_df = pd.DataFrame(report_data)

    # Statistics
    status_counts = report_df['Status'].value_counts()

    print(f"\n{'='*120}")
    print("REPORT SUMMARY")
    print(f"{'='*120}")
    print(f"\n  Total Records: {len(report_df)}")
    print(f"\n  Status Breakdown:")
    for status, count in status_counts.items():
        print(f"    {status}: {count} ({count/len(report_df)*100:.1f}%)")

    # Save report
    output_file = 'visual_validation_report.xlsx'
    print(f"\n{'─'*120}")
    print(f"💾 Saving visual validation report: {output_file}")

    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        # All records
        report_df.to_excel(writer, sheet_name='All Records', index=False)

        # Found records only (for review)
        found_df = report_df[report_df['Status'] == 'FOUND']
        found_df.to_excel(writer, sheet_name='For Review', index=False)

        # Issues only
        issues_df = report_df[report_df['Status'] != 'FOUND']
        if len(issues_df) > 0:
            issues_df.to_excel(writer, sheet_name='Issues', index=False)

        # Summary
        summary_df = pd.DataFrame([
            {'Metric': 'Total Records', 'Value': len(report_df)},
            {'Metric': 'Found in Excel', 'Value': len(found_df)},
            {'Metric': 'Not Found', 'Value': len(issues_df)},
            {'Metric': 'Success Rate', 'Value': f"{len(found_df)/len(report_df)*100:.1f}%"}
        ])
        summary_df.to_excel(writer, sheet_name='Summary', index=False)

    print(f"   ✓ Report saved!")
    print(f"\n{'='*120}")
    print("NEXT STEPS:")
    print("  1. Open: visual_validation_report.xlsx")
    print("  2. Go to 'For Review' sheet")
    print("  3. Compare 'Extracted' columns with 'Raw_Excel_Data'")
    print("  4. Visually verify each record")
    print(f"{'='*120}\n")

    return report_df


if __name__ == '__main__':
    masterlist_path = 'baito_2025_COMPLETE_v3.xlsx'
    source_dir = '/Users/baito.kevin/Downloads/PROMOTER PAYMENT & CLAIMS 2025/Baito Promoter 2025/'

    # Generate report for ALL records
    report = create_visual_validation_report(masterlist_path, source_dir)
