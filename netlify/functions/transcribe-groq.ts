/**
 * Netlify Function: Groq Whisper Transcription
 * Proxies audio transcription requests to Groq's Whisper API
 *
 * Pricing (as of 2024):
 * - Whisper Large v3 Turbo: $0.04/hour (Multilingual, 216x real-time)
 * - Distil-Whisper: $0.02/hour (English only, 240x real-time)
 */

import { Handler, HandlerEvent } from '@netlify/functions'
import busboy from 'busboy'
import { Readable } from 'stream'

const GROQ_API_KEY = process.env.GROQ_API_KEY

interface FileData {
  filename: string
  data: Buffer
  mimeType: string
}

interface FormFields {
  model?: string
  language?: string
}

// Helper to parse multipart form data
function parseMultipartForm(
  event: HandlerEvent
): Promise<{ file: FileData; fields: FormFields }> {
  return new Promise((resolve, reject) => {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || ''

    if (!contentType.includes('multipart/form-data')) {
      reject(new Error('Content-Type must be multipart/form-data'))
      return
    }

    // Decode base64 body if needed
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : Buffer.from(event.body || '', 'utf-8')

    const bb = busboy({ headers: { 'content-type': contentType } })
    let fileData: FileData | null = null
    const fields: FormFields = {}

    // Handle file uploads
    bb.on('file', (name, file, info) => {
      const { filename, mimeType } = info
      const chunks: Buffer[] = []

      file.on('data', (chunk) => {
        chunks.push(chunk)
      })

      file.on('end', () => {
        fileData = {
          filename: filename || 'recording.webm',
          data: Buffer.concat(chunks),
          mimeType: mimeType || 'audio/webm'
        }
      })
    })

    // Handle form fields
    bb.on('field', (name, value) => {
      if (name === 'model' || name === 'language') {
        fields[name] = value
      }
    })

    // Handle completion
    bb.on('finish', () => {
      if (!fileData) {
        reject(new Error('No audio file found in request'))
        return
      }
      resolve({ file: fileData, fields })
    })

    // Handle errors
    bb.on('error', (error) => {
      reject(error)
    })

    // Create a readable stream from the buffer and pipe to busboy
    const stream = Readable.from(bodyBuffer)
    stream.pipe(bb)
  })
}

export const handler: Handler = async (event: HandlerEvent) => {
  console.log('Groq Transcribe function called')
  console.log('Method:', event.httpMethod)

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    }
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Check if API key is configured
  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY not configured')
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Groq API key not configured' })
    }
  }

  try {
    // Parse the multipart form data
    console.log('Parsing multipart form data...')
    const { file, fields } = await parseMultipartForm(event)

    console.log('File received:', {
      filename: file.filename,
      size: file.data.length,
      mimeType: file.mimeType
    })
    console.log('Fields:', fields)

    // Always use Whisper Large v3 Turbo for Malaysian "rojak" speech
    // This handles code-switching between BM, English, Mandarin, Hokkien, Cantonese
    // $0.04/hour - worth it for accurate multilingual transcription
    const model = 'whisper-large-v3-turbo'

    // Create FormData for Groq API
    const FormData = (await import('form-data')).default
    const formData = new FormData()

    formData.append('file', file.data, {
      filename: file.filename,
      contentType: file.mimeType
    })
    formData.append('model', model)
    formData.append('response_format', 'json')

    // For Malaysian "rojak" speech (BM + English + Chinese dialects mixed):
    // Don't set language parameter - let Whisper auto-detect per segment
    // This handles code-switching better than forcing a single language
    // Whisper will transcribe each segment in its detected language

    // Comprehensive Malaysian slang prompt for Whisper
    // Covers: Bahasa Malaysia, English, Mandarin, Hokkien, Cantonese, Tamil slang
    // This helps Whisper understand code-switching and local vocabulary
    const malaysianPrompt = `Malaysian workplace conversation with code-switching between languages.

BAHASA MALAYSIA & MANGLISH:
lah, lor, meh, leh, ah, kan, hor, wei, woi, eh, aiyo, aduh, alamak, walao, sial, giler, best giler,
power, syok, mantap, terror, gempak, terbaik, boleh, tak boleh, macam mana, apa macam,
makan, jalan, balik, cuti, kerja, buat, settle, bayar, gaji, projek, sikit, banyak,
tolong, tunggu, nanti, lepak, gostan, belanja, cincai, kautim, sayang, paiseh, kiasu,
kaypoh, sombong, malas, rajin, pandai, bodoh, blur, sien, ngam, potong, tapau, mamak

WORKPLACE TERMS:
boss, staff, roster, shift, OT, MC, cuti, off day, urgent, ASAP, confirm, cancel, postpone,
crew, event, venue, setup, breakdown, standby, briefing, debrief, check-in, clock-in,
morning shift, night shift, double shift, replacement, backup, last minute, on the way

HOKKIEN & CANTONESE SLANG:
jialat, siao, kanasai, sibei, wah lao, pang seh, bo jio, steady lah, swee, chio,
ang moh, leng lui, leng zai, siu dai, gao dim, yum cha, dim sum, dai lou, siu lo,
ham sap, lou fu, pok kai, sei lo, diu, on loh, jek jek, kiamsiap

COMMON EXPRESSIONS:
"can or not", "got meh", "how ah", "where got", "don't play play", "very the",
"like that also can", "no need lah", "okay one lah", "later see first",
"faster can", "slow slow", "take your time", "no rush", "chop chop"`

    formData.append('prompt', malaysianPrompt)

    console.log('Sending to Groq Whisper API with model:', model)

    // Call Groq Whisper API
    const fetch = (await import('node-fetch')).default
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        ...formData.getHeaders()
      },
      body: formData as any
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', response.status, errorText)
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Transcription failed',
          details: errorText,
          status: response.status
        })
      }
    }

    const data = await response.json()
    console.log('Transcription successful:', data)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('Transcription error:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
