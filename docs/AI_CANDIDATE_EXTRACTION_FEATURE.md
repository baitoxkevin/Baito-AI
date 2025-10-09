# AI-Powered Candidate Information Extraction

## Overview

We've successfully enhanced the Candidate Import Tool with AI reasoning capabilities! The system now intelligently extracts and maps candidate information from unstructured resume text using Large Language Models (LLMs).

## ✨ Key Features

### 1. **Dual Extraction Modes**
   - **Regex Mode** (Default): Fast pattern-based extraction for structured resumes
   - **AI Mode**: Intelligent reasoning for unstructured or complex resume formats

### 2. **AI Reasoning Engine**
   - Analyzes resume text using Claude 3.5 Sonnet (via OpenRouter)
   - Provides confidence scores for each extracted field
   - Explains reasoning behind each extraction
   - Identifies missing or ambiguous data
   - Suggests improvements for data quality

### 3. **Smart Field Mapping**
   - Automatically maps data to 20+ candidate fields:
     - Personal info (name, email, phone, IC number)
     - Demographics (age, race, date of birth)
     - Physical attributes (height, tshirt size)
     - Work details (transportation, languages, experience)
     - Emergency contacts
     - Skills and education arrays

### 4. **Confidence Scoring**
   - **High** (Green): AI is very confident about the extraction
   - **Medium** (Yellow): Reasonable confidence but may need review
   - **Low** (Red): Low confidence, manual verification recommended

### 5. **Privacy-First Design**
   - API keys stored locally in browser (localStorage)
   - Never sent to our servers
   - Direct communication with chosen AI provider
   - User has full control over data and API usage

## 🚀 How to Use

### Step 1: Configure AI Settings

1. Click the **Settings** button in the Candidate Import Tool
2. Select your AI provider (OpenRouter recommended)
3. Enter your API key
   - OpenRouter: Get key at https://openrouter.ai/keys
   - OpenAI: Get key at https://platform.openai.com/api-keys
4. Save settings

### Step 2: Enable AI Mode

1. Toggle the **"Enable AI"** switch to activate AI extraction
2. The header will change to show "AI-Powered Candidate Profile Generator"
3. Icon changes from ⚡ to 🧠 to indicate AI mode is active

### Step 3: Extract Candidate Information

1. Paste resume text into the input area
2. Click **"Extract Profile"** button
3. AI will analyze the text and extract structured data
4. View the preview with:
   - Extracted candidate information
   - Confidence scores per field
   - AI reasoning and suggestions
   - Data quality warnings

### Step 4: Review and Create

1. Review the extracted data in the preview tab
2. Check confidence scores and reasoning
3. Make any necessary corrections
4. Click **"Create Candidate"** to save to database

## 📊 AI Extraction Benefits

| Feature | Regex Mode | AI Mode |
|---------|------------|---------|
| Speed | ⚡ Very Fast | 🐢 Slower (API call) |
| Accuracy | Good for structured formats | Excellent for all formats |
| Flexibility | Limited to predefined patterns | Handles any format |
| Reasoning | None | Detailed explanations |
| Confidence Scores | ❌ No | ✅ Yes |
| Suggestions | ❌ No | ✅ Yes |
| Cost | Free | Requires API credits |

## 💡 Best Practices

### When to Use Regex Mode
- Structured resumes with clear labels
- Known format that matches patterns
- High-volume imports where speed is critical
- No API credits available

### When to Use AI Mode
- Unstructured or complex resume formats
- Missing or incomplete information
- International resumes with different formats
- When you need confidence scores and reasoning
- High-value candidates requiring accuracy

## 🔧 Technical Implementation

### New Files Created

1. **`src/lib/ai-candidate-extractor.ts`**
   - Core AI extraction logic
   - API communication with LLM providers
   - Confidence scoring and reasoning
   - Result transformation to CandidateInfo format

2. **`src/components/AIExtractionSettings.tsx`**
   - Settings dialog for API configuration
   - Provider selection (OpenRouter, OpenAI, Anthropic)
   - API key management
   - Privacy information display

### Modified Files

1. **`src/components/CandidateTextImportTool.tsx`**
   - Added AI toggle switch
   - Integrated AI extraction workflow
   - Updated UI to show AI vs Regex mode
   - Added settings button
   - Enhanced preview with AI insights

### API Integration

**OpenRouter** (Recommended):
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Model: `anthropic/claude-3.5-sonnet`
- Temperature: 0.1 (low for consistency)
- Response format: JSON object

**Benefits of OpenRouter**:
- Access to multiple AI models through one API
- Competitive pricing
- No vendor lock-in
- Automatic model fallback

## 📈 Expected Results

### Input Example
```
Full Name as per I/C: John Tan Wei Ming
I/C Number: 901215-01-1234
Age: 34
Race: Chinese
T-Shirt Size: L
Transportation: Own car
Spoken language: English, Mandarin, Malay
Height: 175cm
Typhoid: Yes
Emergency Contact Name: Mary Tan
Emergency Contact H/P: 012-3456789
```

### AI Output
- **Name**: John Tan Wei Ming (High confidence)
  - Reasoning: "Extracted from 'Full Name as per I/C' field"
- **IC Number**: 901215-01-1234 (High confidence)
  - Reasoning: "Valid Malaysian IC format detected"
- **Date of Birth**: 1990-12-15 (High confidence)
  - Reasoning: "Calculated from IC number first 6 digits"
- **Transportation**: Own car (High confidence)
  - Reasoning: "Explicit mention of 'Own car'"
- **Overall Confidence**: 95%

### Suggestions
- "Consider adding email address"
- "Phone number not provided"
- "Work experience section missing"

## 🔐 Security & Privacy

### Data Flow
1. User enters API key → Stored in browser localStorage
2. Resume text → Sent directly to chosen AI provider
3. AI response → Displayed to user for review
4. User approves → Saved to Supabase database

### What We Store
- ✅ API settings (locally in browser)
- ✅ Extracted candidate data (in database after approval)
- ❌ API keys (never sent to our servers)
- ❌ Resume text (not stored unless in candidate record)

### API Key Security
- Stored encrypted in browser localStorage
- Not accessible by other websites
- User can clear at any time
- Never transmitted to Baito servers

## 🎯 Future Enhancements

### Planned Features
1. **Batch Import**: Process multiple resumes at once
2. **Learning Mode**: Improve extraction over time
3. **Custom Fields**: Train AI for company-specific fields
4. **Resume Templates**: Pre-built templates for common formats
5. **Multi-language Support**: Handle resumes in different languages
6. **Photo Extraction**: Extract candidate photos from PDFs
7. **Verification Mode**: Cross-check extracted data

### Additional Providers
- Anthropic Claude (direct)
- Google Gemini
- Local LLMs (for privacy)

## 📝 Changelog

### Version 1.0.0 (Current)
- ✅ AI extraction with OpenRouter
- ✅ Confidence scoring system
- ✅ Reasoning display
- ✅ Settings management
- ✅ Privacy-first design
- ✅ Dual mode (Regex/AI) support

## 🆘 Troubleshooting

### AI Not Working
**Symptom**: Toggle doesn't enable or errors occur
**Solutions**:
1. Check API key is entered in settings
2. Verify API key is valid (test at provider's website)
3. Check browser console for error messages
4. Ensure you have API credits available
5. Try switching providers in settings

### Low Confidence Scores
**Symptom**: AI shows yellow/red confidence badges
**Solutions**:
1. Review the extracted data carefully
2. Check AI reasoning for explanations
3. Manually correct any incorrect fields
4. Consider providing more structured resume format
5. Use regex mode for known formats

### Slow Performance
**Symptom**: Extraction takes >10 seconds
**Solutions**:
1. Normal for AI mode (API calls take time)
2. Use regex mode for faster results
3. Check your internet connection
4. Verify API provider status

## 📚 Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Pricing](https://openrouter.ai/docs#models)
- [Claude API Docs](https://docs.anthropic.com)
- [OpenAI API Docs](https://platform.openai.com/docs)

---

**Built with ❤️ for Baito AI Platform**
