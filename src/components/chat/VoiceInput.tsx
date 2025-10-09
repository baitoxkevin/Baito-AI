/**
 * Voice Input Component
 * Provides voice recording UI with visual feedback
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
}

export function VoiceInput({
  onTranscript,
  onError,
  language = 'zh',
  disabled = false,
  className,
  isMobile = false
}: VoiceInputProps) {
  const { t } = useTranslation()

  const {
    isRecording,
    isProcessing,
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
