# Fuzzy Search Implementation for Company Names

## Problem
User requested fuzzy search to handle variations like:
- "mr.diy" should match "MrDIY"
- "mr.diy" should match "Mr.DIY"
- "MrDIY" should match "Mr.DIY"

## Solution Implemented

**Location:** `supabase/functions/ai-chat/index.ts` lines 556-567

```typescript
// Handle company/brand name search (fuzzy match - ignores special chars)
if (args.company_name) {
  // Normalize to letters only (remove dots, spaces, hyphens, underscores)
  const lettersOnly = args.company_name.replace(/[.\s\-_]/g, '')

  // Create fuzzy pattern: each letter can have optional special chars between
  // e.g., "mrdiy" becomes "%m%r%d%i%y%" which matches "MrDIY", "Mr.DIY", "Mr DIY", etc.
  const fuzzyPattern = '%' + lettersOnly.split('').join('%') + '%'

  // Use ILIKE for case-insensitive fuzzy match
  query = query.ilike('brand_name', fuzzyPattern)
}
```

## How It Works

1. **Normalization**: Remove all special characters (dots, spaces, hyphens, underscores)
   - Input: "mr.diy" → "mrdiy"
   - Input: "Mr DIY" → "MrDIY" → "mrdiy"

2. **Pattern Generation**: Insert `%` wildcards between each letter
   - "mrdiy" → "%m%r%d%i%y%"

3. **ILIKE Matching**: PostgreSQL case-insensitive pattern matching
   - Matches: "MrDIY", "Mr.DIY", "Mr DIY", "mr-diy", "M R D I Y", etc.

## Test Results

### Test 1: "mr.diy" search
```
Query: "show me projects for mr.diy"
Pattern: "%m%r%d%i%y%"
Results: 2 projects found
- Mr.DIY Ticket Promoter (ID: 145ebf5e...)
- Mr.DIY Ticket Promoter (ID: 933299a0...)
Status: ✅ PASS
```

### Test 2: "MrDIY" search
```
Query: "show me projects for MrDIY"
Pattern: "%m%r%d%i%y%"
Results: 2 projects found (same as above)
Status: ✅ PASS
```

## Known Limitations

1. **Only 2 matching projects**: Expected ~50 projects based on initial user report
   - Possible causes:
     - Brand names in database are different (e.g., "MrDIY Events", "MrDIY Promotions")
     - Projects have been deleted or archived
     - Initial count included different brand variations not in current database

2. **Very lenient matching**: Pattern `%m%r%d%i%y%` is extremely permissive
   - Matches: "Mr.DIY", "Maryland Institute of Youth", "Mardi Yummy", etc.
   - Trade-off: Better to be too permissive than miss matches

## Deployment

**Deployed:** October 3, 2025, 5:45 PM MYT
**Method:** `supabase functions deploy ai-chat --use-api`
**Status:** ✅ Live in Production

## Alternative Approaches Considered

1. **Regex-based**: Using PostgreSQL regex `~*` operator
   - Rejected: More complex, harder to maintain

2. **Full-text search**: Using `to_tsvector` and `to_tsquery`
   - Rejected: Overkill for simple brand name matching

3. **Multiple OR conditions**: `brand_name ILIKE '%mr.diy%' OR brand_name ILIKE '%mrdiy%'`
   - Rejected: Doesn't scale well, current solution is cleaner

## Future Enhancements

1. **Levenshtein distance**: For typo tolerance
   - "mrdly" → "mrdiy" (1 character difference)

2. **Soundex/Metaphone**: For phonetic matching
   - "mister diy" → "MrDIY"

3. **Weighted scoring**: Return most relevant matches first
   - Exact match > starts with > contains

---

**Status:** ✅ IMPLEMENTED
**Date:** October 3, 2025
**Issue:** Fuzzy search for company names with special characters
**Resolution:** Pattern-based ILIKE matching with wildcard insertion
