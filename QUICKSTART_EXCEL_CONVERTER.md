# Quick Start Guide - Excel to CSV Converter

## Installation (30 seconds)

```bash
# Install dependencies
pip install -r requirements.txt
```

## Test It Now (1 minute)

```bash
# 1. Create demo Excel file
python create_demo_excel.py

# 2. Convert it to CSV files
python excel_to_csv_converter.py demo_data.xlsx

# 3. Check the results
ls -lh demo_data_*.csv
```

## Expected Output

You should see 3 CSV files created:
- `demo_data_Sales_Data.csv` (100 rows)
- `demo_data_Employee_Records.csv` (50 rows)
- `demo_data_Inventory_Stock.csv` (75 rows - note: '/' sanitized to '_')

## Common Usage Patterns

### Convert your own Excel file
```bash
python excel_to_csv_converter.py your_file.xlsx
```

### Save to specific folder
```bash
python excel_to_csv_converter.py your_file.xlsx output/
```

### Silent mode (no progress output)
```bash
python excel_to_csv_converter.py your_file.xlsx --quiet
```

## What Gets Created

For an Excel file named `report.xlsx` with sheets "Jan", "Feb", "Mar":
```
report_Jan.csv
report_Feb.csv
report_Mar.csv
```

## Troubleshooting

**Problem:** `ModuleNotFoundError: No module named 'pandas'`
**Solution:** Run `pip install -r requirements.txt`

**Problem:** `FileNotFoundError`
**Solution:** Check the file path is correct

**Problem:** `Invalid file format`
**Solution:** File must be .xlsx or .xls

## Next Steps

See `README_EXCEL_CONVERTER.md` for:
- Detailed feature documentation
- Advanced usage examples
- API reference for programmatic use
- Troubleshooting guide
