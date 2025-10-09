/**
 * Netlify Function: OpenAI Whisper Transcription
 * Proxies audio transcription requests to OpenAI Whisper API
 */

import { Handler, HandlerEvent } from '@netlify/functions'
import busboy from 'busboy'
import { Readable } from 'stream'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

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
  console.log('Transcribe function called')
  console.log('Method:', event.httpMethod)
  console.log('Headers:', JSON.stringify(event.headers))

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
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not configured')
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'API key not configured' })
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

    // Create FormData for OpenAI API
    const FormData = (await import('form-data')).default
    const formData = new FormData()

    formData.append('file', file.data, {
      filename: file.filename,
      contentType: file.mimeType
    })
    formData.append('model', fields.model || 'whisper-1')

    if (fields.language) {
      formData.append('language', fields.language)
    }

    console.log('Sending to OpenAI Whisper API...')

    // Call OpenAI Whisper API
    const fetch = (await import('node-fetch')).default
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders()
      },
      body: formData as any
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
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
