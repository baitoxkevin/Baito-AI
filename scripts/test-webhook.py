#!/usr/bin/env python3
import requests
import json

# Test webhook
url = 'http://localhost:5678/webhook/vision-to-excel'
payload = {
    'image': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'metadata': {'filename': 'test.xlsx'}
}

print('Testing webhook...')
try:
    response = requests.post(url, json=payload, timeout=30)
    print(f'Status: {response.status_code}')
    print(f'Response: {response.text[:200]}')
    if response.status_code == 200:
        print('✅ Webhook is ACTIVE and working!')
    else:
        print(f'⚠️  Got status {response.status_code}')
except Exception as e:
    print(f'❌ Error: {e}')
