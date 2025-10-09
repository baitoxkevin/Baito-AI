# Test Projects - Quick Start Guide

Ready to see your beautiful new calendar in action? Let's populate it with realistic test data! 🎉

---

## 🚀 One Command Setup

```bash
npm run seed:projects
```

That's it! This will create **15 realistic test projects** to showcase all the calendar improvements.

---

## ⚠️ Important: Login First!

Before running the seeder, make sure you're logged into the app:

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Login to the app:**
   ```
   http://localhost:5173/login
   ```

3. **Then run the seeder:**
   ```bash
   npm run seed:projects
   ```

---

## 📊 What You'll Get

### **Today (3 Events)** - Perfect for testing time display!

**Morning:**
```
🕐 9:00 AM - Morning Team Meeting
📍 Conference Room A, Main Office
👥 6/8 crew members
```

**Afternoon:**
```
🕐 2:00 PM - Product Launch Event
📍 Downtown Convention Center, Hall B
👥 25/25 crew members (Full!)
```

**Evening:**
```
🕐 7:00 PM - Evening Networking Mixer
📍 Sky Lounge, 42nd Floor, City Tower
👥 10/12 crew members
```

### **This Week (6 Events)** - Multi-day events included!

- 📱 **Tech Conference 2025** (3-day event, spans multiple cells)
- 📚 Corporate Training Session
- 🎵 **Summer Music Festival** (3-day event)
- 💼 Client Presentation
- ... and more!

### **Next Week (4 Events)**

- 💒 Wedding Reception - Johnson & Smith
- 🎬 **TV Commercial Shoot** (2-day event)
- 🎸 Rock Concert - The Voltage
- 🏔️ **Annual Corporate Retreat** (3-day event)

### **Future (2 Events)**

- 👗 Fashion Show - Spring Collection
- 📊 Board Meeting - Q4 Review

### **Past Events (2 Events)** - Tests completed status!

- 🎉 Film Production Wrap Party (yesterday)
- 💝 Charity Gala Dinner (last week)

---

## ✅ Expected Output

When you run `npm run seed:projects`, you'll see:

```
🌱 Starting to seed test projects...

✅ Authenticated as: kevin@example.com

✅ Created: Morning Team Meeting (2025-10-07)
✅ Created: Product Launch Event (2025-10-07)
✅ Created: Evening Networking Mixer (2025-10-07)
✅ Created: Tech Conference 2025 (2025-10-08)
✅ Created: Corporate Training Session (2025-10-09)
✅ Created: Summer Music Festival (2025-10-11)
✅ Created: Client Presentation (2025-10-12)
✅ Created: Wedding Reception - Johnson & Smith (2025-10-14)
✅ Created: TV Commercial Shoot (2025-10-16)
✅ Created: Rock Concert - The Voltage (2025-10-19)
✅ Created: Annual Corporate Retreat (2025-10-21)
✅ Created: Fashion Show - Spring Collection (2025-10-25)
✅ Created: Board Meeting - Q4 Review (2025-10-28)
✅ Created: Film Production Wrap Party (2025-10-06)
✅ Created: Charity Gala Dinner (2025-09-30)

============================================================
🎉 Seeding complete!
   ✅ Success: 15 projects
============================================================

📅 Project Distribution:
   - Today: 3 events (Morning, Afternoon, Evening)
   - This week: 6 events
   - Next week: 4 events
   - Past events: 2 events
   - Multi-day events: 4 events

🎨 Event Types:
   - Meetings: 5
   - Corporate: 4
   - Production: 3
   - Conference: 1
   - Festival: 1
   - Wedding: 1
   - Concert: 1

💡 Next Steps:
   1. Open http://localhost:5173/calendar/view
   2. See today's events with times
   3. Hover over events for details
   4. Try list view: /calendar/list
```

---

## 🎯 What to Test

### **Calendar View** (`/calendar/view`)

1. **Verify Grid is Visible**
   - ✅ See 7 columns (M-S)
   - ✅ See 6 rows of dates
   - ✅ No debug messages

2. **Check Time Display**
   - ✅ Today's events show times (9:00, 2:00 PM, 7:00 PM)
   - ✅ Time appears above event title
   - ✅ Clock icon visible

3. **Test Multi-Day Events**
   - ✅ Tech Conference spans 3 days (cells connected)
   - ✅ Festival spans 3 days
   - ✅ Events shown as continuous bars

4. **Hover Cards** ⭐ NEW FEATURE
   - ✅ Hover over any event
   - ✅ Wait ~300ms
   - ✅ Rich details card appears
   - ✅ Shows: Date, Time, Location, Crew, Client
   - ✅ Has "View Details" and "Edit" buttons
   - ✅ Card disappears when mouse leaves

5. **Color Coding**
   - ✅ Different event types have different colors
   - ✅ Meetings: Amber
   - ✅ Corporate: Purple
   - ✅ Production: Blue
   - ✅ Weddings: Pink
   - ✅ Festivals: Orange

### **List View** (`/calendar/list`)

1. **Auto-Scroll to Today** ⭐ FIXED
   - ✅ Page automatically scrolls to current month
   - ✅ Today's date is visible on load
   - ✅ Doesn't jump to past months

2. **Event List**
   - ✅ Events in chronological order
   - ✅ Past events appear above today
   - ✅ Future events appear below today

### **Responsive Design**

Test on different screen sizes:
- 📱 Mobile (< 640px)
- 📱 Tablet (640-1024px)
- 💻 Desktop (> 1024px)

---

## 🎨 Visual Guide

### **How Events Look Now:**

**Before (Old):**
```
┌─────────────────┐
│ • Project Alpha │  ← Only title, no time
└─────────────────┘
```

**After (New):**
```
┌─────────────────┐
│ 🕐 9:00         │  ← Time with icon
│ Project Alpha   │  ← Title below
└─────────────────┘
```

### **Hover Card Example:**

When you hover over "Product Launch Event":

```
╔════════════════════════════════════╗
║ Product Launch Event           🟣  ║
║ Active • High Priority             ║
║ ──────────────────────────────── ║
║ 📅 Monday, October 7, 2025         ║
║ 🕐 2:00 PM - 6:00 PM               ║
║ 📍 Downtown Convention Center      ║
║ 👥 25/25 crew members              ║
║ ──────────────────────────────── ║
║ [View Details]          [Edit]     ║
╚════════════════════════════════════╝
```

---

## 🧹 Clean Up Test Data

When you're done testing:

```sql
-- Run this in Supabase SQL Editor to remove test projects
DELETE FROM projects
WHERE title IN (
  'Morning Team Meeting',
  'Product Launch Event',
  'Evening Networking Mixer',
  'Tech Conference 2025',
  'Corporate Training Session',
  'Summer Music Festival',
  'Client Presentation',
  'Wedding Reception - Johnson & Smith',
  'TV Commercial Shoot',
  'Rock Concert - The Voltage',
  'Annual Corporate Retreat',
  'Fashion Show - Spring Collection',
  'Board Meeting - Q4 Review',
  'Film Production Wrap Party',
  'Charity Gala Dinner'
);
```

Or just delete them through the UI!

---

## 🐛 Troubleshooting

### Problem: "No authenticated user found"

**Solution:**
1. Make sure dev server is running: `npm run dev`
2. Login at `http://localhost:5173/login`
3. Then run: `npm run seed:projects`

### Problem: "Permission denied"

**Solution:**
Check that your user has permission to create projects in Supabase RLS policies.

### Problem: Events not appearing

**Solution:**
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Check console for errors
3. Verify in Supabase: `SELECT COUNT(*) FROM projects;`

---

## 📖 More Information

For detailed documentation:
- **Full Implementation:** `docs/calendar-implementation-summary.md`
- **UX Improvements:** `docs/calendar-ux-improvements.md`
- **Scripts README:** `scripts/README.md`

---

## 🎉 Ready?

Let's do this! Run:

```bash
npm run seed:projects
```

Then open:
```
http://localhost:5173/calendar/view
```

**Enjoy your beautiful new calendar!** ✨

---

Questions or issues? All the test data is in:
- JavaScript: `scripts/seed-test-projects.js`
- SQL: `scripts/seed-test-projects.sql`

You can customize dates, times, colors, and more!
