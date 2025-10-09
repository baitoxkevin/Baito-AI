#!/usr/bin/env python3
import requests
import json

# Try test webhook URL
url = 'http://localhost:5678/webhook-test/xf6roS7APOSTr4JF/vision-to-excel'
payload = {
    'image': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'metadata': {'filename': 'test.xlsx'}
}

print('Testing webhook-test URL...')
try:
    response = requests.post(url, json=payload, timeout=30)
    print(f'Status: {response.status_code}')
    print(f'Response: {response.text[:200]}')
    if response.status_code == 200:
        print('✅ Test webhook is working!')
    else:
        print(f'⚠️  Got status {response.status_code}')
except Exception as e:
    print(f'❌ Error: {e}')
