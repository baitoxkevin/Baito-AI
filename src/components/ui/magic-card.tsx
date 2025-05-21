import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  gradientColor?: string;
  gradientSize?: number;
  borderRadius?: number;
}

export function MagicCard({
  children,
  className,
  gradientColor = "rgb(147, 51, 234)",
  gradientSize = 200,
  borderRadius = 12,
}: MagicCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!divRef.current) return;

      const rect = divRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setPosition({ x, y });
    };

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0);

    const div = divRef.current;
    if (div) {
      div.addEventListener('mousemove', handleMouseMove);
      div.addEventListener('mouseenter', handleMouseEnter);
      div.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (div) {
        div.removeEventListener('mousemove', handleMouseMove);
        div.removeEventListener('mouseenter', handleMouseEnter);
        div.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      ref={divRef}
      className={cn(
        "relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
        className
      )}
      style={{ borderRadius: `${borderRadius}px` }}
    >
      <div
        className="absolute pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(${gradientSize}px circle at ${position.x}px ${position.y}px, ${gradientColor}, transparent 40%)`,
          opacity,
          width: '100%',
          height: '100%',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}