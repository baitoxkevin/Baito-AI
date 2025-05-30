#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript and JavaScript files
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('dist')) {
      getAllFiles(filePath, fileList);
    } else if (file.match(/\.(ts|tsx|js|jsx)$/) && !file.includes('.d.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Fix unused imports
function fixUnusedImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Common unused imports pattern
  const unusedPatterns = [
    // Remove unused React imports if not using JSX
    { pattern: /import\s+React\s+from\s+['"]react['"]\s*;?\s*\n/g, check: (content) => !content.includes('<') },
    // Remove empty import lines
    { pattern: /import\s*{\s*}\s*from\s*['"][^'"]+['"]\s*;?\s*\n/g, check: () => true },
  ];
  
  unusedPatterns.forEach(({ pattern, check }) => {
    if (check(content)) {
      const newContent = content.replace(pattern, '');
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in: ${filePath}`);
  }
}

// Fix any types
function fixAnyTypes(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Common any replacements
  const replacements = [
    { from: /:\s*any\[\]/g, to: ': unknown[]' },
    { from: /:\s*any(?=\s*[;,\)])/g, to: ': unknown' },
    { from: /Record<string,\s*any>/g, to: 'Record<string, unknown>' },
    { from: /<any>/g, to: '<unknown>' },
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
  }
}

// Add missing dependencies to useEffect
function fixUseEffectDeps(filePath) {
  if (!filePath.includes('.tsx') && !filePath.includes('.jsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Simple pattern to add common missing deps
  const pattern = /useEffect\(\(\)\s*=>\s*{[\s\S]*?},\s*\[\]\)/g;
  
  // This is a simplified fix - in reality, we'd need AST parsing
  // For now, just log files that need manual review
  if (pattern.test(content)) {
    console.log(`Needs useEffect deps review: ${filePath}`);
  }
}

// Main execution
console.log('Starting lint fixes...\n');

const srcDir = path.join(__dirname, 'src');
const files = getAllFiles(srcDir);

console.log(`Found ${files.length} files to process\n`);

// Process each file
files.forEach(file => {
  try {
    fixUnusedImports(file);
    fixAnyTypes(file);
    fixUseEffectDeps(file);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

// Run ESLint fix
console.log('\nRunning ESLint auto-fix...');
try {
  execSync('npx eslint src --fix', { stdio: 'inherit' });
} catch (error) {
  // ESLint will exit with error if there are unfixable issues
  console.log('ESLint auto-fix completed with some remaining issues');
}

console.log('\nLint fixes completed!');