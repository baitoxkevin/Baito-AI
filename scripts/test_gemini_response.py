#!/usr/bin/env python3
import requests
import base64
from pathlib import Path

GEMINI_API_KEY = "AIzaSyAUzT3o4vg-Htn-l_rd_JiujplI48Mjf4Q"
SCREENSHOTS_DIR = Path("/Users/baito.kevin/Downloads/dev/BMAD-METHOD/Baito/Baito-AI/excel_screenshots")

# Load one image
screenshot = SCREENSHOTS_DIR / "master_candidate_data.png"
with open(screenshot, 'rb') as f:
    image_base64 = base64.b64encode(f.read()).decode('utf-8')

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={GEMINI_API_KEY}"
payload = {
    "contents": [{
        "parts": [
            {"text": "Extract candidate names and IC numbers from this Excel sheet. Return as JSON array."},
            {"inline_data": {"mime_type": "image/png", "data": image_base64}}
        ]
    }]
}

print("Sending request to Gemini...")
response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=180)
print(f"Status: {response.status_code}")
print(f"Response JSON:")
print(response.json())
