const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing Netlify deployment...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Make sure you run this from the project root.');
  process.exit(1);
}

// Step 1: Check for environment variables
console.log('📋 Checking environment setup...');
if (!fs.existsSync('.env') && !fs.existsSync('.env.production')) {
  console.warn('⚠️  Warning: No .env or .env.production file found.');
  console.log('   Creating .env.example for reference...');
  
  const envExample = `# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Get these values from:
# 1. Go to https://app.supabase.com
# 2. Select your project
# 3. Go to Settings > API
# 4. Copy the URL and anon key
`;
  
  fs.writeFileSync('.env.example', envExample);
  console.log('   ✅ Created .env.example - copy this to .env and fill in your values\n');
}

// Step 2: Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('   ✅ Dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Step 3: Run build
console.log('🔨 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('   ✅ Build completed\n');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// Step 4: Check build output
if (!fs.existsSync('dist')) {
  console.error('❌ Error: dist folder not found after build');
  process.exit(1);
}

// Step 5: Create deployment checklist
const checklist = `
✅ Build completed successfully!

📋 Deployment Checklist:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before deploying to Netlify:

1. Environment Variables:
   □ Set VITE_SUPABASE_URL in Netlify
   □ Set VITE_SUPABASE_ANON_KEY in Netlify

2. Deployment Options:

   Option A - Drag & Drop:
   • Go to https://app.netlify.com
   • Drag the 'dist' folder to deploy

   Option B - CLI Deploy:
   • Install: npm install -g netlify-cli
   • Deploy: netlify deploy --prod --dir=dist

   Option C - Git Integration:
   • Push to GitHub
   • Connect repo in Netlify
   • Auto-deploy on push

3. Post-Deployment:
   □ Test all routes work
   □ Verify authentication
   □ Check API connections
   □ Test on mobile

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Your build is ready in the 'dist' folder!
`;

console.log(checklist);

// Step 6: Create zip file for manual deployment
console.log('📦 Creating deployment zip...');
const archiver = require('archiver');
const output = fs.createWriteStream('netlify-deploy.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`   ✅ Created netlify-deploy.zip (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`);
  console.log('\n🎉 Deployment preparation complete!');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory('dist/', false);
archive.finalize();