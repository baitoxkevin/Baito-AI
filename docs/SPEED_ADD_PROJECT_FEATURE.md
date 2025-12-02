# Speed Add Project Feature

## Overview
The Speed Add Project feature allows users to quickly create projects by pasting job advertisements. AI automatically extracts project information and pre-fills the form fields.

## Features

### 1. UI Speed Add Button
- Located in the CreateProjectWizard sidebar
- Opens a dialog for pasting job ad text
- Shows extraction results with confidence levels
- Pre-fills form fields with extracted data

### 2. Baigeer Chat Integration
- Users can paste job ads directly in chat
- Baigeer automatically detects and extracts project information
- Creates projects directly from chat messages
- Returns project details and next actions

## Components

### Frontend

#### 1. AI Project Extractor Service
**File**: `src/lib/ai-project-extractor.ts`

**Functions**:
- `extractProjectFromJobAd(jobAdText, apiKey?, model?)` - Extracts project fields from job ad text
- `aiResultToProjectFormData(result)` - Converts AI extraction result to form data format
- `getConfidenceColor(confidence)` - Returns color class for confidence level
- `getConfidenceBadge(confidence)` - Returns badge text for confidence level

**Extracted Fields**:
- title
- event_type
- description
- venue_address
- venue_details
- start_date / end_date
- working_hours_start / working_hours_end
- crew_count
- hourly_rate

#### 2. Speed Add Dialog Component
**File**: `src/components/SpeedAddProjectDialog.tsx`

**Features**:
- Textarea for pasting job ad
- AI extraction button
- Extraction results display with confidence indicators
- Field-by-field breakdown with reasoning
- Warnings and suggestions
- "Use This Data" button to pre-fill form

#### 3. NewProjectDialog Integration
**File**: `src/components/NewProjectDialog.tsx`

**Changes**:
- Added "Speed Add from Job Ad" button in sidebar header
- Added state for Speed Add dialog
- Added handler to pre-fill form with extracted data
- Shows toast notification when data is loaded

**Button Location**: In the left sidebar, below the "Create Project" title and description, before the numbered step navigation.

### Backend

#### AI Chat Edge Function Tool
**File**: `supabase/functions/ai-chat/index.ts`

**Tool**: `speed_add_project`

**Description**: Extract project information from job ad text and create a new project

**Parameters**:
- `job_ad_text` (string, required): The full job advertisement text

**Permissions**: Requires `write:projects` permission

**Process**:
1. Receives job ad text from user
2. Uses OpenRouter AI to extract project fields
3. Validates and formats extracted data
4. Creates project in database with status "planning"
5. Returns project details and success message

## Usage Examples

### Via UI

1. Click "New Project" button on Projects page
2. In the project creation dialog, look for the "Speed Add from Job Ad" button in the left sidebar (below the "Create Project" title)
3. Click "Speed Add from Job Ad"
4. Paste job advertisement text
5. Click "Extract Project Information"
6. Review extracted fields and confidence levels
7. Click "Use This Data" to pre-fill the form
8. Complete any missing fields (Customer, Manager, etc.)
9. Continue through wizard steps normally
10. Click "Create Project" to finish

### Via Baigeer Chat

**Example 1: Direct paste**
```
User: I need to add this project:
Looking for 10 promoters for Samsung product launch
Date: December 15-17, 2024
Time: 10am - 6pm
Location: Mid Valley Mall
Pay: RM15/hour
Must speak Mandarin

Baigeer: I'll extract the project information and create it for you...
[Extracts fields and creates project]
Successfully created project "Samsung Product Launch" with ID xxx-xxx-xxx.
```

**Example 2: Explicit command**
```
User: Speed add this job ad: [paste job ad]

Baigeer: [Extracts and creates project]
```

## Configuration

### Environment Variables
- `VITE_OPENROUTER_API_KEY` - Required for AI extraction
- `OPENROUTER_API_KEY` - Required for edge function (server-side)

### AI Model
- Default: `google/gemini-2.5-flash-preview-09-2025` (Gemini 2.5 Flash)
- Configurable in both frontend and backend

## AI Prompt Engineering

### Extraction Rules

1. **Date Parsing**: Converts various date formats to YYYY-MM-DD
   - "15 Dec 2024" → "2024-12-15"
   - "15/12/2024" → "2024-12-15"

2. **Time Parsing**: Converts to 24-hour HH:MM format
   - "9am" → "09:00"
   - "2:30pm" → "14:30"

3. **Event Type Detection**: Identifies event type from keywords
   - "launching", "launch" → "Product Launch"
   - "roadshow" → "Roadshow"
   - "conference" → "Conference"

4. **Crew Count**: Extracts number only
   - "10 promoters" → 10
   - "5-7 staff" → 6 (average)

5. **Pay Rate**: Extracts hourly rate
   - "RM15/hour" → 15
   - "RM100/day (8 hours)" → 12.5

### Confidence Levels
- **High (>70%)**: Green indicator, high quality extraction
- **Medium (50-70%)**: Yellow indicator, review recommended
- **Low (<50%)**: Red indicator, manual verification needed

## Error Handling

### Frontend
- Invalid API key → Clear error message with setup instructions
- Network errors → Retry option
- Low confidence → Warning alerts with suggestions
- Missing fields → Defaults applied where possible

### Backend
- Missing job ad text → Error response
- AI extraction failure → Detailed error message
- Database insert failure → Rollback and error response
- Permission denied → Clear authorization error

## Best Practices

1. **For Users**:
   - Include as much detail as possible in job ads
   - Specify dates, times, location, pay rate, and staff count
   - Review extracted fields before using
   - Complete any missing required fields

2. **For Developers**:
   - Test with various job ad formats
   - Monitor extraction confidence levels
   - Update prompt if extraction quality degrades
   - Add more event type keywords as needed

## Future Enhancements

1. **Multi-language Support**: Extract from Chinese/Malay job ads
2. **Batch Import**: Upload multiple job ads at once
3. **Learning System**: Improve extraction based on user corrections
4. **Template Detection**: Recognize job ad formats and adapt
5. **Image OCR**: Extract from job ad images
6. **Auto-matching**: Suggest suitable candidates immediately

## Testing

### Manual Testing Checklist

#### UI Flow:
- [ ] Speed Add button appears in wizard sidebar
- [ ] Dialog opens and accepts text input
- [ ] AI extraction works with valid API key
- [ ] Results display with confidence levels
- [ ] "Use This Data" pre-fills form correctly
- [ ] Missing fields show appropriate warnings
- [ ] Can re-extract with different text
- [ ] Error handling works for invalid inputs

#### Chat Flow:
- [ ] Baigeer detects job ad text
- [ ] Extraction tool is called automatically
- [ ] Project is created successfully
- [ ] Success message includes project details
- [ ] Permissions are checked correctly
- [ ] Error messages are user-friendly

### Test Job Ad Examples

**Example 1: Complete Information**
```
Samsung Product Launch Event
Looking for 10 promoters
Date: December 15-17, 2024
Time: 10:00 AM - 6:00 PM
Location: Mid Valley Mall, KL
Pay: RM15/hour
Requirements: Speak Mandarin, age 18-35
```

**Example 2: Minimal Information**
```
Need 5 staff for event on Dec 20
Location: KLCC
```

**Example 3: Complex Format**
```
Event: Huawei Roadshow Campaign
When: 5th - 8th January 2025
Shift: 11am to 8pm daily
Where: Pavilion Shopping Mall, Entrance Area
Team: 8 Brand Ambassadors needed
Rate: RM18 per hour + meals
Must have: Own transport, English + Malay
```

## Troubleshooting

### Common Issues

**Issue**: "OpenRouter API key not found"
- **Solution**: Set `VITE_OPENROUTER_API_KEY` in `.env` file

**Issue**: Low extraction confidence
- **Solution**: Ensure job ad includes dates, times, location, and pay rate

**Issue**: Wrong event type detected
- **Solution**: Update event type manually or improve prompt with more keywords

**Issue**: Dates not parsing correctly
- **Solution**: Use ISO format (YYYY-MM-DD) or common formats (DD MMM YYYY)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  CreateProjectWizard                                     │
│  └── Speed Add Button ──► SpeedAddProjectDialog         │
│                            │                             │
│                            ├── Textarea (job ad)         │
│                            ├── Extract button            │
│                            └── Results display           │
│                                                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              AI Project Extractor Service                │
│  (src/lib/ai-project-extractor.ts)                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  extractProjectFromJobAd()                               │
│  └── OpenRouter API ──► Gemini 2.5 Flash               │
│      │                                                   │
│      └── Returns: { fields, confidence, warnings }      │
│                                                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│               Form Pre-fill Handler                      │
│  (CreateProjectWizardWithFallback)                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  handleSpeedAddData()                                    │
│  └── form.setValue() for each field                     │
│                                                          │
└──────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────┐
│                    Baigeer Chat                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  User: "Speed add this job ad: [text]"                  │
│                                                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│         AI Chat Edge Function                            │
│  (supabase/functions/ai-chat/index.ts)                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Tool: speed_add_project                                 │
│  │                                                       │
│  ├── Extract fields (OpenRouter)                        │
│  ├── Validate data                                      │
│  ├── Create project (Supabase)                          │
│  └── Return success message                             │
│                                                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                    Database                              │
│  (Supabase - projects table)                            │
└─────────────────────────────────────────────────────────┘
```

## Security Considerations

1. **API Key Protection**:
   - Keys stored in environment variables
   - Never exposed in client-side code
   - Server-side validation in edge function

2. **Permission Checks**:
   - `write:projects` permission required
   - Role-based access control in edge function
   - User context validated before project creation

3. **Input Validation**:
   - Job ad text length limits
   - Field format validation
   - SQL injection prevention (Supabase handles)

4. **Rate Limiting**:
   - OpenRouter API rate limits apply
   - Edge function timeout protections
   - Client-side debouncing on extract button

## Monitoring & Logging

### Frontend Logging
- Extraction attempts and results
- Confidence levels and warnings
- User actions (extract, use data, cancel)

### Backend Logging
- Tool execution logs in `ai_action_logs` table
- Extraction success/failure rates
- Average confidence scores
- Common extraction errors

### Metrics to Track
- Speed Add usage frequency
- Extraction success rate
- Average confidence level
- Time saved vs manual entry
- User satisfaction scores

---

**Created**: 2025-01-15
**Last Updated**: 2025-01-15
**Version**: 1.0.0
