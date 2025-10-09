#!/usr/bin/env python3
"""
Data Validation and Correction System
Detects issues in extracted data and cross-references with original CSV files to fix them.
"""

import os
import sys
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import re

# Import extraction functions
from create_master_excel_v2 import (
    clean_ic_number, clean_name, clean_bank_name, clean_account,
    safe_float, find_header_rows
)


class DataValidator:
    """Validates and corrects extracted candidate data."""

    def __init__(self):
        self.issues_found = []
        self.corrections_made = []
        self.manual_review_needed = []

    def validate_record(self, record, record_idx):
        """
        Validate a single record and identify issues.

        Returns: List of issues found
        """
        issues = []

        # Rule 1: Zero payment with non-zero components
        if record['total_payment'] == 0:
            component_sum = (
                record['total_wages'] +
                record['total_ot'] +
                record['total_allowance'] +
                record['total_claim']
            )
            if component_sum > 0:
                issues.append({
                    'record_idx': record_idx,
                    'type': 'ZERO_PAYMENT_WITH_COMPONENTS',
                    'severity': 'HIGH',
                    'description': f"total_payment=0 but components sum to {component_sum}",
                    'record': record,
                    'suggested_fix': component_sum
                })

        # Rule 2: Payment without days worked
        if record['days_worked'] == 0 and record['total_payment'] > 0:
            issues.append({
                'record_idx': record_idx,
                'type': 'PAYMENT_WITHOUT_DAYS',
                'severity': 'MEDIUM',
                'description': f"days_worked=0 but payment={record['total_payment']}",
                'record': record,
                'suggested_fix': 'Check original CSV for days data'
            })

        # Rule 3: Missing bank account when bank exists
        if pd.notna(record['bank_name']) and pd.isna(record['account_number']):
            if str(record['bank_name']).lower() not in ['sammy claim', 'claim']:
                issues.append({
                    'record_idx': record_idx,
                    'type': 'MISSING_ACCOUNT',
                    'severity': 'HIGH',
                    'description': f"Has bank '{record['bank_name']}' but no account number",
                    'record': record,
                    'suggested_fix': 'Cross-reference with original CSV'
                })

        # Rule 4: Total payment less than component sum
        component_sum = (
            record['total_wages'] +
            record['total_ot'] +
            record['total_allowance'] +
            record['total_claim']
        )
        if record['total_payment'] > 0 and component_sum > record['total_payment']:
            issues.append({
                'record_idx': record_idx,
                'type': 'TOTAL_LESS_THAN_COMPONENTS',
                'severity': 'MEDIUM',
                'description': f"total_payment={record['total_payment']} < components={component_sum}",
                'record': record,
                'suggested_fix': component_sum
            })

        # Rule 5: Suspicious IC number
        if record['ic_number']:
            ic = str(record['ic_number'])
            if len(ic) < 6 or not any(char.isdigit() for char in ic):
                issues.append({
                    'record_idx': record_idx,
                    'type': 'INVALID_IC',
                    'severity': 'HIGH',
                    'description': f"IC number '{ic}' looks invalid",
                    'record': record,
                    'suggested_fix': 'Manual review required'
                })

        # Rule 6: All payment fields are zero
        if (record['total_payment'] == 0 and
            record['total_wages'] == 0 and
            record['total_ot'] == 0 and
            record['total_allowance'] == 0 and
            record['total_claim'] == 0):
            issues.append({
                'record_idx': record_idx,
                'type': 'ALL_PAYMENTS_ZERO',
                'severity': 'HIGH',
                'description': "All payment fields are 0",
                'record': record,
                'suggested_fix': 'Cross-reference with original CSV'
            })

        return issues

    def find_csv_source(self, record):
        """Find the original CSV file for a record."""
        # Extract month and project name
        month = record.get('month', 'april').lower()
        project_name = record.get('project_name', '')

        # Build possible CSV paths
        possible_paths = []

        # Check full year folders
        if month != 'april':
            csv_pattern = f"excel_imports/full_year_2025/{month}/*{project_name}*.csv"
        else:
            csv_pattern = f"excel_imports/payment_details_2025/*{project_name}*.csv"

        import glob
        matches = glob.glob(csv_pattern)

        if matches:
            return matches[0]

        # Fallback: search all CSV files
        all_csv = glob.glob("excel_imports/**/*.csv", recursive=True)
        for csv_file in all_csv:
            if project_name.lower() in Path(csv_file).name.lower():
                return csv_file

        return None

    def cross_reference_and_fix(self, issue):
        """
        Cross-reference with original CSV and attempt to fix the issue.
        """
        record = issue['record']
        csv_path = self.find_csv_source(record)

        if not csv_path:
            self.manual_review_needed.append({
                **issue,
                'reason': 'Could not find source CSV file'
            })
            return None

        try:
            # Read the original CSV
            raw_df = pd.read_csv(csv_path, encoding='utf-8', header=None)

            # Find the candidate's row by IC number
            ic_number = clean_ic_number(record['ic_number'])
            candidate_rows = []

            for idx, row in raw_df.iterrows():
                row_str = ' '.join([str(val) for val in row if pd.notna(val)])
                # Clean IC in row for comparison
                if ic_number in row_str.replace('-', '').replace(' ', ''):
                    candidate_rows.append(idx)

            if not candidate_rows:
                self.manual_review_needed.append({
                    **issue,
                    'reason': f'Could not find IC {ic_number} in source CSV'
                })
                return None

            # Read the section properly with headers
            header_rows = find_header_rows(raw_df)
            if not header_rows:
                return None

            # Find which section this candidate is in
            candidate_section_header = None
            for header_idx in header_rows:
                if any(row_idx > header_idx for row_idx in candidate_rows):
                    candidate_section_header = header_idx
                    break

            if candidate_section_header is None:
                return None

            # Read with proper headers
            section_df = pd.read_csv(
                csv_path,
                encoding='utf-8',
                skiprows=candidate_section_header,
                nrows=50  # Read enough rows
            )

            section_df.columns = [str(col).strip() for col in section_df.columns]

            # Find the candidate row(s) in this section
            ic_cols = [col for col in section_df.columns if 'ic' in col.lower()]
            if not ic_cols:
                return None

            ic_col = ic_cols[0]
            candidate_data = section_df[
                section_df[ic_col].apply(lambda x: ic_number in str(x).replace('-', '').replace(' ', '') if pd.notna(x) else False)
            ]

            if len(candidate_data) == 0:
                return None

            # Get all rows for this candidate (including continuation rows)
            candidate_main_idx = candidate_data.index[0]

            # Collect data from this row and continuation rows
            fixed_data = {}

            # Apply specific fixes based on issue type
            if issue['type'] == 'ZERO_PAYMENT_WITH_COMPONENTS':
                # Auto-fix: Use suggested component sum
                fixed_data['total_payment'] = issue['suggested_fix']
                self.corrections_made.append({
                    'record': record['full_name'],
                    'ic': record['ic_number'],
                    'project': record['project_name'],
                    'issue': issue['type'],
                    'old_value': record['total_payment'],
                    'new_value': issue['suggested_fix'],
                    'method': 'AUTO_CALCULATE'
                })

            elif issue['type'] == 'PAYMENT_WITHOUT_DAYS':
                # Look for "Day" or "Days" column in original
                day_cols = [col for col in section_df.columns if col.lower() in ['day', 'days']]
                if day_cols:
                    day_col = day_cols[0]
                    # Sum all day values for this candidate (including continuation rows)
                    days_sum = 0
                    for idx in range(candidate_main_idx, min(candidate_main_idx + 10, len(section_df))):
                        row = section_df.iloc[idx]
                        if pd.notna(row.get(day_col)):
                            days_sum += safe_float(row[day_col])
                        # Stop if we hit another candidate
                        if pd.notna(row.get(ic_col)) and idx != candidate_main_idx:
                            break

                    if days_sum > 0:
                        fixed_data['days_worked'] = days_sum
                        self.corrections_made.append({
                            'record': record['full_name'],
                            'ic': record['ic_number'],
                            'project': record['project_name'],
                            'issue': issue['type'],
                            'old_value': record['days_worked'],
                            'new_value': days_sum,
                            'method': 'CSV_LOOKUP'
                        })

            elif issue['type'] == 'MISSING_ACCOUNT':
                # Look for account column
                account_cols = [col for col in section_df.columns if 'account' in col.lower()]
                if account_cols:
                    account_col = account_cols[0]
                    account_value = candidate_data.iloc[0].get(account_col)
                    if pd.notna(account_value):
                        fixed_account = clean_account(account_value)
                        if fixed_account:
                            fixed_data['account_number'] = fixed_account
                            self.corrections_made.append({
                                'record': record['full_name'],
                                'ic': record['ic_number'],
                                'project': record['project_name'],
                                'issue': issue['type'],
                                'old_value': 'None',
                                'new_value': fixed_account,
                                'method': 'CSV_LOOKUP'
                            })

            elif issue['type'] == 'ALL_PAYMENTS_ZERO':
                # Try to find any payment-related columns
                payment_cols = [col for col in section_df.columns
                               if any(keyword in col.lower() for keyword in ['wage', 'payment', 'total', 'claim', 'allowance'])]

                total_found = 0
                for col in payment_cols:
                    # Sum across continuation rows
                    for idx in range(candidate_main_idx, min(candidate_main_idx + 10, len(section_df))):
                        row = section_df.iloc[idx]
                        if pd.notna(row.get(col)):
                            total_found += safe_float(row[col])
                        # Stop if we hit another candidate
                        if pd.notna(row.get(ic_col)) and idx != candidate_main_idx:
                            break

                if total_found > 0:
                    fixed_data['total_payment'] = total_found
                    self.corrections_made.append({
                        'record': record['full_name'],
                        'ic': record['ic_number'],
                        'project': record['project_name'],
                        'issue': issue['type'],
                        'old_value': 0,
                        'new_value': total_found,
                        'method': 'CSV_DEEP_SEARCH'
                    })

            elif issue['type'] == 'TOTAL_LESS_THAN_COMPONENTS':
                # Use the component sum
                fixed_data['total_payment'] = issue['suggested_fix']
                self.corrections_made.append({
                    'record': record['full_name'],
                    'ic': record['ic_number'],
                    'project': record['project_name'],
                    'issue': issue['type'],
                    'old_value': record['total_payment'],
                    'new_value': issue['suggested_fix'],
                    'method': 'AUTO_CALCULATE'
                })

            return fixed_data

        except Exception as e:
            print(f"  Error during cross-reference: {e}")
            self.manual_review_needed.append({
                **issue,
                'reason': f'Error: {str(e)}'
            })
            return None


def validate_and_correct_master_file(input_file, output_file):
    """
    Main validation and correction function.
    """
    print("="*120)
    print(" "*40 + "DATA VALIDATION AND CORRECTION SYSTEM")
    print("="*120)

    # Read the master file
    print(f"\n📂 Loading: {input_file}")
    df = pd.read_excel(input_file, sheet_name='All Candidates')
    print(f"   Total records: {len(df):,}")

    # Initialize validator
    validator = DataValidator()

    # Phase 1: Detect issues
    print(f"\n{'─'*120}")
    print("PHASE 1: DETECTING ISSUES")
    print(f"{'─'*120}\n")

    all_issues = []
    for idx, row in df.iterrows():
        issues = validator.validate_record(row, idx)
        if issues:
            all_issues.extend(issues)

    # Summarize issues
    issue_types = defaultdict(int)
    for issue in all_issues:
        issue_types[issue['type']] += 1

    print(f"✓ Validation complete!")
    print(f"  Total issues found: {len(all_issues)}")
    print(f"\n  Issue Breakdown:")
    for issue_type, count in sorted(issue_types.items(), key=lambda x: -x[1]):
        print(f"    - {issue_type:30} {count:>4}")

    if len(all_issues) == 0:
        print("\n🎉 No issues found! Data is perfect.")
        return

    # Phase 2: Cross-reference and fix
    print(f"\n{'─'*120}")
    print("PHASE 2: CROSS-REFERENCING WITH ORIGINAL CSV FILES")
    print(f"{'─'*120}\n")

    for i, issue in enumerate(all_issues, 1):
        print(f"[{i}/{len(all_issues)}] Fixing {issue['type']} for {issue['record']['full_name']}...", end='')

        fixed_data = validator.cross_reference_and_fix(issue)

        if fixed_data:
            # Apply fixes to DataFrame
            record_idx = issue['record_idx']
            for key, value in fixed_data.items():
                df.at[record_idx, key] = value
            print(" ✓ FIXED")
        else:
            print(" ⚠ Needs manual review")

    # Phase 3: Summary
    print(f"\n{'─'*120}")
    print("PHASE 3: CORRECTION SUMMARY")
    print(f"{'─'*120}\n")

    print(f"✅ Auto-fixed: {len(validator.corrections_made)}")
    print(f"⚠️  Needs manual review: {len(validator.manual_review_needed)}")

    # Save corrected file
    print(f"\n💾 Saving corrected data to: {output_file}")

    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        # Save corrected data
        df.to_excel(writer, sheet_name='All Candidates (Corrected)', index=False)

        # Save correction log
        if validator.corrections_made:
            corrections_df = pd.DataFrame(validator.corrections_made)
            corrections_df.to_excel(writer, sheet_name='Corrections Made', index=False)

        # Save manual review list
        if validator.manual_review_needed:
            manual_df = pd.DataFrame(validator.manual_review_needed)
            # Flatten the 'record' dict
            if 'record' in manual_df.columns:
                manual_df = manual_df.drop('record', axis=1)
            manual_df.to_excel(writer, sheet_name='Manual Review Needed', index=False)

    # Print correction details
    if validator.corrections_made:
        print(f"\n{'='*120}")
        print("CORRECTIONS MADE:")
        print(f"{'='*120}")
        print(f"\n  {'Name':<30} {'Project':<25} {'Issue':<25} {'Old':<12} {'New':<12} {'Method':<15}")
        print(f"  {'-'*30} {'-'*25} {'-'*25} {'-'*12} {'-'*12} {'-'*15}")
        for corr in validator.corrections_made[:20]:  # Show first 20
            print(f"  {str(corr['record'])[:29]:<30} "
                  f"{str(corr['project'])[:24]:<25} "
                  f"{corr['issue'][:24]:<25} "
                  f"{str(corr['old_value'])[:11]:<12} "
                  f"{str(corr['new_value'])[:11]:<12} "
                  f"{corr['method']:<15}")

        if len(validator.corrections_made) > 20:
            print(f"  ... and {len(validator.corrections_made) - 20} more (see Excel file)")

    print(f"\n{'='*120}")
    print("✅ VALIDATION AND CORRECTION COMPLETE!")
    print(f"{'='*120}\n")

    return df, validator


if __name__ == '__main__':
    input_file = 'baito_2025_full_year_master.xlsx'
    output_file = 'baito_2025_full_year_master_CORRECTED.xlsx'

    if not Path(input_file).exists():
        print(f"❌ Error: {input_file} not found!")
        print("   Please run the extraction script first.")
        sys.exit(1)

    df_corrected, validator = validate_and_correct_master_file(input_file, output_file)

    print(f"📊 Corrected file saved: {output_file}")
    print(f"   Contains {len(df_corrected):,} records")
    print(f"   {len(validator.corrections_made)} corrections applied")
    print(f"   {len(validator.manual_review_needed)} items need manual review")
    print()
