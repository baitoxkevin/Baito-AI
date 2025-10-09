#!/usr/bin/env python3
"""
Excel Vision Processor - TEST MODE
Uses test webhook URL which works in n8n editor
"""

import openpyxl
from PIL import Image, ImageDraw, ImageFont
import base64
import json
import requests
import time
from pathlib import Path
from datetime import datetime

# Configuration - USE TEST WEBHOOK
WEBHOOK_URL = 'http://localhost:5678/webhook-test/vision-to-excel'
BASE_DIR = Path(__file__).parent.parent
SCREENSHOTS_DIR = BASE_DIR / 'excel_screenshots'

# Just test with one file first
TEST_FILE = 'master_candidate_data.xlsx'


def image_to_data_url(image_path):
    """Convert image to base64 data URL"""
    with open(image_path, 'rb') as f:
        image_data = f.read()
    base64_data = base64.b64encode(image_data).decode('utf-8')
    return f"data:image/png;base64,{base64_data}"


def test_single_file():
    """Test with one screenshot"""
    image_path = SCREENSHOTS_DIR / f"{Path(TEST_FILE).stem}.png"

    if not image_path.exists():
        print(f"❌ Screenshot not found: {image_path}")
        return

    print(f"Testing with: {TEST_FILE}")
    print(f"Image: {image_path}")

    try:
        # Convert to data URL
        print("Converting image to base64...")
        image_data_url = image_to_data_url(image_path)
        print(f"✓ Image size: {len(image_data_url)} bytes")

        # Send to webhook
        print(f"\nSending to webhook: {WEBHOOK_URL}")
        payload = {
            'image': image_data_url,
            'metadata': {
                'filename': TEST_FILE,
                'processedAt': datetime.now().isoformat()
            }
        }

        response = requests.post(
            WEBHOOK_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=120
        )

        print(f"\nStatus: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS!")
            print(f"Records extracted: {result.get('extractedRecords', 0)}")
            print(json.dumps(result, indent=2))
        else:
            print(f"❌ Error {response.status_code}")
            print(response.text[:500])

    except Exception as error:
        print(f"❌ Error: {error}")


if __name__ == '__main__':
    print('Excel Vision Processor - TEST MODE')
    print('=' * 50)
    test_single_file()
