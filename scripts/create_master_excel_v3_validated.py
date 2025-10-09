#!/usr/bin/env python3
"""
Enhanced Master Excel Creator - V3 with Validation
Extracts data with source tracking, validation, and cross-checking.
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
    ic_str = str(ic).strip()
    ic_str = ic_str.split('\n')[0].strip()
    ic_str = ic_str.split('(')[0].strip()
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


def clean_bank_name(bank):
    """Clean and normalize bank name."""
    if pd.isna(bank):
        return None
    bank_str = str(bank).strip()
    return bank_str if bank_str else None


def clean_account(account):
    """Clean and normalize account number - FIX .0 issue."""
    if pd.isna(account):
        return None

    # Convert to string first
    account_str = str(account).strip()

    # Handle scientific notation (e.g., 1.234567e+11)
    try:
        if 'e' in account_str.lower() or '.' in account_str:
            # Convert to float first, then to int to remove decimals
            account_num = float(account_str)
            account_str = str(int(account_num))
    except:
        pass

    # Remove spaces, hyphens, and any remaining .0
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


def validate_record(record, sheet_name, excel_path):
    """
    Validate record and flag suspicious patterns.
    Returns: (is_valid, issues, corrected_record)
    """
    issues = []
    corrected = record.copy()

    # Count non-zero payment fields
    payment_fields = {
        'total_wages': record['total_wages'],
        'total_ot': record['total_ot'],
        'total_allowance': record['total_allowance'],
        'total_claim': record['total_claim'],
        'total_payment': record['total_payment']
    }

    non_zero_count = sum(1 for v in payment_fields.values() if v > 0)

    # Rule 1: At least 2 non-zero payment fields (or all zero)
    if non_zero_count == 1 and record['total_payment'] > 0:
        issues.append(f"SUSPICIOUS: Only 1 non-zero field (total={record['total_payment']})")
        # Try to validate with original Excel
        validated_data = cross_check_excel(record, sheet_name, excel_path)
        if validated_data:
            corrected.update(validated_data)
            issues.append("✓ Corrected from Excel")

    # Rule 2: Total payment exists but wages/days empty
    if record['total_payment'] > 0:
        if record['total_wages'] == 0 and record['days_worked'] == 0:
            issues.append(f"INCOMPLETE: payment={record['total_payment']} but wages=0, days=0")
            validated_data = cross_check_excel(record, sheet_name, excel_path)
            if validated_data:
                corrected.update(validated_data)
                issues.append("✓ Corrected from Excel")

    # Rule 3: Days and payment exist but wages empty
    if record['days_worked'] > 0 and record['total_payment'] > 0 and record['total_wages'] == 0:
        issues.append(f"MISSING_WAGES: days={record['days_worked']}, payment={record['total_payment']}")
        validated_data = cross_check_excel(record, sheet_name, excel_path)
        if validated_data:
            corrected.update(validated_data)
            issues.append("✓ Corrected from Excel")

    # Rule 4: Calculate total if components exist but total is 0
    component_sum = (
        corrected['total_wages'] +
        corrected['total_ot'] +
        corrected['total_allowance'] +
        corrected['total_claim']
    )

    if component_sum > 0 and corrected['total_payment'] == 0:
        corrected['total_payment'] = component_sum
        issues.append(f"✓ Calculated total from components: {component_sum}")

    # Rule 5: Total should be >= component sum
    if corrected['total_payment'] > 0 and component_sum > corrected['total_payment']:
        corrected['total_payment'] = component_sum
        issues.append(f"✓ Adjusted total to match components: {component_sum}")

    is_valid = len([i for i in issues if not i.startswith('✓')]) == 0

    return is_valid, issues, corrected


def cross_check_excel(record, sheet_name, excel_path):
    """
    Cross-check record with original Excel file to validate/correct data.
    """
    try:
        # Read the specific sheet
        df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)

        # Find candidate by IC
        ic_number = record['ic_number']
        candidate_rows = []

        for idx, row in df.iterrows():
            row_str = ' '.join([str(val) for val in row if pd.notna(val)])
            if ic_number in row_str.replace('-', '').replace(' ', ''):
                candidate_rows.append(idx)

        if not candidate_rows:
            return None

        # Find header row
        header_row_idx = None
        for idx in range(max(0, min(candidate_rows) - 10), min(candidate_rows)):
            row = df.iloc[idx]
            row_str = ' '.join([str(val) for val in row if pd.notna(val)]).lower()
            if 'name' in row_str and 'ic' in row_str:
                header_row_idx = idx
                break

        if header_row_idx is None:
            return None

        # Read with proper headers
        section_df = pd.read_excel(excel_path, sheet_name=sheet_name, skiprows=header_row_idx, nrows=50)
        section_df.columns = [str(col).strip() for col in section_df.columns]

        # Find IC column
        ic_cols = [col for col in section_df.columns if 'ic' in col.lower()]
        if not ic_cols:
            return None

        ic_col = ic_cols[0]

        # Find candidate rows (including continuation rows)
        main_idx = None
        for idx, row in section_df.iterrows():
            if pd.notna(row.get(ic_col)):
                if ic_number in str(row[ic_col]).replace('-', '').replace(' ', ''):
                    main_idx = idx
                    break

        if main_idx is None:
            return None

        # Aggregate data from main row and continuation rows
        validated = {}

        # Look for payment columns
        wage_cols = [col for col in section_df.columns if col.lower() in ['wages', 'wage']]
        day_cols = [col for col in section_df.columns if col.lower() in ['day', 'days']]
        ot_cols = [col for col in section_df.columns if col.lower() in ['ot', 'overtime']]
        allowance_cols = [col for col in section_df.columns if 'allowance' in col.lower()]
        claim_cols = [col for col in section_df.columns if col.lower() in ['claim', 'claims']]
        total_cols = [col for col in section_df.columns if col.lower() in ['total', 'payment', 'total wages']]

        # Sum across continuation rows
        for offset in range(10):  # Check up to 10 rows
            row_idx = main_idx + offset
            if row_idx >= len(section_df):
                break

            row = section_df.iloc[row_idx]

            # Stop if we hit another candidate
            if offset > 0 and pd.notna(row.get(ic_col)):
                break

            # Aggregate values
            if wage_cols:
                val = safe_float(row.get(wage_cols[0]))
                validated['total_wages'] = validated.get('total_wages', 0) + val

            if day_cols:
                val = safe_float(row.get(day_cols[0]))
                validated['days_worked'] = validated.get('days_worked', 0) + val

            if ot_cols:
                val = safe_float(row.get(ot_cols[0]))
                validated['total_ot'] = validated.get('total_ot', 0) + val

            if allowance_cols:
                val = safe_float(row.get(allowance_cols[0]))
                validated['total_allowance'] = validated.get('total_allowance', 0) + val

            if claim_cols:
                val = safe_float(row.get(claim_cols[0]))
                validated['total_claim'] = validated.get('total_claim', 0) + val

            if total_cols:
                val = safe_float(row.get(total_cols[0]))
                if val > validated.get('total_payment', 0):
                    validated['total_payment'] = val

        return validated if validated else None

    except Exception as e:
        return None


def extract_month_from_path(path):
    """Extract month from file path."""
    path_str = str(path).lower()
    months = ['jan', 'feb', 'march', 'april', 'may', 'june', 'july', 'aug', 'sep']
    for month in months:
        if f'/{month}/' in path_str or f'_{month}_' in path_str or month in Path(path).name.lower():
            return month.capitalize()
    return 'Unknown'


def process_excel_file_with_validation(excel_path):
    """
    Process Excel file directly (not CSV) with validation and source tracking.
    """
    print(f"\n📂 Processing: {Path(excel_path).name}")

    month = extract_month_from_path(excel_path)
    all_data = []
    validation_log = []

    try:
        # Load workbook to get sheet names
        wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
        sheet_names = wb.sheetnames
        wb.close()

        print(f"   Found {len(sheet_names)} sheet(s)")

        for sheet_idx, sheet_name in enumerate(sheet_names, 1):
            try:
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

                # Process each section in the sheet
                for section_idx, header_row_idx in enumerate(header_rows):
                    # Read with proper headers
                    section_df = pd.read_excel(
                        excel_path,
                        sheet_name=sheet_name,
                        skiprows=header_row_idx,
                        nrows=200  # Read enough rows
                    )

                    section_df.columns = [str(col).strip() for col in section_df.columns]

                    # Identify columns
                    name_cols = [col for col in section_df.columns if 'name' in col.lower() and 'bank' not in col.lower()]
                    ic_cols = [col for col in section_df.columns if 'ic' in col.lower()]
                    bank_cols = [col for col in section_df.columns if 'bank name' in col.lower() or col.lower() == 'bank']
                    account_cols = [col for col in section_df.columns if 'account' in col.lower()]

                    # Payment columns
                    day_cols = [col for col in section_df.columns if col.lower() in ['day', 'days']]
                    wage_cols = [col for col in section_df.columns if col.lower() in ['wages', 'wage']]
                    ot_cols = [col for col in section_df.columns if col.lower() in ['ot', 'overtime']]
                    allowance_cols = [col for col in section_df.columns if 'allowance' in col.lower()]
                    claim_cols = [col for col in section_df.columns if col.lower() in ['claim', 'claims']]
                    total_cols = [col for col in section_df.columns if col.lower() in ['total', 'payment', 'total wages']]

                    if not name_cols or not ic_cols:
                        continue

                    # Extract candidates
                    current_candidate = None
                    candidates = {}

                    for idx, row in section_df.iterrows():
                        # New candidate row
                        if pd.notna(row.get(name_cols[0])) and pd.notna(row.get(ic_cols[0])):
                            # Skip header remnants
                            if str(row[name_cols[0]]).strip().lower() in ['no', 'name', '']:
                                continue

                            ic_number = clean_ic_number(row[ic_cols[0]])
                            if not ic_number or len(ic_number) < 6:
                                continue

                            full_name = clean_name(row[name_cols[0]])
                            if not full_name:
                                continue

                            # Create unique key
                            key = f"{ic_number}_{sheet_name}_{idx}"
                            current_candidate = key

                            candidates[key] = {
                                'month': month,
                                'source_file': Path(excel_path).name,
                                'source_sheet': sheet_name,
                                'project_name': sheet_name,  # Use sheet name as project
                                'full_name': full_name,
                                'ic_number': ic_number,
                                'bank_name': clean_bank_name(row.get(bank_cols[0])) if bank_cols else None,
                                'account_number': clean_account(row.get(account_cols[0])) if account_cols else None,
                                'days_worked': 0,
                                'total_wages': 0.0,
                                'total_ot': 0.0,
                                'total_allowance': 0.0,
                                'total_claim': 0.0,
                                'total_payment': 0.0,
                            }

                        # Aggregate payment data (main + continuation rows)
                        if current_candidate and current_candidate in candidates:
                            if day_cols and pd.notna(row.get(day_cols[0])):
                                candidates[current_candidate]['days_worked'] += safe_float(row[day_cols[0]])

                            if wage_cols and pd.notna(row.get(wage_cols[0])):
                                candidates[current_candidate]['total_wages'] += safe_float(row[wage_cols[0]])

                            if ot_cols and pd.notna(row.get(ot_cols[0])):
                                candidates[current_candidate]['total_ot'] += safe_float(row[ot_cols[0]])

                            if allowance_cols and pd.notna(row.get(allowance_cols[0])):
                                candidates[current_candidate]['total_allowance'] += safe_float(row[allowance_cols[0]])

                            if claim_cols and pd.notna(row.get(claim_cols[0])):
                                candidates[current_candidate]['total_claim'] += safe_float(row[claim_cols[0]])

                            if total_cols and pd.notna(row.get(total_cols[0])):
                                val = safe_float(row[total_cols[0]])
                                if val > candidates[current_candidate]['total_payment']:
                                    candidates[current_candidate]['total_payment'] = val

                    # Validate and add candidates
                    for key, candidate in candidates.items():
                        is_valid, issues, corrected = validate_record(candidate, sheet_name, excel_path)

                        if issues:
                            validation_log.append({
                                'file': Path(excel_path).name,
                                'sheet': sheet_name,
                                'candidate': candidate['full_name'],
                                'ic': candidate['ic_number'],
                                'issues': '; '.join(issues)
                            })

                        all_data.append(corrected)

            except Exception as e:
                print(f"   ⚠️  Error in sheet '{sheet_name}': {e}")
                continue

        print(f"   ✓ Extracted {len(all_data)} record(s)")
        if validation_log:
            print(f"   ⚠️  {len(validation_log)} validation issues (auto-corrected)")

        return all_data, validation_log

    except Exception as e:
        print(f"   ✗ Error: {e}")
        return [], []


def main():
    """Main function."""
    print("="*120)
    print(" "*30 + "ENHANCED EXTRACTION V3 - WITH VALIDATION")
    print("="*120)

    # Find Excel files (not CSV)
    source_dir = "/Users/baito.kevin/Downloads/PROMOTER PAYMENT & CLAIMS 2025/Baito Promoter 2025/"

    months = {
        'jan': 'Baito Jan Payment Details 2025.xlsx',
        'feb': 'Baito Feb Payment Details 2025.xlsx',
        'march': 'Baito March Payment Details 2025.xlsx',
        'april': 'Baito April Payment Details 2025.xlsx',
        'may': 'Baito May Payment Details 2025.xlsx',
        'june': 'Baito June Payment Details 2025.xlsx',
        'july': 'Baito July Payment Details 2025.xlsx',
        'aug': 'Baito Aug Payment Details 2025.xlsx',
        'sep': 'Baito Sep Payment Details 2025.xlsx'
    }

    all_data = []
    all_validation_logs = []

    for month_name, filename in months.items():
        excel_path = Path(source_dir) / filename

        if not excel_path.exists():
            print(f"\n⊘ {month_name.capitalize()}: File not found")
            continue

        data, logs = process_excel_file_with_validation(str(excel_path))
        all_data.extend(data)
        all_validation_logs.extend(logs)

    print(f"\n{'='*120}")
    print(f"Total records extracted: {len(all_data)}")
    print(f"Total validations performed: {len(all_validation_logs)}")
    print(f"{'='*120}")

    # Create DataFrame
    df = pd.DataFrame(all_data)

    # FIX: Force account_number to be string type (no .0)
    if 'account_number' in df.columns:
        df['account_number'] = df['account_number'].astype('object')  # Keep as object type

    # Sort by month, file, sheet
    df = df.sort_values(['month', 'source_file', 'source_sheet', 'full_name'])

    # Save
    output_file = 'baito_2025_VALIDATED_v3.xlsx'
    print(f"\n💾 Saving to: {output_file}")

    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='All Candidates', index=False)

        if all_validation_logs:
            val_df = pd.DataFrame(all_validation_logs)
            val_df.to_excel(writer, sheet_name='Validation Log', index=False)

    print(f"\n✅ COMPLETE!")
    print(f"   File: {output_file}")
    print(f"   Records: {len(df):,}")
    print(f"   Validation issues handled: {len(all_validation_logs)}")
    print()


if __name__ == '__main__':
    main()
