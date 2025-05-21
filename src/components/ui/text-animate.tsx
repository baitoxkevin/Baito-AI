import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TextAnimateProps {
  text: string;
  className?: string;
  variant?: "fadeIn" | "slideUp" | "slideIn" | "typewriter";
  delay?: number;
  duration?: number;
}

const animations: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  slideIn: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  typewriter: {
    hidden: { width: 0 },
    visible: { width: "100%" },
  },
};

export function TextAnimate({
  text,
  className,
  variant = "fadeIn",
  delay = 0,
  duration = 0.5,
}: TextAnimateProps) {
  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial="hidden"
      animate="visible"
      variants={animations[variant]}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
    >
      {variant === "typewriter" ? (
        <span className="inline-block whitespace-nowrap">{text}</span>
      ) : (
        text
      )}
    </motion.div>
  );
}