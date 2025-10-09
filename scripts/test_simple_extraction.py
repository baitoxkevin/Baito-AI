#!/usr/bin/env python3
import requests
import base64
import json
import re
from pathlib import Path

GEMINI_API_KEY = "AIzaSyAUzT3o4vg-Htn-l_rd_JiujplI48Mjf4Q"
BASE_DIR = Path("/Users/baito.kevin/Downloads/dev/BMAD-METHOD/Baito/Baito-AI")
screenshot = BASE_DIR / "excel_screenshots/master_candidate_data.png"

def call_gemini(image_base64, prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": "image/png", "data": image_base64}}
            ]
        }]
    }
    response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=120)
    response.raise_for_status()
    return response.json()['candidates'][0]['content']['parts'][0]['text']

def extract_json(text):
    # Try markdown JSON block first
    json_match = re.search(r'```json\n([\s\S]*?)\n```', text)
    if json_match:
        return json.loads(json_match.group(1))
    
    # Try regular markdown block
    json_match = re.search(r'```\n([\s\S]*?)\n```', text)
    if json_match:
        return json.loads(json_match.group(1))
    
    # Try raw JSON
    try:
        return json.loads(text)
    except:
        print(f"Could not parse JSON. Raw response:\n{text[:500]}")
        raise

print("Loading image...")
with open(screenshot, 'rb') as f:
    image_base64 = base64.b64encode(f.read()).decode('utf-8')

print("\nExtracting candidates with simple prompt...")
prompt = """Extract all candidates from this Excel payroll sheet.

For each candidate, extract:
- fullname
- ic (IC number)
- bank
- bank_no (bank account number - remove .0 suffix)
- wages
- total_payment

Return ONLY a JSON array of candidate objects. No explanation, just JSON."""

response_text = call_gemini(image_base64, prompt)
print(f"\n=== Raw Response (first 300 chars) ===")
print(response_text[:300])

print("\n\n=== Parsing JSON ===")
candidates = extract_json(response_text)

print(f"\n✓ Extracted {len(candidates)} candidates")
print(f"\nFirst 3 candidates:")
for i, candidate in enumerate(candidates[:3], 1):
    print(f"{i}. {candidate.get('fullname', 'N/A')} - IC:{candidate.get('ic', 'N/A')}")

# Save result
output_file = BASE_DIR / "excel_extraction_results/simple_test_result.json"
output_file.parent.mkdir(exist_ok=True, parents=True)
with open(output_file, 'w') as f:
    json.dump(candidates, f, indent=2)

print(f"\n✓ Saved to: {output_file}")
