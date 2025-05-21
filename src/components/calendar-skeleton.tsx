import { cn } from '@/lib/utils';

export function CalendarSkeleton() {
  const days = Array.from({ length: 35 }); // 5 weeks

  return (
    <div className="grid grid-cols-7 gap-px sm:gap-1 md:gap-2">
      {/* Header */}
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
        <div 
          key={day}
          className="h-8 sm:h-10 flex items-center justify-center bg-card"
        >
          <div className="h-4 w-8 bg-muted/50 rounded animate-pulse" />
        </div>
      ))}

      {/* Calendar days */}
      {days.map((_, idx) => (
        <div
          key={idx}
          className="relative border border-muted p-1 sm:p-2 rounded-lg min-h-[120px] sm:min-h-[140px] md:min-h-[160px]"
        >
          {/* Date number */}
          <div className="flex justify-end mb-2">
            <div className="h-6 w-6 bg-muted/50 rounded-full animate-pulse" />
          </div>

          {/* Event placeholders */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}