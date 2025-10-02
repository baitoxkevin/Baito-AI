# 🚀 Comprehensive Implementation Plan - Baito Mobile
## Using All Available MCP Tools

**Project:** Baito Mobile (Gig Economy Platform)
**Current:** Week 1 Complete (Foundation)
**Target:** Full 62-Feature Implementation
**Budget:** $0 (All free tools/services)

---

## 📊 MCP Tools Strategy

### 1. 🎨 **21st.dev MCP** - UI Components
**Use For:**
- Gig cards (job listings)
- Calendar components (scheduling)
- Profile cards (worker profiles)
- Status badges (shift status)
- Interactive forms (clock-in/out)

### 2. ✨ **MagicUI MCP** - Advanced UI
**Use For:**
- Animated lists (gig feed)
- Marquee (announcements)
- Progress indicators (shift progress)
- Interactive buttons (clock-in buttons)
- Shimmer effects (loading states)

### 3. 🗄️ **Supabase MCP** - Database
**Use For:**
- Create attendance tables
- Real-time subscriptions
- Execute SQL queries
- Manage migrations
- Generate TypeScript types

### 4. 📚 **Context7 MCP** - Documentation
**Use For:**
- Expo Camera API docs
- Expo Location API docs
- React Native best practices
- Supabase real-time docs

### 5. 🌐 **Chrome DevTools MCP** - Testing
**Use For:**
- Live UI testing
- Performance monitoring
- Console error debugging
- Network request inspection

---

## 🎯 Week 2 Implementation (Days 1-7)

### **Day 1: Database Schema** (Supabase MCP)
```sql
-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  candidate_id UUID REFERENCES candidates(id),
  check_in_time TIMESTAMPTZ NOT NULL,
  check_in_lat DECIMAL(10, 8),
  check_in_lng DECIMAL(11, 8),
  check_in_photo_url TEXT,
  check_out_time TIMESTAMPTZ,
  check_out_lat DECIMAL(10, 8),
  check_out_lng DECIMAL(11, 8),
  check_out_photo_url TEXT,
  total_hours DECIMAL(5, 2),
  status TEXT CHECK (status IN ('checked_in', 'checked_out', 'pending_approval')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create geofence validation function
CREATE OR REPLACE FUNCTION validate_geofence(
  user_lat DECIMAL,
  user_lng DECIMAL,
  project_id UUID
) RETURNS BOOLEAN AS $$
  SELECT ST_DWithin(
    ST_MakePoint(user_lng, user_lat)::geography,
    ST_MakePoint(venue_lng, venue_lat)::geography,
    100  -- 100 meters radius
  )
  FROM projects
  WHERE id = project_id;
$$ LANGUAGE SQL;
```

**Execute:**
- Create attendance table ✅
- Add geofence validation ✅
- Create real-time policies ✅
- Generate TypeScript types ✅

### **Day 2: Gig Browsing UI** (21st.dev + MagicUI)
```typescript
// Get UI components from 21st.dev
import { GigCard } from '@/components/ui/gig-card'  // From 21st.dev
import { AnimatedList } from '@magicui/animated-list'  // From MagicUI

// app/worker/index.tsx
export default function GigBrowsing() {
  const { data: gigs } = useQuery({
    queryKey: ['gigs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'Published')
        .order('created_at', { desc: true });
      return data;
    }
  });

  return (
    <AnimatedList>
      {gigs?.map(gig => (
        <GigCard
          key={gig.id}
          title={gig.title}
          location={gig.venue_address}
          pay={`RM ${gig.crew_count}`}
          date={gig.start_date}
          onApply={() => handleApply(gig.id)}
        />
      ))}
    </AnimatedList>
  );
}
```

**Using MCPs:**
1. **21st.dev:** Search for "job card" component ✅
2. **MagicUI:** Get AnimatedList component ✅
3. **Context7:** Check Expo best practices ✅

### **Day 3: GPS Clock-In** (Expo Location + Context7)
```typescript
// Get Expo Location docs from Context7
import * as Location from 'expo-location';

export default function ClockInButton({ projectId }) {
  const handleClockIn = async () => {
    // 1. Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied');
      return;
    }

    // 2. Get current location (±10m accuracy)
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });

    // 3. Validate geofence (100m radius)
    const { data: isValid } = await supabase.rpc('validate_geofence', {
      user_lat: location.coords.latitude,
      user_lng: location.coords.longitude,
      project_id: projectId
    });

    if (!isValid) {
      Alert.alert('Too far from job site!');
      return;
    }

    // 4. Record check-in
    const { error } = await supabase.from('attendance').insert({
      project_id: projectId,
      candidate_id: userId,
      check_in_time: new Date().toISOString(),
      check_in_lat: location.coords.latitude,
      check_in_lng: location.coords.longitude,
      status: 'checked_in'
    });

    if (!error) {
      Alert.alert('Checked in successfully!');
    }
  };

  return (
    <ShimmerButton onPress={handleClockIn}>  {/* MagicUI */}
      Clock In
    </ShimmerButton>
  );
}
```

**Using MCPs:**
1. **Context7:** Get Expo Location docs ✅
2. **MagicUI:** Use ShimmerButton ✅
3. **Supabase:** RPC for geofence validation ✅

### **Day 4: Camera Selfie** (Expo Camera + Context7)
```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function SelfieClock In() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const takeSelfie = async () => {
    // 1. Capture photo
    const photo = await cameraRef.current?.takePictureAsync({
      quality: 0.5,
      base64: false
    });

    // 2. Upload to Supabase Storage
    const fileName = `${userId}-${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('attendance-photos')
      .upload(fileName, {
        uri: photo.uri,
        type: 'image/jpeg',
        name: fileName
      });

    // 3. Save photo URL to attendance record
    await supabase.from('attendance')
      .update({ check_in_photo_url: data.path })
      .eq('id', attendanceId);

    return data.path;
  };

  return (
    <CameraView ref={cameraRef} style={{ flex: 1 }}>
      <RainbowButton onPress={takeSelfie}>  {/* MagicUI */}
        Take Selfie
      </RainbowButton>
    </CameraView>
  );
}
```

**Using MCPs:**
1. **Context7:** Expo Camera API docs ✅
2. **MagicUI:** RainbowButton component ✅
3. **Supabase:** Storage upload ✅

### **Day 5: Real-Time Attendance** (Supabase Real-time)
```typescript
export default function AttendanceDashboard() {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    // Real-time subscription
    const channel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance'
      }, (payload) => {
        setAttendance(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  return (
    <AnimatedList>  {/* MagicUI */}
      {attendance.map(record => (
        <AttendanceCard key={record.id} {...record} />
      ))}
    </AnimatedList>
  );
}
```

**Using MCPs:**
1. **Supabase:** Real-time subscriptions ✅
2. **MagicUI:** AnimatedList ✅
3. **21st.dev:** AttendanceCard component ✅

### **Day 6: Calendar View** (21st.dev + MagicUI)
```typescript
import { Calendar } from '@/components/ui/calendar';  // 21st.dev

export default function ShiftCalendar() {
  return (
    <Calendar
      events={shifts}
      onSelectDate={(date) => filterShifts(date)}
      renderEvent={(shift) => (
        <ShiftCard {...shift} />  // 21st.dev
      )}
    />
  );
}
```

**Using MCPs:**
1. **21st.dev:** Search for "calendar component" ✅
2. **MagicUI:** Interactive hover effects ✅

### **Day 7: Testing & Polish** (Chrome DevTools MCP)
```typescript
// Live testing with Chrome DevTools MCP
// 1. Navigate to app
// 2. Take screenshots
// 3. Check console errors
// 4. Monitor network requests
// 5. Performance profiling
```

**Using MCPs:**
1. **Chrome DevTools:** Live testing ✅
2. **Chrome DevTools:** Performance monitoring ✅
3. **Chrome DevTools:** Network inspection ✅

---

## 📱 Week 3 Implementation (Days 8-14)

### **Day 8-9: Gamification** (21st.dev + MagicUI)
```typescript
// Points system with animated counters
import { NumberTicker } from '@magicui/number-ticker';
import { SparklesText } from '@magicui/sparkles-text';

export default function PointsDisplay({ points }) {
  return (
    <div>
      <SparklesText text={`${points} Points`} />
      <NumberTicker value={points} />
    </div>
  );
}
```

### **Day 10-11: Leaderboard** (21st.dev + MagicUI + Supabase)
```typescript
import { Leaderboard } from '@/components/ui/leaderboard';  // 21st.dev
import { Meteors } from '@magicui/meteors';  // Top 3 effect

export default function LeaderboardView() {
  const { data: leaders } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('candidates')
        .select('name, points')
        .order('points', { desc: true })
        .limit(100);
      return data;
    }
  });

  return (
    <div>
      <Meteors number={30} />  {/* Background effect */}
      <Leaderboard
        data={leaders}
        renderRow={(leader, index) => (
          <LeaderRow
            rank={index + 1}
            name={leader.name}
            points={leader.points}
            isTopThree={index < 3}
          />
        )}
      />
    </div>
  );
}
```

### **Day 12-13: Admin Dashboard** (21st.dev + MagicUI)
```typescript
import { DashboardGrid } from '@/components/ui/dashboard';  // 21st.dev
import { AnimatedCounter } from '@magicui/animated-counter';

export default function AdminDashboard() {
  return (
    <DashboardGrid>
      <StatCard
        title="Active Workers"
        value={<AnimatedCounter value={activeWorkers} />}
      />
      <StatCard
        title="Today's Shifts"
        value={<AnimatedCounter value={todayShifts} />}
      />
      {/* More stats */}
    </DashboardGrid>
  );
}
```

### **Day 14: Final Testing** (Chrome DevTools)
- Full user flow testing
- Performance profiling
- Bug fixes
- Production prep

---

## 🔧 MCP Tool Usage Plan

### **21st.dev MCP** (10+ components)
```bash
# Day 2: Gig browsing
- Job card component
- Filter pills
- Search bar

# Day 6: Calendar
- Calendar component
- Event cards

# Day 10: Leaderboard
- Leaderboard table
- Rank badges

# Day 12: Admin dashboard
- Dashboard grid
- Stat cards
- Charts
```

### **MagicUI MCP** (15+ components)
```bash
# Animations
- Animated list (gig feed)
- Number ticker (points)
- Sparkles text (achievements)
- Meteors (leaderboard bg)

# Buttons
- Shimmer button (clock-in)
- Rainbow button (camera)
- Pulsating button (urgent actions)

# Effects
- Border beam (active shifts)
- Shine border (featured gigs)
- Particles (celebration)
```

### **Supabase MCP** (20+ operations)
```bash
# Schema
- Create attendance table
- Create geofence function
- Real-time policies

# Queries
- List gigs
- Insert attendance
- Update records
- Real-time subscriptions

# Types
- Generate TypeScript types
```

### **Context7 MCP** (5+ docs)
```bash
# Expo
- Camera API
- Location API
- Notifications API

# React Native
- Performance best practices
- Navigation patterns
```

### **Chrome DevTools MCP** (Daily)
```bash
# Testing
- Navigate pages
- Take screenshots
- Check console
- Monitor network
- Performance profile
```

---

## 📊 Implementation Metrics

### **Lines of Code:** ~5,000
- Week 2: 2,000 LOC (core features)
- Week 3: 1,500 LOC (gamification)
- Week 4: 1,500 LOC (admin)

### **Components:** ~50
- 21st.dev: 15 components
- MagicUI: 20 components
- Custom: 15 components

### **Database Tables:** 5 new
- attendance
- points_log
- achievements
- leaderboard_cache
- notifications

### **API Endpoints:** 10 new
- GET /api/gigs
- POST /api/clock-in
- POST /api/clock-out
- GET /api/attendance
- GET /api/leaderboard
- POST /api/points
- GET /api/achievements
- POST /api/upload-photo
- GET /api/geofence-validate
- GET /api/stats

---

## ✅ Success Criteria

### **Week 2 Complete:**
- [ ] Workers can browse gigs
- [ ] GPS clock-in within 100m radius
- [ ] Selfie verification working
- [ ] Real-time attendance tracking
- [ ] Admin can view live attendance

### **Week 3 Complete:**
- [ ] Points system operational
- [ ] Leaderboard live
- [ ] Achievements unlocking
- [ ] Admin dashboard functional

### **Production Ready:**
- [ ] All features tested
- [ ] Performance optimized
- [ ] Zero critical bugs
- [ ] Documentation complete

---

## 🚀 Let's Start Implementation!

**Next Action:** Execute Day 1 tasks

1. Set up database schema (Supabase MCP)
2. Get UI components (21st.dev & MagicUI)
3. Start building features

**Ready to begin?** 🎯
