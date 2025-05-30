# Step-by-Step Implementation Guide: Automated Logo Fetching

## Prerequisites
- Supabase project with `projects` table
- React/TypeScript project with NewProjectDialog and SpotlightCard components

## Implementation Steps

### Step 1: Add Database Column (5 minutes)

1. **Create Migration File:**
```sql
-- supabase/migrations/20250129_add_brand_logo_to_projects.sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brand_logo TEXT;
COMMENT ON COLUMN projects.brand_logo IS 'URL of the brand logo image for the project';
```

2. **Apply Migration:**
- Use Supabase Dashboard → SQL Editor
- Or use Supabase CLI: `supabase db push`
- Or use Supabase MCP tool

### Step 2: Update TypeScript Types (5 minutes)

1. **Generate Types from Supabase:**
```bash
cd /path/to/project
node generate-types.js
```

2. **Update Project Interface:**
```typescript
// src/lib/types.ts
export interface Project {
  // ... existing fields
  brand_logo?: string; // Add this line
}
```

### Step 3: Create Logo Service (10 minutes)

1. **Create `src/lib/logo-service.ts`:**
```typescript
// Copy the full LogoService code from the example
// Key functions:
// - fetchFromClearbit()
// - fetchFromGoogle()
// - fetchFromDuckDuckGo()
// - guessDomain() with brand mappings
// - generateFallbackLogo()
// - smartFetchLogo()
```

### Step 4: Update NewProjectDialog (10 minutes)

1. **Import Logo Service:**
```typescript
import { fetchBrandLogo } from '@/lib/logo-service';
```

2. **Add Auto-fetch on Brand Name Blur:**
```typescript
// In the brand_name FormField
onBlur={async (e) => {
  field.onBlur();
  const brandName = e.target.value.trim();
  if (brandName && !form.getValues('brand_logo')) {
    try {
      toast({
        title: "Fetching brand logo...",
        description: "Please wait while we find the logo for " + brandName,
      });
      
      const logoUrl = await fetchBrandLogo(brandName, true);
      form.setValue('brand_logo', logoUrl);
      
      toast({
        title: "Logo found!",
        description: "Brand logo has been added automatically.",
      });
    } catch (error) {
      console.error('Error fetching logo:', error);
    }
  }
}}
```

3. **Add Logo Preview:**
```typescript
{field.value && (
  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
    <img 
      src={field.value} 
      alt="Brand logo preview" 
      className="h-8 w-auto object-contain"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
    <a href={field.value} target="_blank" rel="noopener noreferrer"
       className="text-xs text-blue-500 hover:text-blue-700 underline">
      View full size
    </a>
  </div>
)}
```

### Step 5: Update SpotlightCardSidebar (10 minutes)

1. **Add Brand Logo State:**
```typescript
const [brandLogoUrl, setBrandLogoUrl] = React.useState<string | null>(
  (project as any).brand_logo || null
);
```

2. **Add useEffect to Sync Logo:**
```typescript
React.useEffect(() => {
  setCurrentProject(project);
  setBrandLogoUrl((project as any).brand_logo || null);
  setLogoError(false);
}, [project]);
```

3. **Display Logo with Edit Feature:**
```typescript
<div className="w-36 h-36 bg-gradient-to-br from-gray-50 to-gray-100 
     flex items-center justify-center cursor-pointer group"
     onClick={() => setIsEditingBrandLogo(true)}>
  {brandLogoUrl && !logoError ? (
    <img src={brandLogoUrl} alt="Brand logo" 
         className="w-full h-full object-contain p-3"
         onError={() => setLogoError(true)} />
  ) : (
    <span className="text-gray-400">Brand Logo</span>
  )}
</div>
```

4. **Save Logo Edits to Database:**
```typescript
// In the save button handler
const { error } = await supabase
  .from('projects')
  .update({ brand_logo: tempBrandUrl })
  .eq('id', project.id);
```

### Step 6: Update Project Save/Update Functions (5 minutes)

1. **Remove logo_url Filter in projects.ts:**
```typescript
// In createProject()
const { logo_url, ...projectWithoutLogo } = project;
// brand_logo will be included automatically

// In updateProject()
const { logo_url, ...dataWithoutLogo } = processedData;
// brand_logo will be included automatically
```

### Step 7: Test the Implementation (5 minutes)

1. **Test Brand Names:**
- Common: Nike, Apple, Google, Microsoft
- Special: Coca-Cola, McDonald's
- Malaysian: Maybank, AirAsia, Petronas
- Unknown: "Random Company XYZ" (should generate initials)

2. **Test Workflow:**
- Create new project
- Enter brand name
- Tab/click away from field
- Logo should appear automatically
- Save project
- Check SpotlightCard shows logo
- Edit logo in SpotlightCard
- Verify it saves to database

### Step 8: Optional Enhancements

1. **Add Loading Spinner:**
```typescript
const [isFetchingLogo, setIsFetchingLogo] = useState(false);
// Show spinner while fetching
```

2. **Add Manual Retry Button:**
```typescript
<Button onClick={() => fetchLogo(brandName)}>
  Retry Logo Fetch
</Button>
```

3. **Store Logos in Supabase Storage:**
```typescript
// Set storeInSupabase to true
const logoUrl = await fetchBrandLogo(brandName, true);
```

## Troubleshooting

### Logo Not Appearing
1. Check browser console for errors
2. Verify brand_logo column exists in database
3. Check network tab for API calls
4. Try different brand names

### CORS Issues
- All APIs used are CORS-enabled
- If issues persist, implement server-side proxy

### Performance
- Logos are cached by checking existing projects
- Consider implementing local storage cache
- Use lazy loading for logo images

## Total Implementation Time: ~45 minutes

The feature will work automatically once implemented. Users just enter brand names and logos appear!