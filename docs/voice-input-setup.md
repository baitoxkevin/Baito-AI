# Voice Input Setup Guide

This guide explains how to set up and use the voice input feature with OpenAI Whisper API.

## Features

- **Voice Recording**: Click microphone button to start recording
- **Visual Feedback**: Pulsing animation during recording, processing indicator
- **Multilingual Support**: Automatically detects language (Chinese/English) from chat settings
- **Audio Processing**: Uses OpenAI Whisper API for accurate transcription
- **Secure**: API calls handled through Netlify serverless function

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (you won't be able to see it again)

### 2. Configure Environment Variable

#### For Local Development:

Add to your `.env` file:
```bash
OPENAI_API_KEY=sk-your-api-key-here
```

#### For Production (Netlify):

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** > **Environment variables**
3. Click **Add a variable**
4. Set:
   - Key: `OPENAI_API_KEY`
   - Value: `sk-your-api-key-here`
5. Save and redeploy your site

### 3. Test Locally

To test the Netlify function locally:

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Start local development server with functions
netlify dev
```

This will:
- Start your Vite dev server
- Run Netlify functions locally
- Make the transcribe function available at `http://localhost:8888/.netlify/functions/transcribe`

### 4. Test Voice Input

1. Open the chat widget
2. Click the microphone icon
3. Allow microphone permissions when prompted
4. Speak your message
5. Click the square icon to stop recording
6. Wait for transcription to appear in the input field

## Cost Estimation

OpenAI Whisper API pricing: **$0.006 per minute**

Example monthly costs:
- 100 minutes/month: $0.60
- 250 minutes/month: $1.50
- 500 minutes/month: $3.00
- 1,000 minutes/month: $6.00

Average voice message: 5-15 seconds
- 500 messages × 10 seconds = ~83 minutes = **$0.50/month**

## Architecture

### Frontend (`src/components/chat/VoiceInput.tsx`)
- Handles microphone permissions
- Records audio using MediaRecorder API
- Provides visual feedback (pulsing animation, loading state)
- Sends audio to backend

### Hook (`src/hooks/chat/useWhisperTranscription.ts`)
- Manages recording state
- Creates audio blob from chunks
- Sends FormData to Netlify function
- Returns transcription text

### Backend (`netlify/functions/transcribe.ts`)
- Serverless function (runs on demand)
- Proxies requests to OpenAI Whisper API
- Keeps API key secure (never exposed to client)
- Handles errors and returns results

## Supported Audio Formats

- **webm** (default, best browser support)
- **mp3** (fallback)
- **wav** (uncompressed, larger file size)

The hook automatically uses `audio/webm` for best compatibility.

## Browser Support

Voice recording requires:
- Modern browser with MediaRecorder API support
- HTTPS connection (required for microphone access)
- Microphone permissions granted by user

**Supported browsers:**
- Chrome/Edge 49+
- Firefox 25+
- Safari 14.1+
- Opera 36+

## Troubleshooting

### "Microphone permission denied"

- User must grant microphone permissions
- HTTPS is required (http://localhost is allowed for development)
- Check browser settings for site permissions

### "Voice input failed"

- Check browser console for detailed error
- Verify OPENAI_API_KEY is set correctly
- Ensure API key has sufficient credits
- Check network connection

### "API key not configured"

- Environment variable `OPENAI_API_KEY` is not set
- For local: add to `.env` and restart `netlify dev`
- For production: add in Netlify dashboard and redeploy

### Recording not starting

- Check microphone is connected and working
- Try in a different browser
- Clear browser cache and reload
- Check browser console for errors

## Security Considerations

- API key is stored securely in environment variables
- Never exposed to client-side code
- All API calls go through Netlify function
- Audio is sent directly to OpenAI (not stored on your servers)
- OpenAI retains audio for 30 days for abuse monitoring (as of 2024)

## Next Steps

- Implement audio compression before upload (reduce costs)
- Add support for different audio formats
- Implement local processing fallback (Web Speech API)
- Add voice activity detection (auto-stop when silence)
- Implement speaker diarization for multi-speaker scenarios
