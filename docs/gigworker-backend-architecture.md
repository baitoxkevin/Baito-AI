# Gigworker Platform - Backend Architecture

> **Note:** This document provides backend-specific implementation details. For the complete system architecture, see [gigworker-platform-architecture.md](./gigworker-platform-architecture.md).

---

## Overview

The Gigworker Platform backend leverages **Supabase** (PostgreSQL + Edge Functions) for a fully serverless architecture, emphasizing scalability, cost-efficiency, and rapid development. The backend handles authentication, data storage, business logic for gamification, and integrations with external services (Twilio, Firebase, Mixpanel).

**Key Principles:**
- Serverless-first architecture
- Database-driven via Row Level Security (RLS)
- Event-driven gamification engine
- Type-safe API contracts
- Auto-scaling edge functions

---

## Technology Stack

| Category | Technology | Version | Rationale |
|----------|------------|---------|-----------|
| Database | PostgreSQL | 15+ | ACID compliance, JSON support, Supabase managed |
| Backend Runtime | Deno (Supabase Edge Functions) | Latest | Fast, secure, TypeScript-native |
| API Layer | PostgREST + RPC Functions | Latest | Auto-generated REST + custom logic |
| Authentication | Supabase Auth | Latest | JWT + Magic Link + OAuth |
| Real-time | Supabase Realtime | Latest | WebSocket-based database changes |
| File Storage | Supabase Storage | Latest | S3-compatible, RLS-protected |
| Cache | Redis (Upstash) | Latest | Serverless Redis for leaderboards |
| Notifications | Twilio + Firebase CM | Latest | SMS + push notifications |
| Logging | Supabase Logs + Axiom | Latest | Centralized log aggregation |

---

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
└──────────────┬──────────────────────────┘
               │ HTTPS/WSS
┌──────────────┴──────────────────────────┐
│      Supabase API Gateway               │
│  • Authentication (JWT)                 │
│  • Rate Limiting (60 req/min)           │
│  • CORS Management                      │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
┌─────┴──────┐   ┌──────┴──────┐
│ PostgREST  │   │ Edge        │
│ Auto API   │   │ Functions   │
└─────┬──────┘   └──────┬──────┘
      │                 │
      │        ┌────────┴────────┐
      │        │                 │
┌─────┴────────┴──┐   ┌─────────┴─────┐
│   PostgreSQL    │   │ External APIs │
│ • RLS Policies  │   │ • Twilio SMS  │
│ • Triggers      │   │ • Firebase    │
│ • Functions     │   │ • Mixpanel    │
└─────────────────┘   └───────────────┘
```

---

## Database Architecture

### Core Tables

See [gigworker-platform-architecture.md](./gigworker-platform-architecture.md#database-schema) for complete schema.

**Key Design Patterns:**

1. **Row Level Security (RLS):**
   - All tables have RLS enabled
   - Users can only access their own data
   - Public gigs visible to all authenticated users

2. **PostGIS for Geospatial:**
   - `gigs.location` stored as `GEOGRAPHY(POINT, 4326)`
   - Spatial indexes for fast geo-queries
   - Distance calculations in meters

3. **Audit Logging:**
   - `created_at` and `updated_at` on all tables
   - Database triggers for automatic timestamp updates

### Database Functions (RPC)

**Stored Procedures for Business Logic:**

```sql
-- Search gigs with geo-filtering
CREATE OR REPLACE FUNCTION search_gigs(
  p_category TEXT DEFAULT NULL,
  p_max_distance_km INT DEFAULT 10,
  p_user_lat NUMERIC DEFAULT NULL,
  p_user_lng NUMERIC DEFAULT NULL,
  p_min_rate NUMERIC DEFAULT 0
)
RETURNS SETOF gigs AS $$
BEGIN
  RETURN QUERY
  SELECT g.*
  FROM gigs g
  WHERE g.status = 'open'
    AND g.published_at IS NOT NULL
    AND (p_category IS NULL OR g.category = p_category)
    AND g.hourly_rate >= p_min_rate
    AND (
      p_user_lat IS NULL
      OR ST_DWithin(
        g.location::geography,
        ST_MakePoint(p_user_lng, p_user_lat)::geography,
        p_max_distance_km * 1000  -- Convert km to meters
      )
    )
  ORDER BY
    CASE
      WHEN p_user_lat IS NOT NULL THEN
        ST_Distance(g.location::geography, ST_MakePoint(p_user_lng, p_user_lat)::geography)
      ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;
```

```sql
-- Apply to gig with validation
CREATE OR REPLACE FUNCTION apply_to_gig(
  p_gig_id UUID,
  p_cover_message TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_application_id UUID;
  v_points_earned INT := 10;
BEGIN
  -- Check if already applied
  IF EXISTS (
    SELECT 1 FROM gig_applications
    WHERE user_id = v_user_id AND gig_id = p_gig_id
  ) THEN
    RAISE EXCEPTION 'Already applied to this gig';
  END IF;

  -- Insert application
  INSERT INTO gig_applications (user_id, gig_id, cover_message)
  VALUES (v_user_id, p_gig_id, p_cover_message)
  RETURNING id INTO v_application_id;

  -- Award points
  UPDATE users
  SET total_points = total_points + v_points_earned
  WHERE id = v_user_id;

  RETURN json_build_object(
    'application_id', v_application_id,
    'points_earned', v_points_earned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Database Triggers

**Automatic Updates:**

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
```

---

## Edge Functions Architecture

### Function Organization

```
supabase/functions/
├── clock-in/              # Start timesheet
│   ├── index.ts           # Main handler
│   └── index.test.ts      # Deno tests
├── clock-out/             # End timesheet + gamification
│   ├── index.ts
│   └── index.test.ts
├── apply-to-gig/          # Application submission
│   └── index.ts
├── award-points/          # Points calculation
│   └── index.ts
├── check-achievements/    # Achievement evaluation
│   └── index.ts
├── update-leaderboard/    # Scheduled leaderboard refresh
│   └── index.ts
├── send-notification/     # FCM + Twilio integration
│   └── index.ts
└── _shared/               # Shared utilities
    ├── supabase.ts        # Admin client setup
    ├── gamification.ts    # Gamification logic
    ├── validation.ts      # Zod schemas
    └── types.ts           # Shared types
```

### Edge Function Template

**Example: Clock-Out with Gamification**

```typescript
// supabase/functions/clock-out/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { awardPoints, checkAchievements } from '../_shared/gamification.ts'

const requestSchema = z.object({
  timesheetId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
})

serve(async (req) => {
  try {
    // Authenticate
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Validate request
    const body = await req.json()
    const { timesheetId, lat, lng } = requestSchema.parse(body)

    // Get timesheet with gig location
    const { data: timesheet, error } = await supabase
      .from('timesheets')
      .select('*, gigs!inner(location, hourly_rate)')
      .eq('id', timesheetId)
      .eq('user_id', user.id)
      .is('clock_out', null)  // Must not be clocked out already
      .single()

    if (error) throw new Error('Timesheet not found or already clocked out')

    // Validate location (within 100m of gig)
    const { data: isNear } = await supabase.rpc('is_within_distance', {
      p_point1: `POINT(${lng} ${lat})`,
      p_point2: timesheet.gigs.location,
      p_distance_meters: 100
    })

    if (!isNear) throw new Error('Must be at gig location to clock out')

    // Calculate hours and earnings
    const clockInTime = new Date(timesheet.clock_in)
    const clockOutTime = new Date()
    const hoursWorked = (clockOutTime - clockInTime) / (1000 * 60 * 60)
    const totalAmount = hoursWorked * timesheet.hourly_rate

    // Update timesheet
    await supabase
      .from('timesheets')
      .update({
        clock_out: clockOutTime.toISOString(),
        clock_out_location: `POINT(${lng} ${lat})`,
        total_hours_worked: hoursWorked,
        total_amount: totalAmount
      })
      .eq('id', timesheetId)

    // Award points
    const basePoints = 50
    const bonusPoints = hoursWorked >= 8 ? 20 : 0  // Full day bonus
    const totalPoints = basePoints + bonusPoints

    await awardPoints(supabase, user.id, totalPoints, 'completed_shift')

    // Check for newly unlocked achievements
    const newAchievements = await checkAchievements(supabase, user.id)

    return new Response(
      JSON.stringify({
        success: true,
        hours_worked: hoursWorked,
        amount_earned: totalAmount,
        points_earned: totalPoints,
        new_achievements: newAchievements
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[clock-out error]', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: error.message === 'Unauthorized' ? 401 : 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
```

### Shared Gamification Logic

```typescript
// supabase/functions/_shared/gamification.ts
import { SupabaseClient } from '@supabase/supabase-js'

export async function awardPoints(
  supabase: SupabaseClient,
  userId: string,
  points: number,
  reason: string
) {
  // Update user points
  const { error } = await supabase.rpc('increment_user_points', {
    p_user_id: userId,
    p_points: points
  })

  if (error) throw error

  // Log points award for analytics
  await supabase.from('points_log').insert({
    user_id: userId,
    points,
    reason
  })

  return points
}

export async function checkAchievements(
  supabase: SupabaseClient,
  userId: string
) {
  // Get user stats
  const { data: stats } = await supabase.rpc('get_user_stats', {
    p_user_id: userId
  })

  if (!stats) return []

  // Get unlockable achievements
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)

  // Check each achievement
  const newlyUnlocked = []

  for (const achievement of achievements || []) {
    // Check if already unlocked
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievement.id)
      .single()

    if (existing) continue  // Already unlocked

    // Check criteria
    let unlocked = false

    switch (achievement.criteria_type) {
      case 'gigs_completed':
        unlocked = stats.gigs_completed >= achievement.criteria_value
        break
      case 'hours_worked':
        unlocked = stats.total_hours_worked >= achievement.criteria_value
        break
      case 'perfect_attendance':
        unlocked = stats.attendance_rate === 100 &&
                   stats.gigs_completed >= achievement.criteria_value
        break
      case 'streak_days':
        unlocked = stats.streak_days >= achievement.criteria_value
        break
    }

    if (unlocked) {
      // Unlock achievement
      await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id
      })

      // Award bonus points
      if (achievement.points_reward > 0) {
        await awardPoints(supabase, userId, achievement.points_reward, 'achievement_unlock')
      }

      newlyUnlocked.push(achievement)
    }
  }

  return newlyUnlocked
}
```

---

## Authentication & Authorization

### Supabase Auth Configuration

**Authentication Methods:**
1. **Magic Link (Phone):** Primary method for gigworkers
2. **Email/Password:** Optional backup
3. **OAuth (Google):** Social login

**Session Management:**
- Access token: 1-hour TTL
- Refresh token: 30-day TTL
- Stored in httpOnly cookies (frontend)

### Row Level Security (RLS) Policies

**Example Policies:**

```sql
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can view active gigs (public data)
CREATE POLICY "Anyone can view active gigs"
  ON gigs FOR SELECT
  USING (status = 'open' AND published_at IS NOT NULL);

-- Users can only view their own applications
CREATE POLICY "Users can view own applications"
  ON gig_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON gig_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only view their own timesheets
CREATE POLICY "Users can view own timesheets"
  ON timesheets FOR SELECT
  USING (auth.uid() = user_id);
```

---

## External API Integrations

### Twilio (SMS Notifications)

```typescript
// supabase/functions/send-notification/twilio.ts
import Twilio from 'twilio'

const client = Twilio(
  Deno.env.get('TWILIO_ACCOUNT_SID')!,
  Deno.env.get('TWILIO_AUTH_TOKEN')!
)

export async function sendSMS(to: string, message: string) {
  try {
    const result = await client.messages.create({
      from: Deno.env.get('TWILIO_PHONE_NUMBER')!,
      to,
      body: message
    })

    return { success: true, messageId: result.sid }
  } catch (error) {
    console.error('[Twilio error]', error)
    throw error
  }
}
```

### Firebase Cloud Messaging (Push Notifications)

```typescript
// supabase/functions/send-notification/fcm.ts
export async function sendPush(deviceToken: string, notification: {
  title: string
  body: string
  data?: Record<string, string>
}) {
  const response = await fetch('https://fcm.googleapis.com/v1/projects/gigworker-platform/messages:send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('FCM_SERVER_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        notification,
        data: notification.data
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`FCM error: ${error}`)
  }

  return { success: true }
}
```

### Mixpanel (Analytics)

```typescript
// supabase/functions/_shared/mixpanel.ts
export async function trackEvent(
  userId: string,
  eventName: string,
  properties: Record<string, any> = {}
) {
  const event = {
    event: eventName,
    properties: {
      distinct_id: userId,
      ...properties,
      time: Date.now()
    }
  }

  await fetch('https://api.mixpanel.com/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: btoa(JSON.stringify(event)),
      api_key: Deno.env.get('MIXPANEL_PROJECT_TOKEN')
    })
  })
}
```

---

## Real-time Features

### Supabase Realtime Subscriptions

**Frontend subscribes to database changes:**

```typescript
// Frontend: lib/hooks/use-realtime-gigs.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeGigs() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('gigs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',  // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'gigs'
        },
        (payload) => {
          console.log('[Gig updated]', payload)

          // Invalidate gigs query to refetch
          queryClient.invalidateQueries({ queryKey: ['gigs'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
```

---

## Scheduled Jobs

### Cron Jobs (Supabase Edge Functions)

**Update Leaderboards (Hourly):**

```yaml
# supabase/functions/update-leaderboard/cron.yaml
schedule: '0 * * * *'  # Every hour
timezone: Asia/Singapore
```

```typescript
// supabase/functions/update-leaderboard/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Calculate weekly leaderboard
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

  await supabase.rpc('refresh_leaderboard', {
    p_period_type: 'weekly',
    p_period_start: startOfWeek.toISOString().split('T')[0]
  })

  return new Response(JSON.stringify({ success: true }))
})
```

---

## Error Handling

### Structured Error Responses

```typescript
// _shared/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message)
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401 },
  INVALID_LOCATION: { code: 'INVALID_LOCATION', status: 400 },
  ALREADY_APPLIED: { code: 'ALREADY_APPLIED', status: 409 },
  GIG_NOT_FOUND: { code: 'GIG_NOT_FOUND', status: 404 }
} as const

export function errorResponse(error: Error) {
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
```

---

## Performance Optimization

### Database Query Optimization

**1. Indexes:**
```sql
-- Frequently queried columns
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_gigs_category ON gigs(category);
CREATE INDEX idx_gigs_dates ON gigs(start_date, end_date);

-- Geo-spatial index (PostGIS)
CREATE INDEX idx_gigs_location ON gigs USING GIST(location);

-- User queries
CREATE INDEX idx_gig_applications_user ON gig_applications(user_id);
CREATE INDEX idx_timesheets_user_gig ON timesheets(user_id, gig_id);
```

**2. Materialized Views (Leaderboards):**
```sql
CREATE MATERIALIZED VIEW weekly_leaderboard AS
SELECT
  user_id,
  SUM(total_points) as points_earned,
  COUNT(*) as gigs_completed,
  SUM(total_hours_worked) as hours_worked,
  ROW_NUMBER() OVER (ORDER BY SUM(total_points) DESC) as rank
FROM timesheets
WHERE created_at >= date_trunc('week', CURRENT_DATE)
GROUP BY user_id;

-- Refresh hourly via cron
CREATE UNIQUE INDEX ON weekly_leaderboard(user_id);
```

### Caching Strategy

**Redis for Leaderboards (Upstash):**

```typescript
// _shared/cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_TOKEN')!
})

export async function cacheLeaderboard(
  period: string,
  data: any[]
) {
  const key = `leaderboard:${period}`
  await redis.set(key, JSON.stringify(data), {
    ex: 3600  // 1 hour TTL
  })
}

export async function getLeaderboard(period: string) {
  const key = `leaderboard:${period}`
  const cached = await redis.get(key)
  return cached ? JSON.parse(cached as string) : null
}
```

---

## Testing

### Deno Tests (Edge Functions)

```typescript
// supabase/functions/clock-in/index.test.ts
import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts'
import { handleClockIn } from './index.ts'

Deno.test('clock-in validates location', async () => {
  const req = new Request('http://localhost', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      gigId: 'test-gig-id',
      lat: 3.1390,
      lng: 101.6869
    })
  })

  const res = await handleClockIn(req)
  const body = await res.json()

  assertEquals(res.status, 400)
  assertEquals(body.error.code, 'INVALID_LOCATION')
})
```

### Database Tests (SQL)

```sql
-- Test RLS policies
BEGIN;
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "user-123"}';

  -- Should only see own applications
  SELECT COUNT(*) FROM gig_applications WHERE user_id != 'user-123';
  -- Expected: 0

ROLLBACK;
```

---

## Deployment

**Platform:** Supabase Cloud

**Deploy Edge Functions:**
```bash
# Deploy single function
supabase functions deploy clock-in --project-ref <project-ref>

# Deploy all functions
supabase functions deploy --project-ref <project-ref>
```

**Environment Variables (Supabase Secrets):**
```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxx --project-ref <project-ref>
supabase secrets set TWILIO_AUTH_TOKEN=xxx --project-ref <project-ref>
supabase secrets set FCM_SERVER_KEY=AAAA... --project-ref <project-ref>
```

**Database Migrations:**
```bash
# Create migration
supabase migration new add_gamification_tables

# Apply migrations to production
supabase db push --project-ref <project-ref>
```

---

## Monitoring & Logging

### Supabase Dashboard Metrics

**Track:**
- API request rate and latency
- Database query performance
- Edge function invocations and errors
- Storage usage

### Axiom Log Aggregation

```typescript
// _shared/logger.ts
export async function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata?: Record<string, any>
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata
  }

  // Send to Axiom
  await fetch('https://api.axiom.co/v1/datasets/gigworker-logs/ingest', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('AXIOM_API_TOKEN')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([logEntry])
  })

  // Also log to console for local development
  console.log(JSON.stringify(logEntry))
}
```

---

## Security Best Practices

1. **Never expose Service Role Key to frontend**
   - Use anon key for client-side
   - Service role only in Edge Functions

2. **Always validate inputs with Zod**
   - Parse all request bodies
   - Validate UUIDs, emails, coordinates

3. **Use RLS policies for all tables**
   - Never disable RLS
   - Test policies thoroughly

4. **Rate limiting**
   - Supabase default: 60 req/min per IP
   - Custom limits via Redis for sensitive endpoints

5. **SQL injection prevention**
   - Use parameterized queries
   - Never concatenate SQL strings

---

## Next Steps

See [gigworker-platform-architecture.md](./gigworker-platform-architecture.md) for complete implementation roadmap.

**Backend-specific priorities:**
1. Set up Supabase project (database + auth)
2. Run database migrations (schema creation)
3. Configure RLS policies
4. Deploy initial Edge Functions (clock-in, clock-out)
5. Set up Twilio and FCM integrations
6. Seed achievements data

---

**Document Status:** ✅ Complete
**Parent Document:** gigworker-platform-architecture.md
