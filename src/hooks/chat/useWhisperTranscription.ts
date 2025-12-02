/**
 * Hook for Speech-to-Text transcription
 * Uses Web Speech API with Whisper API fallback for production
 */

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseWhisperTranscriptionProps {
  language?: 'zh' | 'en'
  onTranscript: (text: string) => void
  onError?: (error: Error) => void
}

interface WhisperResponse {
  text: string
}

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV

// Check if Web Speech API is available
const isSpeechRecognitionAvailable = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

export function useWhisperTranscription({
  language = 'zh',
  onTranscript,
  onError
}: UseWhisperTranscriptionProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [interimText, setInterimText] = useState<string>('')  // Live transcription display
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const interimTranscriptRef = useRef<string>('')

  // Use Web Speech API for development or as fallback
  const useWebSpeechAPI = isDevelopment || !isSpeechRecognitionAvailable()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      if (silenceTimeoutRef.current) {
        clearInterval(silenceTimeoutRef.current)
      }
    }
  }, [])

  const isManualStopRef = useRef(false)  // Track if user manually stopped
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSpeechTimeRef = useRef<number>(0)

  const SILENCE_TIMEOUT = 8000  // Stop after 8 seconds of no speech

  const startWebSpeechRecording = useCallback(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported in this browser')
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      // Use Malaysian English for better "rojak" support (BM + English + Chinese mixed)
      // ms-MY (Malay) or en-MY (Malaysian English) work better than en-US for local speech
      recognition.lang = language === 'zh' ? 'zh-CN' : 'en-MY'

      interimTranscriptRef.current = ''
      isManualStopRef.current = false
      lastSpeechTimeRef.current = Date.now()

      // Start silence timeout checker
      const checkSilence = () => {
        if (isManualStopRef.current) return

        const silenceDuration = Date.now() - lastSpeechTimeRef.current
        if (silenceDuration >= SILENCE_TIMEOUT && recognitionRef.current) {
          console.log('Auto-stopping due to silence timeout')
          isManualStopRef.current = true
          recognitionRef.current.stop()
          recognitionRef.current = null
          if (silenceTimeoutRef.current) {
            clearInterval(silenceTimeoutRef.current)
            silenceTimeoutRef.current = null
          }
        }
      }
      silenceTimeoutRef.current = setInterval(checkSilence, 1000)

      recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          interimTranscriptRef.current += finalTranscript
        }

        // Reset silence timer when speech is detected
        if (finalTranscript || interimTranscript) {
          lastSpeechTimeRef.current = Date.now()
        }

        // Update live transcription display immediately
        const liveText = interimTranscriptRef.current + interimTranscript
        setInterimText(liveText)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)

        // Don't stop for "no-speech" - just keep listening
        // Don't stop for "aborted" if we're auto-restarting
        if (event.error === 'no-speech' || event.error === 'aborted') {
          console.log('Ignoring no-speech/aborted, continuing to listen...')
          return
        }

        setIsRecording(false)
        setIsProcessing(false)

        // Map error types to user-friendly messages
        const errorMessages: Record<string, string> = {
          'not-allowed': 'Microphone access denied. Please allow microphone access in your browser settings.',
          'network': 'Network error. Please check your connection.',
          'audio-capture': 'No microphone found. Please check your audio input device.',
        }

        const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`
        onError?.(new Error(message))
      }

      recognition.onend = () => {
        // If user didn't manually stop and we're still supposed to be recording,
        // auto-restart the recognition (browser sometimes stops it automatically)
        if (!isManualStopRef.current && recognitionRef.current) {
          console.log('Auto-restarting speech recognition...')
          try {
            recognition.start()
            return  // Don't process the end event yet
          } catch (e) {
            console.log('Could not restart recognition:', e)
          }
        }

        setIsRecording(false)
        setIsProcessing(false)

        // Send the accumulated transcript
        if (interimTranscriptRef.current.trim()) {
          onTranscript(interimTranscriptRef.current.trim())
        }

        // Clear interim text after sending
        setInterimText('')
      }

      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting Web Speech recording:', error)
      onError?.(error as Error)
    }
  }, [language, onTranscript, onError])

  const stopWebSpeechRecording = useCallback(() => {
    // Clear silence timeout
    if (silenceTimeoutRef.current) {
      clearInterval(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }

    if (recognitionRef.current) {
      isManualStopRef.current = true  // Signal that user manually stopped
      recognitionRef.current.stop()
      recognitionRef.current = null   // Clear the ref to prevent auto-restart
      setIsRecording(false)
    }
  }, [])

  const startWhisperRecording = useCallback(async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm' // Whisper supports webm
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

        // Send to Whisper API
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      onError?.(error as Error)
    }
  }, [onError])

  const stopWhisperRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)
    }
  }, [isRecording])

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Create FormData for Groq Whisper API
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('language', language === 'zh' ? 'zh' : 'en')

      // Call Netlify function that proxies to Groq Whisper
      // Using Groq's Whisper Large v3 Turbo: $0.04/hour (multilingual)
      // Or Distil-Whisper: $0.02/hour (English only)
      const response = await fetch('/.netlify/functions/transcribe-groq', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Transcription failed: ${response.statusText}`)
      }

      const data: WhisperResponse = await response.json()

      if (data.text) {
        onTranscript(data.text)
      }
    } catch (error) {
      console.error('Transcription error:', error)
      onError?.(error as Error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Choose the appropriate methods based on environment
  const startRecording = useWebSpeechAPI ? startWebSpeechRecording : startWhisperRecording
  const stopRecording = useWebSpeechAPI ? stopWebSpeechRecording : stopWhisperRecording

  // Clear interim text when starting a new recording
  const handleStartRecording = useCallback(() => {
    setInterimText('')
    startRecording()
  }, [startRecording])

  return {
    isRecording,
    isProcessing,
    interimText,  // Live transcription text for display
    startRecording: handleStartRecording,
    stopRecording,
  }
}
