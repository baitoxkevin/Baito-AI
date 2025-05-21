import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

interface AnimatedListProps {
  children: React.ReactNode[];
  className?: string;
  delay?: number;
}

export function AnimatedList({ children, className, delay = 0.1 }: AnimatedListProps) {
  return (
    <AnimatePresence>
      <div className={className}>
        {children.map((child, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.3,
                delay: index * delay,
                ease: [0.23, 1, 0.32, 1],
              },
            }}
            exit={{ opacity: 0, y: -20 }}
          >
            {child}
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}

interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  return (
    <motion.div
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}