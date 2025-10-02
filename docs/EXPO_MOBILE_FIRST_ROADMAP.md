# Baito Platform - Mobile-First Progressive Roadmap
## Expo React Native (Android + iOS + Web)

**Business Context:**
- Current: RM 1.8M manpower revenue (manual operations)
- Target: RM 5M within 24 months
- Delivery: Mobile app (Android/iOS) + Web domain access
- Stack: Expo React Native (ONE codebase = 3 platforms)

---

## 📱 **REVISED TECH STACK - EXPO UNIVERSAL**

### **Frontend (Mobile + Web)**
```
Expo SDK 51+ (Latest)
├── React Native (mobile core)
├── React Native Web (web support)
├── Expo Router (file-based routing)
├── TypeScript 5.5+
├── NativeWind (TailwindCSS for React Native)
├── Expo Camera (selfie/photo)
├── Expo Location (GPS tracking)
├── Expo Notifications (push notifications)
└── React Query (data fetching)
```

### **UI Components**
```
NativeBase / Tamagui (cross-platform UI)
├── Works on iOS, Android, Web
├── Accessible components
├── Customizable theme
└── Performance optimized
```

### **Backend (Same as planned)**
```
Supabase (unchanged)
├── PostgreSQL 15+ with PostGIS
├── Supabase Auth (phone OTP)
├── Supabase Storage (photos)
├── Supabase Edge Functions (business logic)
└── Real-time subscriptions
```

### **State Management**
```
Zustand (global state)
React Query (server state)
AsyncStorage (local storage)
```

### **Build & Deploy**
```
EAS (Expo Application Services)
├── Android: Google Play Store
├── iOS: Apple App Store
├── Web: Vercel/Netlify (domain: app.baito.com)
└── OTA Updates (instant fixes without app store)
```

---

## 🚀 **PROGRESSIVE IMPLEMENTATION - WEEK BY WEEK**

### **WEEK 1: Foundation & Setup**

**Day 1-2: Project Initialization**
```bash
# Initialize Expo app
npx create-expo-app@latest baito-app --template

# Install core dependencies
npx expo install expo-router
npx expo install expo-location expo-camera
npx expo install @supabase/supabase-js
npx expo install nativewind
npx expo install @tanstack/react-query
npx expo install zustand
npx expo install expo-notifications

# Setup Supabase client
# Configure environment variables
```

**Features to Build:**
- ✅ Expo project structure (iOS/Android/Web)
- ✅ Supabase integration
- ✅ Phone number authentication (OTP)
- ✅ Basic navigation (Expo Router)
- ✅ Splash screen & app icon

**Deliverable:**
- App runs on Android emulator, iOS simulator, web browser
- Users can sign in with phone number

---

### **WEEK 2: Worker Core Experience**

**Day 3-5: Worker App (Mobile-First)**
```typescript
// Screens to build:
screens/
├── (auth)/
│   ├── login.tsx          // Phone OTP login
│   └── verify.tsx         // OTP verification
├── (worker)/
│   ├── home.tsx           // Available gigs list
│   ├── gig/[id].tsx       // Gig details
│   └── profile.tsx        // Worker profile
```

**Features to Build:**
- ✅ Worker home screen (list of gigs YOU posted)
- ✅ Gig details screen (job description, pay, location)
- ✅ One-tap apply to gig
- ✅ Worker profile (name, phone, skills)
- ✅ Bottom tab navigation

**Deliverable:**
- Workers can see gigs, apply, view profile
- Works on Android, iOS, Web

---

### **WEEK 3: Time Tracking (Core Value)**

**Day 6-8: GPS + Photo Clock In/Out**
```typescript
// Core timemark features:
components/
├── ClockInButton.tsx      // GPS + Camera trigger
├── ClockOutButton.tsx     // GPS + Camera + hours calc
├── GeofenceValidator.tsx  // 100m radius check
├── PhotoCapture.tsx       // Selfie with overlay
└── TimesheetCard.tsx      // Display hours worked
```

**Features to Build:**
- ✅ GPS location capture (Expo Location)
- ✅ Selfie capture (Expo Camera)
- ✅ Geofence validation (PostGIS backend)
- ✅ Photo with timestamp overlay
- ✅ Clock in/out buttons
- ✅ Auto-timesheet calculation

**Permissions Required:**
```typescript
// Request on first use
await Location.requestForegroundPermissionsAsync()
await Camera.requestCameraPermissionsAsync()
```

**Deliverable:**
- Workers can clock in/out with GPS + selfie
- Geofence prevents clocking in >100m away
- Auto-timesheet generated
- **NO MORE DISPUTES!**

---

### **WEEK 4: Admin Dashboard (Your Tools)**

**Day 9-11: Owner/Admin Features**
```typescript
// Your admin screens:
screens/
├── (admin)/
│   ├── dashboard.tsx      // Overview: active projects, workers
│   ├── projects/
│   │   ├── index.tsx      // List your projects
│   │   ├── create.tsx     // Create new project
│   │   └── [id].tsx       // Project details
│   ├── workers/
│   │   ├── index.tsx      // Worker database
│   │   └── assign.tsx     // Assign workers to project
│   └── attendance.tsx     // Live attendance tracking
```

**Features to Build:**
- ✅ Dashboard (active projects, workers deployed)
- ✅ Create project/gig (for your clients)
- ✅ Worker database (import CSV of existing workers)
- ✅ Assign workers to projects
- ✅ Live attendance map (see who's clocked in)
- ✅ Timesheet approval

**Deliverable:**
- YOU can manage everything from mobile app
- Web version works for desktop admin work

---

### **WEEK 5: Payment & Compliance**

**Day 12-14: PERKESO, LHDN, Invoicing**
```typescript
// Compliance features:
services/
├── perkeso-service.ts     // 1.25% auto-deduction
├── lhdn-invoice.ts        // E-invoice generation
├── service-agreement.ts   // Gig Bill 2025 compliance
└── payment-tracker.ts     // 7-day payment monitor
```

**Features to Build:**
- ✅ PERKESO auto-deduction (1.25% from earnings)
- ✅ LHDN e-invoice generation (for clients)
- ✅ Service agreement auto-generate (PDF)
- ✅ 7-day payment compliance tracker
- ✅ Earnings dashboard (workers see RM earned)
- ✅ Invoice list (you see what clients owe)

**Deliverable:**
- Full Gig Worker Bill 2025 compliance
- Workers see earnings in real-time
- You get auto-generated invoices for clients

---

### **WEEK 6: Polish & Test**

**Day 15-17: UI/UX Polish + Testing**
```typescript
// Polish features:
- Loading states (Skeleton screens)
- Error handling (Toast notifications)
- Offline support (AsyncStorage cache)
- Image optimization (compress photos)
- Performance (React Query caching)
- Animations (smooth transitions)
```

**Testing Checklist:**
- [ ] Test on Android physical device
- [ ] Test on iOS physical device (TestFlight)
- [ ] Test on web browser (Chrome, Safari)
- [ ] Test GPS accuracy in different locations
- [ ] Test camera in low light conditions
- [ ] Test with 10 real workers (beta test)

**Deliverable:**
- Polished app ready for production
- Beta tested with real users

---

### **WEEK 7: Deploy to Stores**

**Day 18-20: Production Deployment**

**Android (Google Play):**
```bash
# Build production APK/AAB
eas build --platform android --profile production

# Submit to Google Play Console
eas submit --platform android
```

**iOS (Apple App Store):**
```bash
# Build production IPA
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios
```

**Web (Domain):**
```bash
# Build web version
npx expo export --platform web

# Deploy to Vercel
vercel deploy

# Configure domain: app.baito.my or baito.app
```

**Deliverable:**
- Android app LIVE on Google Play
- iOS app LIVE on App Store
- Web app accessible at yourdomain.com

---

### **WEEK 8: Monitor & Iterate**

**Day 21-23: Launch Week**

**Monitoring Setup:**
- [ ] Sentry (error tracking)
- [ ] Mixpanel/Amplitude (analytics)
- [ ] Supabase dashboard (database monitoring)
- [ ] App Store reviews monitoring

**Launch Activities:**
- [ ] Onboard 50 existing workers to app
- [ ] Run 5 projects through platform
- [ ] Collect feedback from workers
- [ ] Fix critical bugs
- [ ] OTA update for minor fixes (no app store wait!)

**Deliverable:**
- 50 workers using app
- 5 projects completed via platform
- Feedback collected for Phase 2

---

## 📁 **PROJECT STRUCTURE**

```
baito-app/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/            # Auth screens
│   │   ├── login.tsx
│   │   └── verify.tsx
│   ├── (worker)/          # Worker app
│   │   ├── _layout.tsx    # Tab navigation
│   │   ├── home.tsx
│   │   ├── gigs/
│   │   │   └── [id].tsx
│   │   ├── attendance.tsx
│   │   └── profile.tsx
│   ├── (admin)/           # Admin app (you)
│   │   ├── dashboard.tsx
│   │   ├── projects/
│   │   ├── workers/
│   │   └── compliance.tsx
│   └── _layout.tsx        # Root layout
│
├── components/            # Reusable components
│   ├── ui/               # UI components (NativeBase/Tamagui)
│   ├── ClockInButton.tsx
│   ├── GigCard.tsx
│   ├── WorkerCard.tsx
│   └── ...
│
├── services/             # Business logic
│   ├── supabase.ts       # Supabase client
│   ├── auth.ts           # Authentication
│   ├── gigs.ts           # Gig operations
│   ├── timemark.ts       # Time tracking
│   ├── compliance.ts     # PERKESO, LHDN
│   └── ...
│
├── hooks/                # Custom React hooks
│   ├── useGigs.ts
│   ├── useLocation.ts
│   ├── useCamera.ts
│   └── ...
│
├── store/                # Zustand stores
│   ├── authStore.ts
│   ├── gigsStore.ts
│   └── ...
│
├── types/                # TypeScript types
│   └── database.types.ts # Supabase types
│
├── app.json              # Expo config
├── eas.json              # EAS Build config
└── package.json
```

---

## 🔧 **KEY EXPO FEATURES WE'LL USE**

### **1. Expo Camera (Photo/Selfie)**
```typescript
import { CameraView, useCameraPermissions } from 'expo-camera'

// Selfie for clock in
const takeSelfie = async () => {
  const photo = await cameraRef.current?.takePictureAsync()
  // Upload to Supabase Storage
}
```

### **2. Expo Location (GPS)**
```typescript
import * as Location from 'expo-location'

// Get current location
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High
})

// Validate geofence (100m radius)
const distance = calculateDistance(
  location.coords,
  gigLocation
)
if (distance > 100) {
  alert('Too far from job site!')
}
```

### **3. Expo Notifications (Push)**
```typescript
import * as Notifications from 'expo-notifications'

// Send shift reminder
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Shift starts in 1 hour!",
    body: `${gig.title} at ${gig.location}`
  },
  trigger: { seconds: 3600 }
})
```

### **4. Expo Router (Navigation)**
```typescript
// File-based routing
app/
├── (worker)/home.tsx      → /home
├── gigs/[id].tsx          → /gigs/123
└── profile.tsx            → /profile

// Navigate programmatically
import { router } from 'expo-router'
router.push(`/gigs/${gig.id}`)
```

### **5. EAS Update (OTA)**
```typescript
// Push instant updates without app store
eas update --branch production

// Users get update automatically
// No waiting for App Store/Play Store approval!
```

---

## 🌐 **WEB ACCESS VIA DOMAIN**

### **Setup:**
```bash
# Build web version
npx expo export --platform web

# Deploy to Vercel
vercel deploy

# Configure custom domain
# app.baito.my or baito.app
```

### **Web-Specific Considerations:**
```typescript
// Platform-specific code
import { Platform } from 'react-native'

if (Platform.OS === 'web') {
  // Use web camera API
} else {
  // Use Expo Camera
}

// Responsive design
<View className={Platform.select({
  web: 'max-w-7xl mx-auto',
  default: 'w-full'
})}>
```

### **Web Features:**
- ✅ Full app works on web browser
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Same codebase as mobile
- ✅ PWA support (install on home screen)
- ✅ Deep linking (baito.app/gigs/123)

---

## 📊 **PROGRESSIVE FEATURE ROLLOUT**

### **Phase 1 (Week 1-8): MVP - 22 Features**
✅ Core platform (auth, gigs, workers)
✅ Time tracking (GPS + selfie)
✅ Compliance (PERKESO, LHDN)
✅ Admin tools (you manage everything)
✅ **Deployed to stores + web**

### **Phase 2 (Week 9-16): Automation - 15 Features**
- AI job matching
- Attendance dashboard
- Photo proof enhancements
- Government data export
- WhatsApp notifications

### **Phase 3 (Week 17-24): Engagement - 12 Features**
- Points & badges
- Leaderboard
- Top Pro program
- Backup talent pool
- Shift swapping

### **Phase 4 (Week 25-32): Advanced - 13 Features**
- DuitNow instant pay
- Client portal
- Advanced analytics
- Benefits marketplace
- Referral program

---

## 💰 **COST BREAKDOWN (8 Weeks)**

### **Development Tools (FREE tier initially)**
- Expo: FREE
- Supabase: FREE (up to 500MB storage, 2GB bandwidth)
- Vercel: FREE (web hosting)
- EAS Build: 30 builds/month (enough for testing)

### **Paid Services (After launch)**
- Google Play Store: $25 one-time
- Apple Developer Program: $99/year
- EAS Build (production): $99/month (unlimited builds)
- Supabase Pro: $25/month (once you scale)
- Custom domain: ~$12/year

### **Total Year 1 Cost:**
- Development: $0 (using free tiers)
- Launch: $25 (Google) + $99 (Apple) = $124
- Ongoing: $99/month (EAS) + $25/month (Supabase) = $124/month
- **Year 1 Total: ~$1,500-2,000**

**Way less than the RM 500K budget we discussed! 🎉**

---

## 🚀 **IMMEDIATE NEXT STEPS - TODAY**

### **Step 1: Environment Setup (30 mins)**
```bash
# Install Expo CLI globally
npm install -g expo-cli eas-cli

# Verify installation
expo --version
eas --version

# Install Node.js 18+ (if not installed)
```

### **Step 2: Create Project (15 mins)**
```bash
# Create Expo app with TypeScript
npx create-expo-app@latest baito-app --template blank-typescript

cd baito-app

# Install core dependencies
npx expo install expo-router expo-location expo-camera
npx expo install @supabase/supabase-js
npx expo install nativewind tailwindcss
```

### **Step 3: Configure Supabase (30 mins)**
```typescript
// lib/supabase.ts
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

### **Step 4: Test on Devices (15 mins)**
```bash
# Start development server
npx expo start

# Options shown:
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator
# - Press 'w' for web browser
# - Scan QR code with Expo Go app (physical device)
```

### **Step 5: First Screen (1 hour)**
```typescript
// app/index.tsx
import { View, Text, Button } from 'react-native'
import { router } from 'expo-router'

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-2xl font-bold">Baito Platform</Text>
      <Text className="text-gray-600 mt-2">
        RM 1.8M → RM 5M Scale
      </Text>
      <Button
        title="Get Started"
        onPress={() => router.push('/login')}
      />
    </View>
  )
}
```

---

## 📱 **TESTING PLAN**

### **Week 1-2: Developer Testing**
- Test on Android emulator (Android Studio)
- Test on iOS simulator (Xcode)
- Test on web browser (Chrome DevTools)

### **Week 3-4: Internal Testing**
- TestFlight (iOS) - 25 testers
- Internal testing (Android) - 100 testers
- Web staging (staging.baito.app)

### **Week 5-6: Beta Testing**
- 50 real workers
- 5 real projects
- Collect feedback

### **Week 7-8: Production**
- Public release (Google Play + App Store)
- Web production (baito.app)
- Monitor errors (Sentry)

---

## ✅ **ADVANTAGES OF EXPO APPROACH**

### **ONE Codebase, THREE Platforms:**
✅ Write once, run on Android, iOS, Web
✅ Shared business logic (Supabase, React Query)
✅ Shared UI components (95% code reuse)
✅ Faster development (no maintaining 3 separate apps)

### **Developer Experience:**
✅ Hot reload (instant changes)
✅ TypeScript throughout
✅ Great debugging tools
✅ Extensive documentation

### **Over-The-Air Updates:**
✅ Push fixes instantly (no app store wait)
✅ Update JavaScript code without rebuild
✅ A/B testing new features
✅ Rollback if issues

### **Native Features:**
✅ Camera, GPS, Notifications (all work)
✅ Native performance
✅ App store distribution
✅ Offline support

### **Web Bonus:**
✅ SEO-friendly URLs
✅ Deep linking
✅ Desktop-optimized layouts
✅ Progressive Web App (PWA)

---

## 🎯 **SUCCESS CRITERIA (8 Weeks)**

**Technical:**
- ✅ App runs on Android, iOS, Web
- ✅ GPS accuracy ±10 meters
- ✅ Photo upload <3 seconds
- ✅ 99.9% uptime (Supabase)

**Business:**
- ✅ 50 workers onboarded
- ✅ 10 projects completed
- ✅ Zero timesheet disputes
- ✅ 100% PERKESO/LHDN compliance

**User Experience:**
- ✅ <5 taps to clock in
- ✅ <30 seconds to apply for gig
- ✅ Real-time earnings visibility
- ✅ 4.5+ star rating (beta testers)

---

## 🔥 **READY TO START?**

### **What We'll Build This Week:**
**Week 1 Deliverables:**
1. ✅ Expo app initialized (Android + iOS + Web)
2. ✅ Supabase connected (database ready)
3. ✅ Phone auth working (OTP login)
4. ✅ Basic navigation (Expo Router)
5. ✅ First screen deployed (test on devices)

**Time Required:**
- Setup: 2 hours
- Development: 30 hours
- Testing: 8 hours
- **Total: 40 hours (1 work week)**

---

**Let's build this mobile-first! Which agent do you need?**
- `*agent dev` (James) - Start coding Expo app NOW
- `*agent ux-expert` (Sally) - Design mobile screens
- `*agent architect` (Winston) - Review Expo architecture

**Command to start:** `npx create-expo-app@latest baito-app --template blank-typescript`

🚀 **LET'S FUCKING GO!**
