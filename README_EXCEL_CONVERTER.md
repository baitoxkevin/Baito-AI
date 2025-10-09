# Excel to CSV Converter

A Python command-line tool that converts Excel files with multiple sheets into separate CSV files.

## Features

- ✅ Support for both `.xlsx` and `.xls` formats
- ✅ Extracts each sheet into a separate CSV file
- ✅ Automatic filename sanitization (handles special characters)
- ✅ Progress reporting with row/column counts
- ✅ Custom output directory support
- ✅ UTF-8 encoding support
- ✅ Error handling for corrupted sheets

## Requirements

- Python 3.7 or higher
- pandas
- openpyxl
- xlrd

## Installation

1. **Clone or download this repository**

2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

Or install individually:

```bash
pip install pandas openpyxl xlrd
```

## Usage

### Basic Usage

Convert an Excel file to CSV files in the same directory:

```bash
python excel_to_csv_converter.py input.xlsx
```

### Specify Output Directory

Save CSV files to a specific directory:

```bash
python excel_to_csv_converter.py input.xlsx output/
```

### Quiet Mode

Suppress progress output:

```bash
python excel_to_csv_converter.py input.xlsx --quiet
```

### Help

View all available options:

```bash
python excel_to_csv_converter.py --help
```

## Output Format

CSV files are named using the pattern: `originalname_SheetName.csv`

**Example:**
- Input: `sales_data.xlsx` with sheets: "Q1", "Q2", "Q3"
- Output:
  - `sales_data_Q1.csv`
  - `sales_data_Q2.csv`
  - `sales_data_Q3.csv`

## Features in Detail

### Special Character Handling

Sheet names with special characters are automatically sanitized:

- Characters like `<>:"/\|?*` are replaced with underscores
- Leading/trailing spaces and dots are removed
- Multiple consecutive underscores are reduced to single underscores

**Example:**
- Sheet name: `Sales/Revenue (Q1)`
- Output filename: `data_Sales_Revenue_Q1.csv`

### Progress Reporting

The tool displays detailed progress information:

```
============================================================
Converting: sales_data.xlsx
Output directory: /path/to/output
============================================================

Found 3 sheet(s) to convert:

  [1/3] ✓ Q1 Sales
       → sales_data_Q1_Sales.csv
       → 1,250 rows × 8 columns

  [2/3] ✓ Q2 Sales
       → sales_data_Q2_Sales.csv
       → 1,180 rows × 8 columns

  [3/3] ✓ Q3 Sales
       → sales_data_Q3_Sales.csv
       → 1,320 rows × 8 columns

============================================================
Conversion complete!
Created 3 CSV file(s)
============================================================
```

### Error Handling

- Validates file existence and format
- Gracefully handles corrupted sheets
- Provides clear error messages
- Continues processing remaining sheets if one fails

## Testing with Demo Data

A demo Excel file creator is included to test the tool:

1. **Create demo Excel file:**

```bash
python create_demo_excel.py
```

This creates `demo_data.xlsx` with 3 sample sheets.

2. **Convert the demo file:**

```bash
python excel_to_csv_converter.py demo_data.xlsx
```

3. **Check output files:**

```bash
ls -lh demo_data_*.csv
```

## Command-Line Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `excel_file` | Yes | Path to the Excel file (.xlsx or .xls) |
| `output_dir` | No | Output directory for CSV files (default: same as input) |
| `--quiet, -q` | No | Suppress progress output |
| `--version, -v` | No | Show version information |
| `--help, -h` | No | Show help message |

## Examples

### Example 1: Basic Conversion

```bash
python excel_to_csv_converter.py financial_report.xlsx
```

### Example 2: Organize Output

```bash
python excel_to_csv_converter.py data.xlsx csv_output/
```

### Example 3: Batch Processing

```bash
# Convert multiple files
for file in *.xlsx; do
  python excel_to_csv_converter.py "$file" csv_exports/
done
```

### Example 4: Use in Scripts

```python
from excel_to_csv_converter import convert_excel_to_csv

# Convert programmatically
files = convert_excel_to_csv('data.xlsx', 'output/', verbose=False)
print(f"Created {len(files)} CSV files")
```

## Troubleshooting

### Error: "No module named 'openpyxl'"

Install the required dependencies:

```bash
pip install -r requirements.txt
```

### Error: "Excel file not found"

Check that:
- The file path is correct
- The file exists
- You have read permissions

### Error: "Invalid file format"

Ensure the file has a `.xlsx` or `.xls` extension.

### Empty CSV Files

Check if:
- The Excel sheets contain data
- The sheets aren't protected
- The file isn't corrupted

## Performance

- Small files (< 1 MB): Near instant
- Medium files (1-10 MB): 1-5 seconds
- Large files (10-100 MB): 5-30 seconds
- Very large files (> 100 MB): May require additional memory

## Limitations

- Maximum file size depends on available system memory
- Very large sheets may be slow to process
- Formula results are exported, not the formulas themselves
- Formatting (colors, fonts, etc.) is not preserved

## License

MIT License - Feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Version History

- **1.0.0** (2025-10-08)
  - Initial release
  - Support for .xlsx and .xls formats
  - Progress reporting
  - Special character handling
  - Custom output directory

## Support

For issues or questions, please create an issue in the repository.
