#!/usr/bin/env python3
"""
Comprehensive Masterlist Validator
Re-evaluates every extracted record by going back to original Excel and reasoning through values.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import re
from datetime import datetime


class RecordValidator:
    """Validates a single record by reasoning through original Excel data."""

    def __init__(self, source_dir):
        self.source_dir = Path(source_dir)
        self.validation_log = []

    def clean_ic(self, ic):
        """Clean IC number for comparison."""
        if pd.isna(ic):
            return None
        return str(ic).replace('-', '').replace(' ', '').strip()

    def find_in_excel(self, record):
        """
        Find the candidate in the original Excel sheet.
        Returns: (found, raw_rows, reasoning)
        """
        excel_file = self.source_dir / record['source_file']
        if not excel_file.exists():
            return False, [], f"Excel file not found: {excel_file}"

        try:
            # Read the specific sheet
            df = pd.read_excel(excel_file, sheet_name=record['source_sheet'], header=None)

            # Search for IC number
            target_ic = self.clean_ic(record['ic_number'])

            candidate_rows = []
            for idx, row in df.iterrows():
                row_str = ' '.join([str(val) for val in row if pd.notna(val)])
                row_str_clean = row_str.replace('-', '').replace(' ', '')

                if target_ic and target_ic in row_str_clean:
                    candidate_rows.append(idx)

            if not candidate_rows:
                return False, [], f"IC {target_ic} not found in sheet"

            # Get the data rows
            raw_rows = []
            for row_idx in candidate_rows:
                raw_rows.append({
                    'row_number': row_idx,
                    'data': df.iloc[row_idx].to_list()
                })

            return True, raw_rows, "Found in Excel"

        except Exception as e:
            return False, [], f"Error reading Excel: {str(e)}"

    def reason_values(self, record, raw_rows):
        """
        Reason through what the values SHOULD be based on raw Excel data.
        Returns: (expected_values, reasoning_steps)
        """
        reasoning = []
        expected = {
            'days_worked': 0,
            'total_wages': 0,
            'total_ot': 0,
            'total_allowance': 0,
            'total_claim': 0,
            'total_payment': 0
        }

        # Try to identify columns by pattern
        # This is a simplified heuristic - looks for numeric values
        for row_info in raw_rows:
            row_data = row_info['data']
            row_num = row_info['row_number']

            reasoning.append(f"Row {row_num}: {[v for v in row_data[:15] if pd.notna(v)]}")

            # Look for numeric values that could be days/payment
            numeric_values = []
            for i, val in enumerate(row_data):
                if pd.notna(val) and isinstance(val, (int, float)):
                    if 0 < val < 10000:  # Reasonable range
                        numeric_values.append((i, val))

            # Simple heuristic: small numbers = days, larger = payment
            for col_idx, val in numeric_values:
                if val <= 50:  # Likely days
                    expected['days_worked'] += val
                    reasoning.append(f"  Col {col_idx}: {val} (likely days)")
                elif 50 < val < 500:  # Likely wages/payment per row
                    expected['total_wages'] += val
                    reasoning.append(f"  Col {col_idx}: {val} (likely wages)")
                elif val >= 500:  # Likely total or large payment
                    if val > expected['total_payment']:
                        expected['total_payment'] = val
                        reasoning.append(f"  Col {col_idx}: {val} (likely total payment)")

        # If no total payment found, calculate from wages
        if expected['total_payment'] == 0 and expected['total_wages'] > 0:
            expected['total_payment'] = expected['total_wages']
            reasoning.append(f"Total payment = wages ({expected['total_wages']})")

        return expected, reasoning

    def validate_record(self, record):
        """
        Validate a single record.
        Returns: validation result dict
        """
        result = {
            'full_name': record['full_name'],
            'ic_number': record['ic_number'],
            'source_sheet': record['source_sheet'],
            'month': record['month'],
            'status': 'UNKNOWN',
            'issues': [],
            'reasoning': []
        }

        # Step 1: Find in Excel
        found, raw_rows, message = self.find_in_excel(record)
        result['reasoning'].append(f"Search: {message}")

        if not found:
            result['status'] = 'NOT_FOUND'
            result['issues'].append(message)
            return result

        # Step 2: Reason through expected values
        expected, reasoning_steps = self.reason_values(record, raw_rows)
        result['reasoning'].extend(reasoning_steps)

        # Step 3: Compare extracted vs expected
        extracted = {
            'days_worked': record['days_worked'],
            'total_wages': record['total_wages'],
            'total_payment': record['total_payment']
        }

        result['extracted'] = extracted
        result['expected'] = expected

        # Check for discrepancies
        discrepancies = []

        # Days check
        if abs(extracted['days_worked'] - expected['days_worked']) > 0.1:
            discrepancies.append(
                f"Days: extracted={extracted['days_worked']}, expected={expected['days_worked']}"
            )

        # Payment check (allow 5% tolerance for rounding)
        if expected['total_payment'] > 0:
            diff_pct = abs(extracted['total_payment'] - expected['total_payment']) / expected['total_payment']
            if diff_pct > 0.05:  # More than 5% difference
                discrepancies.append(
                    f"Payment: extracted={extracted['total_payment']}, expected={expected['total_payment']} (diff: {diff_pct*100:.1f}%)"
                )

        if discrepancies:
            result['status'] = 'MISMATCH'
            result['issues'] = discrepancies
        else:
            result['status'] = 'VALID'

        return result


def validate_masterlist(masterlist_path, source_dir, sample_size=None):
    """
    Validate the entire masterlist.

    Args:
        masterlist_path: Path to baito_2025_COMPLETE_v3.xlsx
        source_dir: Directory containing original Excel files
        sample_size: If set, only validate this many records (for testing)
    """
    print("="*120)
    print(" "*40 + "COMPREHENSIVE MASTERLIST VALIDATION")
    print("="*120)

    # Read masterlist
    print(f"\n📂 Loading masterlist: {masterlist_path}")
    df = pd.read_excel(masterlist_path, sheet_name='All Candidates', dtype={'account_number': str})

    total_records = len(df)
    if sample_size:
        df = df.head(sample_size)
        print(f"   Validating SAMPLE of {len(df)} records (out of {total_records})")
    else:
        print(f"   Validating ALL {total_records:,} records")

    # Initialize validator
    validator = RecordValidator(source_dir)

    # Validate each record
    results = []
    status_counts = {'VALID': 0, 'MISMATCH': 0, 'NOT_FOUND': 0, 'ERROR': 0}

    print(f"\n{'─'*120}")
    print("VALIDATION IN PROGRESS...")
    print(f"{'─'*120}\n")

    for idx, record in df.iterrows():
        if idx > 0 and idx % 100 == 0:
            print(f"  Progress: {idx}/{len(df)} records validated...")

        try:
            result = validator.validate_record(record)
            results.append(result)
            status_counts[result['status']] += 1
        except Exception as e:
            results.append({
                'full_name': record['full_name'],
                'status': 'ERROR',
                'issues': [str(e)]
            })
            status_counts['ERROR'] += 1

    # Summary
    print(f"\n{'='*120}")
    print("VALIDATION SUMMARY")
    print(f"{'='*120}")
    print(f"\n  Total Records Validated: {len(df):,}")
    print(f"\n  Results:")
    print(f"    ✓ VALID:      {status_counts['VALID']:4} ({status_counts['VALID']/len(df)*100:.1f}%)")
    print(f"    ✗ MISMATCH:   {status_counts['MISMATCH']:4} ({status_counts['MISMATCH']/len(df)*100:.1f}%)")
    print(f"    ? NOT_FOUND:  {status_counts['NOT_FOUND']:4} ({status_counts['NOT_FOUND']/len(df)*100:.1f}%)")
    print(f"    ! ERROR:      {status_counts['ERROR']:4} ({status_counts['ERROR']/len(df)*100:.1f}%)")

    # Show sample mismatches
    mismatches = [r for r in results if r['status'] == 'MISMATCH']
    if mismatches:
        print(f"\n{'─'*120}")
        print(f"SAMPLE MISMATCHES (showing first 10):")
        print(f"{'─'*120}")

        for r in mismatches[:10]:
            print(f"\n  {r['full_name']} ({r['source_sheet']} - {r['month']})")
            print(f"    Issues: {r['issues']}")
            if 'extracted' in r and 'expected' in r:
                print(f"    Extracted: Days={r['extracted']['days_worked']}, Payment={r['extracted']['total_payment']}")
                print(f"    Expected:  Days={r['expected']['days_worked']}, Payment={r['expected']['total_payment']}")

    # Save detailed report
    report_file = 'validation_report_detailed.xlsx'
    print(f"\n{'─'*120}")
    print(f"💾 Saving detailed report: {report_file}")

    # Create report DataFrame
    report_data = []
    for r in results:
        report_data.append({
            'Name': r['full_name'],
            'IC': r.get('ic_number', ''),
            'Sheet': r.get('source_sheet', ''),
            'Month': r.get('month', ''),
            'Status': r['status'],
            'Issues': '; '.join(r.get('issues', [])),
            'Extracted_Days': r.get('extracted', {}).get('days_worked', ''),
            'Expected_Days': r.get('expected', {}).get('days_worked', ''),
            'Extracted_Payment': r.get('extracted', {}).get('total_payment', ''),
            'Expected_Payment': r.get('expected', {}).get('total_payment', ''),
            'Reasoning': ' | '.join(r.get('reasoning', []))
        })

    report_df = pd.DataFrame(report_data)

    with pd.ExcelWriter(report_file, engine='openpyxl') as writer:
        # All results
        report_df.to_excel(writer, sheet_name='All Validations', index=False)

        # Mismatches only
        if mismatches:
            mismatch_df = report_df[report_df['Status'] == 'MISMATCH']
            mismatch_df.to_excel(writer, sheet_name='Mismatches', index=False)

        # Summary
        summary_df = pd.DataFrame([
            {'Metric': 'Total Records', 'Value': len(df)},
            {'Metric': 'Valid', 'Value': status_counts['VALID']},
            {'Metric': 'Mismatch', 'Value': status_counts['MISMATCH']},
            {'Metric': 'Not Found', 'Value': status_counts['NOT_FOUND']},
            {'Metric': 'Error', 'Value': status_counts['ERROR']},
            {'Metric': 'Accuracy %', 'Value': f"{status_counts['VALID']/len(df)*100:.2f}%"}
        ])
        summary_df.to_excel(writer, sheet_name='Summary', index=False)

    print(f"   ✓ Detailed validation report saved!")
    print(f"{'='*120}\n")

    return results, status_counts


if __name__ == '__main__':
    masterlist_path = 'baito_2025_COMPLETE_v3.xlsx'
    source_dir = '/Users/baito.kevin/Downloads/PROMOTER PAYMENT & CLAIMS 2025/Baito Promoter 2025/'

    # For testing, validate a sample first
    print("Starting validation with SAMPLE (100 records)...\n")
    results, stats = validate_masterlist(masterlist_path, source_dir, sample_size=100)

    # If sample looks good, offer to validate all
    if stats['VALID'] / 100 > 0.8:  # If >80% valid
        print("\n" + "="*120)
        print("Sample validation shows good results!")
        print("To validate ALL 1,428 records, run:")
        print("  python3 scripts/comprehensive_validator.py --full")
        print("="*120)
