#!/usr/bin/env python3
import requests, base64, json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
screenshot = BASE_DIR / "excel_screenshots/master_candidate_data.png"

print("Testing n8n webhook...")
print(f"Screenshot: {screenshot}")

with open(screenshot, 'rb') as f:
    img_b64 = base64.b64encode(f.read()).decode('utf-8')

payload = {"image_base64": img_b64}

print("Sending to n8n webhook...")
response = requests.post(
    "http://localhost:5678/webhook/vision-to-excel",
    json=payload,
    timeout=60
)

print(f"\nStatus: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    print(f"✓ Success! Extracted {result.get('count', 0)} candidates")
    print(f"\nFirst candidate:")
    if result.get('candidates'):
        print(json.dumps(result['candidates'][0], indent=2))
else:
    print(f"✗ Error: {response.text}")
