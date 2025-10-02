# Gigworker Platform - Full-Stack Architecture

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-01 | 1.0 | Initial full-stack architecture | Winston (AI Architect) |

---

## Introduction

This document outlines the complete full-stack architecture for the **Gigworker Platform**, a standalone mobile-first application that empowers gigworkers to find gigs, manage their work, track salary, time, and leverage gamification for engagement. This platform complements the existing Baito-AI system while serving a different user base (gigworkers vs. internal staff/managers).

**Key Differentiators from Baito-AI:**
- **User Focus:** Gigworkers (mobile-first, consumer-facing)
- **Primary Use Cases:** Find gigs, self-manage work, track earnings
- **Engagement Strategy:** Gamification-driven (inspired by Vimigo)
- **Architecture:** Standalone system with potential data sync to Baito-AI

**Starter Template:** Greenfield project - No starter template

---

## High Level Architecture

### Technical Summary

The Gigworker Platform adopts a **modern JAMstack architecture** with **serverless backend** to maximize scalability, minimize costs, and enable rapid iteration. The frontend leverages **Next.js 14** with **App Router** for optimal SEO and performance, crucial for gig discovery. Authentication and database operations are handled by **Supabase**, maintaining consistency with Baito-AI while operating as a completely standalone system. The platform emphasizes **mobile-first PWA** capabilities with offline support, real-time updates via WebSockets, and a comprehensive gamification layer inspired by Vimigo's performance-based reward systems. Deployment on **Vercel + Supabase Cloud** ensures global edge delivery with minimal operational overhead.

### Platform and Infrastructure Choice

**Selected Platform:** Vercel + Supabase

**Rationale:**
- **Rapid Development:** Leverages existing Baito-AI Supabase expertise
- **Cost Efficiency:** Serverless pricing model suits variable gig worker traffic
- **Performance:** Edge functions + global CDN for instant page loads
- **Mobile-First:** Next.js PWA support with offline capabilities
- **Scalability:** Auto-scales from 0 to millions of users

**Key Services:**
- **Frontend Hosting:** Vercel (Edge Network)
- **Backend/Database:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **File Storage:** Supabase Storage (profile pics, documents)
- **Email:** Supabase Auth + SendGrid integration
- **SMS:** Twilio (for job notifications)
- **Push Notifications:** Firebase Cloud Messaging
- **Analytics:** Vercel Analytics + Mixpanel (gamification tracking)

**Deployment Regions:**
- Primary: Singapore (sg1 - closest to Malaysia/SEA)
- CDN: Global edge locations via Vercel

### Repository Structure

**Structure:** Monorepo (Single repository, multiple packages)

**Monorepo Tool:** Turborepo

**Rationale:**
- Shared types between frontend and backend
- Unified build and deployment
- Code reuse for gamification logic
- Simplified dependency management

**Package Organization:**
```
gigworker-platform/
├── apps/
│   ├── web/          # Next.js 14 app (gigworkers)
│   └── api/          # Supabase Edge Functions
├── packages/
│   ├── shared/       # Types, constants, validation schemas
│   ├── ui/           # Shared UI components
│   └── gamification/ # Gamification engine
```

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Mobile[Mobile Browser PWA]
        Desktop[Desktop Web]
    end

    subgraph "Edge Layer - Vercel"
        NextJS[Next.js App Router<br/>SSR + ISR]
        EdgeAPI[Edge Functions]
        CDN[Static Assets CDN]
    end

    subgraph "Backend Layer - Supabase"
        Auth[Auth Service<br/>JWT + Magic Link]
        DB[(PostgreSQL<br/>Gigs, Users, Gamification)]
        Storage[Storage<br/>Profiles, Documents]
        Realtime[Realtime<br/>WebSockets]
        EdgeFunctions[Supabase Edge Functions<br/>Business Logic]
    end

    subgraph "External Services"
        Twilio[Twilio SMS<br/>Job Alerts]
        FCM[Firebase<br/>Push Notifications]
        Mixpanel[Mixpanel<br/>Analytics]
    end

    Mobile --> NextJS
    Desktop --> NextJS
    NextJS --> EdgeAPI
    NextJS --> CDN
    EdgeAPI --> Auth
    EdgeAPI --> DB
    EdgeAPI --> Storage
    EdgeAPI --> Realtime
    EdgeAPI --> EdgeFunctions
    EdgeFunctions --> Twilio
    EdgeFunctions --> FCM
    NextJS --> Mixpanel
```

### Architectural Patterns

- **JAMstack:** Static generation with serverless APIs - *Rationale: Performance, SEO for gig discovery, cost efficiency*
- **Mobile-First PWA:** Progressive Web App with offline support - *Rationale: Native-like experience without app store deployment*
- **Component-Based UI:** Reusable React components with TypeScript - *Rationale: Maintainability and consistency*
- **Repository Pattern:** Abstract data access logic - *Rationale: Testability and flexibility*
- **Event-Driven Gamification:** Real-time score/badge updates - *Rationale: Instant feedback drives engagement (Vimigo pattern)*
- **Optimistic UI Updates:** Immediate UI feedback before server confirmation - *Rationale: Perceived performance improvement*
- **API Gateway Pattern:** Single entry via Supabase PostgREST - *Rationale: Centralized auth and rate limiting*

---

## Tech Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Framework | Next.js | 14.x (App Router) | React framework with SSR/ISR | SEO for gig discovery, optimal performance, PWA support |
| Frontend Language | TypeScript | 5.5+ | Type-safe development | Prevents runtime errors, better DX |
| UI Component Library | shadcn/ui + Radix | Latest | Accessible components | Consistent with Baito-AI, fully customizable |
| Styling | TailwindCSS | 3.4+ | Utility-first CSS | Rapid development, small bundle size |
| State Management | Zustand + React Query | Latest | Global state + server cache | Lightweight, TypeScript-first, automatic caching |
| Backend Language | TypeScript | 5.5+ | Type-safe backend | Shared types with frontend |
| Backend Framework | Supabase Edge Functions | Latest | Serverless functions | Auto-scaling, integrated with Supabase |
| API Style | PostgREST + RPC | Latest | Auto-generated REST + custom functions | Type-safe, automatically generated from schema |
| Database | PostgreSQL | 15+ | Primary database | ACID compliance, JSON support, Supabase managed |
| Cache | Redis (Upstash) | Latest | Session cache, rate limiting | Serverless Redis, pay-per-request |
| File Storage | Supabase Storage | Latest | User uploads, documents | S3-compatible, integrated auth |
| Authentication | Supabase Auth | Latest | JWT + Magic Link + OAuth | Phone/email login, social auth (Google) |
| Real-time | Supabase Realtime | Latest | Live updates | WebSocket-based, automatic sync |
| Frontend Testing | Vitest + React Testing Library | Latest | Unit/integration tests | Fast, Vite-native, React-focused |
| Backend Testing | Deno Test | Latest | Edge function tests | Built into Supabase Edge Functions runtime |
| E2E Testing | Playwright | Latest | End-to-end tests | Cross-browser, mobile testing |
| Build Tool | Turbo | Latest | Monorepo builds | Incremental builds, caching |
| Bundler | Next.js (Turbopack) | Latest | Frontend bundling | Built-in, optimized for Next.js |
| CSS Framework | TailwindCSS | 3.4+ | Utility-first styling | Rapid development, tree-shaking |
| IaC Tool | Supabase CLI | Latest | Database migrations | Version-controlled schema |
| CI/CD | GitHub Actions + Vercel | Latest | Automated deployment | Native Vercel integration, preview deploys |
| Monitoring | Vercel Analytics + Sentry | Latest | Performance + errors | Built-in analytics, error tracking |
| Logging | Supabase Logs + Axiom | Latest | Application logging | Centralized logs, queryable |
| Push Notifications | Firebase Cloud Messaging | Latest | Job alerts, achievements | Cross-platform push |
| SMS | Twilio | Latest | Phone verification, alerts | Reliable SMS delivery |
| Analytics | Mixpanel | Latest | User behavior, gamification | Event tracking, funnel analysis |

---

## Data Models

### User (Gigworker)

**Purpose:** Core user entity representing gigworkers using the platform

**TypeScript Interface:**
```typescript
interface User {
  id: string;                    // UUID
  phone: string;                 // Primary login (E.164 format)
  email?: string;                // Optional email
  full_name: string;
  ic_number?: string;            // Encrypted IC/NRIC
  profile_photo_url?: string;
  date_of_birth?: string;        // ISO 8601

  // Gamification
  total_points: number;          // Lifetime points
  current_level: number;         // User level (1-100)
  badges: string[];              // Array of badge IDs
  streak_days: number;           // Login streak

  // Verification
  phone_verified: boolean;
  email_verified: boolean;
  ic_verified: boolean;
  background_check_status: 'pending' | 'approved' | 'rejected';

  // Preferences
  preferred_job_categories: string[];  // e.g., ['F&B', 'Events']
  max_travel_distance_km: number;
  push_enabled: boolean;
  sms_enabled: boolean;

  // Metadata
  created_at: string;            // ISO 8601
  updated_at: string;
  last_active_at: string;
}
```

**Relationships:**
- **With GigApplications:** 1:many
- **With UserAchievements:** 1:many
- **With WorkHistory:** 1:many
- **With TimeSheets:** 1:many

---

### Gig

**Purpose:** Job/project posting available for gigworkers to apply

**TypeScript Interface:**
```typescript
interface Gig {
  id: string;                    // UUID
  company_id: string;            // Foreign key to companies (from Baito-AI?)
  title: string;
  description: string;
  category: string;              // 'F&B', 'Events', 'Retail', 'Warehouse'

  // Compensation
  hourly_rate: number;           // MYR/hour
  total_positions: number;
  filled_positions: number;

  // Schedule
  start_date: string;            // ISO 8601
  end_date: string;
  working_hours_start: string;   // HH:MM
  working_hours_end: string;

  // Location
  location_name: string;
  address: string;
  lat: number;
  lng: number;

  // Requirements
  required_skills: string[];
  min_experience_months: number;
  requires_background_check: boolean;

  // Status
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  published_at?: string;

  // Gamification
  points_reward: number;         // Points earned on completion
  badge_eligible?: string;       // Special badge for completing this gig

  created_at: string;
  updated_at: string;
}
```

**Relationships:**
- **With GigApplications:** 1:many
- **With Companies:** many:1
- **With TimeSheets:** 1:many

---

### GigApplication

**Purpose:** Tracks user applications to gigs

**TypeScript Interface:**
```typescript
interface GigApplication {
  id: string;
  user_id: string;               // FK to users
  gig_id: string;                // FK to gigs

  status: 'applied' | 'accepted' | 'rejected' | 'withdrawn';

  // Application data
  cover_message?: string;
  resume_url?: string;

  // Workflow
  applied_at: string;
  reviewed_at?: string;
  accepted_at?: string;
  rejected_reason?: string;

  // Performance tracking
  attendance_rate?: number;      // % of shifts attended (post-acceptance)
  rating?: number;               // 1-5 star rating from company
  review_comment?: string;
}
```

**Relationships:**
- **With User:** many:1
- **With Gig:** many:1

---

### TimeSheet

**Purpose:** Track working hours for payment calculation

**TypeScript Interface:**
```typescript
interface TimeSheet {
  id: string;
  user_id: string;
  gig_id: string;
  application_id: string;

  // Time tracking
  clock_in: string;              // ISO 8601 with timezone
  clock_out?: string;
  break_duration_minutes: number;
  total_hours_worked: number;

  // Location verification
  clock_in_lat?: number;
  clock_in_lng?: number;
  clock_out_lat?: number;
  clock_out_lng?: number;

  // Payment
  hourly_rate: number;           // Frozen from gig at time of clock-in
  total_amount: number;          // Calculated: (total_hours - break) * rate
  payment_status: 'pending' | 'approved' | 'paid';
  paid_at?: string;

  // Approval
  approved_by?: string;          // User ID of approver
  approved_at?: string;

  created_at: string;
  updated_at: string;
}
```

**Relationships:**
- **With User:** many:1
- **With Gig:** many:1
- **With GigApplication:** many:1

---

### Achievement

**Purpose:** Gamification achievements/badges (Vimigo-inspired)

**TypeScript Interface:**
```typescript
interface Achievement {
  id: string;
  type: 'badge' | 'level' | 'milestone';

  // Display
  name: string;                  // e.g., "First Gig Champion"
  description: string;
  icon_url: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';

  // Unlocking criteria
  criteria_type: 'gigs_completed' | 'hours_worked' | 'perfect_attendance' | 'streak_days';
  criteria_value: number;        // e.g., 10 gigs, 100 hours, 30 days

  // Rewards
  points_reward: number;
  unlocks_feature?: string;      // e.g., "priority_apply", "higher_pay_tier"

  // Visibility
  is_active: boolean;
  is_secret: boolean;            // Hidden until unlocked
  display_order: number;

  created_at: string;
}
```

**Relationships:**
- **With UserAchievement:** 1:many

---

### UserAchievement

**Purpose:** Tracks user-unlocked achievements

**TypeScript Interface:**
```typescript
interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;

  unlocked_at: string;
  progress_percentage: number;   // For achievements in progress

  // Social
  is_showcased: boolean;         // Display on profile
  shared_to_social: boolean;
}
```

**Relationships:**
- **With User:** many:1
- **With Achievement:** many:1

---

### Leaderboard

**Purpose:** Performance rankings (Vimigo-style)

**TypeScript Interface:**
```typescript
interface LeaderboardEntry {
  id: string;
  user_id: string;

  // Period
  period_type: 'daily' | 'weekly' | 'monthly' | 'all_time';
  period_start: string;
  period_end: string;

  // Metrics
  rank: number;
  points_earned: number;
  gigs_completed: number;
  hours_worked: number;
  average_rating: number;

  // Rewards
  reward_tier?: 'top1' | 'top3' | 'top10' | 'top100';
  reward_points?: number;

  last_updated: string;
}
```

---

## API Specification

### API Style: PostgREST + Supabase RPC Functions

**Base URL:** `https://[project-ref].supabase.co/rest/v1/`

**Authentication:** Bearer token (JWT) in `Authorization` header

### Key Endpoints

#### Auto-generated REST endpoints (PostgREST):

```typescript
// Gigs
GET    /gigs?status=eq.open&order=created_at.desc
GET    /gigs?id=eq.{gig_id}
POST   /gigs                  // Admin only
PATCH  /gigs?id=eq.{gig_id}

// Applications
GET    /gig_applications?user_id=eq.{user_id}
POST   /gig_applications
PATCH  /gig_applications?id=eq.{app_id}

// TimeSheets
GET    /timesheets?user_id=eq.{user_id}&gig_id=eq.{gig_id}
POST   /timesheets
PATCH  /timesheets?id=eq.{id}

// Achievements
GET    /achievements?is_active=eq.true
GET    /user_achievements?user_id=eq.{user_id}
```

#### Custom RPC Functions:

```typescript
// Apply to gig (with validation)
POST /rpc/apply_to_gig
{
  "p_gig_id": "uuid",
  "p_cover_message": "string"
}
Response: { "application_id": "uuid", "points_earned": 10 }

// Clock in/out
POST /rpc/clock_in
{
  "p_gig_id": "uuid",
  "p_lat": 3.1390,
  "p_lng": 101.6869
}
Response: { "timesheet_id": "uuid", "clock_in": "2025-10-01T09:00:00Z" }

POST /rpc/clock_out
{
  "p_timesheet_id": "uuid",
  "p_lat": 3.1390,
  "p_lng": 101.6869
}
Response: { "hours_worked": 8.5, "amount_earned": 85.00, "points_earned": 50 }

// Gamification
POST /rpc/award_points
{
  "p_user_id": "uuid",
  "p_points": 100,
  "p_reason": "completed_gig"
}

GET /rpc/get_leaderboard
{
  "p_period": "weekly",
  "p_limit": 100
}
Response: LeaderboardEntry[]

GET /rpc/check_achievements
{
  "p_user_id": "uuid"
}
Response: { "new_achievements": Achievement[], "points_awarded": 500 }

// Search
POST /rpc/search_gigs
{
  "p_category": "F&B",
  "p_max_distance_km": 10,
  "p_user_lat": 3.1390,
  "p_user_lng": 101.6869,
  "p_min_rate": 12.00
}
Response: Gig[] (sorted by relevance + distance)
```

---

## Components

### Frontend Components

#### GigDiscovery Component

**Responsibility:** Main gig browsing and filtering interface

**Key Interfaces:**
- `onApplyGig(gigId: string)` - Trigger application flow
- `onFilterChange(filters: GigFilters)` - Update search criteria

**Dependencies:**
- **Existing:** N/A (new component)
- **New:** SearchService, GigCard, FilterPanel

**Technology Stack:** Next.js App Router page, React Server Components for initial load, Client Components for interactivity

---

#### GamificationDashboard Component

**Responsibility:** Display user level, points, badges, leaderboard (Vimigo-inspired)

**Key Interfaces:**
- `onBadgeClick(badgeId: string)` - Show badge details
- `onShareAchievement(achievementId: string)` - Social sharing

**Dependencies:**
- **New:** GamificationService, BadgeCard, LevelProgress, LeaderboardWidget

**Technology Stack:** Next.js Client Component with real-time updates via Supabase Realtime

---

#### TimeTracker Component

**Responsibility:** Clock in/out interface with location verification

**Key Interfaces:**
- `onClockIn(lat, lng)` - Start time tracking
- `onClockOut(lat, lng)` - End time tracking

**Dependencies:**
- **New:** TimeSheetService, Geolocation API, ConfirmationDialog

**Technology Stack:** PWA-enabled component with offline support, background location tracking

---

### Backend Components

#### GamificationEngine (Edge Function)

**Responsibility:** Calculate points, unlock achievements, update leaderboards

**Key Interfaces:**
- `awardPoints(userId, points, reason)` - Add points to user
- `checkAchievements(userId)` - Evaluate and unlock achievements
- `updateLeaderboard(userId, period)` - Refresh leaderboard entries

**Dependencies:**
- **Database:** users, achievements, user_achievements, leaderboards
- **External:** Mixpanel (event tracking)

**Technology Stack:** Supabase Edge Function (Deno runtime)

---

#### NotificationService (Edge Function)

**Responsibility:** Send push notifications and SMS alerts

**Key Interfaces:**
- `sendJobAlert(userId, gigId)` - New gig matches user preferences
- `sendAchievementUnlock(userId, achievementId)` - Achievement notification
- `sendPaymentConfirmation(userId, amount)` - Payment processed

**Dependencies:**
- **External:** Firebase Cloud Messaging, Twilio
- **Database:** users, notifications_log

**Technology Stack:** Supabase Edge Function with Twilio SDK + FCM SDK

---

#### SearchService (Database Function)

**Responsibility:** Advanced gig search with geo-filtering and ranking

**Key Interfaces:**
- `searchGigs(filters, userLocation, limit)` - Returns ranked gig list

**Dependencies:**
- **Database:** gigs, user preferences

**Technology Stack:** PostgreSQL function with PostGIS for geo-queries

---

### Component Interaction Diagram

```mermaid
graph LR
    subgraph "Frontend"
        GD[GigDiscovery]
        GameDB[GamificationDashboard]
        TT[TimeTracker]
    end

    subgraph "Backend Services"
        SS[SearchService]
        GE[GamificationEngine]
        NS[NotificationService]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL)]
        RT[Realtime]
    end

    GD --> SS
    SS --> DB
    GameDB --> GE
    GameDB --> RT
    GE --> DB
    GE --> NS
    TT --> DB
    TT --> GE
    NS --> FCM[Firebase]
    NS --> Twilio
```

---

## External APIs

### Twilio API

- **Purpose:** SMS for phone verification, job alerts
- **Documentation:** https://www.twilio.com/docs/sms
- **Base URL:** https://api.twilio.com/2010-04-01
- **Authentication:** Account SID + Auth Token (Basic Auth)

**Key Endpoints Used:**
- `POST /Accounts/{AccountSid}/Messages.json` - Send SMS

**Integration Notes:** Store API credentials in Supabase Secrets, use Edge Function for sending

---

### Firebase Cloud Messaging (FCM)

- **Purpose:** Push notifications for job alerts, achievements
- **Documentation:** https://firebase.google.com/docs/cloud-messaging
- **Base URL:** https://fcm.googleapis.com/v1
- **Authentication:** Service account JSON key

**Key Endpoints Used:**
- `POST /v1/projects/{project_id}/messages:send` - Send push notification

**Integration Notes:** Device tokens stored in users table, sent via Edge Function

---

### Mixpanel API

- **Purpose:** Track gamification events, user behavior analytics
- **Documentation:** https://developer.mixpanel.com/docs
- **Base URL:** https://api.mixpanel.com
- **Authentication:** Project Token

**Integration Notes:** Track events client-side and server-side for complete funnel

---

## Core Workflows

### Workflow 1: Gig Discovery and Application

```mermaid
sequenceDiagram
    participant U as User (Mobile)
    participant FE as Next.js Frontend
    participant API as Supabase API
    participant DB as PostgreSQL
    participant GE as GamificationEngine
    participant NS as NotificationService

    U->>FE: Open "Find Gigs" page
    FE->>API: GET /rpc/search_gigs (with location)
    API->>DB: Execute geo-search query
    DB-->>API: Return ranked gigs
    API-->>FE: Gig list
    FE-->>U: Display gigs with distance

    U->>FE: Click "Apply" on gig
    FE->>API: POST /rpc/apply_to_gig
    API->>DB: Insert gig_application
    API->>GE: Award application points (+10)
    GE->>DB: Update user points
    GE->>NS: Send application confirmation
    NS->>U: Push notification
    API-->>FE: Success response
    FE-->>U: "Application submitted!" + points earned
```

### Workflow 2: Clock In/Out with Gamification

```mermaid
sequenceDiagram
    participant U as User (Mobile)
    participant FE as PWA Frontend
    participant Geo as Geolocation API
    participant API as Supabase API
    participant DB as PostgreSQL
    participant GE as GamificationEngine

    U->>FE: Click "Clock In"
    FE->>Geo: Request current location
    Geo-->>FE: lat/lng
    FE->>API: POST /rpc/clock_in (gig_id, lat, lng)
    API->>DB: Validate location (within 100m of gig)
    alt Location valid
        API->>DB: Insert timesheet (clock_in)
        DB-->>API: Timesheet ID
        API-->>FE: Success (timesheet_id)
        FE-->>U: "Clocked in! Happy working!"
    else Location invalid
        API-->>FE: Error (too far from location)
        FE-->>U: "Please be at the gig location"
    end

    Note over U,GE: 8 hours later...

    U->>FE: Click "Clock Out"
    FE->>Geo: Request current location
    Geo-->>FE: lat/lng
    FE->>API: POST /rpc/clock_out (timesheet_id, lat, lng)
    API->>DB: Update timesheet (clock_out, calculate hours)
    API->>GE: Award completion points (+50)
    GE->>DB: Update user points, check achievements
    alt Achievement unlocked
        GE->>NS: Send achievement notification
        NS->>U: Push "You unlocked: Perfect Attendance!"
    end
    DB-->>API: Timesheet + earnings
    API-->>FE: Hours worked, amount earned, points earned
    FE-->>U: "Great job! 8.5 hrs, MYR 85.00 earned, +50 points"
```

---

## Database Schema

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- For geo-queries

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  ic_number TEXT,  -- Encrypted
  profile_photo_url TEXT,
  date_of_birth DATE,

  -- Gamification
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  badges TEXT[] DEFAULT '{}',
  streak_days INTEGER DEFAULT 0,

  -- Verification
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  ic_verified BOOLEAN DEFAULT false,
  background_check_status VARCHAR(20) DEFAULT 'pending',

  -- Preferences
  preferred_job_categories TEXT[] DEFAULT '{}',
  max_travel_distance_km INTEGER DEFAULT 10,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_level ON users(current_level DESC);
CREATE INDEX idx_users_points ON users(total_points DESC);

-- Gigs table
CREATE TABLE gigs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID,  -- Can link to Baito-AI companies if shared DB
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),

  -- Compensation
  hourly_rate DECIMAL(10,2) NOT NULL,
  total_positions INTEGER NOT NULL,
  filled_positions INTEGER DEFAULT 0,

  -- Schedule
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  working_hours_start TIME,
  working_hours_end TIME,

  -- Location (PostGIS)
  location_name VARCHAR(255),
  address TEXT,
  location GEOGRAPHY(POINT, 4326),  -- PostGIS type

  -- Requirements
  required_skills TEXT[] DEFAULT '{}',
  min_experience_months INTEGER DEFAULT 0,
  requires_background_check BOOLEAN DEFAULT false,

  -- Status
  status VARCHAR(20) DEFAULT 'open',
  published_at TIMESTAMPTZ,

  -- Gamification
  points_reward INTEGER DEFAULT 50,
  badge_eligible VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_gigs_category ON gigs(category);
CREATE INDEX idx_gigs_dates ON gigs(start_date, end_date);
CREATE INDEX idx_gigs_location ON gigs USING GIST(location);  -- Spatial index

-- Gig Applications
CREATE TABLE gig_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,

  status VARCHAR(20) DEFAULT 'applied',
  cover_message TEXT,
  resume_url TEXT,

  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_reason TEXT,

  attendance_rate DECIMAL(5,2),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_comment TEXT,

  UNIQUE(user_id, gig_id)
);

CREATE INDEX idx_applications_user ON gig_applications(user_id);
CREATE INDEX idx_applications_gig ON gig_applications(gig_id);
CREATE INDEX idx_applications_status ON gig_applications(status);

-- Time Sheets
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
  application_id UUID REFERENCES gig_applications(id) ON DELETE CASCADE,

  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  break_duration_minutes INTEGER DEFAULT 0,
  total_hours_worked DECIMAL(5,2),

  clock_in_location GEOGRAPHY(POINT, 4326),
  clock_out_location GEOGRAPHY(POINT, 4326),

  hourly_rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2),
  payment_status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,

  approved_by UUID,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timesheets_user ON timesheets(user_id);
CREATE INDEX idx_timesheets_gig ON timesheets(gig_id);
CREATE INDEX idx_timesheets_status ON timesheets(payment_status);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  tier VARCHAR(20),

  criteria_type VARCHAR(50),
  criteria_value INTEGER,

  points_reward INTEGER DEFAULT 0,
  unlocks_feature VARCHAR(100),

  is_active BOOLEAN DEFAULT true,
  is_secret BOOLEAN DEFAULT false,
  display_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,

  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress_percentage INTEGER DEFAULT 100,

  is_showcased BOOLEAN DEFAULT false,
  shared_to_social BOOLEAN DEFAULT false,

  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- Leaderboards
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  period_type VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  rank INTEGER,
  points_earned INTEGER,
  gigs_completed INTEGER,
  hours_worked DECIMAL(10,2),
  average_rating DECIMAL(3,2),

  reward_tier VARCHAR(20),
  reward_points INTEGER,

  last_updated TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, period_type, period_start)
);

CREATE INDEX idx_leaderboard_period ON leaderboard_entries(period_type, period_start, rank);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Example RLS: Users can only see their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Gigs are public (read-only for gigworkers)
CREATE POLICY "Anyone can view active gigs"
  ON gigs FOR SELECT
  USING (status = 'open' AND published_at IS NOT NULL);
```

---

## Frontend Architecture

### Component Organization

```
apps/web/src/
├── app/                        # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (gigworker)/           # Authenticated routes
│   │   ├── discover/          # Gig discovery
│   │   ├── my-gigs/           # Applied/active gigs
│   │   ├── timesheet/         # Time tracking
│   │   ├── earnings/          # Payment history
│   │   ├── achievements/      # Gamification dashboard
│   │   └── profile/
│   └── layout.tsx
├── components/
│   ├── ui/                    # shadcn/ui base components
│   ├── gigs/
│   │   ├── GigCard.tsx
│   │   ├── GigFilters.tsx
│   │   ├── ApplyGigDialog.tsx
│   │   └── GigDetails.tsx
│   ├── gamification/
│   │   ├── LevelProgress.tsx
│   │   ├── BadgeGrid.tsx
│   │   ├── LeaderboardWidget.tsx
│   │   └── PointsAnimation.tsx
│   ├── timesheet/
│   │   ├── ClockInButton.tsx
│   │   ├── ClockOutButton.tsx
│   │   └── TimesheetHistory.tsx
│   └── layout/
│       ├── AppShell.tsx
│       ├── BottomNav.tsx       # Mobile navigation
│       └── ProfileAvatar.tsx
├── lib/
│   ├── services/
│   │   ├── gig-service.ts
│   │   ├── gamification-service.ts
│   │   └── timesheet-service.ts
│   ├── hooks/
│   │   ├── use-gigs.ts
│   │   ├── use-auth.ts
│   │   ├── use-achievements.ts
│   │   └── use-location.ts
│   ├── stores/
│   │   ├── auth-store.ts      # Zustand
│   │   └── ui-store.ts
│   └── utils/
│       ├── supabase.ts        # Supabase client
│       ├── format.ts
│       └── validation.ts
└── public/
    ├── icons/                  # Achievement badges
    ├── manifest.json           # PWA manifest
    └── service-worker.js
```

### Component Template

```typescript
// components/gigs/GigCard.tsx
'use client'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, DollarSign } from 'lucide-react'
import { Gig } from '@/types/gig'
import { formatDistance } from '@/lib/utils/format'

interface GigCardProps {
  gig: Gig
  userLocation?: { lat: number; lng: number }
  onApply: (gigId: string) => void
}

export function GigCard({ gig, userLocation, onApply }: GigCardProps) {
  const distance = userLocation
    ? formatDistance(gig.location, userLocation)
    : null

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg">{gig.title}</h3>
            <p className="text-sm text-muted-foreground">{gig.company_name}</p>
          </div>
          <Badge>{gig.category}</Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-semibold">RM {gig.hourly_rate}/hr</span>
            <span className="text-xs text-muted-foreground">
              +{gig.points_reward} pts
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{gig.working_hours_start} - {gig.working_hours_end}</span>
          </div>

          {distance && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{distance} away</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={() => onApply(gig.id)}
        >
          Apply Now
        </Button>
      </CardFooter>
    </Card>
  )
}
```

### State Management

**State Structure (Zustand):**

```typescript
// lib/stores/auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  session: Session | null

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null })
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)
```

**State Management Patterns:**
- **Server State:** React Query for API data caching
- **Client State:** Zustand for auth, UI preferences
- **Form State:** React Hook Form with Zod validation
- **URL State:** Next.js searchParams for filters

### Routing Architecture

```
/                          # Landing page (unauthenticated)
/login                     # Phone/email login
/register                  # Sign up flow

# Authenticated routes (require auth)
/discover                  # Gig discovery (default after login)
/my-gigs                   # Applied + active gigs
/timesheet                 # Clock in/out
/earnings                  # Payment history + export
/achievements              # Gamification dashboard
/leaderboard              # Rankings
/profile                   # User profile + settings
```

**Protected Route Pattern:**

```typescript
// lib/middleware/auth-guard.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function authGuard(request: NextRequest) {
  const supabase = createServerClient(/* config */)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && request.nextUrl.pathname.startsWith('/discover')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}
```

### Frontend Services Layer

**API Client Setup:**

```typescript
// lib/services/api-client.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type-safe RPC wrapper
export async function rpc<T = any>(
  fn: string,
  params?: Record<string, any>
): Promise<{ data: T | null; error: Error | null }> {
  const { data, error } = await supabase.rpc(fn, params)
  return { data, error }
}
```

**Service Example:**

```typescript
// lib/services/gig-service.ts
import { supabase, rpc } from './api-client'
import { Gig, GigFilters } from '@/types/gig'

export const gigService = {
  async searchGigs(filters: GigFilters, userLocation?: { lat: number; lng: number }) {
    const { data, error } = await rpc<Gig[]>('search_gigs', {
      p_category: filters.category,
      p_max_distance_km: filters.maxDistance,
      p_user_lat: userLocation?.lat,
      p_user_lng: userLocation?.lng,
      p_min_rate: filters.minRate
    })

    if (error) throw error
    return data || []
  },

  async applyToGig(gigId: string, coverMessage?: string) {
    const { data, error } = await rpc<{ application_id: string; points_earned: number }>(
      'apply_to_gig',
      { p_gig_id: gigId, p_cover_message: coverMessage }
    )

    if (error) throw error
    return data!
  }
}
```

---

## Backend Architecture

### Service Architecture (Serverless - Supabase Edge Functions)

**Function Organization:**

```
apps/api/supabase/functions/
├── apply-to-gig/
│   └── index.ts           # Application submission logic
├── clock-in/
│   └── index.ts           # Start timesheet
├── clock-out/
│   └── index.ts           # End timesheet + gamification
├── award-points/
│   └── index.ts           # Points calculation
├── check-achievements/
│   └── index.ts           # Achievement evaluation
├── update-leaderboard/
│   └── index.ts           # Leaderboard refresh (scheduled)
├── send-notification/
│   └── index.ts           # FCM + Twilio integration
└── _shared/
    ├── supabase.ts        # Supabase admin client
    ├── gamification.ts    # Shared gamification logic
    └── validation.ts      # Input validation schemas
```

**Function Template (Clock Out):**

```typescript
// apps/api/supabase/functions/clock-out/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { awardPoints, checkAchievements } from '../_shared/gamification.ts'

const reqSchema = z.object({
  timesheetId: z.string().uuid(),
  lat: z.number(),
  lng: z.number()
})

serve(async (req) => {
  try {
    // Parse request
    const body = await req.json()
    const { timesheetId, lat, lng } = reqSchema.parse(body)

    // Get auth user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(/* admin client */)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError) throw new Error('Unauthorized')

    // Get timesheet
    const { data: timesheet, error: tsError } = await supabase
      .from('timesheets')
      .select('*, gigs(location, hourly_rate)')
      .eq('id', timesheetId)
      .eq('user_id', user.id)
      .single()

    if (tsError) throw new Error('Timesheet not found')
    if (timesheet.clock_out) throw new Error('Already clocked out')

    // Validate location (within 100m of gig)
    const { data: isNear } = await supabase.rpc('is_within_distance', {
      p_point1: `POINT(${lng} ${lat})`,
      p_point2: timesheet.gigs.location,
      p_distance_meters: 100
    })

    if (!isNear) throw new Error('Must be at gig location to clock out')

    // Calculate hours worked
    const clockIn = new Date(timesheet.clock_in)
    const clockOut = new Date()
    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
    const totalAmount = hoursWorked * timesheet.hourly_rate

    // Update timesheet
    const { error: updateError } = await supabase
      .from('timesheets')
      .update({
        clock_out: clockOut.toISOString(),
        clock_out_location: `POINT(${lng} ${lat})`,
        total_hours_worked: hoursWorked,
        total_amount: totalAmount
      })
      .eq('id', timesheetId)

    if (updateError) throw updateError

    // Award points
    const basePoints = 50
    const bonusPoints = hoursWorked >= 8 ? 20 : 0  // Full day bonus
    const totalPoints = basePoints + bonusPoints

    await awardPoints(user.id, totalPoints, 'completed_shift')

    // Check achievements
    const newAchievements = await checkAchievements(user.id)

    return new Response(
      JSON.stringify({
        hours_worked: hoursWorked,
        amount_earned: totalAmount,
        points_earned: totalPoints,
        new_achievements: newAchievements
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

### Database Architecture

**Data Access Layer (Repository Pattern):**

```typescript
// packages/shared/repositories/user-repository.ts
import { SupabaseClient } from '@supabase/supabase-js'
import { User } from '../types/user'

export class UserRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async updatePoints(userId: string, pointsDelta: number): Promise<void> {
    const { error } = await this.supabase.rpc('increment_user_points', {
      p_user_id: userId,
      p_points: pointsDelta
    })

    if (error) throw error
  }
}
```

### Authentication and Authorization

**Auth Flow:**

```mermaid
sequenceDiagram
    participant U as User (Mobile)
    participant FE as Next.js Frontend
    participant Auth as Supabase Auth
    participant DB as PostgreSQL

    U->>FE: Enter phone number
    FE->>Auth: Send OTP (magic link)
    Auth->>U: SMS with OTP
    U->>FE: Enter OTP code
    FE->>Auth: Verify OTP
    Auth->>DB: Create/update user session
    Auth-->>FE: JWT token + session
    FE->>FE: Store session in localStorage
    FE-->>U: Redirect to /discover
```

**Auth Middleware:**

```typescript
// middleware.ts (Next.js Edge)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: '', ...options })
        }
      }
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes
  if (!session && request.nextUrl.pathname.startsWith('/discover')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/discover/:path*', '/my-gigs/:path*', '/timesheet/:path*']
}
```

---

## Unified Project Structure

```
gigworker-platform/
├── .github/
│   └── workflows/
│       ├── ci.yml                # Linting, type-checking, tests
│       └── deploy.yml            # Deploy to Vercel + Supabase
├── apps/
│   ├── web/                      # Next.js 14 App
│   │   ├── src/
│   │   │   ├── app/              # App Router pages
│   │   │   ├── components/       # UI components
│   │   │   ├── lib/              # Services, hooks, utils
│   │   │   └── styles/           # Global CSS
│   │   ├── public/
│   │   │   ├── manifest.json     # PWA manifest
│   │   │   └── icons/            # Achievement badges
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   └── api/                      # Supabase Edge Functions
│       └── supabase/
│           └── functions/
│               ├── clock-in/
│               ├── clock-out/
│               ├── award-points/
│               └── _shared/      # Shared utilities
├── packages/
│   ├── shared/                   # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types/            # TypeScript interfaces
│   │   │   ├── validation/       # Zod schemas
│   │   │   ├── constants/        # Shared constants
│   │   │   └── repositories/     # Data access layer
│   │   └── package.json
│   ├── ui/                       # Shared UI components
│   │   └── src/                  # Headless components
│   └── config/                   # Shared configs
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
├── supabase/
│   ├── migrations/               # Database migrations
│   │   ├── 20250101_initial_schema.sql
│   │   └── 20250102_gamification.sql
│   └── config.toml               # Supabase local config
├── scripts/
│   ├── seed-achievements.ts      # Seed achievement data
│   └── generate-types.sh         # Generate DB types from schema
├── docs/
│   ├── prd.md
│   └── gigworker-platform-architecture.md
├── .env.example
├── .env.local
├── package.json                  # Root package.json
├── turbo.json                    # Turborepo config
├── tsconfig.json                 # Root TypeScript config
└── README.md
```

---

## Development Workflow

### Local Development Setup

**Prerequisites:**
```bash
# Install Node.js 18+
node -v  # Should be >= 18

# Install pnpm (package manager)
npm install -g pnpm

# Install Supabase CLI
brew install supabase/tap/supabase  # macOS
# OR
npm install -g supabase

# Install Turbo globally (optional)
npm install -g turbo
```

**Initial Setup:**
```bash
# Clone repository
git clone <repo-url>
cd gigworker-platform

# Install dependencies
pnpm install

# Start Supabase local (Docker required)
supabase start

# Copy environment variables
cp .env.example .env.local

# Generate TypeScript types from Supabase
pnpm run db:types

# Run database migrations
supabase db reset

# Seed achievements data
pnpm run seed:achievements
```

**Development Commands:**
```bash
# Start all services (web + API functions)
pnpm run dev

# Start frontend only
pnpm run dev --filter=web

# Start specific Edge Function locally
supabase functions serve clock-in --env-file .env.local

# Run tests
pnpm run test              # All tests
pnpm run test:unit         # Unit tests only
pnpm run test:e2e          # E2E tests (Playwright)

# Type-checking
pnpm run type-check

# Linting
pnpm run lint
pnpm run lint:fix

# Database commands
supabase migration new <name>        # Create new migration
supabase db diff                     # Generate migration from changes
supabase db reset                    # Reset local DB
pnpm run db:types                    # Regenerate TypeScript types
```

### Environment Configuration

**Required Environment Variables:**

```bash
# Frontend (.env.local for apps/web)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token

# Shared (both frontend and backend)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Backend Edge Functions (.env for supabase/functions)
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Admin key for Edge Functions
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_PHONE_NUMBER=+1234567890
FCM_SERVER_KEY=AAAA...
MIXPANEL_PROJECT_TOKEN=xxx...

# Production (Set in Vercel + Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
```

---

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment (Vercel):**
- **Platform:** Vercel
- **Build Command:** `turbo run build --filter=web`
- **Output Directory:** `apps/web/.next`
- **CDN/Edge:** Vercel Edge Network (automatic)
- **Environment:** Global edge locations with regional functions

**Backend Deployment (Supabase):**
- **Platform:** Supabase Cloud
- **Build Command:** `supabase functions deploy <function-name>`
- **Deployment Method:** CLI deployment via GitHub Actions
- **Region:** Singapore (ap-southeast-1)

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm run lint

      - name: Type-check
        run: pnpm run type-check

      - name: Run tests
        run: pnpm run test:unit

  deploy-frontend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Deploy Edge Functions
        run: |
          supabase functions deploy clock-in --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase functions deploy clock-out --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase functions deploy award-points --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:54321 | Local development |
| Preview | https://gigworker-pr-123.vercel.app | https://staging-xxx.supabase.co | PR preview deployments |
| Production | https://gigworker.app | https://aoiwrdzlichescqgnohi.supabase.co | Live environment |

---

## Security and Performance

### Security Requirements

**Frontend Security:**
- **CSP Headers:** `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co;`
- **XSS Prevention:** React auto-escaping + DOMPurify for user-generated content
- **Secure Storage:** Sensitive data in httpOnly cookies, JWT in memory only

**Backend Security:**
- **Input Validation:** Zod schemas for all Edge Function inputs
- **Rate Limiting:** Supabase built-in (60 req/min per IP) + Redis for custom limits
- **CORS Policy:** `Access-Control-Allow-Origin: https://gigworker.app` (production only)

**Authentication Security:**
- **Token Storage:** JWT in httpOnly cookie, refresh token in secure cookie
- **Session Management:** 1-hour access token, 30-day refresh token
- **Password Policy:** N/A (magic link auth only)
- **Phone Verification:** OTP via Twilio with 5-minute expiry

### Performance Optimization

**Frontend Performance:**
- **Bundle Size Target:** < 200KB initial JS (gzipped)
- **Loading Strategy:**
  - App Shell pattern (instant skeleton)
  - Route-based code splitting
  - Image optimization with Next.js Image
  - PWA with Service Worker caching
- **Caching Strategy:**
  - Static assets: 1 year
  - API responses: React Query with 5-minute stale time
  - Images: Vercel Image Optimization CDN

**Backend Performance:**
- **Response Time Target:** < 200ms (p95)
- **Database Optimization:**
  - Indexed queries on common filters (status, category, location)
  - PostGIS spatial indexes for geo-queries
  - Materialized views for leaderboard (refreshed hourly)
- **Caching Strategy:**
  - Redis cache for leaderboards (1-hour TTL)
  - Edge Function response caching (gig listings, achievements)

---

## Testing Strategy

### Testing Pyramid

```
      E2E Tests (Playwright)
      /                    \
    /                        \
  Integration Tests (Vitest)
  /                            \
Frontend Unit (Vitest)    Backend Unit (Deno Test)
```

### Test Organization

**Frontend Tests:**
```
apps/web/tests/
├── unit/
│   ├── components/
│   │   ├── GigCard.test.tsx
│   │   └── ClockInButton.test.tsx
│   └── hooks/
│       └── use-gigs.test.ts
├── integration/
│   └── gig-application-flow.test.tsx
└── e2e/
    ├── discover-and-apply.spec.ts
    └── clock-in-clock-out.spec.ts
```

**Backend Tests:**
```
apps/api/supabase/functions/
├── clock-in/
│   ├── index.ts
│   └── index.test.ts
└── _shared/
    ├── gamification.ts
    └── gamification.test.ts
```

### Test Examples

**Frontend Component Test:**
```typescript
// apps/web/tests/unit/components/GigCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GigCard } from '@/components/gigs/GigCard'

describe('GigCard', () => {
  const mockGig = {
    id: '123',
    title: 'F&B Server',
    hourly_rate: 15,
    category: 'F&B',
    points_reward: 50
  }

  it('renders gig details correctly', () => {
    render(<GigCard gig={mockGig} onApply={vi.fn()} />)

    expect(screen.getByText('F&B Server')).toBeInTheDocument()
    expect(screen.getByText('RM 15/hr')).toBeInTheDocument()
    expect(screen.getByText('+50 pts')).toBeInTheDocument()
  })

  it('calls onApply when Apply button clicked', () => {
    const mockOnApply = vi.fn()
    render(<GigCard gig={mockGig} onApply={mockOnApply} />)

    fireEvent.click(screen.getByText('Apply Now'))
    expect(mockOnApply).toHaveBeenCalledWith('123')
  })
})
```

**Backend API Test:**
```typescript
// apps/api/supabase/functions/clock-in/index.test.ts
import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts'

Deno.test('clock-in validates location', async () => {
  const req = new Request('http://localhost', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    body: JSON.stringify({
      gigId: 'test-gig-id',
      lat: 3.1390,  // Too far from gig location
      lng: 101.6869
    })
  })

  const res = await handleRequest(req)
  const body = await res.json()

  assertEquals(res.status, 400)
  assertEquals(body.error, 'Must be at gig location to clock in')
})
```

**E2E Test:**
```typescript
// apps/web/tests/e2e/discover-and-apply.spec.ts
import { test, expect } from '@playwright/test'

test('gigworker can discover and apply to gig', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="phone"]', '+60123456789')
  await page.click('button:text("Send OTP")')
  await page.fill('[name="otp"]', '123456')
  await page.click('button:text("Verify")')

  // Should redirect to discover page
  await expect(page).toHaveURL('/discover')

  // Find and apply to gig
  await page.click('.gig-card:first-child button:text("Apply Now")')

  // Fill application form
  await page.fill('[name="coverMessage"]', 'I am interested in this gig')
  await page.click('button:text("Submit Application")')

  // Should show success message
  await expect(page.locator('text=Application submitted!')).toBeVisible()

  // Should award points
  await expect(page.locator('text=+10 points')).toBeVisible()
})
```

---

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define types in `packages/shared/src/types` and import from `@gigworker/shared`
- **API Calls:** Never make direct `fetch()` calls - use the service layer (`lib/services/*`)
- **Environment Variables:** Access only through `lib/config.ts`, never `process.env` directly in components
- **Error Handling:** All API routes must use the standard error wrapper with proper error codes
- **State Updates:** Never mutate Zustand state directly - use provided actions
- **Database Access:** Frontend uses Supabase client, backend uses service role key (never expose service role to frontend)
- **Gamification Events:** All point awards must go through `awardPoints()` function for consistency
- **Location Validation:** Always validate user location before clock-in/clock-out (100m radius)
- **RLS Policies:** Never disable RLS - create proper policies for all tables

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `GigCard.tsx` |
| Hooks | camelCase with 'use' | - | `useGigs.ts`, `useAuth.ts` |
| API Routes | - | kebab-case | `/api/gig-applications` |
| Database Tables | - | snake_case | `gig_applications`, `user_achievements` |
| Edge Functions | - | kebab-case | `clock-in/`, `award-points/` |
| Constants | UPPER_SNAKE_CASE | UPPER_SNAKE_CASE | `MAX_GIG_DISTANCE_KM` |
| Types/Interfaces | PascalCase | PascalCase | `Gig`, `User`, `TimeSheet` |

---

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Supabase API
    participant DB as Database

    U->>FE: Submit action
    FE->>API: API request
    API->>DB: Query

    alt Success
        DB-->>API: Data
        API-->>FE: { data }
        FE-->>U: Success UI
    else Validation Error
        DB-->>API: Constraint violation
        API-->>FE: { error: { code: 'INVALID_INPUT', message: '...' } }
        FE-->>U: Toast error message
    else Auth Error
        API-->>FE: { error: { code: 'UNAUTHORIZED', message: '...' } }
        FE->>FE: Clear session
        FE-->>U: Redirect to /login
    else Server Error
        API-->>FE: { error: { code: 'SERVER_ERROR', message: '...' } }
        FE-->>U: Toast + retry option
    end
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: Record<string, any>;  // Additional context
    timestamp: string;      // ISO 8601
    requestId: string;      // For support/debugging
  };
}
```

### Frontend Error Handling

```typescript
// lib/utils/error-handler.ts
import { toast } from 'sonner'
import { PostgrestError } from '@supabase/supabase-js'

export function handleApiError(error: PostgrestError | Error) {
  // Map Supabase error codes to user-friendly messages
  const errorMap: Record<string, string> = {
    '23505': 'You have already applied to this gig',
    '23503': 'Invalid gig or user reference',
    'PGRST116': 'No data found',
    'PGRST301': 'Unauthorized access'
  }

  const code = 'code' in error ? error.code : 'UNKNOWN'
  const userMessage = errorMap[code] || error.message || 'An error occurred'

  toast.error(userMessage)

  // Log to error tracking (Sentry)
  console.error('[API Error]', { code, message: error.message })
}

// Usage in components
try {
  await gigService.applyToGig(gigId)
  toast.success('Application submitted!')
} catch (error) {
  handleApiError(error as PostgrestError)
}
```

### Backend Error Handling

```typescript
// apps/api/supabase/functions/_shared/error-handler.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super(message)
  }
}

export function errorResponse(error: AppError | Error) {
  const isAppError = error instanceof AppError

  return new Response(
    JSON.stringify({
      error: {
        code: isAppError ? error.code : 'SERVER_ERROR',
        message: error.message,
        details: isAppError ? error.details : undefined,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    }),
    {
      status: isAppError ? error.statusCode : 500,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

// Usage in Edge Functions
try {
  // ... business logic
} catch (error) {
  if (error.message.includes('location')) {
    throw new AppError('INVALID_LOCATION', 'Must be at gig location', 400)
  }
  throw error
}
```

---

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Vercel Analytics (Web Vitals) + Sentry (errors)
- **Backend Monitoring:** Supabase Dashboard (API metrics) + Axiom (logs)
- **Error Tracking:** Sentry (frontend + backend)
- **Performance Monitoring:** Vercel Speed Insights + Lighthouse CI
- **User Analytics:** Mixpanel (funnels, cohorts, gamification events)

### Key Metrics

**Frontend Metrics (Vercel Analytics):**
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1
- **JavaScript Errors:** Track via Sentry
- **API Response Times:** Measure via React Query devtools

**Backend Metrics (Supabase Dashboard):**
- **Request Rate:** Requests per second
- **Error Rate:** < 1% of total requests
- **Response Time:** p50 < 100ms, p95 < 200ms, p99 < 500ms
- **Database Query Performance:** Slow query alerts (> 1s)
- **Edge Function Invocations:** Execution count + duration

**Business Metrics (Mixpanel):**
- **DAU/MAU:** Daily/Monthly active users
- **Gig Application Rate:** % of users who apply after viewing
- **Clock-in Success Rate:** % of accepted gigs actually worked
- **Gamification Engagement:** % of users actively earning points
- **Achievement Unlock Rate:** Distribution of achievement unlocks
- **Leaderboard Participation:** % of users checking leaderboard

---

## Next Steps

### Immediate Actions (Week 1)

1. **Setup Development Environment**
   - Initialize monorepo with Turborepo
   - Configure Supabase local development
   - Set up Vercel project

2. **Database Schema Implementation**
   - Create initial migration with core tables
   - Set up RLS policies
   - Seed achievements data

3. **Authentication Flow**
   - Implement magic link auth (phone)
   - Create login/register UI
   - Test auth flow end-to-end

### Phase 1: MVP Features (Weeks 2-4)

1. **Gig Discovery**
   - Gig listing with filters
   - Search by category, location, rate
   - Apply to gig flow

2. **Time Tracking**
   - Clock in/out with location validation
   - Timesheet history view
   - Earnings calculation

3. **Basic Gamification**
   - Points system for gig completion
   - User level progression
   - Achievement badges (first 10)

### Phase 2: Engagement Features (Weeks 5-8)

1. **Advanced Gamification**
   - Leaderboard system
   - Streaks and challenges
   - Social sharing of achievements

2. **Notifications**
   - Push notifications for gig matches
   - SMS alerts for job opportunities
   - Achievement unlock notifications

3. **Profile & Preferences**
   - User profile customization
   - Job category preferences
   - Notification settings

### Phase 3: Optimization & Polish (Weeks 9-12)

1. **Performance Optimization**
   - Bundle size reduction
   - PWA offline capabilities
   - Database query optimization

2. **Analytics Integration**
   - Mixpanel event tracking
   - Funnel analysis
   - A/B testing framework

3. **Production Readiness**
   - Comprehensive testing
   - Security audit
   - Load testing
   - Documentation finalization

---

**Document Status:** ✅ Complete
**Last Updated:** 2025-10-01
**Next Review:** After MVP launch
