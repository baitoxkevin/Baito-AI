#!/usr/bin/env python3
import requests, base64, json, re, openpyxl
from pathlib import Path
from datetime import datetime

GEMINI_API_KEY = "AIzaSyAUzT3o4vg-Htn-l_rd_JiujplI48Mjf4Q"
BASE_DIR = Path(__file__).parent.parent
SCREENSHOTS_DIR = BASE_DIR / "excel_screenshots"
OUTPUT_DIR = BASE_DIR / "excel_extraction_results"

FILES = [
    'master_candidate_data.xlsx',
    'master_candidate_data_v2.xlsx',
    'baito_2025_full_year_master.xlsx',
    'zenevento_2025_master.xlsx',
    'combined_2025_master.xlsx'
]

def call_gemini(img_b64, prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={GEMINI_API_KEY}"
    r = requests.post(url, json={"contents": [{"parts": [{"text": prompt}, {"inline_data": {"mime_type": "image/png", "data": img_b64}}]}]}, timeout=120)
    r.raise_for_status()
    return r.json()['candidates'][0]['content']['parts'][0]['text']

def extract_json(text):
    m = re.search(r'```json\n([\s\S]*?)\n```', text)
    if m: return json.loads(m.group(1))
    m = re.search(r'```\n([\s\S]*?)\n```', text)
    if m: return json.loads(m.group(1))
    return json.loads(text)

print("="*60)
print("SIMPLE EXTRACTION (WORKING VERSION)")
print("="*60)

all_results = []

for fname in FILES:
    print(f"\n{'='*60}\n{fname}\n{'='*60}")
    screenshot = SCREENSHOTS_DIR / f"{Path(fname).stem}.png"
    
    if not screenshot.exists():
        print("  ✗ Screenshot not found")
        continue
    
    print("  Loading image...")
    with open(screenshot, 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode('utf-8')
    
    print("  Extracting candidates (simple prompt)...")
    try:
        prompt = "Extract ALL candidates from this payroll sheet as JSON array. Each candidate: fullname, ic, bank, bank_no, wages, total_payment. Remove .0 from bank account numbers. Return ONLY JSON, no explanation."
        
        text = call_gemini(img_b64, prompt)
        candidates = extract_json(text)
        print(f"  ✓ Extracted {len(candidates)} candidates")
        
        OUTPUT_DIR.mkdir(exist_ok=True, parents=True)
        with open(OUTPUT_DIR / f"{Path(fname).stem}_simple.json", 'w') as f:
            json.dump(candidates, f, indent=2)
        
        all_results.append({'file': fname, 'success': True, 'candidates': candidates})
    except Exception as e:
        print(f"  ✗ Error: {e}")
        all_results.append({'file': fname, 'success': False, 'candidates': []})
    
    print("  Waiting 5 seconds...")
    import time
    time.sleep(5)

# Generate masterlist
print(f"\n{'='*60}\nGenerating Masterlist\n{'='*60}")
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "MASTERLIST"

headers = ["Full Name", "IC Number", "Bank", "Bank Account No", "Wages", "Total Payment", "Source File"]
for i, h in enumerate(headers, 1):
    ws.cell(1, i, h).font = openpyxl.styles.Font(bold=True)

row = 2
for r in all_results:
    if not r['success']: continue
    for c in r['candidates']:
        ws.cell(row, 1, c.get('fullname', ''))
        ws.cell(row, 2, c.get('ic', ''))
        ws.cell(row, 3, c.get('bank', ''))
        ws.cell(row, 4, c.get('bank_no', ''))
        ws.cell(row, 5, c.get('wages', ''))
        ws.cell(row, 6, c.get('total_payment', ''))
        ws.cell(row, 7, r['file'])
        row += 1

ml_file = OUTPUT_DIR / f"MASTERLIST_SIMPLE_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
wb.save(ml_file)
print(f"✓ Masterlist: {ml_file}")

print(f"\n{'='*60}\nSUMMARY\n{'='*60}")
print(f"Total files: {len(FILES)}")
print(f"Successful: {sum(1 for r in all_results if r['success'])}")
print(f"Total candidates: {sum(len(r['candidates']) for r in all_results)}")
