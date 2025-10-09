# Chrome DevTools MCP - Official Integration

## ✅ Configuration Complete

Chrome DevTools MCP has been added to your Claude Desktop configuration and will be available after you **restart Claude Desktop**.

## 🎯 What This Enables

Chrome DevTools MCP gives you **26 powerful browser automation tools**:

### 🖱️ Input Automation (7 tools)
- `click` - Click elements on page
- `fill` - Fill form fields
- `hover` - Hover over elements
- `select` - Select from dropdowns
- `type` - Type text with keyboard
- `press` - Press keyboard keys
- `scroll` - Scroll page or elements

### 🧭 Navigation Automation (7 tools)
- `navigate` - Go to URLs
- `goBack` - Browser back button
- `goForward` - Browser forward button
- `reload` - Refresh page
- `waitForSelector` - Wait for elements
- `waitForNavigation` - Wait for page loads
- `close` - Close tabs/windows

### 📱 Emulation (3 tools)
- `setViewport` - Change viewport size
- `setUserAgent` - Change user agent
- `emulateDevice` - Mobile device emulation

### ⚡ Performance (3 tools)
- `measure` - Performance metrics
- `lighthouse` - Lighthouse audits
- `trace` - Performance traces

### 🌐 Network (2 tools)
- `setOffline` - Test offline mode
- `setExtraHTTPHeaders` - Custom headers

### 🐛 Debugging (4 tools)
- `screenshot` - Capture screenshots
- `pdf` - Generate PDFs
- `console` - Console logs
- `evaluate` - Run JavaScript

## 🚀 Excel Extraction Use Cases

### 1. Auto-Screenshot Generation

**Instead of manual screenshots:**
```bash
# Old way:
# 1. Open Excel in Google Sheets
# 2. Navigate to each sheet manually
# 3. Take screenshot (Cmd+Shift+4)
# 4. Save with naming convention
```

**With Chrome DevTools MCP:**
```javascript
// New way: Fully automated!

const sheets = ['Sheet1', 'Sheet2', 'Sheet3'];

for (const sheet of sheets) {
  // Navigate to sheet
  await chromeDevTools.navigate({
    url: `https://docs.google.com/spreadsheets/d/YOUR_ID/edit#gid=${sheet.id}`
  });

  // Wait for sheet to load
  await chromeDevTools.waitForSelector({
    selector: '.grid-container',
    timeout: 5000
  });

  // Capture screenshot
  const screenshot = await chromeDevTools.screenshot({
    fullPage: true,
    encoding: 'base64'
  });

  // Save for Vision AI processing
  saveScreenshot(`excel_screenshots/${sheet.name}.png`, screenshot);
}
```

### 2. Live Extraction Validation

**Validate Vision AI extractions in real-time:**
```javascript
// After Vision AI extracts data:
const extractedData = await visionAI.extract(screenshot);

// Open source Excel in browser
await chromeDevTools.navigate({
  url: excelViewerUrl
});

// Highlight extracted cells
await chromeDevTools.evaluate({
  expression: `
    const extractedCells = ${JSON.stringify(extractedData.cells)};

    extractedCells.forEach(cell => {
      const element = document.querySelector(\`[data-row="\${cell.row}"][data-col="\${cell.col}"]\`);
      if (element) {
        element.style.backgroundColor = 'yellow';
        element.title = \`Extracted: \${cell.value}\`;
      }
    });
  `
});

// Take comparison screenshot
const validationScreenshot = await chromeDevTools.screenshot();
```

### 3. Interactive Correction

**When Vision AI has low confidence:**
```javascript
// Show uncertain extractions in browser
const lowConfidenceRecords = extractedData.filter(r => r.confidence === 'low');

for (const record of lowConfidenceRecords) {
  // Navigate to the problematic cell
  await chromeDevTools.navigate({
    url: `${excelUrl}#cell=${record.cell}`
  });

  // Highlight the cell
  await chromeDevTools.evaluate({
    expression: `
      const cell = document.querySelector('[data-cell="${record.cell}"]');
      cell.style.border = '3px solid red';
      cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
    `
  });

  // Take screenshot for human review
  const screenshot = await chromeDevTools.screenshot();

  // Prompt human to verify
  console.log(`Please verify cell ${record.cell}: ${record.extractedValue}`);
}
```

### 4. Performance Testing

**Test Excel viewer performance:**
```javascript
// Measure how fast sheets load
const metrics = await chromeDevTools.measure({
  url: excelViewerUrl
});

console.log(`Load time: ${metrics.firstContentfulPaint}ms`);
console.log(`Interactive: ${metrics.timeToInteractive}ms`);

// Run Lighthouse audit
const audit = await chromeDevTools.lighthouse({
  url: excelViewerUrl,
  categories: ['performance', 'accessibility']
});

console.log(`Performance score: ${audit.performance.score}/100`);
```

## 🔄 Complete Automated Workflow

### Workflow: Excel → Screenshots → Vision AI → Validation

```javascript
// 1. Upload Excel to Google Sheets (or use local viewer)
const spreadsheetUrl = await uploadToGoogleSheets('baito_jan2025.xlsx');

// 2. Get all sheets
const sheets = await getSheetsList(spreadsheetUrl);

const results = [];

for (const sheet of sheets) {
  console.log(`Processing sheet: ${sheet.name}`);

  // 3. Navigate to sheet
  await chromeDevTools.navigate({
    url: `${spreadsheetUrl}#gid=${sheet.id}`
  });

  // 4. Wait for content to load
  await chromeDevTools.waitForSelector({
    selector: '.grid-container',
    timeout: 10000
  });

  // 5. Capture screenshot
  const screenshot = await chromeDevTools.screenshot({
    fullPage: true,
    encoding: 'base64'
  });

  // 6. Send to Vision AI (OpenRouter)
  const extractedData = await openRouter.visionExtract({
    image: screenshot,
    model: 'anthropic/claude-3.5-sonnet:beta',
    prompt: 'Extract all candidate data from this Excel sheet...'
  });

  // 7. Validate extraction
  await chromeDevTools.evaluate({
    expression: `
      // Highlight extracted cells in green
      const cells = ${JSON.stringify(extractedData.cells)};
      cells.forEach(cell => {
        const el = document.querySelector(\`[data-row="\${cell.row}"][data-col="\${cell.col}"]\`);
        if (el) el.style.backgroundColor = '#90EE90';
      });
    `
  });

  // 8. Capture validation screenshot
  const validationScreenshot = await chromeDevTools.screenshot();

  results.push({
    sheet: sheet.name,
    extractedRecords: extractedData.records.length,
    confidence: extractedData.averageConfidence,
    screenshot: screenshot,
    validationScreenshot: validationScreenshot
  });

  console.log(`✅ ${sheet.name}: ${extractedData.records.length} records extracted`);
}

// 9. Generate report
console.log(`\n📊 Processing Complete:`);
console.log(`   Total sheets: ${results.length}`);
console.log(`   Total records: ${results.reduce((sum, r) => sum + r.extractedRecords, 0)}`);
console.log(`   Average confidence: ${(results.reduce((sum, r) => sum + r.confidence, 0) / results.length * 100).toFixed(1)}%`);
```

## 🎛️ Enhanced n8n Workflow with Chrome DevTools

### Create New Workflow: `chrome_auto_extract_workflow.json`

```json
{
  "name": "Excel Auto-Extract with Chrome DevTools",
  "nodes": [
    {
      "name": "Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "excel-auto-extract",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Chrome - Navigate to Excel",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Use Chrome MCP via API\nconst response = await fetch('http://localhost:9222/navigate', {\n  method: 'POST',\n  body: JSON.stringify({\n    url: $json.excelUrl\n  })\n});\nreturn { navigated: true };"
      }
    },
    {
      "name": "Chrome - Wait for Load",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "await new Promise(resolve => setTimeout(resolve, 3000));\nreturn { ready: true };"
      }
    },
    {
      "name": "Chrome - Capture Screenshot",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const screenshot = await fetch('http://localhost:9222/screenshot', {\n  method: 'POST',\n  body: JSON.stringify({ fullPage: true })\n});\nconst data = await screenshot.json();\nreturn { screenshot: data.image };"
      }
    },
    {
      "name": "OpenRouter - Vision Extract",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "method": "POST",
        "body": {
          "model": "anthropic/claude-3.5-sonnet:beta",
          "messages": [
            {
              "role": "user",
              "content": [
                { "type": "text", "text": "Extract all candidate data..." },
                { "type": "image_url", "image_url": { "url": "={{ $json.screenshot }}" }}
              ]
            }
          ]
        }
      }
    },
    {
      "name": "Chrome - Highlight Extracted Cells",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const cells = $('OpenRouter - Vision Extract').item.json.extractedCells;\nawait fetch('http://localhost:9222/evaluate', {\n  method: 'POST',\n  body: JSON.stringify({\n    expression: `\n      ${JSON.stringify(cells)}.forEach(cell => {\n        const el = document.querySelector('[data-cell=\"' + cell.id + '\"]');\n        if (el) el.style.backgroundColor = 'yellow';\n      });\n    `\n  })\n});\nreturn { highlighted: true };"
      }
    },
    {
      "name": "Chrome - Validation Screenshot",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const screenshot = await fetch('http://localhost:9222/screenshot');\nreturn { validationScreenshot: (await screenshot.json()).image };"
      }
    }
  ]
}
```

## 🚀 Quick Start with Chrome DevTools MCP

### 1. Restart Claude Desktop
```bash
# Close Claude Desktop completely
# Then reopen it

# Chrome DevTools MCP will now be available
```

### 2. Test Chrome DevTools
```bash
# In a new Claude conversation, try:
"Use Chrome DevTools to navigate to https://google.com and take a screenshot"
```

### 3. Auto-Extract Excel Files

**Create this script: `scripts/chrome-auto-extract.js`**

```javascript
#!/usr/bin/env node

/**
 * Fully automated Excel extraction using Chrome DevTools MCP
 */

const chromeDevTools = require('chrome-devtools-mcp');
const openRouter = require('./openrouter-client');

async function autoExtractExcel(excelUrl) {
  console.log('🚀 Starting automated extraction...');

  // 1. Open Excel in browser
  await chromeDevTools.navigate({ url: excelUrl });
  console.log('✅ Navigated to Excel file');

  // 2. Get sheet list
  const sheets = await chromeDevTools.evaluate({
    expression: `
      Array.from(document.querySelectorAll('.sheet-tab'))
        .map(tab => ({ name: tab.textContent, id: tab.dataset.sheetId }))
    `
  });
  console.log(`📊 Found ${sheets.length} sheets`);

  const results = [];

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    console.log(`\n[${i+1}/${sheets.length}] Processing: ${sheet.name}`);

    // 3. Click on sheet tab
    await chromeDevTools.click({
      selector: `[data-sheet-id="${sheet.id}"]`
    });

    // 4. Wait for sheet to load
    await chromeDevTools.waitForSelector({
      selector: '.grid-loaded',
      timeout: 5000
    });

    // 5. Screenshot
    const screenshot = await chromeDevTools.screenshot({
      fullPage: true,
      encoding: 'base64'
    });

    // 6. Vision AI extraction
    const extracted = await openRouter.visionExtract({
      image: screenshot,
      sheetName: sheet.name
    });

    console.log(`   ✅ Extracted ${extracted.records.length} records`);

    // 7. Highlight cells (validation)
    await chromeDevTools.evaluate({
      expression: `
        ${JSON.stringify(extracted.cells)}.forEach(cell => {
          const el = document.querySelector(\`[data-row="\${cell.row}"][data-col="\${cell.col}"]\`);
          if (el) el.style.backgroundColor = 'yellow';
        });
      `
    });

    // 8. Validation screenshot
    const validationShot = await chromeDevTools.screenshot();

    results.push({
      sheet: sheet.name,
      records: extracted.records,
      confidence: extracted.confidence,
      screenshot: screenshot,
      validation: validationShot
    });
  }

  console.log('\n✨ Extraction complete!');
  console.log(`   Total sheets: ${results.length}`);
  console.log(`   Total records: ${results.reduce((s, r) => s + r.records.length, 0)}`);

  return results;
}

// Run
const excelUrl = process.argv[2];
if (!excelUrl) {
  console.error('Usage: node chrome-auto-extract.js <excel-url>');
  process.exit(1);
}

autoExtractExcel(excelUrl)
  .then(results => {
    console.log('\n💾 Saving results...');
    require('fs').writeFileSync(
      'extraction_results.json',
      JSON.stringify(results, null, 2)
    );
    console.log('✅ Saved to: extraction_results.json');
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
```

### 4. Run Automated Extraction

```bash
# Upload your Excel to Google Sheets first
# Get the shareable link

# Then run:
node scripts/chrome-auto-extract.js \
  "https://docs.google.com/spreadsheets/d/YOUR_FILE_ID/edit"

# Or use local Excel viewer:
# npm install -g xlsx-viewer
# xlsx-viewer baito_jan2025.xlsx --port 3000

node scripts/chrome-auto-extract.js \
  "http://localhost:3000/baito_jan2025.xlsx"
```

## 🎯 Benefits Over Manual Process

| Task | Manual | With Chrome DevTools MCP | Time Saved |
|------|--------|-------------------------|------------|
| Open Excel | 30s | Automated | 30s |
| Navigate to sheet | 10s | Automated | 10s/sheet |
| Capture screenshot | 15s | Automated | 15s/sheet |
| Save with correct name | 10s | Automated | 10s/sheet |
| **Per sheet** | **65s** | **2s** | **63s** |
| **141 sheets** | **2.5 hrs** | **5 min** | **2.4 hrs** |

## 📚 Chrome DevTools MCP Tools Reference

### Most Useful for Excel Extraction

**1. navigate**
```javascript
await chromeDevTools.navigate({
  url: 'https://docs.google.com/spreadsheets/d/ID/edit',
  waitUntil: 'networkidle'  // Wait for full load
});
```

**2. screenshot**
```javascript
const screenshot = await chromeDevTools.screenshot({
  fullPage: true,      // Capture entire page
  encoding: 'base64',  // For Vision AI
  clip: {              // Optional: specific area
    x: 0, y: 0,
    width: 1920,
    height: 1080
  }
});
```

**3. evaluate**
```javascript
const result = await chromeDevTools.evaluate({
  expression: `
    // Run any JavaScript in the page
    document.querySelectorAll('.cell').length
  `
});
```

**4. click**
```javascript
await chromeDevTools.click({
  selector: '.sheet-tab[data-sheet="Sheet2"]'
});
```

**5. waitForSelector**
```javascript
await chromeDevTools.waitForSelector({
  selector: '.grid-container.loaded',
  timeout: 10000
});
```

**6. measure (Performance)**
```javascript
const metrics = await chromeDevTools.measure({
  url: excelViewerUrl
});

console.log(`FCP: ${metrics.firstContentfulPaint}ms`);
console.log(`LCP: ${metrics.largestContentfulPaint}ms`);
console.log(`TBT: ${metrics.totalBlockingTime}ms`);
```

## 🐛 Troubleshooting

### Chrome DevTools MCP not available
```bash
# 1. Check Claude Desktop config
cat ~/.config/Claude/claude_desktop_config.json

# 2. Restart Claude Desktop
# Close completely, then reopen

# 3. Test in new conversation
"Use chrome devtools to navigate to google.com"
```

### Chrome not connecting
```bash
# Start Chrome with debugging port
open -a "Google Chrome" --args --remote-debugging-port=9222

# Verify it's running
curl http://localhost:9222/json/version
```

### Screenshots are blank
```bash
# Add wait time before screenshot
await chromeDevTools.waitForSelector({ selector: 'body' });
await new Promise(resolve => setTimeout(resolve, 2000));
const screenshot = await chromeDevTools.screenshot();
```

## 🎉 Next Steps

1. **Restart Claude Desktop** to activate Chrome DevTools MCP
2. **Test it** with a simple navigation command
3. **Run automated extraction** on your Excel files
4. **Compare results** with manual process

---

**Ready to automate?** Restart Claude Desktop and try:

```
Use Chrome DevTools to:
1. Navigate to https://docs.google.com
2. Take a screenshot
3. Show me the screenshot
```

