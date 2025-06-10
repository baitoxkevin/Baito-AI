# Netlify Deployment Guide

## Pre-deployment Checklist ✅

1. **Environment Variables** - Set these in Netlify dashboard:
   - `VITE_SUPABASE_URL` = `https://aoiwrdzlichescqgnohi.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = Your BaitoAI project anon key
   - `VITE_GOOGLE_AI_API_KEY` = (Optional) Your Google AI key

2. **Build Settings** in Netlify:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18.x or higher

3. **Important Files**:
   - `netlify.toml` - Contains redirect rules and headers
   - `.env.production` - Template for environment variables

## Known Issues Fixed:
- ✅ QuickAuthCheck component now only shows in development
- ✅ User profiles created for all auth users
- ✅ Database pointing to BaitoAI project
- ✅ Missing `is_active` column added to users table

## Post-deployment Steps:

1. **Update Supabase Auth Settings**:
   - Add your Netlify URL to authorized URLs in Supabase dashboard
   - Update redirect URLs for authentication

2. **Test Critical Features**:
   - User login/logout
   - User management in Settings
   - Project creation and management
   - Expense claims submission

## Database Info:
- Project: BaitoAI (aoiwrdzlichescqgnohi)
- Region: us-east-1
- Has all required tables: users, projects, companies, candidates, expense_claims

## Support Contacts:
- Admin: admin@baito.events (super_admin)
- Technical: admin@baitoai.com (super_admin)