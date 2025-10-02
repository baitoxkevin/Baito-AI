# Gigworker Platform - Frontend Architecture

> **Note:** This document provides frontend-specific implementation details. For the complete system architecture, see [gigworker-platform-architecture.md](./gigworker-platform-architecture.md).

---

## Overview

The Gigworker Platform frontend is a **mobile-first Progressive Web App (PWA)** built with **Next.js 14 App Router**, emphasizing instant load times, offline capabilities, and gamified user experiences inspired by Vimigo's performance-based engagement model.

**Key Principles:**
- Mobile-first responsive design
- Offline-first with Service Worker
- Optimistic UI updates for perceived speed
- Real-time gamification feedback
- Accessibility (WCAG 2.1 AA)

---

## Technology Stack

| Category | Technology | Version | Rationale |
|----------|------------|---------|-----------|
| Framework | Next.js | 14.x (App Router) | SSR/ISR for SEO, optimal performance, PWA support |
| Language | TypeScript | 5.5+ | Type safety, better DX |
| UI Library | shadcn/ui + Radix UI | Latest | Accessible, customizable, consistent with Baito-AI |
| Styling | TailwindCSS | 3.4+ | Rapid development, small bundle |
| State Management | Zustand + React Query | Latest | Lightweight global state + server cache |
| Forms | React Hook Form + Zod | Latest | Performance + validation |
| Animations | Framer Motion | Latest | Smooth gamification animations |
| Testing | Vitest + Playwright | Latest | Fast unit tests + E2E |
| Analytics | Mixpanel | Latest | Gamification event tracking |

---

## Component Architecture

### Directory Structure

```
apps/web/src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth routes (unauthenticated)
│   │   ├── login/
│   │   │   └── page.tsx        # Phone login
│   │   └── register/
│   │       └── page.tsx        # Registration
│   ├── (gigworker)/           # Authenticated routes
│   │   ├── layout.tsx          # Shared layout with BottomNav
│   │   ├── discover/
│   │   │   └── page.tsx        # Gig discovery page
│   │   ├── my-gigs/
│   │   │   └── page.tsx        # Applied + active gigs
│   │   ├── timesheet/
│   │   │   └── page.tsx        # Clock in/out interface
│   │   ├── earnings/
│   │   │   └── page.tsx        # Payment history
│   │   ├── achievements/
│   │   │   └── page.tsx        # Gamification dashboard
│   │   ├── leaderboard/
│   │   │   └── page.tsx        # Rankings
│   │   └── profile/
│   │       └── page.tsx        # User settings
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── components/
│   ├── ui/                     # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   ├── gigs/                   # Gig-related components
│   │   ├── GigCard.tsx         # Gig display card
│   │   ├── GigFilters.tsx      # Filter panel
│   │   ├── GigDetails.tsx      # Detail modal
│   │   └── ApplyGigDialog.tsx  # Application form
│   ├── gamification/           # Gamification UI
│   │   ├── LevelProgress.tsx   # User level bar
│   │   ├── BadgeGrid.tsx       # Achievement badges
│   │   ├── LeaderboardWidget.tsx
│   │   ├── PointsAnimation.tsx # +XX points animation
│   │   └── StreakCounter.tsx   # Login streak display
│   ├── timesheet/              # Time tracking
│   │   ├── ClockInButton.tsx   # Clock in with location
│   │   ├── ClockOutButton.tsx
│   │   ├── TimesheetHistory.tsx
│   │   └── LocationValidator.tsx
│   └── layout/                 # Layout components
│       ├── AppShell.tsx        # Main app container
│       ├── BottomNav.tsx       # Mobile bottom navigation
│       ├── TopBar.tsx          # Header with points/level
│       └── ProfileAvatar.tsx
├── lib/
│   ├── services/               # API service layer
│   │   ├── gig-service.ts      # Gig CRUD operations
│   │   ├── gamification-service.ts
│   │   ├── timesheet-service.ts
│   │   └── auth-service.ts
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-gigs.ts         # React Query hook
│   │   ├── use-auth.ts         # Auth state hook
│   │   ├── use-location.ts     # Geolocation hook
│   │   └── use-achievements.ts
│   ├── stores/                 # Zustand stores
│   │   ├── auth-store.ts       # User session
│   │   └── ui-store.ts         # UI state (modals, etc.)
│   └── utils/
│       ├── supabase.ts         # Supabase client
│       ├── format.ts           # Formatters (date, currency)
│       └── validation.ts       # Zod schemas
└── public/
    ├── icons/                  # Achievement badges (SVG)
    ├── manifest.json           # PWA manifest
    └── service-worker.js       # Offline support
```

### Component Patterns

#### 1. Feature Components (Smart Components)

Located in feature folders (`gigs/`, `gamification/`, `timesheet/`)

**Responsibilities:**
- Fetch data via React Query hooks
- Handle business logic
- Manage local state
- Pass data to presentational components

**Example:**
```typescript
// components/gigs/GigDiscovery.tsx
'use client'

import { useState } from 'react'
import { useGigs } from '@/lib/hooks/use-gigs'
import { useLocation } from '@/lib/hooks/use-location'
import { GigCard } from './GigCard'
import { GigFilters } from './GigFilters'

export function GigDiscovery() {
  const [filters, setFilters] = useState({ category: null, maxDistance: 10 })
  const { location } = useLocation()
  const { data: gigs, isLoading } = useGigs(filters, location)

  return (
    <div className="p-4">
      <GigFilters value={filters} onChange={setFilters} />

      {isLoading && <SkeletonLoader />}

      <div className="grid gap-4 mt-4">
        {gigs?.map(gig => (
          <GigCard
            key={gig.id}
            gig={gig}
            userLocation={location}
          />
        ))}
      </div>
    </div>
  )
}
```

#### 2. Presentational Components (Dumb Components)

Located in `ui/` folder or feature folders

**Responsibilities:**
- Display data passed via props
- Emit events via callbacks
- No direct API calls
- Highly reusable

**Example:**
```typescript
// components/gigs/GigCard.tsx (simplified from full-stack doc)
interface GigCardProps {
  gig: Gig
  userLocation?: { lat: number; lng: number }
  onApply?: (gigId: string) => void
}

export function GigCard({ gig, userLocation, onApply }: GigCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{gig.title}</CardTitle>
        <Badge>{gig.category}</Badge>
      </CardHeader>
      <CardContent>
        {/* Display gig details */}
      </CardContent>
      <CardFooter>
        <Button onClick={() => onApply?.(gig.id)}>
          Apply Now
        </Button>
      </CardFooter>
    </Card>
  )
}
```

---

## State Management

### State Layers

**1. Server State (React Query):**
```typescript
// lib/hooks/use-gigs.ts
import { useQuery } from '@tanstack/react-query'
import { gigService } from '@/lib/services/gig-service'

export function useGigs(filters, userLocation) {
  return useQuery({
    queryKey: ['gigs', filters, userLocation],
    queryFn: () => gigService.searchGigs(filters, userLocation),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    cacheTime: 10 * 60 * 1000  // 10 minutes
  })
}
```

**2. Global State (Zustand):**
```typescript
// lib/stores/auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  session: Session | null
  setUser: (user: User | null) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      setUser: (user) => set({ user }),
      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null })
      }
    }),
    { name: 'auth-storage' }
  )
)
```

**3. Local State (useState/useReducer):**
```typescript
// For component-specific state (form inputs, UI toggles)
const [isOpen, setIsOpen] = useState(false)
const [filters, setFilters] = useState<GigFilters>({ category: null })
```

**4. URL State (searchParams):**
```typescript
// For shareable/bookmarkable state
'use client'

import { useSearchParams, useRouter } from 'next/navigation'

export function GigFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const category = searchParams.get('category')

  const updateCategory = (newCategory: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('category', newCategory)
    router.push(`/discover?${params.toString()}`)
  }

  return <Select value={category} onChange={updateCategory} />
}
```

---

## Routing Strategy

### Route Organization

```
/                           # Landing (public)
/login                      # Phone login (public)
/register                   # Sign up (public)

# Authenticated routes (require login)
/discover                   # Gig discovery (default after login)
/my-gigs                    # Applied/active gigs
/timesheet                  # Clock in/out
/earnings                   # Payment history
/achievements               # Gamification dashboard
/leaderboard                # Rankings
/profile                    # User settings
```

### Protected Routes (Middleware)

```typescript
// middleware.ts (Next.js Edge)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* config */)
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect unauthenticated users to login
  if (!session && request.nextUrl.pathname.startsWith('/discover')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (session && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/discover', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/discover/:path*', '/my-gigs/:path*', '/timesheet/:path*', '/login', '/register']
}
```

---

## PWA Configuration

### Manifest (public/manifest.json)

```json
{
  "name": "Gigworker Platform",
  "short_name": "Gigworker",
  "description": "Find gigs, track work, earn rewards",
  "start_url": "/discover",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Service Worker (Offline Support)

```javascript
// public/service-worker.js
const CACHE_NAME = 'gigworker-v1'
const URLS_TO_CACHE = [
  '/',
  '/discover',
  '/my-gigs',
  '/timesheet',
  '/offline'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Return offline page if network request fails
        return caches.match('/offline')
      })
    })
  )
})
```

---

## Performance Optimization

### Bundle Splitting

**next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react']
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        supabase: {
          test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
          name: 'supabase',
          priority: 10
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 5
        }
      }
    }
    return config
  }
}
```

### Code Splitting

```typescript
// app/(gigworker)/achievements/page.tsx
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Lazy load heavy components
const BadgeGrid = dynamic(() => import('@/components/gamification/BadgeGrid'), {
  loading: () => <SkeletonLoader />,
  ssr: false  // Client-side only for animations
})

export default function AchievementsPage() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <BadgeGrid />
    </Suspense>
  )
}
```

### Image Optimization

```typescript
import Image from 'next/image'

<Image
  src={gig.company_logo_url}
  alt={gig.company_name}
  width={64}
  height={64}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,..."
/>
```

---

## Gamification UI Patterns

### Points Animation (Vimigo-inspired)

```typescript
// components/gamification/PointsAnimation.tsx
'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface PointsAnimationProps {
  points: number
  onComplete?: () => void
}

export function PointsAnimation({ points, onComplete }: PointsAnimationProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
      onComplete?.()
    }, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.5 }}
      animate={{ opacity: 1, y: -100, scale: 1.2 }}
      exit={{ opacity: 0, y: -200 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-yellow-400 text-white font-bold px-6 py-3 rounded-full shadow-lg">
        +{points} points
      </div>
    </motion.div>
  )
}
```

### Level Progress Bar

```typescript
// components/gamification/LevelProgress.tsx
export function LevelProgress({ user }: { user: User }) {
  const pointsToNextLevel = user.current_level * 100  // Simple formula
  const progress = (user.total_points % pointsToNextLevel) / pointsToNextLevel * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">Level {user.current_level}</span>
        <span className="text-muted-foreground">
          {user.total_points % pointsToNextLevel} / {pointsToNextLevel} XP
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}
```

---

## Mobile-First Design

### Responsive Breakpoints (Tailwind)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Small devices
      'md': '768px',   // Tablets
      'lg': '1024px',  // Desktops (rarely used for gigworker platform)
      'xl': '1280px'
    }
  }
}
```

### Mobile Navigation

```typescript
// components/layout/BottomNav.tsx
'use client'

import { Home, Briefcase, Clock, Trophy, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/discover', icon: Home, label: 'Discover' },
    { href: '/my-gigs', icon: Briefcase, label: 'My Gigs' },
    { href: '/timesheet', icon: Clock, label: 'Clock' },
    { href: '/achievements', icon: Trophy, label: 'Rewards' },
    { href: '/profile', icon: User, label: 'Profile' }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
      <div className="flex justify-around">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center py-2 px-3 ${
              pathname === href ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
```

---

## Accessibility

### ARIA Labels

```typescript
<button
  aria-label="Apply to F&B Server position"
  aria-describedby="gig-123-title"
>
  Apply Now
</button>
```

### Keyboard Navigation

```typescript
// Ensure all interactive elements are keyboard accessible
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
  onClick={handleClick}
>
  Interactive Element
</div>
```

### Color Contrast

```css
/* Ensure WCAG AA contrast ratio (4.5:1) */
--foreground: 0 0% 3.9%;        /* Almost black on white */
--primary: 221.2 83.2% 53.3%;   /* Blue with sufficient contrast */
```

---

## Testing

### Component Tests (Vitest)

```typescript
// components/gigs/__tests__/GigCard.test.tsx
import { render, screen } from '@testing-library/react'
import { GigCard } from '../GigCard'

test('renders gig details', () => {
  const gig = {
    id: '1',
    title: 'F&B Server',
    hourly_rate: 15,
    points_reward: 50
  }

  render(<GigCard gig={gig} />)

  expect(screen.getByText('F&B Server')).toBeInTheDocument()
  expect(screen.getByText('RM 15/hr')).toBeInTheDocument()
  expect(screen.getByText('+50 pts')).toBeInTheDocument()
})
```

### E2E Tests (Playwright)

```typescript
// e2e/gig-application.spec.ts
import { test, expect } from '@playwright/test'

test('user can apply to gig', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="phone"]', '+60123456789')
  await page.click('text=Send OTP')

  // ... login flow

  await page.goto('/discover')
  await page.click('.gig-card:first-child button:text("Apply Now")')

  await expect(page.locator('text=Application submitted!')).toBeVisible()
  await expect(page.locator('text=+10 points')).toBeVisible()
})
```

---

## Performance Budgets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Bundle Size (JS) | < 200KB (gzipped) | TBD | 🟡 Pending |
| LCP | < 2.5s | TBD | 🟡 Pending |
| FID | < 100ms | TBD | 🟡 Pending |
| CLS | < 0.1 | TBD | 🟡 Pending |
| Lighthouse Score | > 90 | TBD | 🟡 Pending |

---

## Deployment

**Platform:** Vercel

**Build Command:**
```bash
cd apps/web && pnpm run build
```

**Environment Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_MIXPANEL_TOKEN=<token>
```

**Optimization:**
- **Image Optimization:** Automatic via Next.js Image
- **CDN:** Vercel Edge Network
- **Caching:** Static pages cached for 1 hour

---

## Next Steps

See [gigworker-platform-architecture.md](./gigworker-platform-architecture.md) for complete implementation roadmap.

**Frontend-specific priorities:**
1. Set up Next.js 14 project with App Router
2. Configure TailwindCSS + shadcn/ui
3. Implement authentication UI (login/register)
4. Build gig discovery page
5. Create gamification dashboard
6. Add PWA manifest and service worker

---

**Document Status:** ✅ Complete
**Parent Document:** gigworker-platform-architecture.md
