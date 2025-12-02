# Deployment Guide - Profile Test Standalone

## Quick Deploy to Netlify

### Method 1: Drag & Drop (Easiest)

1. **Build the project**:
   ```bash
   cd profile-test-standalone
   npm install
   npm run build
   ```

2. **Deploy**:
   - Go to https://app.netlify.com/drop
   - Drag the `dist` folder into the upload area
   - Wait for deployment to complete
   - You'll get a URL like: `https://random-name-12345.netlify.app`

### Method 2: Netlify CLI (Recommended)

```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Navigate to standalone folder
cd profile-test-standalone

# Install dependencies
npm install

# Login to Netlify
netlify login

# Deploy to production
npm run build
netlify deploy --prod --dir=dist
```

Follow the prompts:
- **Team**: Select your team
- **Site name**: Choose a unique name (e.g., `profile-test-baito`)
- The site will be deployed to: `https://your-site-name.netlify.app`

### Method 3: Connect Git Repository (Best for continuous deployment)

1. **Create a new Git repository**:
   ```bash
   cd profile-test-standalone
   git init
   git add .
   git commit -m "Initial commit - Profile test standalone"
   ```

2. **Push to GitHub/GitLab**:
   ```bash
   # Create a new repo on GitHub
   # Then push to it
   git remote add origin https://github.com/your-username/profile-test-standalone.git
   git branch -M main
   git push -u origin main
   ```

3. **Connect to Netlify**:
   - Go to https://app.netlify.com
   - Click "Add new site" > "Import an existing project"
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Select the repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
     - **Node version**: Leave as default or set to 18

4. **Deploy**:
   - Click "Deploy site"
   - Your site will be live in ~2 minutes
   - Every git push will automatically trigger a new deployment

## Custom Domain (Optional)

### Add a Custom Domain in Netlify:

1. Go to your site in Netlify dashboard
2. Go to "Site settings" > "Domain management"
3. Click "Add custom domain"
4. Follow instructions to update DNS records

Example:
- You can use: `profile-test.yourdomain.com`
- Or any subdomain you prefer

## Environment-Specific URLs

Since this is a test page separate from your main app, consider these naming conventions:

- **Test/Staging**: `profile-test-staging.netlify.app`
- **Demo**: `profile-demo.netlify.app`
- **UAT**: `profile-uat.netlify.app`

## Post-Deployment Checklist

After deploying, test the following:

### ✅ Mobile Testing
- [ ] Open on actual mobile device (iOS/Android)
- [ ] Test 4-photo grid (should show 2x2 on mobile)
- [ ] Test form validation
- [ ] Test QR code modal
- [ ] Test keyboard navigation on desktop

### ✅ Browser Testing
- [ ] Chrome (desktop & mobile)
- [ ] Safari (desktop & mobile)
- [ ] Firefox
- [ ] Edge

### ✅ Functionality Testing
- [ ] Fill all required fields
- [ ] Upload/delete photos
- [ ] Test form validation errors
- [ ] Test unsaved changes warning
- [ ] Test QR code generation
- [ ] Test keyboard shortcuts (Alt + arrows)
- [ ] Test responsive layout at different screen sizes

## Troubleshooting

### Build Fails

```bash
# Clear everything and rebuild
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Deployment URL Not Working

- Check that `netlify.toml` is present
- Verify redirects are configured for SPA routing
- Check Netlify build logs for errors

### White Screen After Deployment

- Check browser console for errors
- Verify all imports are correct
- Make sure base path in Vite config is correct

## Updating the Site

### Quick Update (Drag & Drop):

```bash
npm run build
# Then drag new dist folder to Netlify
```

### CLI Update:

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Git Update (Auto-deploy):

```bash
git add .
git commit -m "Update profile form"
git push
# Netlify will automatically rebuild and deploy
```

## Monitoring

- **Site Analytics**: Available in Netlify dashboard
- **Build Logs**: Check for any deployment issues
- **Function Logs**: N/A (this is a static site)

## Cost

- **Netlify Free Tier**:
  - ✅ 100GB bandwidth/month
  - ✅ 300 build minutes/month
  - ✅ Unlimited sites
  - ✅ Custom domains
  - ✅ HTTPS included

This standalone deployment will NOT affect your main site or use its quotas.

## Rollback

If you need to rollback to a previous version:

1. Go to Netlify dashboard
2. Click "Deploys"
3. Find the working version
4. Click "Publish deploy" to rollback

## Security

- HTTPS is automatically enabled by Netlify
- No environment variables needed (test page only)
- No backend API calls (standalone test mode)

## Share the Link

Once deployed, you can share the Netlify URL with:
- QA team for testing
- Stakeholders for review
- Mobile testers for device testing

The standalone page is completely independent from your main application at `baitoai.netlify.app`!
