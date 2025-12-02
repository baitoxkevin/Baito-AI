/**
 * Voice Input Component
 * Provides voice recording UI with real-time transcription display
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWhisperTranscription } from '@/hooks/chat/useWhisperTranscription'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onError?: (error: Error) => void
  language?: 'zh' | 'en'
  disabled?: boolean
  className?: string
  isMobile?: boolean
  showTranscription?: boolean  // Show live transcription bubble
}

export function VoiceInput({
  onTranscript,
  onError,
  language = 'zh',
  disabled = false,
  className,
  isMobile = false,
  showTranscription = true
}: VoiceInputProps) {
  const { t } = useTranslation()

  const {
    isRecording,
    isProcessing,
    interimText,
    startRecording,
    stopRecording
  } = useWhisperTranscription({
    language,
    onTranscript,
    onError
  })

  const handleClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const isActive = isRecording || isProcessing

  return (
    <div className={cn('relative', className)}>
      {/* Live Transcription Bubble - shows above the button */}
      <AnimatePresence>
        {showTranscription && isRecording && interimText && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute bottom-full mb-2 left-1/2 -translate-x-1/2",
              "bg-neutral-900 dark:bg-neutral-800 text-white",
              "px-3 py-2 rounded-lg shadow-lg",
              "max-w-[280px] sm:max-w-[320px]",
              "text-sm leading-relaxed",
              "z-50"
            )}
          >
            {/* Speech bubble arrow */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-neutral-900 dark:bg-neutral-800 rotate-45" />

            {/* Live text with typing indicator */}
            <div className="relative">
              <span className="break-words">{interimText}</span>
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block ml-0.5 w-0.5 h-4 bg-white align-middle"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording status indicator - shows when recording but no text yet */}
      <AnimatePresence>
        {showTranscription && isRecording && !interimText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              "absolute bottom-full mb-2 left-1/2 -translate-x-1/2",
              "bg-red-500 text-white",
              "px-3 py-1.5 rounded-full shadow-lg",
              "text-xs font-medium whitespace-nowrap",
              "flex items-center gap-2",
              "z-50"
            )}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-white rounded-full"
            />
            {t('voice.listening', 'Listening...')}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        size="icon"
        variant={isActive ? 'default' : 'outline'}
        className={cn(
          'relative overflow-hidden transition-all',
          isRecording && 'bg-red-500 hover:bg-red-600 text-white',
          isProcessing && 'bg-blue-500 hover:bg-blue-600 text-white',
          isMobile && 'h-11 w-11'
        )}
        aria-label={
          isRecording
            ? t('voice.stop', 'Stop recording')
            : isProcessing
            ? t('voice.processing', 'Processing...')
            : t('voice.start', 'Start voice input')
        }
        title={
          isRecording
            ? t('voice.listening', 'Listening...')
            : isProcessing
            ? t('voice.processing', 'Processing...')
            : t('voice.start', 'Start voice input')
        }
      >
        {/* Pulsing background effect when recording */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute inset-0 bg-red-400 rounded-md"
            />
          )}
        </AnimatePresence>

        {/* Icon */}
        <div className="relative z-10">
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isRecording ? (
            <Square className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </div>
      </Button>

      {/* Recording indicator dots */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -top-1 -right-1 flex space-x-0.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-1.5 h-1.5 bg-red-500 rounded-full"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
