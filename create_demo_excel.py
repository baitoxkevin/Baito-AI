#!/usr/bin/env python3
"""
Create a demo Excel file with multiple sheets for testing the converter.
"""

import pandas as pd
from datetime import datetime, timedelta
import random


def create_demo_excel(filename='demo_data.xlsx'):
    """
    Create a demo Excel file with 3 sheets containing sample data.

    Args:
        filename: Output filename for the Excel file
    """
    print(f"Creating demo Excel file: {filename}")
    print("-" * 60)

    # Sheet 1: Sales Data
    print("\n[1/3] Creating 'Sales Data' sheet...")
    dates = [datetime(2024, 1, 1) + timedelta(days=x) for x in range(100)]
    sales_data = pd.DataFrame({
        'Date': dates,
        'Product': [random.choice(['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard']) for _ in range(100)],
        'Region': [random.choice(['North', 'South', 'East', 'West']) for _ in range(100)],
        'Sales': [random.randint(1000, 10000) for _ in range(100)],
        'Quantity': [random.randint(1, 50) for _ in range(100)],
        'Discount': [round(random.uniform(0, 0.3), 2) for _ in range(100)],
        'Profit_Margin': [round(random.uniform(0.1, 0.4), 2) for _ in range(100)]
    })
    print(f"   ✓ Generated {len(sales_data)} rows × {len(sales_data.columns)} columns")

    # Sheet 2: Employee Data
    print("\n[2/3] Creating 'Employee Records' sheet...")
    departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance']
    employee_data = pd.DataFrame({
        'Employee_ID': [f'EMP{str(i).zfill(4)}' for i in range(1, 51)],
        'Name': [f'Employee {i}' for i in range(1, 51)],
        'Department': [random.choice(departments) for _ in range(50)],
        'Position': [random.choice(['Manager', 'Senior', 'Junior', 'Intern']) for _ in range(50)],
        'Hire_Date': [(datetime(2020, 1, 1) + timedelta(days=random.randint(0, 1460))).strftime('%Y-%m-%d')
                      for _ in range(50)],
        'Salary': [random.randint(40000, 120000) for _ in range(50)],
        'Performance_Rating': [round(random.uniform(3.0, 5.0), 1) for _ in range(50)],
        'Active': [random.choice([True, True, True, False]) for _ in range(50)]
    })
    print(f"   ✓ Generated {len(employee_data)} rows × {len(employee_data.columns)} columns")

    # Sheet 3: Inventory Data
    print("\n[3/3] Creating 'Inventory/Stock' sheet (with special chars)...")
    inventory_data = pd.DataFrame({
        'SKU': [f'SKU-{str(i).zfill(5)}' for i in range(1, 76)],
        'Product_Name': [f'Product {chr(65 + i % 26)}{i}' for i in range(75)],
        'Category': [random.choice(['Electronics', 'Furniture', 'Clothing', 'Food', 'Books'])
                     for _ in range(75)],
        'In_Stock': [random.randint(0, 500) for _ in range(75)],
        'Reserved': [random.randint(0, 50) for _ in range(75)],
        'Reorder_Point': [random.randint(10, 100) for _ in range(75)],
        'Unit_Cost': [round(random.uniform(5, 500), 2) for _ in range(75)],
        'Unit_Price': [round(random.uniform(10, 1000), 2) for _ in range(75)],
        'Supplier': [f'Supplier {chr(65 + i % 10)}' for i in range(75)],
        'Last_Updated': [(datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d %H:%M:%S')
                         for _ in range(75)]
    })
    print(f"   ✓ Generated {len(inventory_data)} rows × {len(inventory_data.columns)} columns")

    # Create Excel writer object
    print(f"\n{'='*60}")
    print("Writing to Excel file...")

    with pd.ExcelWriter(filename, engine='openpyxl') as writer:
        sales_data.to_excel(writer, sheet_name='Sales Data', index=False)
        employee_data.to_excel(writer, sheet_name='Employee Records', index=False)
        inventory_data.to_excel(writer, sheet_name='Inventory/Stock', index=False)

    print(f"✓ Successfully created: {filename}")
    print(f"{'='*60}")
    print("\nDemo file contains:")
    print("  1. Sales Data (100 rows)")
    print("  2. Employee Records (50 rows)")
    print("  3. Inventory/Stock (75 rows) - Note: Contains '/' in name")
    print("\nTest the converter with:")
    print(f"  python excel_to_csv_converter.py {filename}")
    print()


if __name__ == '__main__':
    try:
        create_demo_excel()
    except ImportError as e:
        print(f"Error: Missing required library. Please install dependencies:")
        print(f"  pip install pandas openpyxl")
        print(f"\nDetails: {e}")
    except Exception as e:
        print(f"Error creating demo file: {e}")
