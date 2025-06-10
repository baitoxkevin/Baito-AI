#!/usr/bin/env node

/**
 * Script to replace console.log statements with secure logger
 * Follows OWASP secure coding practices
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  srcDir: path.join(__dirname, '..', 'src'),
  filePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/logger.ts'],
  backupDir: path.join(__dirname, '..', 'console-log-backup'),
};

// Mapping of console methods to logger methods
const consoleToLogger = {
  'console.log': 'logger.debug',
  'console.debug': 'logger.debug',
  'console.info': 'logger.info',
  'console.warn': 'logger.warn',
  'console.error': 'logger.error',
  'console.trace': 'logger.debug',
  'console.table': 'logger.debug',
  'console.dir': 'logger.debug',
  'console.time': '// logger.performance', // Comment out timing
  'console.timeEnd': '// logger.performance', // Comment out timing
};

let totalFiles = 0;
let modifiedFiles = 0;
let totalReplacements = 0;

// Create backup directory
if (!fs.existsSync(config.backupDir)) {
  fs.mkdirSync(config.backupDir, { recursive: true });
}

// Get all files to process
function getFiles() {
  const files = [];
  config.filePatterns.forEach(pattern => {
    const matches = glob.sync(path.join(config.srcDir, pattern), {
      ignore: config.excludePatterns.map(p => path.join(config.srcDir, p))
    });
    files.push(...matches);
  });
  return [...new Set(files)]; // Remove duplicates
}

// Check if file already imports logger
function hasLoggerImport(content) {
  return content.includes("from '@/lib/logger'") || 
         content.includes('from "@/lib/logger"') ||
         content.includes("from '../lib/logger'") ||
         content.includes('from "../lib/logger"');
}

// Add logger import to file
function addLoggerImport(content, filePath) {
  if (hasLoggerImport(content)) return content;

  // Calculate relative path to logger
  const relativePath = path.relative(path.dirname(filePath), path.join(config.srcDir, 'lib/logger.ts'));
  const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
  const cleanPath = importPath.replace(/\.ts$/, '');

  // Find where to insert import
  const importRegex = /^(import\s+.*?;\s*)+/m;
  const importMatch = content.match(importRegex);

  if (importMatch) {
    // Add after existing imports
    const lastImportEnd = importMatch.index + importMatch[0].length;
    return content.slice(0, lastImportEnd) + 
           `import { logger } from '${cleanPath}';\n` + 
           content.slice(lastImportEnd);
  } else {
    // Add at the beginning of file
    return `import { logger } from '${cleanPath}';\n\n` + content;
  }
}

// Process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fileModified = false;
    let replacements = 0;

    // Skip if it's the logger file itself
    if (filePath.includes('logger.ts') || filePath.includes('logger.js')) {
      return;
    }

    // Replace console statements
    Object.entries(consoleToLogger).forEach(([consoleMethod, loggerMethod]) => {
      const regex = new RegExp(`\\b${consoleMethod.replace('.', '\\.')}\\s*\\(`, 'g');
      const matches = content.match(regex);
      
      if (matches) {
        content = content.replace(regex, `${loggerMethod}(`);
        replacements += matches.length;
        fileModified = true;
      }
    });

    // Handle console.log with template literals and multiple arguments
    content = content.replace(
      /logger\.debug\((.*?)\)/gs,
      (match, args) => {
        // Convert template literals to proper format
        if (args.includes('`') && args.includes('${')) {
          return `logger.debug(${args})`;
        }
        // Handle multiple arguments
        if (args.includes(',')) {
          const firstComma = args.indexOf(',');
          const message = args.substring(0, firstComma).trim();
          const context = args.substring(firstComma + 1).trim();
          return `logger.debug(${message}, { data: ${context} })`;
        }
        return match;
      }
    );

    // If file was modified, add logger import and save
    if (fileModified) {
      content = addLoggerImport(content, filePath);
      
      // Create backup
      const backupPath = path.join(config.backupDir, path.relative(config.srcDir, filePath));
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.writeFileSync(backupPath, originalContent);
      
      // Save modified file
      fs.writeFileSync(filePath, content);
      
      modifiedFiles++;
      totalReplacements += replacements;
      console.log(`✓ Processed ${filePath} - ${replacements} replacements`);
    }
    
    totalFiles++;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🔍 Scanning for console.log statements...\n');

const files = getFiles();
console.log(`Found ${files.length} files to process\n`);

files.forEach(processFile);

console.log('\n📊 Summary:');
console.log(`Total files scanned: ${totalFiles}`);
console.log(`Files modified: ${modifiedFiles}`);
console.log(`Total replacements: ${totalReplacements}`);
console.log(`\nBackups saved to: ${config.backupDir}`);

// Create a restoration script
const restoreScript = `#!/bin/bash
# Restore original files from backup
cp -r "${config.backupDir}/"* "${config.srcDir}/"
echo "Files restored from backup"
`;

fs.writeFileSync(path.join(__dirname, 'restore-console-logs.sh'), restoreScript);
fs.chmodSync(path.join(__dirname, 'restore-console-logs.sh'), '755');

console.log('\n✅ Complete! To restore original files, run: npm run restore-console-logs');