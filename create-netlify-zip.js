const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create output stream
const output = fs.createWriteStream(path.join(__dirname, 'baito-events-netlify.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

// Listen for archive events
output.on('close', function() {
  console.log(`Archive created: baito-events-netlify.zip (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`);
});

archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add directories
archive.directory('src/', 'src/', {
  ignore: [
    '**/test-*',
    '**/debug*',
    '**/*test*',
    '**/*backup*',
    '**/*original*'
  ]
});

archive.directory('public/', 'public/');

// Add specific files
const filesToAdd = [
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'components.json',
  'eslint.config.js',
  'postcss.config.js',
  'tailwind.config.js',
  'vite.config.ts',
  'vite.config.enhanced.ts',
  'index.html',
  'index-enhanced.html',
  'netlify.toml',
  'README.md',
  'NETLIFY_DEPLOYMENT.md'
];

filesToAdd.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    archive.file(file, { name: file });
  }
});

// Check for .env.production
if (fs.existsSync(path.join(__dirname, '.env.production'))) {
  archive.file('.env.production', { name: '.env.production' });
}

// Finalize the archive
archive.finalize();