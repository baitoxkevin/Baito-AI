#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('dist')) {
      getAllTsFiles(filePath, fileList);
    } else if (file.match(/\.(ts|tsx)$/) && !file.includes('.d.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Fix any types
function fixAnyTypes(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // More comprehensive any replacements
  const replacements = [
    // Simple any arrays
    { from: /:\s*any\[\]/g, to: ': unknown[]' },
    // Simple any
    { from: /:\s*any(?=\s*[;,\)}\]])/g, to: ': unknown' },
    // Record<string, any>
    { from: /Record<string,\s*any>/g, to: 'Record<string, unknown>' },
    // Generic any
    { from: /<any>/g, to: '<unknown>' },
    // Function parameters
    { from: /\(([^:)]+):\s*any\)/g, to: '($1: unknown)' },
    // Multiple parameters
    { from: /,\s*([^:,)]+):\s*any(?=[,)])/g, to: ', $1: unknown' },
    // Array destructuring
    { from: /\[([^:]+):\s*any\]/g, to: '[$1: unknown]' },
    // Type assertions
    { from: /as\s+any(?=\s*[;,\)}\]])/g, to: 'as unknown' },
    // Return types
    { from: /\):\s*any(?=\s*{)/g, to: '): unknown' },
    // Promise<any>
    { from: /Promise<any>/g, to: 'Promise<unknown>' },
    // any in generics
    { from: /<([^<>]*),\s*any>/g, to: '<$1, unknown>' },
    { from: /<any,\s*([^<>]*)>/g, to: '<unknown, $1>' },
  ];
  
  replacements.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed any types in: ${filePath}`);
    return true;
  }
  return false;
}

// Main execution
console.log('Starting any type fixes...\n');

const srcDir = path.join(__dirname, 'src');
const files = getAllTsFiles(srcDir);
let fixedCount = 0;

console.log(`Found ${files.length} TypeScript files to process\n`);

// Process each file
files.forEach(file => {
  try {
    if (fixAnyTypes(file)) {
      fixedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log(`\nFixed any types in ${fixedCount} files`);
console.log('\nRunning ESLint to check remaining issues...');

try {
  execSync('npx eslint src --fix', { stdio: 'inherit' });
} catch (error) {
  // ESLint will exit with error if there are unfixable issues
}

console.log('\nAny type fixes completed!');