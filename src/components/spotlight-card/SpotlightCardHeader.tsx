import React from 'react';
import { motion } from 'framer-motion';

interface SpotlightCardHeaderProps {
  onMinimize: () => void;
}

export function SpotlightCardHeader({ onMinimize }: SpotlightCardHeaderProps) {
  return (
    <div className="bg-white dark:bg-slate-800 px-8 py-2 relative h-10">
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-pink-500/5 to-purple-600/5"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "200% 100%" }}
      />
      {/* Reduced height header with just the animated background gradient */}
    </div>
  );
}