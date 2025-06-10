# Manual Commands to Create Netlify Deployment Zip

Since the automated scripts are having issues, please run these commands manually in your terminal:

## Option 1: Using zip command (Recommended)

Navigate to the project directory and run:

```bash
cd "/Users/baito.kevin/Downloads/project 10"

# Remove existing zip if it exists
rm -f baito-events-netlify.zip

# Create the zip file
zip -r baito-events-netlify.zip \
  src/ \
  public/ \
  package.json \
  package-lock.json \
  pnpm-lock.yaml \
  tsconfig.json \
  tsconfig.app.json \
  tsconfig.node.json \
  components.json \
  eslint.config.js \
  postcss.config.js \
  tailwind.config.js \
  vite.config.ts \
  vite.config.enhanced.ts \
  index.html \
  index-enhanced.html \
  netlify.toml \
  README.md \
  NETLIFY_DEPLOYMENT.md \
  -x "*.sql" \
  -x "*test*" \
  -x "*debug*" \
  -x ".env" \
  -x ".env.local" \
  -x ".env.development" \
  -x "*.zip" \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "dist/*" \
  -x "build/*" \
  -x "supabase/*" \
  -x "*.tsbuildinfo" \
  -x "*backup*" \
  -x "*original*"
```

## Option 2: Using the shell script

```bash
cd "/Users/baito.kevin/Downloads/project 10"
chmod +x create-netlify-zip.sh
./create-netlify-zip.sh
```

## Option 3: Using the Python script

```bash
cd "/Users/baito.kevin/Downloads/project 10"
python3 create-netlify-zip.py
```

## After Creating the Zip

The zip file `baito-events-netlify.zip` will be created in the project directory. You can then:

1. Go to https://app.netlify.com
2. Drag and drop the zip file to deploy
3. Or use Netlify CLI: `netlify deploy --prod --dir=.`

## Note about .env.production

If you need to create a `.env.production` file, create it with your production environment variables before running the zip command:

```bash
# Example .env.production content
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```