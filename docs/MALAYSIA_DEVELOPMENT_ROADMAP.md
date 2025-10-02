# Malaysia Gigworker Platform - Development Roadmap
## 8-Week MVP + 24-Week Full Launch

**Version:** 1.0
**Date:** 2025-10-01
**Target Market:** Malaysia Gig Economy
**Compliance:** Gig Worker Bill 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Legal & Market Context](#legal--market-context)
3. [Phase 1: MVP (Weeks 1-8)](#phase-1-mvp-weeks-1-8)
4. [Phase 2: Competitive Features (Weeks 9-16)](#phase-2-competitive-features-weeks-9-16)
5. [Phase 3: Market Leadership (Weeks 17-24)](#phase-3-market-leadership-weeks-17-24)
6. [Phase 4: Scale & Optimize (Weeks 25-32)](#phase-4-scale--optimize-weeks-25-32)
7. [Technical Stack & Infrastructure](#technical-stack--infrastructure)
8. [Risk Management](#risk-management)
9. [Success Metrics](#success-metrics)

---

## Executive Summary

### Mission
Build Malaysia's #1 gig worker platform combining TROOPERS' matching accuracy, comprehensive timemark features, aggressive gamification, and DuitNow instant payments.

### Timeline
- **MVP Launch:** 8 weeks
- **Full Feature Launch:** 24 weeks (6 months)
- **Market Leadership:** 32 weeks (8 months)

### Target Users (Year 1)
- **Workers:** 5,000 (Month 3) → 50,000 (Month 12)
- **Employers:** 50 (Month 3) → 500 (Month 12)
- **Cities:** Klang Valley → Penang, Johor, Ipoh

### Key Differentiators
1. ✅ **95% AI matching accuracy** (TROOPERS standard)
2. ✅ **DuitNow instant pay** (FREE, Malaysia-first)
3. ✅ **Comprehensive timemark** (GPS + Face + Geofence + Photo proof)
4. ✅ **Aggressive gamification** (Vimigo-inspired)
5. ✅ **Legal compliance** (Gig Worker Bill 2025)

---

## Legal & Market Context

### Gig Worker Bill 2025 (MANDATORY)

**Payment Requirements:**
- ✅ Pay workers within **7 days** of service completion
- ✅ Service agreement must specify rate, payment method, benefits
- ✅ **PERKESO contributions** (1.25% auto-deduction for e-hailing/p-hailing)

**Worker Protections:**
- ✅ Insurance coverage requirements
- ✅ Clear termination procedures
- ✅ Minimum standard working arrangements

**Platform Obligations:**
- ✅ Written service agreements
- ✅ Transparent payment terms
- ✅ Worker welfare provisions

### Malaysia Payment Infrastructure

**Available Options:**
- **DuitNow** - Real-time P2P, FREE up to RM5,000, 24/7
- **eWallet** - GrabPay, Touch 'n Go, Boost (90% usage)
- **FPX** - Online banking, real-time
- **Bank Transfer** - Same/next day

**Our Strategy:**
- ❌ NO US-style instant cash-out (not viable)
- ✅ **DuitNow as primary** (instant + free)
- ✅ **7-day compliance** (legal requirement)
- ✅ **Multiple payment options** (worker choice)

---

## Phase 1: MVP (Weeks 1-8)

**Goal:** Launch functional platform compliant with Gig Worker Bill 2025

### Week 1-2: Foundation & Core Setup

**Backend Infrastructure:**
- ✅ Set up Supabase project (PostgreSQL + Auth + Storage)
- ✅ Configure Vercel deployment
- ✅ Create database schema (core tables)
- ✅ Set up Row Level Security (RLS) policies
- ✅ Configure environment variables
- ✅ Set up CI/CD pipeline

**Frontend Setup:**
- ✅ Initialize Next.js 14 App Router project
- ✅ Configure TailwindCSS + shadcn/ui
- ✅ Set up TypeScript strict mode
- ✅ Create design system (colors, typography)
- ✅ Set up state management (Zustand + React Query)

**Legal Compliance Setup:**
- ✅ Create service agreement template
- ✅ Configure payment escrow system
- ✅ Set up 7-day auto-release trigger
- ✅ Research PERKESO integration requirements

**Deliverables:**
- [ ] Development environment ready
- [ ] Database schema designed
- [ ] Design system implemented
- [ ] Compliance framework in place

---

### Week 3-4: Core Job Platform

**Job Discovery & Matching:**
- ✅ Job search with filters (category, location, date, pay range)
- ✅ Geolocation-based search (PostGIS)
- ✅ Job listing cards (mobile-first design)
- ✅ Job detail view
- ✅ Search pagination & infinite scroll

**AI Matching Algorithm (Phase 1 - Basic):**
- ✅ Skill-based matching
- ✅ Location-based matching (10km radius)
- ✅ Availability matching
- ✅ Rating-based prioritization
- ✅ Target: 85%+ accuracy (improve to 95% in Phase 2)

**Application System:**
- ✅ One-click apply
- ✅ Application status tracking
- ✅ Application history
- ✅ Employer can accept/reject
- ✅ 24-hour response time notification

**User Authentication:**
- ✅ Phone number authentication (OTP)
- ✅ Email authentication (fallback)
- ✅ Profile creation wizard
- ✅ Photo upload
- ✅ Skills & experience input
- ✅ Verification flow (IC/passport)

**Deliverables:**
- [ ] Job discovery working
- [ ] Basic AI matching (85%)
- [ ] Application system complete
- [ ] User authentication live

---

### Week 5-6: Timemark & Time Tracking

**Clock In/Out System:**
- ✅ GPS location capture on clock in
- ✅ Selfie/photo capture for verification
- ✅ Geofence validation (100m radius)
- ✅ Shift reminder notifications
- ✅ Clock out with GPS validation

**Timesheet Management:**
- ✅ Automatic timesheet generation
- ✅ Hours calculation (clock_out - clock_in)
- ✅ Overtime detection (>8 hours)
- ✅ Break tracking (manual start/stop)
- ✅ Timesheet summary view

**Photo Proof:**
- ✅ Timestamp overlay on photos
- ✅ GPS coordinates overlay
- ✅ Photo gallery (organized by shift)
- ✅ Photo validation (require at clock in/out)

**Deliverables:**
- [ ] GPS time tracking working
- [ ] Selfie verification implemented
- [ ] Automatic timesheets generating
- [ ] Photo proof system complete

---

### Week 7-8: Payment & Compliance

**Payment System (DuitNow Priority):**
- ✅ Register with PayNet for DuitNow API
- ✅ Integrate Stripe/Xendit for escrow
- ✅ Payment holding system
- ✅ 7-day auto-release mechanism
- ✅ DuitNow instant transfer
- ✅ eWallet integration (GrabPay, TnG, Boost)

**Legal Compliance:**
- ✅ Service agreement generation
- ✅ Rate and payment method specification
- ✅ PERKESO 1.25% auto-deduction setup
- ✅ Worker insurance information display
- ✅ Termination procedure documentation

**Earnings Dashboard:**
- ✅ Real-time earnings tracking
- ✅ Payment history
- ✅ Upcoming payments
- ✅ Tax documentation (1099 equivalent)
- ✅ Earnings analytics (weekly, monthly)

**Employer Features (Basic):**
- ✅ Post job/shift
- ✅ View applications
- ✅ Accept/reject applicants
- ✅ Approve timesheets
- ✅ Payment management
- ✅ Worker performance view

**Deliverables:**
- [ ] DuitNow payment live
- [ ] 7-day compliance enforced
- [ ] Earnings dashboard complete
- [ ] Employer portal functional

---

### MVP Launch Checklist (End of Week 8)

**Core Features:**
- [x] Job search & discovery
- [x] AI matching (85% accuracy)
- [x] One-click application
- [x] GPS time tracking
- [x] Selfie verification
- [x] Geofencing (100m)
- [x] Automatic timesheets
- [x] DuitNow instant payment
- [x] 7-day payment compliance
- [x] Earnings dashboard
- [x] Basic employer portal

**Legal Compliance:**
- [x] Service agreements
- [x] PERKESO integration
- [x] Insurance information
- [x] 7-day payment guarantee

**Testing:**
- [ ] 50 beta workers onboarded
- [ ] 5-10 beta employers
- [ ] 100+ test shifts completed
- [ ] Payment system validated
- [ ] GPS accuracy verified

**Metrics Targets (Month 3):**
- Workers: 500-1,000
- Employers: 20-50
- Shifts: 1,000-2,000
- Matching accuracy: 85%+
- Payment success: 99%+

---

## Phase 2: Competitive Features (Weeks 9-16)

**Goal:** Add differentiation features to compete with TROOPERS and establish market position

### Week 9-10: Gamification Foundation

**Points System:**
- ✅ Base points per shift (50 pts)
- ✅ Bonus for 8+ hour shifts (20 pts)
- ✅ Weekend/holiday multipliers (2x)
- ✅ Streak bonuses (5 consecutive days = 100 pts)
- ✅ Points ledger & history

**Achievement Badges:**
- ✅ "First Shift" - Complete first gig (50 pts)
- ✅ "Weekend Warrior" - 10 weekend shifts (200 pts)
- ✅ "Reliable" - 95% attendance rate (500 pts)
- ✅ "Speed Demon" - 50 shifts in 30 days (300 pts)
- ✅ "Night Owl" - 20 night shifts (150 pts)
- ✅ Badge display on profile
- ✅ Achievement unlock notifications

**Level System:**
- ✅ Bronze (0-1000 pts)
- ✅ Silver (1000-5000 pts)
- ✅ Gold (5000-10000 pts)
- ✅ Platinum (10000-25000 pts)
- ✅ Diamond (25000+ pts)
- ✅ Level-based benefits

**Deliverables:**
- [ ] Points system live
- [ ] 20+ achievement badges
- [ ] 5-tier level progression
- [ ] Gamification dashboard

---

### Week 11-12: Social Gamification

**Leaderboards:**
- ✅ Weekly leaderboard (resets Monday)
- ✅ Monthly leaderboard
- ✅ All-time leaderboard
- ✅ Category-specific (by industry, location)
- ✅ Friend leaderboards
- ✅ Top 10/50/100 displays
- ✅ Prize/reward system

**Social Features:**
- ✅ Worker profiles (public/private toggle)
- ✅ Follow other workers
- ✅ Shift buddy system (work with friends)
- ✅ In-app chat (worker ↔ employer)
- ✅ Community forum/feed

**Top Pro Program (Loyalty):**
- ✅ Qualification criteria (points, rating, attendance)
- ✅ **Early shift access** (24h before public)
- ✅ **Bonus multipliers** (1.5x points)
- ✅ **Priority support** (dedicated chat)
- ✅ **Exclusive gigs** (high-paying, premium)
- ✅ Top Pro badge

**Deliverables:**
- [ ] Leaderboard system live
- [ ] Social features implemented
- [ ] Top Pro program launched
- [ ] Community engagement tools

---

### Week 13-14: Enhanced Time Tracking

**Advanced Timemark Features:**
- ✅ Real-time location tracking (breadcrumb trails)
- ✅ Geofence alerts (leave job site notification)
- ✅ Photo proof with company logo overlay
- ✅ Break tracking (paid/unpaid)
- ✅ Mileage tracking (for delivery/driver roles)
- ✅ Mileage calculator (RM per km)

**Admin Dashboard (Employers):**
- ✅ Live attendance view (map-based)
- ✅ Timesheet approval workflow
- ✅ GPS log review (breadcrumb playback)
- ✅ Photo gallery review
- ✅ Anomaly detection (late, early, wrong location)
- ✅ Attendance reports (Excel/PDF export)

**Timesheet Enhancements:**
- ✅ Weekly/monthly summaries
- ✅ Export as PDF/Excel
- ✅ Multi-shift aggregation
- ✅ Custom date range reports
- ✅ Tax-ready documentation

**Deliverables:**
- [ ] Advanced tracking features
- [ ] Admin dashboard complete
- [ ] Enhanced reporting
- [ ] Mileage tracking for drivers

---

### Week 15-16: Payment & Benefits

**Payment Enhancements:**
- ✅ 3-day fast payment (RM2 fee) - Premium
- ✅ Same-day payment (RM5 fee) - If feasible
- ✅ DuitNow as default (FREE)
- ✅ Payment method selection
- ✅ Multiple account support

**Backup Talent System (TROOPERS Feature):**
- ✅ Standby worker pool
- ✅ Auto-notify backups on no-shows
- ✅ Backup confirmation flow
- ✅ Reliability scoring
- ✅ Backup incentives (bonus points)

**Shift Management:**
- ✅ Shift swap/trade between workers
- ✅ Emergency cancellation with penalty
- ✅ Shift reminder escalation
- ✅ Auto-replacement system

**Deliverables:**
- [ ] Fast payment options
- [ ] Backup talent system
- [ ] Shift management tools
- [ ] No-show prevention

---

### Phase 2 Completion (End of Week 16)

**Features Added:**
- ✅ Full gamification (points, badges, levels, leaderboards)
- ✅ Top Pro loyalty program
- ✅ Social features & community
- ✅ Advanced timemark (real-time tracking, mileage)
- ✅ Admin dashboard
- ✅ Backup talent system
- ✅ Payment enhancements

**Metrics Targets (Month 6):**
- Workers: 10,000-20,000
- Employers: 200-300
- Shifts/month: 50,000+
- Matching accuracy: 95%+ (TROOPERS level)
- Top Pro members: 5-10% of workers
- Gamification engagement: 60%+

---

## Phase 3: Market Leadership (Weeks 17-24)

**Goal:** Establish as #1 platform in Malaysia with unique benefits

### Week 17-18: Worker Benefits & Welfare

**Insurance Marketplace:**
- ✅ Life insurance quotes integration
- ✅ Health insurance marketplace
- ✅ Accident insurance (gig-specific)
- ✅ Insurance partner onboarding
- ✅ Subsidized premiums for Top Pros

**Financial Wellness:**
- ✅ Expense tracking tool
- ✅ Tax estimation calculator
- ✅ Emergency fund savings goals
- ✅ Financial literacy content
- ✅ Budgeting tools

**Transport & Gas Discounts:**
- ✅ Partner with Petronas/Shell for discounts
- ✅ 25¢/liter savings (Gridwise model)
- ✅ Ride-hailing credits (Grab integration)
- ✅ MRT/LRT subsidies

**Deliverables:**
- [ ] Insurance marketplace live
- [ ] Financial tools implemented
- [ ] Discount partnerships secured
- [ ] Worker benefits portal

---

### Week 19-20: Referral & Growth

**Referral Program:**
- ✅ Refer worker: RM50 bonus (after 5 completed shifts)
- ✅ Refer employer: RM200 bonus (after first hire)
- ✅ Referral tracking & attribution
- ✅ Leaderboard for referrals
- ✅ Team referral challenges

**Worker Acquisition:**
- ✅ Social media campaigns
- ✅ University partnerships
- ✅ Job fair presence
- ✅ Influencer marketing
- ✅ WhatsApp/Telegram groups

**Employer Acquisition:**
- ✅ Sales team onboarding
- ✅ B2B partnerships
- ✅ Industry association tie-ups
- ✅ Case studies & testimonials
- ✅ Free trial period (first 10 workers)

**Deliverables:**
- [ ] Referral program launched
- [ ] Acquisition channels live
- [ ] Sales pipeline established
- [ ] Partnership agreements signed

---

### Week 21-22: Advanced AI & Analytics

**AI Matching Optimization (95%+):**
- ✅ Machine learning model training
- ✅ Historical performance data analysis
- ✅ Predictive job matching
- ✅ Worker travel time optimization
- ✅ Personality/culture fit matching
- ✅ A/B testing different algorithms

**Earnings Analytics:**
- ✅ Best paying gigs/categories identification
- ✅ Peak earning hours/days analysis
- ✅ Monthly income trends
- ✅ Comparison to similar workers
- ✅ Earning potential calculator
- ✅ Personalized recommendations

**Performance Insights:**
- ✅ Attendance rate tracking
- ✅ Average rating analysis
- ✅ Skills gap identification
- ✅ Improvement recommendations
- ✅ Career progression suggestions
- ✅ Training/certification recommendations

**Deliverables:**
- [ ] 95%+ AI matching accuracy
- [ ] Advanced analytics dashboard
- [ ] Personalized insights
- [ ] Career development tools

---

### Week 23-24: Scale & Infrastructure

**Performance Optimization:**
- ✅ Database query optimization
- ✅ Redis caching for leaderboards
- ✅ CDN for static assets
- ✅ Image optimization (WebP)
- ✅ Code splitting & lazy loading
- ✅ Edge function optimization

**Multi-Region Expansion:**
- ✅ Penang launch
- ✅ Johor Bahru launch
- ✅ Ipoh launch
- ✅ Regional marketing campaigns
- ✅ Local employer partnerships

**Platform Stability:**
- ✅ Load testing (10,000+ concurrent users)
- ✅ Disaster recovery plan
- ✅ Automated backups (daily)
- ✅ Monitoring & alerting (Sentry)
- ✅ 99.9% uptime SLA

**Deliverables:**
- [ ] Multi-region live
- [ ] Performance optimized
- [ ] Stability ensured
- [ ] Monitoring comprehensive

---

### Phase 3 Completion (End of Week 24)

**Features Added:**
- ✅ Insurance marketplace & benefits
- ✅ Referral program
- ✅ 95%+ AI matching
- ✅ Advanced analytics
- ✅ Multi-region expansion

**Metrics Targets (Month 9):**
- Workers: 30,000-50,000
- Employers: 500-800
- Shifts/month: 200,000+
- Cities: 4-5 major cities
- Referrals: 20% of new signups
- Top Pro: 10-15% of workers

---

## Phase 4: Scale & Optimize (Weeks 25-32)

**Goal:** Solidify market leadership and prepare for regional expansion

### Week 25-26: Mobile App Enhancement

**Progressive Web App (PWA) → Native:**
- ✅ Convert to React Native (optional)
- ✅ OR enhance PWA features
- ✅ Offline mode support
- ✅ Background location tracking
- ✅ Push notification optimization
- ✅ Install prompts

**App Store Optimization:**
- ✅ Play Store & App Store listing
- ✅ Screenshots & app preview videos
- ✅ ASO keyword optimization
- ✅ Review management system
- ✅ In-app rating prompts

---

### Week 27-28: Advanced Gamification

**PK System (Vimigo-Inspired):**
- ✅ Challenge other workers (earn more in a week)
- ✅ Winner gets bonus points/cash prize
- ✅ PK leaderboard
- ✅ 1v1, team vs team modes

**Team Competitions:**
- ✅ Group challenges (total hours worked)
- ✅ Team leaderboards
- ✅ Team-based rewards
- ✅ Corporate team battles

**Seasonal Events:**
- ✅ Holiday bonuses (CNY, Raya, Deepavali - 2x points)
- ✅ Special limited edition badges
- ✅ Seasonal challenges
- ✅ Festival-themed rewards

---

### Week 29-30: Predictive AI

**Smart Scheduling:**
- ✅ AI suggests best times to work
- ✅ Predict peak demand periods
- ✅ Energy level optimization (avoid burnout)
- ✅ Work-life balance recommendations

**Advanced Features:**
- ✅ Equipment rental marketplace
- ✅ Meal vouchers for shift workers
- ✅ Transportation subsidies
- ✅ Uniform/tools marketplace

---

### Week 31-32: Regional Expansion Prep

**International Readiness:**
- ✅ Multi-currency support
- ✅ Multi-language (Malay, English, Chinese, Tamil)
- ✅ Singapore market prep
- ✅ Indonesia market research
- ✅ Thailand feasibility study

**Platform Maturity:**
- ✅ API for third-party integrations
- ✅ White-label solution for enterprises
- ✅ Advanced reporting for employers
- ✅ Data export capabilities

---

## Technical Stack & Infrastructure

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.5+
- **Styling:** TailwindCSS + shadcn/ui
- **State:** Zustand (global) + React Query (server)
- **Maps:** Mapbox/Google Maps
- **Charts:** Recharts
- **Animation:** Framer Motion

### Backend
- **Database:** Supabase (PostgreSQL 15+)
- **Functions:** Supabase Edge Functions (Deno)
- **Auth:** Supabase Auth (JWT)
- **Storage:** Supabase Storage (S3-compatible)
- **Geospatial:** PostGIS extension
- **Cache:** Upstash Redis

### Infrastructure
- **Hosting:** Vercel (Edge Network)
- **Database:** Supabase Cloud
- **CDN:** Vercel Edge
- **Monitoring:** Sentry + Mixpanel
- **Analytics:** Mixpanel

### Integrations
- **Payment:** DuitNow (PayNet) + Stripe/Xendit
- **eWallet:** GrabPay, Touch 'n Go, Boost
- **SMS:** Twilio
- **Push:** Firebase Cloud Messaging
- **Maps:** Google Maps API
- **Face Detection:** AWS Rekognition OR FaceIO

---

## Risk Management

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| DuitNow API access delayed | Medium | High | Parallel: Integrate Stripe, delay instant pay |
| GPS accuracy issues | Low | Medium | Use hybrid (GPS + network + WiFi) |
| Face recognition fails | Medium | Low | Fallback: Manual photo verification |
| Payment gateway issues | Low | High | Multi-provider setup (Stripe + Xendit) |
| Supabase downtime | Low | High | Implement fallback DB, monitor uptime |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| TROOPERS competitive response | High | High | Focus on gamification differentiation |
| Grab/Foodpanda enters gig staffing | Medium | High | Build strong brand & community quickly |
| Regulatory changes | Medium | Medium | Legal team on retainer, compliance-first |
| Worker acquisition cost too high | Medium | High | Referral program, organic growth focus |
| Employer churn | Medium | Medium | Backup talent system, excellent support |

### Compliance Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Gig Bill interpretation changes | Low | Medium | Legal counsel, industry association membership |
| PERKESO integration issues | Medium | Medium | Early integration, test thoroughly |
| Payment regulation changes | Low | High | Monitor BNM announcements, flexible system |
| Data protection violations | Low | Critical | GDPR/PDPA compliance, security audits |

---

## Success Metrics

### Phase 1 (Week 8 - MVP)
- ✅ 500-1,000 workers
- ✅ 20-50 employers
- ✅ 1,000-2,000 shifts completed
- ✅ 85%+ matching accuracy
- ✅ 99%+ payment success rate
- ✅ 7-day payment compliance: 100%

### Phase 2 (Week 16 - Competitive)
- ✅ 10,000-20,000 workers
- ✅ 200-300 employers
- ✅ 50,000+ shifts/month
- ✅ 95%+ matching accuracy (TROOPERS level)
- ✅ 60%+ gamification engagement
- ✅ 5-10% Top Pro members

### Phase 3 (Week 24 - Leadership)
- ✅ 30,000-50,000 workers
- ✅ 500-800 employers
- ✅ 200,000+ shifts/month
- ✅ 4-5 cities coverage
- ✅ 20% referral acquisition rate
- ✅ #1 in Klang Valley

### Phase 4 (Week 32 - Scale)
- ✅ 50,000-100,000 workers
- ✅ 1,000+ employers
- ✅ 500,000+ shifts/month
- ✅ Regional expansion ready
- ✅ Market leader position secured

---

## Budget Estimate

### Development (8 months)
- **Team:** 3-4 developers @ RM10,000/month = RM240,000-320,000
- **Designer:** 1 @ RM6,000/month = RM48,000
- **PM:** 1 @ RM8,000/month = RM64,000
- **Total Labor:** RM352,000-432,000

### Infrastructure (Annual)
- **Supabase:** $25-100/month = RM1,200-4,800
- **Vercel:** $20-100/month = RM960-4,800
- **Redis (Upstash):** $10-50/month = RM480-2,400
- **Monitoring (Sentry):** $26/month = RM1,248
- **Total Infra:** RM3,888-13,248/year

### Integrations (Annual)
- **DuitNow/PayNet:** RM0.50/transaction >RM5,000
- **Stripe/Xendit:** 2.9% + RM0.50/transaction
- **Twilio SMS:** RM0.15/SMS
- **Firebase:** FREE tier → $25/month = RM1,200
- **Total Integration:** Variable (based on volume)

### Marketing (First 6 months)
- **Digital ads:** RM50,000
- **Referral bonuses:** RM100,000
- **Partnerships:** RM30,000
- **Events/activations:** RM20,000
- **Total Marketing:** RM200,000

### Grand Total (8 months)
**RM556,000-646,000** (~USD 120,000-140,000)

---

## Next Steps

### Week 1 Actions

1. **Technical Setup**
   - [ ] Create Supabase project
   - [ ] Set up Vercel account
   - [ ] Initialize Next.js repo
   - [ ] Configure CI/CD

2. **Legal & Compliance**
   - [ ] Consult employment lawyer
   - [ ] Register with PayNet (DuitNow)
   - [ ] Research PERKESO integration
   - [ ] Draft service agreement template

3. **Team Formation**
   - [ ] Hire lead developer
   - [ ] Hire 2 junior developers
   - [ ] Hire UI/UX designer
   - [ ] Hire product manager

4. **Market Research**
   - [ ] Interview 50 potential gig workers
   - [ ] Interview 10 potential employers
   - [ ] Analyze TROOPERS user reviews
   - [ ] Validate feature priorities

---

**Document Status:** ✅ Complete
**Ready for:** Executive approval, team onboarding, development kickoff

---

*Roadmap created by Winston (AI Architect)*
*Based on comprehensive competitive analysis of 20+ platforms*
*Optimized for Malaysia market & Gig Worker Bill 2025 compliance*
