#!/bin/bash

echo "Deactivating workflow..."
curl -X PATCH http://localhost:5678/api/v1/workflows/xf6roS7APOSTr4JF \
  -H "Content-Type: application/json" \
  -d '{"active": false}'

echo -e "\n\nWaiting 3 seconds..."
sleep 3

echo -e "\nReactivating workflow..."
curl -X PATCH http://localhost:5678/api/v1/workflows/xf6roS7APOSTr4JF \
  -H "Content-Type: application/json" \
  -d '{"active": true}'

echo -e "\n\nTesting webhook..."
curl -X POST http://localhost:5678/webhook/vision-to-excel \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/png;base64,test", "metadata": {"filename": "test.xlsx"}}' \
  -v 2>&1 | grep "HTTP"

echo -e "\nDone!"
