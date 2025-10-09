/**
 * Hook for OpenAI Whisper API transcription
 * Handles audio recording and transcription
 */

import { useState, useRef, useCallback } from 'react'

interface UseWhisperTranscriptionProps {
  language?: 'zh' | 'en'
  onTranscript: (text: string) => void
  onError?: (error: Error) => void
}

interface WhisperResponse {
  text: string
}

export function useWhisperTranscription({
  language = 'zh',
  onTranscript,
  onError
}: UseWhisperTranscriptionProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
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

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)
    }
  }, [isRecording])

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Create FormData for Whisper API
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('model', 'whisper-1')
      formData.append('language', language === 'zh' ? 'zh' : 'en')

      // Call Netlify function that proxies to OpenAI Whisper
      const response = await fetch('/.netlify/functions/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`)
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

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  }
}
