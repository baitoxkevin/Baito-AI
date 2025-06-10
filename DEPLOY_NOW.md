# 🚀 Quick Deploy to Netlify

## Option 1: Manual Build & Deploy (Recommended)

### Step 1: Build the project
```bash
npm install
npm run build
```

### Step 2: Create deployment zip
After building, you'll have a `dist` folder. To deploy:

1. **On Mac**: 
   - Right-click the `dist` folder
   - Select "Compress dist"
   - This creates `dist.zip`

2. **On Windows**:
   - Right-click the `dist` folder
   - Select "Send to" > "Compressed (zipped) folder"

### Step 3: Deploy to Netlify
1. Go to https://app.netlify.com
2. Drag your `dist.zip` file to the deployment area
3. Wait for deployment to complete

### Step 4: Set Environment Variables
In your Netlify dashboard:
1. Go to Site settings > Environment variables
2. Add these variables:
   ```
   VITE_SUPABASE_URL = https://aoiwrdzlichescqgnohi.supabase.co
   VITE_SUPABASE_ANON_KEY = [Your actual anon key from Supabase]
   ```

## Option 2: Direct Folder Deploy

1. Build the project: `npm run build`
2. Go to https://app.netlify.com
3. Drag the entire `dist` folder (not zipped) to the deployment area

## Option 3: GitHub Deploy (Best for Updates)

1. Push your code to GitHub
2. In Netlify:
   - New site from Git
   - Connect to GitHub
   - Select your repository
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variables
   - Deploy!

## 🔑 Getting Your Supabase Keys

1. Go to https://app.supabase.com
2. Select "BaitoAI" project
3. Settings > API
4. Copy:
   - Project URL
   - `anon` public key (under Project API keys)

## ✅ Deployment Checklist

- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Run `npm run build` successfully
- [ ] Have Supabase URL and anon key ready
- [ ] Created Netlify account
- [ ] Set environment variables in Netlify

## 🎯 Your site will be live at:
`https://[your-site-name].netlify.app`

## Need Help?
- Build errors? Run `npm run type-check` to find issues
- 404 errors? Check that `_redirects` file exists
- API errors? Verify environment variables are set correctly