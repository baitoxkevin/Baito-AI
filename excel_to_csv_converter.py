#!/usr/bin/env python3
"""
Excel to CSV Converter
Converts multi-sheet Excel files into separate CSV files.
"""

import argparse
import os
import sys
import re
from pathlib import Path
import pandas as pd


def sanitize_filename(filename):
    """
    Remove or replace special characters in filenames to make them safe.

    Args:
        filename: Original filename string

    Returns:
        Sanitized filename string
    """
    # Replace common problematic characters
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove leading/trailing spaces and dots
    sanitized = sanitized.strip('. ')
    # Replace multiple underscores with single underscore
    sanitized = re.sub(r'_+', '_', sanitized)
    return sanitized


def convert_excel_to_csv(excel_path, output_dir=None, verbose=True):
    """
    Convert an Excel file with multiple sheets to separate CSV files.

    Args:
        excel_path: Path to the Excel file
        output_dir: Directory to save CSV files (default: same as input file)
        verbose: Print progress information

    Returns:
        List of created CSV file paths
    """
    # Validate input file
    excel_path = Path(excel_path)
    if not excel_path.exists():
        raise FileNotFoundError(f"Excel file not found: {excel_path}")

    if excel_path.suffix.lower() not in ['.xlsx', '.xls']:
        raise ValueError(f"Invalid file format. Expected .xlsx or .xls, got {excel_path.suffix}")

    # Set output directory
    if output_dir is None:
        output_dir = excel_path.parent
    else:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

    # Get base filename without extension
    base_name = excel_path.stem

    if verbose:
        print(f"\n{'='*60}")
        print(f"Converting: {excel_path.name}")
        print(f"Output directory: {output_dir}")
        print(f"{'='*60}\n")

    # Read Excel file
    try:
        # Use openpyxl engine for .xlsx files
        engine = 'openpyxl' if excel_path.suffix.lower() == '.xlsx' else 'xlrd'
        excel_file = pd.ExcelFile(excel_path, engine=engine)
    except Exception as e:
        raise RuntimeError(f"Error reading Excel file: {e}")

    sheet_names = excel_file.sheet_names
    created_files = []

    if verbose:
        print(f"Found {len(sheet_names)} sheet(s) to convert:\n")

    # Process each sheet
    for idx, sheet_name in enumerate(sheet_names, 1):
        try:
            # Read sheet into DataFrame
            df = pd.read_excel(excel_file, sheet_name=sheet_name)

            # Get dimensions
            rows, cols = df.shape

            # Sanitize sheet name for filename
            safe_sheet_name = sanitize_filename(sheet_name)

            # Create output filename
            csv_filename = f"{base_name}_{safe_sheet_name}.csv"
            csv_path = output_dir / csv_filename

            # Save to CSV
            df.to_csv(csv_path, index=False, encoding='utf-8')
            created_files.append(csv_path)

            if verbose:
                status = "✓"
                print(f"  [{idx}/{len(sheet_names)}] {status} {sheet_name}")
                print(f"       → {csv_filename}")
                print(f"       → {rows:,} rows × {cols} columns")
                print()

        except Exception as e:
            if verbose:
                print(f"  [✗] Error processing sheet '{sheet_name}': {e}")
                print()
            continue

    if verbose:
        print(f"{'='*60}")
        print(f"Conversion complete!")
        print(f"Created {len(created_files)} CSV file(s)")
        print(f"{'='*60}\n")

    return created_files


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Convert Excel files with multiple sheets into separate CSV files.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Convert Excel file to CSV files in same directory
  python excel_to_csv_converter.py data.xlsx

  # Convert and save to specific directory
  python excel_to_csv_converter.py data.xlsx output/

  # Quiet mode (no progress output)
  python excel_to_csv_converter.py data.xlsx --quiet
        """
    )

    parser.add_argument(
        'excel_file',
        help='Path to the Excel file (.xlsx or .xls)'
    )

    parser.add_argument(
        'output_dir',
        nargs='?',
        default=None,
        help='Output directory for CSV files (default: same as input file)'
    )

    parser.add_argument(
        '-q', '--quiet',
        action='store_true',
        help='Suppress progress output'
    )

    parser.add_argument(
        '-v', '--version',
        action='version',
        version='%(prog)s 1.0.0'
    )

    args = parser.parse_args()

    try:
        created_files = convert_excel_to_csv(
            args.excel_file,
            args.output_dir,
            verbose=not args.quiet
        )

        if not args.quiet and created_files:
            print("Output files:")
            for file_path in created_files:
                print(f"  - {file_path}")

        return 0

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
