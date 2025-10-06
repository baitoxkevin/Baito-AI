# Candidate Database Schema - Complete Reference

## Main Candidates Table

### Core Identification Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Primary key, auto-generated |
| `ic_number` | TEXT | ✅ | Unique IC/NRIC number |
| `full_name` | TEXT | ✅ | Full legal name |
| `unique_id` | TEXT | ❌ | Custom unique identifier for reference |

### Contact Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | TEXT | ❌ | Primary phone number |
| `phone_number` | TEXT | ❌ | Alternative phone field |
| `email` | TEXT | ❌ | Email address |
| `home_address` | TEXT | ❌ | Home address (simple text) |
| `business_address` | TEXT | ❌ | Business address (simple text) |
| `address` | TEXT | ❌ | General address field |
| `city` | TEXT | ❌ | City |
| `state` | TEXT | ❌ | State/Province |
| `postcode` | TEXT | ❌ | Postal code |

### Personal Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date_of_birth` | DATE | ❌ | Date of birth |
| `gender` | TEXT | ❌ | Gender (male, female, other) |
| `nationality` | TEXT | ❌ | Nationality (default: Malaysian) |
| `avatar_url` | TEXT | ❌ | Profile picture URL |

### Skills & Experience
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `skills` | TEXT[] | ❌ | Array of skills (e.g., ["forklift", "warehouse"]) |
| `languages` | TEXT[] | ❌ | Array of languages spoken |
| `shirt_size` | TEXT | ❌ | Shirt size for uniform |

### Vehicle Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `has_vehicle` | BOOLEAN | ❌ | Has own vehicle (default: false) |
| `vehicle_type` | TEXT | ❌ | Type of vehicle (e.g., "car", "motorcycle") |

### Status & Performance
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | TEXT | ❌ | Candidate status (active, inactive, blacklisted, pending) |
| `rating` | DECIMAL(3,2) | ❌ | Performance rating (0.00-5.00) |
| `total_projects` | INTEGER | ❌ | Total projects completed |

### Financial Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bank_details` | JSONB | ❌ | Bank account information (JSON) |

### Emergency Contact
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `emergency_contact` | JSONB | ❌ | Emergency contact details (JSON) |

### Flexible Data
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `custom_fields` | JSONB | ❌ | Additional custom attributes (JSON) |
| `profile` | JSONB | ❌ | Extended profile information (JSON) |

### System Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `created_at` | TIMESTAMPTZ | ✅ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | ✅ | Last update timestamp |

---

## Related Tables

### 1. Location Preferences (`location_preferences`)
Stores location and transport preferences for candidates.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `candidate_id` | UUID | Foreign key to candidates |
| `current_latitude` | FLOAT | Current location latitude |
| `current_longitude` | FLOAT | Current location longitude |
| `current_address` | TEXT | Current address |
| `preferred_working_zones` | JSONB | Preferred work locations |
| `public_transport_dependent` | BOOLEAN | Relies on public transport |
| `transport_notes` | TEXT | Additional transport notes |
| `last_location_update` | TIMESTAMPTZ | Last location update |

### 2. Availability (`availability`)
Tracks when candidates are available to work.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `candidate_id` | UUID | Foreign key to candidates |
| `preferred_working_hours` | JSONB | Preferred hours (JSON) |
| `weekend_available` | BOOLEAN | Available on weekends |
| `public_holiday_available` | BOOLEAN | Available on holidays |
| `blackout_dates` | JSONB | Unavailable dates (JSON) |
| `notice_period_days` | INTEGER | Notice period required (days) |
| `last_updated` | TIMESTAMPTZ | Last update |

### 3. Language Proficiency (`language_proficiency`)
Details about languages spoken by candidates.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `candidate_id` | UUID | Foreign key to candidates |
| `language` | TEXT | Language name |
| `proficiency_level` | ENUM | Proficiency (basic, conversational, fluent, native) |
| `is_primary` | BOOLEAN | Primary language |
| `last_updated` | TIMESTAMPTZ | Last update |

### 4. Physical Capabilities (`physical_capabilities`)
Physical abilities for specific tasks.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `candidate_id` | UUID | Foreign key to candidates |
| `capability_type` | TEXT | Type (e.g., "heavy_lifting", "standing_long_hours") |
| `is_capable` | BOOLEAN | Can perform this task |
| `notes` | TEXT | Additional notes |

### 5. Measurements (`measurements`)
Body measurements for uniform sizing.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `candidate_id` | UUID | Foreign key to candidates |
| `height_cm` | FLOAT | Height in cm |
| `weight_kg` | FLOAT | Weight in kg |
| `shirt_size` | TEXT | Shirt size |
| `neck_cm` | FLOAT | Neck circumference |
| `chest_cm` | FLOAT | Chest circumference |
| `waist_cm` | FLOAT | Waist circumference |
| `hip_cm` | FLOAT | Hip circumference |
| `inseam_cm` | FLOAT | Inseam length |
| `shoulder_cm` | FLOAT | Shoulder width |
| `shoe_size` | TEXT | Shoe size |
| `last_updated` | TIMESTAMPTZ | Last update |

### 6. Certifications (`certifications`)
Professional certifications and licenses.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `candidate_id` | UUID | Foreign key to candidates |
| `certification_name` | TEXT | Certification name |
| `certification_type` | TEXT | Type/category |
| `issuing_organization` | TEXT | Who issued it |
| `issue_date` | DATE | Date issued |
| `expiry_date` | DATE | Expiration date |
| `certificate_number` | TEXT | Certificate ID |
| `document_url` | TEXT | Document/scan URL |
| `verification_status` | TEXT | Verification status |
| `last_verified` | TIMESTAMPTZ | Last verification |

### 7. Project Staff (`project_staff`)
Links candidates to projects.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | Foreign key to projects |
| `candidate_id` | UUID | Foreign key to candidates |
| `role` | TEXT | Role in project |
| `status` | TEXT | Status (assigned, confirmed, declined, completed, no_show) |
| `daily_rate` | DECIMAL(10,2) | Daily rate |
| `start_date` | DATE | Start date |
| `end_date` | DATE | End date |
| `check_in_time` | TIME | Check-in time |
| `check_out_time` | TIME | Check-out time |
| `actual_hours` | DECIMAL(5,2) | Hours worked |
| `performance_rating` | INTEGER | Rating (1-5) |
| `notes` | TEXT | Additional notes |
| `created_at` | TIMESTAMPTZ | Assignment date |

---

## Indexes

### Main Candidates Table
- `idx_candidates_ic` - Index on `ic_number` (unique lookups)
- `idx_candidates_status` - Index on `status` (filtering by status)
- `idx_candidates_skills` - GIN index on `skills` (array search)
- `idx_candidates_name` - GIN index on `full_name` (fuzzy search)
- `idx_candidates_rating` - Index on `rating` DESC (top performers)
- `idx_candidates_unique_id` - Index on `unique_id` (custom ID lookups)

---

## Common Queries

### Search by Skills
```sql
SELECT * FROM candidates
WHERE skills && ARRAY['forklift', 'warehouse'];
```

### Search by Vehicle Ownership
```sql
SELECT * FROM candidates
WHERE has_vehicle = true;
```

### Search by Status
```sql
SELECT * FROM candidates
WHERE status = 'active';
```

### Search by Name (Fuzzy)
```sql
SELECT * FROM candidates
WHERE full_name ILIKE '%john%';
```

### Check Availability for Date
```sql
SELECT c.* FROM candidates c
WHERE c.id NOT IN (
  SELECT ps.candidate_id
  FROM project_staff ps
  JOIN projects p ON ps.project_id = p.id
  WHERE p.start_date <= '2025-10-10'
    AND p.end_date >= '2025-10-10'
    AND ps.status = 'confirmed'
);
```

---

## AI Chatbot Access

### Currently Exposed Fields (via query_candidates)
The AI chatbot can currently access these fields:

```typescript
.select('id, full_name, ic_number, phone_number, email, status,
         has_vehicle, vehicle_type, home_address, business_address,
         skills, custom_fields')
```

### Available Filters
- ✅ `name` - Partial match on full_name
- ✅ `status` - Filter by status (active/inactive)
- ✅ `has_vehicle` - Filter by vehicle ownership
- ✅ `skills` - Filter by skills array
- ✅ `available_date` - Check availability for date
- ✅ `limit` - Limit results (default 20)

### Fields NOT Currently Exposed
- ❌ `date_of_birth` - Privacy concern
- ❌ `ic_number` - Security concern (only shown in results)
- ❌ `bank_details` - Security concern
- ❌ `emergency_contact` - Privacy concern
- ❌ `rating` - Could add as filter
- ❌ `languages` - Could add as filter
- ❌ Related tables (location, availability, certifications, etc.)

---

## Schema Design Notes

### Data Normalization
The schema uses a **hybrid approach**:
- **Core fields** in main `candidates` table (commonly accessed)
- **Specialized data** in related tables (location, availability, measurements)
- **Flexible data** in JSONB fields (custom_fields, profile, emergency_contact)

### Benefits
1. ✅ **Performance**: Core data in one table for fast queries
2. ✅ **Flexibility**: JSONB for custom attributes
3. ✅ **Normalization**: Related data in separate tables
4. ✅ **Scalability**: Can add new related tables without schema changes

### Trade-offs
1. ⚠️ **Complexity**: Multiple tables to maintain
2. ⚠️ **Joins**: Need joins to access related data
3. ⚠️ **Migration**: Schema changes require careful planning

---

## Future Enhancements

### Potential AI Chatbot Additions
1. **Language Filter**: Search by languages spoken
2. **Rating Filter**: Find top-rated candidates
3. **Location Filter**: Find candidates near project location
4. **Certification Filter**: Find candidates with specific certifications
5. **Availability Patterns**: Find candidates available on weekends/holidays

### Schema Improvements
1. Add `preferred_roles` TEXT[] - Preferred job roles
2. Add `hourly_rate` DECIMAL(10,2) - Standard hourly rate
3. Add `years_experience` INTEGER - Total years of experience
4. Add `last_active_date` DATE - Last time candidate was active

---

**Last Updated:** October 3, 2025
**Source:** Consolidated from migrations 20250929, 20250223, 20250505, 20250703
**Status:** ✅ Current Production Schema
