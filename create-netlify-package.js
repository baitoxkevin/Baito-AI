const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('Creating Netlify deployment package...');

// Create output stream
const output = fs.createWriteStream(path.join(__dirname, 'baito-events-netlify.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

// Handle errors
archive.on('error', (err) => {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Files and directories to include
const filesToInclude = [
  'src/',
  'public/',
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'tailwind.config.js',
  'postcss.config.js',
  'index.html',
  'netlify.toml',
  'components.json',
  'eslint.config.js',
  'README.md',
  'NETLIFY_DEPLOYMENT.md',
  '.env.production'
];

// Add files to archive
filesToInclude.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      archive.directory(filePath, file, {
        // Exclude certain patterns
        ignore: [
          '**/node_modules/**',
          '**/.git/**',
          '**/*.log',
          '**/dist/**',
          '**/build/**',
          '**/.DS_Store',
          '**/debug*',
          '**/test-*'
        ]
      });
    } else {
      archive.file(filePath, { name: file });
    }
  }
});

// Finalize the archive
output.on('close', () => {
  console.log(`✅ Archive created: baito-events-netlify.zip (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`);
  console.log('\n📋 Next steps:');
  console.log('1. Upload baito-events-netlify.zip to Netlify');
  console.log('2. Set environment variables in Netlify dashboard:');
  console.log('   - VITE_SUPABASE_URL = https://aoiwrdzlichescqgnohi.supabase.co');
  console.log('   - VITE_SUPABASE_ANON_KEY = [Your BaitoAI anon key]');
  console.log('3. Deploy!');
});

archive.finalize();