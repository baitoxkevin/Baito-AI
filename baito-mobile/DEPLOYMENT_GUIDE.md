# 🚀 Deployment Guide: Baito Mobile

**Complete guide to deploy Baito Mobile to production**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Build Setup](#build-setup)
5. [iOS Deployment](#ios-deployment)
6. [Android Deployment](#android-deployment)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Accounts
- ✅ Expo Account (https://expo.dev)
- ✅ Apple Developer Account ($99/year) - for iOS
- ✅ Google Play Console ($25 one-time) - for Android
- ✅ Supabase Account (FREE)

### Required Tools
```bash
# Install Node.js 18+ and npm
node --version  # v18.0.0 or higher

# Install EAS CLI globally
npm install -g eas-cli

# Install Expo CLI
npm install -g expo-cli

# Login to Expo
eas login
```

### Verify Installation
```bash
eas --version   # Should show v5.2.0 or higher
expo --version  # Should show latest version
```

---

## 2. Database Setup

### Step 1: Apply All Migrations

**Go to:** https://app.supabase.com/project/aoiwrdzlichescqgnohi/sql/new

**Run these migrations in order:**

#### Week 2-3: Foundation
```sql
-- 1. Gamification System
supabase/migrations/20251002010000_create_gamification_tables.sql

-- 2. Fix Attendance Policies
supabase/migrations/20251002010001_fix_attendance_policies.sql
```

#### Week 4: Notifications
```sql
-- 3. Notification System
supabase/migrations/20251002020000_create_notifications_system.sql

-- 4. Fix Notification Trigger
supabase/migrations/20251002020001_fix_notification_trigger.sql
```

#### Week 5: Analytics
```sql
-- 5. Analytics Views
supabase/migrations/20251002030000_create_analytics_views.sql
```

#### Week 6: Payments
```sql
-- 6. Payment System
supabase/migrations/20251002040000_create_payment_system.sql
```

### Step 2: Verify Database

**Check Tables Exist:**
```sql
-- Run this query to verify all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Tables:**
- achievements
- attendance
- candidates
- expense_claims
- leaderboard
- notifications
- payment_batches
- payment_batch_items
- payment_history
- project_staff
- projects
- push_tokens
- salary_configurations
- scheduled_notifications
- users
- worker_earnings

### Step 3: Verify Functions

**Check Functions Exist:**
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Expected Functions:**
- broadcast_announcement
- calculate_worker_earnings
- create_payment_batch
- get_analytics_summary
- get_revenue_trend
- get_shift_completion_rate
- get_worker_performance_history
- notify_achievement_unlock
- process_payment_batch
- schedule_shift_reminders
- send_notification

---

## 3. Environment Configuration

### Step 1: Create .env.production

```bash
# Copy template
cp .env.production.example .env.production
```

### Step 2: Update Production Variables

**Edit `.env.production`:**
```bash
# Supabase (Production)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_URL=https://api.baito.app

# Feature Flags
EXPO_PUBLIC_ENABLE_GPS_TRACKING=true
EXPO_PUBLIC_ENABLE_SELFIE_VERIFICATION=true
EXPO_PUBLIC_ENABLE_NOTIFICATIONS=true
EXPO_PUBLIC_ENABLE_GAMIFICATION=true
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_PAYMENTS=true

# GPS Configuration
EXPO_PUBLIC_GPS_ACCURACY_THRESHOLD=100
EXPO_PUBLIC_GPS_TIMEOUT=10000

# Payment Configuration
EXPO_PUBLIC_DEFAULT_CURRENCY=MYR
EXPO_PUBLIC_PAYMENT_BATCH_SIZE=50
```

### Step 3: Update app.json

**Edit `app.json`:**
```json
{
  "expo": {
    "name": "Baito - Gig Work Platform",
    "owner": "your-expo-username",
    "ios": {
      "bundleIdentifier": "com.yourcompany.baito"
    },
    "android": {
      "package": "com.yourcompany.baito"
    },
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

---

## 4. Build Setup

### Step 1: Initialize EAS Build

```bash
# Initialize EAS in your project
eas build:configure
```

**This will create `eas.json` if it doesn't exist.**

### Step 2: Verify eas.json

**Check `eas.json` has these profiles:**
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true,
      "channel": "production"
    }
  }
}
```

### Step 3: Link Project to EAS

```bash
# Create new EAS project or link existing
eas init

# This will:
# 1. Create a project on Expo servers
# 2. Link it to your local project
# 3. Update app.json with projectId
```

---

## 5. iOS Deployment

### Prerequisites
- ✅ Apple Developer Account ($99/year)
- ✅ macOS with Xcode installed (for local builds)
- ✅ App Store Connect access

### Step 1: Create App on App Store Connect

1. **Go to:** https://appstoreconnect.apple.com
2. **Click:** "My Apps" → "+" → "New App"
3. **Fill in:**
   - Platform: iOS
   - Name: Baito - Gig Work Platform
   - Primary Language: English
   - Bundle ID: com.yourcompany.baito
   - SKU: baito-mobile
   - User Access: Full Access

### Step 2: Configure iOS Build

**Update `eas.json` with iOS settings:**
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD1234EF"
      }
    }
  }
}
```

### Step 3: Build for iOS

```bash
# Preview build (for TestFlight testing)
eas build --platform ios --profile preview

# Production build (for App Store)
eas build --platform ios --profile production
```

**Build process:**
1. Uploads your code to EAS servers
2. Installs dependencies
3. Compiles native code
4. Creates .ipa file
5. Downloads .ipa to your machine

### Step 4: Submit to App Store

**Option A: Automatic (Recommended)**
```bash
eas submit --platform ios --latest
```

**Option B: Manual**
1. Download .ipa from EAS dashboard
2. Use Transporter app to upload to App Store Connect
3. Fill in App Store metadata
4. Submit for review

### Step 5: App Store Metadata

**Fill in App Store Connect:**

**App Information:**
- Name: Baito - Gig Work Platform
- Subtitle: Find gig work easily
- Category: Business
- Content Rights: Yes, it contains third-party content

**Version Information:**
- Screenshots (required):
  - iPhone 6.7" (1290 x 2796 px) - 3-10 images
  - iPhone 6.5" (1242 x 2688 px) - 3-10 images
- Description: [Your app description]
- Keywords: gig work, freelance, jobs, shifts, earnings
- Support URL: https://baito.app/support
- Marketing URL: https://baito.app

**App Privacy:**
- Data Collected:
  - Location (for GPS attendance)
  - Photos (for selfie verification)
  - Contact Info (email, phone)
  - Financial Info (earnings data)

### Step 6: Submit for Review

1. **Pricing:** Free or Paid
2. **Availability:** Select countries
3. **Submit for Review**
4. **Wait 1-3 days** for Apple review

---

## 6. Android Deployment

### Prerequisites
- ✅ Google Play Console Account ($25 one-time)
- ✅ Google Play Console access

### Step 1: Create App on Play Console

1. **Go to:** https://play.google.com/console
2. **Click:** "Create app"
3. **Fill in:**
   - App name: Baito - Gig Work Platform
   - Default language: English (US)
   - App or game: App
   - Free or paid: Free

### Step 2: Build for Android

```bash
# Preview build (APK for testing)
eas build --platform android --profile preview

# Production build (AAB for Play Store)
eas build --platform android --profile production
```

**Build artifacts:**
- Preview: `.apk` file (installable on devices)
- Production: `.aab` file (for Play Store)

### Step 3: Internal Testing (Optional)

```bash
# Build and upload to Internal Testing
eas build --platform android --profile preview
eas submit --platform android --latest --track internal
```

**Add testers:**
1. Go to Play Console → Internal testing
2. Add tester email addresses
3. Share testing link with testers

### Step 4: Submit to Play Store

**Option A: Automatic (Recommended)**
```bash
# Build production AAB
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --latest
```

**Option B: Manual**
1. Download .aab from EAS dashboard
2. Go to Play Console → Production → Create new release
3. Upload .aab file
4. Fill in release notes
5. Submit for review

### Step 5: Play Store Metadata

**Store Listing:**

**App details:**
- App name: Baito - Gig Work Platform
- Short description: Find gig work easily (80 chars max)
- Full description: [Your app description] (4000 chars max)

**Graphics:**
- App icon: 512 x 512 px (PNG)
- Feature graphic: 1024 x 500 px (PNG)
- Screenshots:
  - Phone: 1080 x 1920 px (2-8 images)
  - Tablet: 1200 x 1920 px (optional, 2-8 images)

**Categorization:**
- App category: Business
- Content rating: Everyone
- Target audience: 18+

**Contact details:**
- Email: support@baito.app
- Phone: +60 12 345 6789 (optional)
- Website: https://baito.app

**Privacy Policy:**
- Privacy policy URL: https://baito.app/privacy

### Step 6: Content Rating

**Complete questionnaire:**
1. Violence: None
2. Sexual content: None
3. Profanity: None
4. Drug use: None
5. Gambling: None
6. Result: Everyone

### Step 7: Submit for Review

1. **Pricing & Distribution:** Select countries
2. **App content:** Complete all sections
3. **Submit for review**
4. **Wait 1-7 days** for Google review

---

## 7. Testing

### Pre-Deployment Testing

#### 1. Test on Physical Devices

**iOS:**
```bash
# Install on iOS device via TestFlight
eas build --platform ios --profile preview
# Upload to TestFlight via EAS
eas submit --platform ios --latest
```

**Android:**
```bash
# Build APK
eas build --platform android --profile preview

# Download and install APK on device
# Share link from EAS dashboard
```

#### 2. Test All Features

**Authentication:**
- [ ] Worker sign up
- [ ] Worker login
- [ ] Admin login
- [ ] Password reset

**GPS Tracking:**
- [ ] Clock in with GPS
- [ ] GPS accuracy check
- [ ] Location verification

**Selfie Verification:**
- [ ] Capture selfie on clock-in
- [ ] Selfie upload to Supabase
- [ ] Selfie preview

**Attendance:**
- [ ] Clock in
- [ ] Clock out
- [ ] View attendance history
- [ ] Admin view all attendance

**Gamification:**
- [ ] Earn achievements
- [ ] View leaderboard
- [ ] Points system
- [ ] Level up notifications

**Notifications:**
- [ ] Receive shift reminders
- [ ] Achievement notifications
- [ ] Admin broadcasts
- [ ] Mark as read

**Analytics (Admin):**
- [ ] View performance charts
- [ ] Revenue tracking
- [ ] Worker metrics
- [ ] Export data

**Payments:**
- [ ] View worker earnings
- [ ] Create payment batches
- [ ] Process payments
- [ ] Payment history

#### 3. Performance Testing

**Load Testing:**
```bash
# Test with multiple concurrent users
# Check response times
# Monitor Supabase usage
```

**Database:**
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 8. Troubleshooting

### Common Issues

#### Build Failures

**Issue:** Build fails with "Metro bundler error"
```bash
# Solution: Clear Metro cache
npx expo start --clear

# Rebuild
eas build --platform all --profile production
```

**Issue:** "Module not found" error
```bash
# Solution: Reinstall dependencies
rm -rf node_modules
npm install --legacy-peer-deps

# Rebuild
eas build --platform all --profile production
```

#### Supabase Issues

**Issue:** "Invalid API key"
```bash
# Solution: Check environment variables
cat .env.production

# Verify in eas.json
eas secrets:list
```

**Issue:** RLS policy blocking queries
```sql
-- Solution: Check RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'your_table';

-- Temporarily disable for testing (NOT in production)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
```

#### iOS Specific

**Issue:** "Invalid Bundle Identifier"
```bash
# Solution: Update app.json
{
  "ios": {
    "bundleIdentifier": "com.yourcompany.baito"
  }
}

# Rebuild
eas build --platform ios --profile production
```

**Issue:** "Missing required icon sizes"
```bash
# Solution: Generate all icon sizes
# Use https://icon.kitchen or similar tool
# Place in assets/ folder
```

#### Android Specific

**Issue:** "Package name already exists"
```bash
# Solution: Update package name in app.json
{
  "android": {
    "package": "com.yourcompany.baito.v2"
  }
}
```

**Issue:** "Gradle build failed"
```bash
# Solution: Clean and rebuild
eas build --platform android --profile production --clear-cache
```

### Getting Help

**Expo Forums:**
- https://forums.expo.dev

**Discord:**
- https://chat.expo.dev

**Documentation:**
- https://docs.expo.dev

**Supabase:**
- https://supabase.com/docs
- https://discord.supabase.com

---

## 🎉 Deployment Checklist

### Pre-Launch
- [ ] All migrations applied
- [ ] Environment variables configured
- [ ] app.json updated with production values
- [ ] eas.json configured
- [ ] Icons and splash screens created
- [ ] Privacy policy published
- [ ] Terms of service published

### iOS Launch
- [ ] Apple Developer Account active
- [ ] App created on App Store Connect
- [ ] Build uploaded to App Store
- [ ] Metadata filled in
- [ ] Screenshots uploaded
- [ ] Privacy information completed
- [ ] Submitted for review
- [ ] Approved and live

### Android Launch
- [ ] Google Play Console Account active
- [ ] App created on Play Console
- [ ] Build uploaded to Play Store
- [ ] Store listing completed
- [ ] Screenshots uploaded
- [ ] Content rating completed
- [ ] Privacy policy linked
- [ ] Submitted for review
- [ ] Approved and live

### Post-Launch
- [ ] Monitor crash reports
- [ ] Check user reviews
- [ ] Monitor Supabase usage
- [ ] Set up analytics
- [ ] Plan OTA updates
- [ ] Collect user feedback

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Login to EAS
eas login

# 3. Initialize EAS
eas init

# 4. Build for both platforms
eas build --platform all --profile production

# 5. Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest

# 6. Monitor builds
eas build:list
```

---

## 📊 Post-Deployment Monitoring

### Supabase Dashboard
- Monitor database usage
- Check query performance
- Review error logs

### Expo Dashboard
- Track app downloads
- Monitor crash reports
- Check update installations

### App Store Analytics
- Downloads
- User ratings
- Crash reports
- In-app events

### Play Console Analytics
- Installs
- Uninstalls
- Ratings & reviews
- ANR & crash rate

---

## 🎊 Success!

Your Baito Mobile app is now live in production! 🎉

**Next steps:**
1. Monitor user feedback
2. Plan feature updates
3. Set up OTA updates with EAS Update
4. Scale Supabase as needed
5. Collect analytics data

**Support:**
- Email: support@baito.app
- Website: https://baito.app
- Documentation: https://docs.baito.app

---

**Built with ❤️ using Expo, React Native, and Supabase**
**Total Cost: $0** (100% FREE development stack)
