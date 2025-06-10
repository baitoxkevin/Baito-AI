# Netlify Deployment Instructions

## Prerequisites
1. A Netlify account (free tier is sufficient)
2. Your Supabase project credentials

## Step 1: Prepare for Deployment

### 1.1 Set Environment Variables
Before deploying, you need to set your Supabase credentials. Create a `.env.production` file:

```
VITE_SUPABASE_URL=https://aoiwrdzlichescqgnohi.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

**Important**: Get your actual anon key from:
1. Go to your Supabase dashboard
2. Select your project (BaitoAI)
3. Go to Settings > API
4. Copy the `anon` public key

### 1.2 Build the Project Locally
```bash
cd "project 10"
npm install
npm run build
```

This will create a `dist` folder with your production build.

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify CLI
1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod --dir=dist
   ```

### Option B: Deploy via Drag & Drop
1. Build your project: `npm run build`
2. Go to https://app.netlify.com
3. Drag the `dist` folder to the deployment area

### Option C: Deploy via Git (Recommended)
1. Push your code to GitHub/GitLab/Bitbucket
2. In Netlify:
   - Click "New site from Git"
   - Connect your repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Click "Deploy site"

## Step 3: Configure Environment Variables in Netlify

1. Go to your site settings in Netlify
2. Navigate to "Environment variables"
3. Add these variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

## Step 4: Set Up Custom Domain (Optional)

1. In Netlify site settings, go to "Domain management"
2. Add your custom domain
3. Follow DNS configuration instructions

## Project Structure for Deployment

```
project-10/
├── dist/                  # Build output (created after npm run build)
├── src/                   # Source code
├── public/               # Static assets
├── netlify.toml          # Netlify configuration
├── _redirects            # SPA routing configuration
├── package.json          # Dependencies
└── vite.config.ts        # Vite configuration
```

## Important Files

- **netlify.toml**: Contains build settings and redirect rules
- **_redirects**: Ensures SPA routing works correctly
- **.env.production**: Production environment variables (not committed to git)

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test authentication (login/logout)
- [ ] Check calendar view functionality
- [ ] Test project creation and editing
- [ ] Verify staff management works
- [ ] Check that all API calls use HTTPS
- [ ] Test on mobile devices

## Troubleshooting

### Build Fails
- Check Node version (should be 18+)
- Ensure all dependencies are listed in package.json
- Check for TypeScript errors: `npm run type-check`

### 404 Errors on Routes
- Ensure _redirects file exists
- Check netlify.toml redirect configuration

### API/Supabase Connection Issues
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure RLS policies allow access

## Security Considerations

1. Never commit `.env` files to git
2. Use environment variables for all sensitive data
3. Enable HTTPS (automatic on Netlify)
4. Review and update CORS settings if needed
5. Regularly update dependencies

## Support

For Netlify-specific issues: https://docs.netlify.com
For Supabase issues: https://supabase.com/docs