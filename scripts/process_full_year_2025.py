#!/usr/bin/env python3
"""
Process Full Year 2025 Payment Data
Converts all monthly Excel files to CSV, then creates comprehensive master file.
"""

import os
import sys
import glob
import subprocess
from pathlib import Path
from datetime import datetime

# Month mapping
MONTHS = {
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

SOURCE_DIR = '/Users/baito.kevin/Downloads/PROMOTER PAYMENT & CLAIMS 2025/Baito Promoter 2025/'
OUTPUT_DIR = 'excel_imports/full_year_2025/'


def print_header(text):
    """Print a formatted header."""
    print(f"\n{'='*100}")
    print(f"{text:^100}")
    print(f"{'='*100}\n")


def convert_excel_to_csv(month_name, excel_file, output_folder):
    """Convert a single Excel file to multiple CSV files."""
    print(f"\n📁 Processing: {month_name.upper()}")
    print(f"   File: {Path(excel_file).name}")
    print(f"   Size: {Path(excel_file).stat().st_size / 1024 / 1024:.1f} MB")

    try:
        # Run the Excel to CSV converter
        cmd = [
            'python3',
            'excel_to_csv_converter.py',
            excel_file,
            output_folder
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600  # 10 minute timeout for large files
        )

        if result.returncode == 0:
            # Count CSV files created
            csv_count = len(glob.glob(f"{output_folder}/*.csv"))
            print(f"   ✓ Converted to {csv_count} CSV file(s)")
            return True
        else:
            print(f"   ✗ Error: {result.stderr}")
            return False

    except subprocess.TimeoutExpired:
        print(f"   ✗ Timeout: File took too long to process")
        return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False


def main():
    """Main processing function."""
    print_header("BAITO FULL YEAR 2025 - BATCH PROCESSING")

    print("📊 Overview:")
    print(f"   Source: {SOURCE_DIR}")
    print(f"   Output: {OUTPUT_DIR}")
    print(f"   Months: {len(MONTHS)} (Jan - Sep 2025)")

    # Check if source directory exists
    if not Path(SOURCE_DIR).exists():
        print(f"\n❌ Error: Source directory not found: {SOURCE_DIR}")
        return

    # Survey files
    print("\n📋 Survey of available files:")
    total_size = 0
    available_months = []

    for month, filename in MONTHS.items():
        file_path = Path(SOURCE_DIR) / filename
        if file_path.exists():
            size_mb = file_path.stat().st_size / 1024 / 1024
            total_size += size_mb
            available_months.append(month)
            status = "✓" if month == 'april' else "⏳"
            note = " (already processed)" if month == 'april' else ""
            print(f"   {status} {month.capitalize():10} - {size_mb:6.1f} MB{note}")
        else:
            print(f"   ✗ {month.capitalize():10} - NOT FOUND")

    print(f"\n   Total size: {total_size:.1f} MB")
    print(f"   Files to process: {len(available_months) - 1}")  # -1 for April already done

    # Confirm
    print(f"\n{'='*100}")
    response = input(f"\nProceed with converting {len(available_months) - 1} Excel files to CSV? (yes/no): ")

    if response.lower() not in ['yes', 'y']:
        print("\n❌ Processing cancelled.")
        return

    # Process each month
    print_header("CONVERTING EXCEL FILES TO CSV")

    start_time = datetime.now()
    success_count = 0
    skip_count = 0
    error_count = 0

    for month in available_months:
        # Skip April (already processed)
        if month == 'april':
            print(f"\n📁 {month.upper()}: Skipping (already processed)")
            skip_count += 1
            continue

        excel_file = Path(SOURCE_DIR) / MONTHS[month]
        output_folder = Path(OUTPUT_DIR) / month

        # Create output folder
        output_folder.mkdir(parents=True, exist_ok=True)

        # Convert
        if convert_excel_to_csv(month, str(excel_file), str(output_folder)):
            success_count += 1
        else:
            error_count += 1

    # Summary
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    print_header("CONVERSION SUMMARY")
    print(f"✓ Successfully converted: {success_count}")
    print(f"⊘ Skipped (already done): {skip_count}")
    print(f"✗ Errors: {error_count}")
    print(f"⏱️  Time taken: {duration:.1f} seconds ({duration/60:.1f} minutes)")

    if success_count > 0:
        print("\n" + "="*100)
        print("\n✅ CSV conversion complete!")
        print("\n📊 Next step: Run the extraction script to create master file")
        print("   Command: python3 scripts/create_yearly_master_excel.py")
        print()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Processing cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
