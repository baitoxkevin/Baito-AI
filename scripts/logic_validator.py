#!/usr/bin/env python3
"""
Logic Validator - Validates payment calculation logic for each record
Reads Excel headers, identifies columns, calculates expected total, compares with extracted
"""

import pandas as pd
import numpy as np
from pathlib import Path


def safe_float(val):
    """Convert to float safely."""
    if pd.isna(val):
        return 0.0
    try:
        return float(val)
    except:
        return 0.0


def find_header_row(df):
    """Find the header row containing column names."""
    for idx, row in df.iterrows():
        row_str = ' '.join([str(val).lower() for val in row if pd.notna(val)])
        if 'name' in row_str and 'ic' in row_str:
            return idx
    return None


def identify_columns(df, header_row):
    """Identify which columns represent which data."""
    columns = df.iloc[header_row].to_list()
    columns = [str(col).strip().lower() for col in columns]

    col_map = {
        'name': None,
        'ic': None,
        'day': None,
        'days': None,
        'wage': None,
        'wages': None,
        'payment': None,
        'ot': None,
        'overtime': None,
        'allowance': None,
        'claim': None,
        'total': None,
        'transport': None
    }

    for i, col in enumerate(columns):
        if pd.isna(col):
            continue

        col = str(col).strip().lower()

        # Exact matches
        if 'name' in col and 'bank' not in col:
            col_map['name'] = i
        elif col in ['ic number', 'ic no', 'ic']:
            col_map['ic'] = i
        elif col in ['day', 'days']:
            col_map['days'] = i
        elif col in ['wage', 'wages']:
            col_map['wage'] = i
        elif col == 'payment':
            col_map['payment'] = i
        elif col in ['ot', 'overtime']:
            col_map['ot'] = i
        elif 'allowance' in col:
            col_map['allowance'] = i
        elif col in ['claim', 'claims']:
            col_map['claim'] = i
        elif col == 'total' or col == 'total wages':
            col_map['total'] = i
        elif 'transport' in col:
            col_map['transport'] = i

    return col_map


def calculate_expected_total(rows_data, col_map):
    """
    Calculate what the total SHOULD be based on Excel column structure.
    Returns (expected_total, calculation_steps)
    """
    calculation = []
    components = {
        'days': 0,
        'wages': 0,
        'payment': 0,
        'ot': 0,
        'allowance': 0,
        'claim': 0,
        'transport': 0,
        'total': 0
    }

    for row in rows_data:
        # Extract values from identified columns
        if col_map['days'] is not None:
            val = safe_float(row[col_map['days']])
            if val <= 50:  # Sanity check
                components['days'] += val

        if col_map['wage'] is not None:
            components['wages'] += safe_float(row[col_map['wage']])

        if col_map['payment'] is not None:
            val = safe_float(row[col_map['payment']])
            # Only add if not suspiciously high (could be total in wrong column)
            if val > 0 and val < 10000:
                components['payment'] += val

        if col_map['ot'] is not None:
            components['ot'] += safe_float(row[col_map['ot']])

        if col_map['allowance'] is not None:
            components['allowance'] += safe_float(row[col_map['allowance']])

        if col_map['claim'] is not None:
            components['claim'] += safe_float(row[col_map['claim']])

        if col_map['transport'] is not None:
            components['transport'] += safe_float(row[col_map['transport']])

        # Get total value (usually only on first row)
        if col_map['total'] is not None:
            val = safe_float(row[col_map['total']])
            if val > components['total']:
                components['total'] = val

    # Calculate expected total based on logic
    # Case 1: Has "Total" column - use that value
    if components['total'] > 0:
        expected = components['total']
        calculation.append(f"Total column = {components['total']}")

    # Case 2: Has Payment column (per-row payments)
    elif components['payment'] > 0:
        expected = components['payment'] + components['ot'] + components['allowance'] + components['claim'] + components['transport']
        calc_parts = []
        if components['payment'] > 0:
            calc_parts.append(f"Payment: {components['payment']}")
        if components['ot'] > 0:
            calc_parts.append(f"OT: {components['ot']}")
        if components['allowance'] > 0:
            calc_parts.append(f"Allowance: {components['allowance']}")
        if components['claim'] > 0:
            calc_parts.append(f"Claim: {components['claim']}")
        if components['transport'] > 0:
            calc_parts.append(f"Transport: {components['transport']}")
        calculation.append(' + '.join(calc_parts) + f" = {expected}")

    # Case 3: Has Wages column
    elif components['wages'] > 0:
        expected = components['wages'] + components['ot'] + components['allowance'] + components['claim']
        calc_parts = []
        if components['wages'] > 0:
            calc_parts.append(f"Wages: {components['wages']}")
        if components['ot'] > 0:
            calc_parts.append(f"OT: {components['ot']}")
        if components['allowance'] > 0:
            calc_parts.append(f"Allowance: {components['allowance']}")
        if components['claim'] > 0:
            calc_parts.append(f"Claim: {components['claim']}")
        calculation.append(' + '.join(calc_parts) + f" = {expected}")

    else:
        expected = 0
        calculation.append("No payment data found in columns")

    return expected, components, calculation


def validate_record_logic(record, source_dir):
    """
    Validate a single record by checking payment calculation logic.
    """
    result = {
        'name': record['full_name'],
        'ic': record['ic_number'],
        'sheet': record['source_sheet'],
        'month': record['month'],
        'extracted': {
            'days': record['days_worked'],
            'wages': record['total_wages'],
            'payment': record['total_payment']
        },
        'status': 'UNKNOWN',
        'logic': [],
        'issues': []
    }

    excel_file = Path(source_dir) / record['source_file']

    if not excel_file.exists():
        result['status'] = 'FILE_NOT_FOUND'
        result['issues'].append('Excel file not found')
        return result

    try:
        # Read the sheet
        df = pd.read_excel(excel_file, sheet_name=record['source_sheet'], header=None)

        # Find header row
        header_row = find_header_row(df)
        if header_row is None:
            result['status'] = 'NO_HEADER'
            result['issues'].append('Could not find header row')
            return result

        # Identify columns
        col_map = identify_columns(df, header_row)
        result['columns'] = {k: v for k, v in col_map.items() if v is not None}

        # Search for candidate by IC
        target_ic = str(record['ic_number']).replace('-', '').replace(' ', '').replace('.0', '')

        candidate_rows = []
        candidate_row_indices = []

        for idx in range(header_row + 1, len(df)):
            row = df.iloc[idx]

            # Check if this is the candidate's row
            if col_map['ic'] is not None:
                ic_val = str(row[col_map['ic']]) if pd.notna(row[col_map['ic']]) else ''
                ic_clean = ic_val.replace('-', '').replace(' ', '')

                if target_ic in ic_clean:
                    candidate_rows.append(row.to_list())
                    candidate_row_indices.append(idx)

                    # Check next few rows for continuation (empty Name/IC)
                    for i in range(idx + 1, min(idx + 5, len(df))):
                        next_row = df.iloc[i]
                        has_name = pd.notna(next_row[col_map['name']]) if col_map['name'] is not None else False
                        has_ic = pd.notna(next_row[col_map['ic']]) if col_map['ic'] is not None else False

                        if not has_name and not has_ic:
                            # This is a continuation row
                            has_data = any(pd.notna(next_row[j]) and next_row[j] != ''
                                         for j in range(len(next_row)))
                            if has_data:
                                candidate_rows.append(next_row.to_list())
                                candidate_row_indices.append(i)
                        else:
                            break
                    break

        if not candidate_rows:
            result['status'] = 'NOT_FOUND'
            result['issues'].append(f"IC {target_ic} not found in sheet")
            return result

        result['excel_rows'] = candidate_row_indices
        result['logic'].append(f"Found in Excel at rows: {candidate_row_indices}")

        # Calculate expected total
        expected_total, components, calculation = calculate_expected_total(candidate_rows, col_map)

        result['expected'] = {
            'total': expected_total,
            'components': components
        }
        result['logic'].extend(calculation)

        # Compare extracted vs expected
        extracted_total = record['total_payment']

        # Allow 1% tolerance for rounding
        if expected_total > 0:
            diff_pct = abs(extracted_total - expected_total) / expected_total

            if diff_pct <= 0.01:  # Within 1%
                result['status'] = 'VALID'
            elif diff_pct <= 0.05:  # Within 5%
                result['status'] = 'MINOR_DIFF'
                result['issues'].append(f"Small difference: {diff_pct*100:.1f}%")
            else:
                result['status'] = 'MISMATCH'
                result['issues'].append(f"Extracted: {extracted_total}, Expected: {expected_total} (diff: {diff_pct*100:.1f}%)")
        elif expected_total == 0 and extracted_total == 0:
            result['status'] = 'VALID_ZERO'
        else:
            result['status'] = 'CHECK'
            result['issues'].append(f"Extracted: {extracted_total}, Expected: {expected_total}")

        return result

    except Exception as e:
        result['status'] = 'ERROR'
        result['issues'].append(f"Error: {str(e)}")
        return result


def run_logic_validation(masterlist_path, source_dir, sample_size=None):
    """Run logic validation on all records."""
    print("="*120)
    print(" "*40 + "PAYMENT LOGIC VALIDATOR")
    print("="*120)

    # Read masterlist
    print(f"\n📂 Loading masterlist: {masterlist_path}")
    df = pd.read_excel(masterlist_path, sheet_name='All Candidates', dtype={'account_number': str})

    if sample_size:
        df = df.head(sample_size)
        print(f"   Validating SAMPLE: {len(df)} records")
    else:
        print(f"   Validating ALL: {len(df):,} records")

    results = []
    status_counts = {}

    print(f"\n{'─'*120}")
    print("VALIDATING PAYMENT LOGIC...")
    print(f"{'─'*120}\n")

    for idx, record in df.iterrows():
        if idx > 0 and idx % 50 == 0:
            print(f"  Progress: {idx}/{len(df)}...")

        result = validate_record_logic(record, source_dir)
        results.append(result)

        status = result['status']
        status_counts[status] = status_counts.get(status, 0) + 1

    # Summary
    print(f"\n{'='*120}")
    print("VALIDATION SUMMARY")
    print(f"{'='*120}")
    print(f"\n  Total Records: {len(df):,}")
    print(f"\n  Results:")
    for status, count in sorted(status_counts.items()):
        pct = count / len(df) * 100
        icon = '✓' if status in ['VALID', 'VALID_ZERO'] else '?' if status == 'MINOR_DIFF' else '✗'
        print(f"    {icon} {status:20} {count:4} ({pct:.1f}%)")

    # Show sample mismatches
    mismatches = [r for r in results if r['status'] in ['MISMATCH', 'CHECK']]
    if mismatches:
        print(f"\n{'─'*120}")
        print(f"SAMPLE PAYMENT LOGIC ISSUES (first 10):")
        print(f"{'─'*120}")

        for r in mismatches[:10]:
            print(f"\n  {r['name']} ({r['sheet']} - {r['month']})")
            print(f"    Extracted: {r['extracted']['payment']}")
            if 'expected' in r:
                print(f"    Expected:  {r['expected']['total']}")
                print(f"    Logic: {'; '.join(r['logic'])}")
            print(f"    Issues: {'; '.join(r['issues'])}")

    # Save report
    report_file = 'payment_logic_validation.xlsx'
    print(f"\n{'─'*120}")
    print(f"💾 Saving report: {report_file}")

    report_data = []
    for r in results:
        report_data.append({
            'Name': r['name'],
            'IC': r['ic'],
            'Sheet': r['sheet'],
            'Month': r['month'],
            'Status': r['status'],
            'Extracted_Days': r['extracted']['days'],
            'Extracted_Wages': r['extracted']['wages'],
            'Extracted_Total': r['extracted']['payment'],
            'Expected_Total': r.get('expected', {}).get('total', ''),
            'Calculation_Logic': ' | '.join(r['logic']),
            'Issues': '; '.join(r['issues']),
            'Excel_Rows': str(r.get('excel_rows', '')),
            'Columns_Found': str(r.get('columns', ''))
        })

    report_df = pd.DataFrame(report_data)

    with pd.ExcelWriter(report_file, engine='openpyxl') as writer:
        report_df.to_excel(writer, sheet_name='All Results', index=False)

        # Valid records
        valid_df = report_df[report_df['Status'].isin(['VALID', 'VALID_ZERO', 'MINOR_DIFF'])]
        valid_df.to_excel(writer, sheet_name='Valid', index=False)

        # Issues
        issues_df = report_df[~report_df['Status'].isin(['VALID', 'VALID_ZERO', 'MINOR_DIFF'])]
        if len(issues_df) > 0:
            issues_df.to_excel(writer, sheet_name='Issues', index=False)

    print(f"   ✓ Report saved!")
    print(f"{'='*120}\n")

    return results, status_counts


if __name__ == '__main__':
    masterlist_path = 'baito_2025_COMPLETE_v3.xlsx'
    source_dir = '/Users/baito.kevin/Downloads/PROMOTER PAYMENT & CLAIMS 2025/Baito Promoter 2025/'

    # Validate all records
    results, stats = run_logic_validation(masterlist_path, source_dir)
