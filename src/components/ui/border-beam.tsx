import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  borderWidth?: number;
  borderRadius?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  delay = 0,
  borderWidth = 1.5,
  borderRadius = 8,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        `rounded-[${borderRadius}px]`,
        className
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          borderRadius: `${borderRadius}px`,
          padding: borderWidth,
          background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
          WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(from 90deg at 50% 50%, transparent 0deg, ${colorFrom} 90deg, ${colorTo} 180deg, transparent 270deg)`,
            width: size,
            height: size,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            animation: `rotate ${duration}s linear infinite`,
            animationDelay: `${delay}s`,
          }}
        />
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rotate {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      ` }} />
    </div>
  );
}