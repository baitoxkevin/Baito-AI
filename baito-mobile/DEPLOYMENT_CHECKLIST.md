# Baito Mobile App - Deployment Checklist

## Pre-Deployment Setup

### 1. Apple Developer Account (iOS)
- [ ] Register at https://developer.apple.com ($99/year)
- [ ] Create App ID in Apple Developer Portal
- [ ] Create App in App Store Connect
- [ ] Note your credentials:
  - Apple ID email: _______________
  - Team ID: _______________
  - App Store Connect App ID: _______________

### 2. Google Play Console (Android)
- [ ] Register at https://play.google.com/console ($25 one-time)
- [ ] Create app in Google Play Console
- [ ] Generate Service Account Key:
  1. Go to Settings > API Access
  2. Create Service Account with "Release Manager" role
  3. Download JSON key
  4. Save as `baito-mobile/google-play-service-account.json`

### 3. Expo Account
- [ ] Create account at https://expo.dev (free)
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login: `eas login`
- [ ] Link project: `eas init`

---

## Configuration Files to Update

### eas.json - Update Submit Section
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "YOUR_APPLE_ID@example.com",
      "ascAppId": "1234567890",  // From App Store Connect
      "appleTeamId": "ABCD1234EF"  // From Apple Developer Portal
    },
    "android": {
      "serviceAccountKeyPath": "./google-play-service-account.json",
      "track": "internal"  // Start with internal testing
    }
  }
}
```

### Supabase - Add Redirect URL
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add to "Redirect URLs":
   - `baito://auth/callback` (for production)
   - `exp://*/--/auth/callback` (for development)

---

## Build & Deploy Commands

### Development Build (Testing)
```bash
# iOS Simulator
eas build --platform ios --profile development

# Android APK
eas build --platform android --profile development
```

### Preview Build (Internal Testing)
```bash
# Both platforms
eas build --platform all --profile preview
```

### Production Build
```bash
# iOS (App Store)
eas build --platform ios --profile production

# Android (Play Store)
eas build --platform android --profile production
```

### Submit to Stores
```bash
# Submit iOS to App Store
eas submit --platform ios --latest

# Submit Android to Play Store
eas submit --platform android --latest
```

---

## App Store Listing Requirements

### Screenshots Needed
- iPhone 6.7" (1290x2796) - 5-8 screenshots
- iPhone 5.5" (1242x2208) - 5-8 screenshots (optional)
- iPad Pro 12.9" (2048x2732) - if supporting tablets

### Play Store Listing
- Feature graphic (1024x500)
- Phone screenshots (min 2, max 8)
- Tablet screenshots (optional)
- Short description (80 chars max)
- Full description (4000 chars max)

### Both Stores
- Privacy Policy URL
- Support email/URL
- App category: Business or Lifestyle
- Content rating questionnaire

---

## Post-Deployment

### Monitor
- [ ] Expo dashboard for OTA updates
- [ ] App Store Connect for crash reports
- [ ] Google Play Console for ANRs
- [ ] Supabase for auth errors

### Updates
```bash
# Push OTA update (minor changes)
eas update --branch production --message "Bug fixes"

# New binary required for native changes
eas build --platform all --profile production
```

---

## Quick Start (TL;DR)

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Build for internal testing (no store account needed)
cd baito-mobile
eas build --platform android --profile preview

# 4. Download APK and share with team for testing
# (Link will be provided after build completes)
```

**Note:** You can distribute Android APKs directly without Play Store for internal testing!
