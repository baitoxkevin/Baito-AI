#!/usr/bin/env python3
"""
Excel Vision Processor - DIRECT GEMINI API
Calls Gemini 2.0 Flash directly via OpenRouter (no n8n needed)
"""

import openpyxl
from PIL import Image, ImageDraw, ImageFont
import base64
import json
import requests
import time
import os
from pathlib import Path
from datetime import datetime

# Configuration
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')  # Get from environment variable
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.0-flash-exp:free"

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / 'excel_extraction_results'
SCREENSHOTS_DIR = BASE_DIR / 'excel_screenshots'

# Excel files to process
EXCEL_FILES = [
    'master_candidate_data.xlsx',
    'master_candidate_data_v2.xlsx',
    'baito_2025_full_year_master.xlsx',
    'zenevento_2025_master.xlsx',
    'combined_2025_master.xlsx',
]


def image_to_data_url(image_path):
    """Convert image to base64 data URL"""
    with open(image_path, 'rb') as f:
        image_data = f.read()
    base64_data = base64.b64encode(image_data).decode('utf-8')
    return f"data:image/png;base64,{base64_data}"


def call_gemini_vision(image_data_url, prompt):
    """Call Gemini via OpenRouter with vision"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://baito-ai.app",
        "X-Title": "Baito Excel Extractor",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_data_url}}
            ]
        }]
    }

    response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=120)
    response.raise_for_status()

    result = response.json()
    return result['choices'][0]['message']['content']


def extract_json_from_response(text):
    """Extract JSON from AI response (handles markdown code blocks)"""
    import re

    # Try to find JSON in markdown code blocks
    json_match = re.search(r'```json\n([\s\S]*?)\n```', text)
    if json_match:
        return json.loads(json_match.group(1))

    json_match = re.search(r'```\n([\s\S]*?)\n```', text)
    if json_match:
        return json.loads(json_match.group(1))

    # Try parsing the whole response as JSON
    return json.loads(text)


def process_excel_file(filename):
    """Process a single Excel file with Gemini"""
    image_path = SCREENSHOTS_DIR / f"{Path(filename).stem}.png"
    result_path = OUTPUT_DIR / f"{Path(filename).stem}_result.json"

    print(f"\n=== Processing: {filename} ===")

    if not image_path.exists():
        print(f"✗ Screenshot not found: {image_path}")
        return {"success": False, "error": "Screenshot not found"}

    try:
        # Convert image to data URL
        print("Converting image to base64...")
        image_data_url = image_to_data_url(image_path)

        # Step 1: Extract data with Gemini
        print("Sending to Gemini for extraction...")
        extraction_prompt = """Analyze this Excel spreadsheet for a staffing/event management company (Baito).

Extract ALL candidate data with reasoning:

**FOR EACH ROW:**
1. Is this a data row, continuation row, or summary row?
2. Which candidate does this row belong to?
3. What is the semantic meaning of each cell value?

**HANDLE MERGED CELLS:**
- If cell is empty but row has data → check if it's a continuation
- Group continuation rows with their parent row

**EXCLUDE:**
- Summary rows ("Total", "Grand Total")
- Non-person entries

Return JSON array of CANDIDATE RECORDS:
[
  {
    "candidateName": "string",
    "icNumber": "string",
    "extractedData": {
      "name": "string",
      "ic": "string",
      "phone": "string",
      "bankName": "string",
      "accountNumber": "string",
      "totalDays": number,
      "wages": number,
      "totalPayment": number,
      "paymentDate": "YYYY-MM-DD",
      "projectName": "string"
    },
    "confidence": "high|medium|low"
  }
]"""

        raw_response = call_gemini_vision(image_data_url, extraction_prompt)
        print(f"✓ Got response from Gemini ({len(raw_response)} chars)")

        # Parse the response
        try:
            extracted_data = extract_json_from_response(raw_response)
        except:
            print("⚠️  Could not parse as JSON, saving raw response")
            extracted_data = {"raw_response": raw_response}

        # Save result
        result = {
            "filename": filename,
            "processedAt": datetime.now().isoformat(),
            "model": MODEL,
            "extractedRecords": len(extracted_data) if isinstance(extracted_data, list) else 0,
            "data": extracted_data
        }

        with open(result_path, 'w') as f:
            json.dump(result, f, indent=2)

        records_count = len(extracted_data) if isinstance(extracted_data, list) else 0
        print(f"✓ Extracted {records_count} records")
        print(f"✓ Result saved to: {result_path.name}")

        return {"success": True, "records": records_count}

    except Exception as error:
        print(f"✗ Error: {error}")
        return {"success": False, "error": str(error)}


def main():
    """Main execution"""
    print('Excel Gemini Direct Extractor')
    print('Using: Gemini 2.0 Flash (FREE) via OpenRouter')
    print('=' * 50 + '\n')

    # Create output directories
    OUTPUT_DIR.mkdir(exist_ok=True)

    # Process all Excel files
    results = []
    for filename in EXCEL_FILES:
        result = process_excel_file(filename)
        results.append({"filename": filename, **result})

        # Add delay between requests to avoid rate limiting
        print(f"Waiting 15 seconds before next file...")
        time.sleep(15)

    # Summary
    print('\n' + '=' * 50)
    print('=== Summary ===')
    successful = [r for r in results if r.get('success')]
    failed = [r for r in results if not r.get('success')]

    print(f"Total files: {len(results)}")
    print(f"Successful: {len(successful)}")
    print(f"Failed: {len(failed)}")

    if successful:
        total_records = sum(r.get('records', 0) for r in successful)
        print(f"Total records extracted: {total_records}")

    print(f"\nResults saved in: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
