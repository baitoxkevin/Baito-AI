#!/usr/bin/env node

/**
 * Excel Vision Processor
 * Converts Excel files to images and sends them to n8n workflow for AI extraction
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const WEBHOOK_URL = 'http://localhost:5678/webhook/vision-to-excel';
const EXCEL_DIR = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(__dirname, '..', 'excel_extraction_results');
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'excel_screenshots');

// Excel files to process
const EXCEL_FILES = [
  'master_candidate_data.xlsx',
  'master_candidate_data_v2.xlsx',
  'baito_2025_full_year_master.xlsx',
  'zenevento_2025_master.xlsx',
  'combined_2025_master.xlsx',
  'baito_2025_full_year_master_CORRECTED.xlsx',
  'baito_2025_VALIDATED_v3.xlsx',
  'baito_2025_VALIDATED_v3_FIXED.xlsx',
  'baito_2025_FIXED_v3.2.xlsx',
  'baito_2025_COMPLETE_v3.xlsx'
];

/**
 * Convert Excel file to screenshot using Python
 */
async function convertExcelToImage(excelPath, outputPath) {
  console.log(`Converting ${path.basename(excelPath)} to image...`);

  const pythonScript = `
import openpyxl
from PIL import Image, ImageDraw, ImageFont
import json
import sys

def excel_to_image(excel_path, output_path):
    """Convert Excel to image with cell-by-cell rendering"""
    try:
        wb = openpyxl.load_workbook(excel_path, data_only=True)
        sheet = wb.active

        # Calculate image dimensions
        col_widths = {}
        for col_idx, col in enumerate(sheet.columns, 1):
            col_letter = openpyxl.utils.get_column_letter(col_idx)
            width = sheet.column_dimensions[col_letter].width
            col_widths[col_idx] = int((width if width else 10) * 7)

        row_heights = {}
        for row_idx in range(1, sheet.max_row + 1):
            height = sheet.row_dimensions[row_idx].height
            row_heights[row_idx] = int((height if height else 15) * 1.3)

        img_width = sum(col_widths.values()) + 20
        img_height = sum(row_heights.values()) + 20

        # Create image
        img = Image.new('RGB', (img_width, img_height), 'white')
        draw = ImageDraw.Draw(img)

        try:
            font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 12)
        except:
            font = ImageFont.load_default()

        # Draw grid and cells
        y_offset = 10
        for row_idx, row in enumerate(sheet.iter_rows(min_row=1, max_row=sheet.max_row), 1):
            x_offset = 10
            for col_idx, cell in enumerate(row, 1):
                cell_width = col_widths[col_idx]
                cell_height = row_heights[row_idx]

                # Draw cell border
                draw.rectangle(
                    [x_offset, y_offset, x_offset + cell_width, y_offset + cell_height],
                    outline='black',
                    width=1
                )

                # Draw cell value
                if cell.value is not None:
                    text = str(cell.value)[:50]  # Truncate long text
                    draw.text((x_offset + 5, y_offset + 5), text, fill='black', font=font)

                x_offset += cell_width
            y_offset += cell_height

        img.save(output_path, 'PNG')
        print(json.dumps({"success": True, "path": output_path}))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

excel_to_image('${excelPath}', '${outputPath}')
`;

  const tempScriptPath = path.join(SCREENSHOTS_DIR, 'temp_convert.py');
  await fs.writeFile(tempScriptPath, pythonScript);

  try {
    const { stdout, stderr } = await execAsync(`python3 ${tempScriptPath}`);
    if (stderr) console.error('Python stderr:', stderr);

    const result = JSON.parse(stdout.trim());
    if (!result.success) {
      throw new Error(result.error);
    }

    console.log(`✓ Image created: ${path.basename(outputPath)}`);
    return outputPath;
  } finally {
    await fs.unlink(tempScriptPath).catch(() => {});
  }
}

/**
 * Convert image to base64 data URL
 */
async function imageToDataURL(imagePath) {
  const imageBuffer = await fs.readFile(imagePath);
  const base64 = imageBuffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}

/**
 * Send image to n8n webhook for processing
 */
async function sendToWorkflow(imageDataURL, metadata) {
  console.log(`Sending ${metadata.filename} to n8n workflow...`);

  const payload = {
    image: imageDataURL,
    metadata: metadata
  };

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Process a single Excel file
 */
async function processExcelFile(filename) {
  const excelPath = path.join(EXCEL_DIR, filename);
  const imagePath = path.join(SCREENSHOTS_DIR, `${path.parse(filename).name}.png`);
  const resultPath = path.join(OUTPUT_DIR, `${path.parse(filename).name}_result.json`);

  console.log(`\n=== Processing: ${filename} ===`);

  try {
    // Step 1: Convert Excel to image
    await convertExcelToImage(excelPath, imagePath);

    // Step 2: Convert image to base64
    const imageDataURL = await imageToDataURL(imagePath);

    // Step 3: Send to n8n workflow
    const result = await sendToWorkflow(imageDataURL, {
      filename: filename,
      processedAt: new Date().toISOString(),
      imagePath: imagePath
    });

    // Step 4: Save result
    await fs.writeFile(resultPath, JSON.stringify(result, null, 2));

    console.log(`✓ Extracted ${result.extractedRecords} records from ${filename}`);
    console.log(`✓ Result saved to: ${path.basename(resultPath)}`);

    return {
      success: true,
      filename,
      records: result.extractedRecords,
      validation: result.validationReport
    };

  } catch (error) {
    console.error(`✗ Error processing ${filename}:`, error.message);
    return {
      success: false,
      filename,
      error: error.message
    };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('Excel Vision Processor');
  console.log('======================\n');

  // Create output directories
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });

  // Check if webhook is accessible
  try {
    console.log('Checking n8n webhook...');
    const testResponse = await fetch(WEBHOOK_URL, { method: 'GET' });
    console.log(`✓ Webhook accessible (status: ${testResponse.status})\n`);
  } catch (error) {
    console.error('✗ Cannot connect to n8n webhook!');
    console.error('  Make sure:');
    console.error('  1. n8n is running at http://localhost:5678');
    console.error('  2. Workflow "Excel Vision Extractor" is ACTIVE');
    console.error('  3. Webhook path is "vision-to-excel"\n');
    process.exit(1);
  }

  // Process all Excel files
  const results = [];
  for (const filename of EXCEL_FILES) {
    const result = await processExcelFile(filename);
    results.push(result);

    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n=== Summary ===');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Total files: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  if (successful.length > 0) {
    const totalRecords = successful.reduce((sum, r) => sum + (r.records || 0), 0);
    console.log(`Total records extracted: ${totalRecords}`);
  }

  if (failed.length > 0) {
    console.log('\nFailed files:');
    failed.forEach(r => console.log(`  - ${r.filename}: ${r.error}`));
  }

  console.log(`\nResults saved in: ${OUTPUT_DIR}`);
  console.log(`Screenshots saved in: ${SCREENSHOTS_DIR}`);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { processExcelFile, convertExcelToImage };
