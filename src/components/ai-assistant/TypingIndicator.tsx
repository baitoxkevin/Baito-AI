/**
 * Typing Indicator Component
 * Shows animated dots when AI is processing
 */

import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
      role="status"
      aria-live="polite"
      aria-label="AI is typing"
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center"
        role="img"
        aria-label="AI assistant avatar"
      >
        <Bot className="h-4 w-4 text-gray-700 dark:text-gray-300" aria-hidden="true" />
      </div>

      {/* Typing Animation */}
      <div className="inline-block px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-tl-sm" aria-hidden="true">
        <div className="flex space-x-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
