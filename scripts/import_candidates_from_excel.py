#!/usr/bin/env python3
"""
Import candidates from Excel payment details into Supabase database.
Reads CSV files from excel_imports folder and creates/updates candidate records.
"""

import os
import re
import sys
import json
import glob
from pathlib import Path
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
# Use service role key for admin operations
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables")
    print("Please ensure .env file contains:")
    print("  VITE_SUPABASE_URL=your_url")
    print("  SUPABASE_SERVICE_ROLE_KEY=your_key (for admin operations)")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def clean_ic_number(ic):
    """Clean and normalize IC number."""
    if pd.isna(ic):
        return None
    ic_str = str(ic).strip()
    # Remove spaces and hyphens
    ic_str = ic_str.replace(' ', '').replace('-', '')
    return ic_str if ic_str else None


def clean_phone(phone):
    """Clean and normalize phone number."""
    if pd.isna(phone):
        return None
    phone_str = str(phone).strip()
    # Remove spaces, hyphens, and parentheses
    phone_str = re.sub(r'[ \-\(\)]', '', phone_str)
    # Add +60 if Malaysian number without country code
    if phone_str and not phone_str.startswith('+'):
        if phone_str.startswith('0'):
            phone_str = '+60' + phone_str[1:]
        else:
            phone_str = '+60' + phone_str
    return phone_str if phone_str else None


def clean_name(name):
    """Clean and normalize name."""
    if pd.isna(name):
        return None
    # Remove extra spaces and capitalize properly
    name_str = str(name).strip()
    name_str = ' '.join(name_str.split())
    # Capitalize each word properly
    name_str = ' '.join(word.capitalize() for word in name_str.split())
    return name_str if name_str else None


def clean_bank_name(bank):
    """Clean and normalize bank name."""
    if pd.isna(bank):
        return None
    bank_str = str(bank).strip()
    return bank_str if bank_str else None


def clean_account_number(account):
    """Clean and normalize bank account number."""
    if pd.isna(account):
        return None
    account_str = str(account).strip().replace(' ', '').replace('-', '')
    return account_str if account_str else None


def extract_candidates_from_csv(csv_path):
    """
    Extract candidate data from a CSV file.
    Handles CSV files with multiple header rows and sections.

    Returns:
        List of candidate dictionaries
    """
    try:
        # Read entire CSV as raw data
        raw_df = pd.read_csv(csv_path, encoding='utf-8', header=None)

        candidates = []

        # Find all rows that look like headers (contain "Name" and "IC")
        header_rows = []
        for idx, row in raw_df.iterrows():
            row_str = ' '.join([str(val) for val in row if pd.notna(val)]).lower()
            if 'name' in row_str and 'ic' in row_str:
                header_rows.append(idx)

        if not header_rows:
            print(f"  ⚠️  Skipping {Path(csv_path).name} - Cannot find header rows")
            return []

        # Process each section
        for section_idx, header_row_idx in enumerate(header_rows):
            # Determine end of section
            next_header_idx = header_rows[section_idx + 1] if section_idx + 1 < len(header_rows) else len(raw_df)

            # Read section with proper header
            section_df = pd.read_csv(
                csv_path,
                encoding='utf-8',
                skiprows=header_row_idx,
                nrows=next_header_idx - header_row_idx - 1,
                na_values=['', 'nan', 'NaN', 'None']
            )

            # Clean column names
            section_df.columns = [str(col).strip() for col in section_df.columns]

            # Try to identify columns
            name_cols = [col for col in section_df.columns if 'name' in col.lower() and 'bank' not in col.lower()]
            ic_cols = [col for col in section_df.columns if 'ic' in col.lower()]
            bank_cols = [col for col in section_df.columns if 'bank name' in col.lower() or col.lower() == 'bank']
            account_cols = [col for col in section_df.columns if 'account' in col.lower()]

            if not name_cols or not ic_cols:
                continue

            name_col = name_cols[0]
            ic_col = ic_cols[0]
            bank_col = bank_cols[0] if bank_cols else None
            account_col = account_cols[0] if account_cols else None

            # Extract candidates from this section
            for idx, row in section_df.iterrows():
                # Skip header rows and empty rows
                if pd.isna(row[name_col]) or pd.isna(row[ic_col]):
                    continue

                # Skip if name is 'No' (column header)
                if str(row[name_col]).strip().lower() in ['no', 'name']:
                    continue

                # Clean IC number
                ic_number = clean_ic_number(row[ic_col])
                if not ic_number or len(ic_number) < 6:
                    continue

                # Clean name
                full_name = clean_name(row[name_col])
                if not full_name:
                    continue

                # Build candidate data
                candidate = {
                    'ic_number': ic_number,
                    'full_name': full_name,
                    'bank_details': {}
                }

                # Add bank details if available
                if bank_col and bank_col in row.index and not pd.isna(row[bank_col]):
                    bank_value = row[bank_col]
                    if str(bank_value).strip().lower() not in ['sammy claim', 'claim']:
                        candidate['bank_details']['bank_name'] = clean_bank_name(bank_value)

                if account_col and account_col in row.index and not pd.isna(row[account_col]):
                    candidate['bank_details']['account_number'] = clean_account_number(row[account_col])

                # Add candidate even if no bank details (we can update later)
                candidates.append(candidate)

        return candidates

    except Exception as e:
        print(f"  ✗ Error reading {Path(csv_path).name}: {e}")
        import traceback
        traceback.print_exc()
        return []


def merge_candidate_data(existing_candidates):
    """
    Merge duplicate candidates, preferring the one with most complete data.
    """
    merged = {}

    for candidate in existing_candidates:
        ic = candidate['ic_number']

        if ic not in merged:
            merged[ic] = candidate
        else:
            # Merge bank details
            if candidate.get('bank_details'):
                if not merged[ic].get('bank_details'):
                    merged[ic]['bank_details'] = {}

                for key, value in candidate['bank_details'].items():
                    if value and (not merged[ic]['bank_details'].get(key) or len(str(value)) > len(str(merged[ic]['bank_details'].get(key, '')))):
                        merged[ic]['bank_details'][key] = value

    return list(merged.values())


def upsert_candidates_to_db(candidates):
    """
    Insert or update candidates in Supabase database.
    """
    success_count = 0
    error_count = 0

    for candidate in candidates:
        try:
            ic_number = candidate['ic_number']

            # Check if candidate exists
            result = supabase.table('candidates').select('*').eq('ic_number', ic_number).execute()

            if result.data:
                # Update existing candidate
                existing = result.data[0]

                # Merge bank details
                existing_bank = existing.get('bank_details') or {}
                new_bank = candidate.get('bank_details') or {}
                merged_bank = {**existing_bank, **new_bank}

                update_data = {
                    'bank_details': merged_bank,
                    'full_name': candidate['full_name']
                }

                supabase.table('candidates').update(update_data).eq('ic_number', ic_number).execute()
                print(f"  ✓ Updated: {candidate['full_name']} ({ic_number})")
                success_count += 1
            else:
                # Insert new candidate
                insert_data = {
                    'ic_number': ic_number,
                    'full_name': candidate['full_name'],
                    'bank_details': candidate.get('bank_details', {}),
                    'status': 'active',
                    'nationality': 'Malaysian'
                }

                supabase.table('candidates').insert(insert_data).execute()
                print(f"  ✓ Created: {candidate['full_name']} ({ic_number})")
                success_count += 1

        except Exception as e:
            print(f"  ✗ Error processing {candidate.get('full_name', 'Unknown')}: {e}")
            error_count += 1

    return success_count, error_count


def main():
    """Main import process."""
    print("=" * 80)
    print("BAITO CANDIDATES IMPORT - FROM EXCEL PAYMENT DETAILS")
    print("=" * 80)
    print()

    # Find all CSV files in excel_imports folder
    csv_pattern = "excel_imports/**/*.csv"
    csv_files = glob.glob(csv_pattern, recursive=True)

    if not csv_files:
        print("No CSV files found in excel_imports folder.")
        print("Please run the Excel converter first:")
        print("  python3 excel_to_csv_converter.py 'path/to/excel/file.xlsx' excel_imports/")
        return

    print(f"Found {len(csv_files)} CSV file(s) to process\n")

    all_candidates = []

    # Extract candidates from all CSV files
    for csv_file in csv_files:
        print(f"Processing: {Path(csv_file).name}")
        candidates = extract_candidates_from_csv(csv_file)
        print(f"  → Extracted {len(candidates)} candidate(s)\n")
        all_candidates.extend(candidates)

    print(f"Total candidates extracted: {len(all_candidates)}")

    # Merge duplicate entries
    print("\nMerging duplicate candidates...")
    merged_candidates = merge_candidate_data(all_candidates)
    print(f"Unique candidates after merging: {len(merged_candidates)}\n")

    # Confirm before proceeding
    print("=" * 80)
    response = input(f"\nProceed to import {len(merged_candidates)} candidates into database? (yes/no): ")

    if response.lower() not in ['yes', 'y']:
        print("Import cancelled.")
        return

    print("\n" + "=" * 80)
    print("IMPORTING TO DATABASE")
    print("=" * 80 + "\n")

    # Import to database
    success_count, error_count = upsert_candidates_to_db(merged_candidates)

    print("\n" + "=" * 80)
    print("IMPORT COMPLETE")
    print("=" * 80)
    print(f"\n✓ Successfully processed: {success_count}")
    print(f"✗ Errors: {error_count}")
    print(f"\nTotal candidates in batch: {len(merged_candidates)}")
    print()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nImport cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\nFatal error: {e}")
        sys.exit(1)
