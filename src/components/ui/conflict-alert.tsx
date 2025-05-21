import React from "react";
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from "@/components/ui/alert";
import { 
  AlertCircle, 
  Clock,
  Calendar,
  Building 
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ScheduleConflict {
  date: Date;
  projectId: string;
  projectTitle: string;
}

interface ConflictAlertProps {
  conflicts: ScheduleConflict[];
  staffName?: string;
  variant?: "default" | "warning" | "destructive" | "subtle";
  className?: string;
  showTitle?: boolean;
  maxItems?: number;
}

export function ConflictAlert({
  conflicts,
  staffName,
  variant = "destructive",
  className = "",
  showTitle = true,
  maxItems = 3
}: ConflictAlertProps) {
  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  // Allow showing a subset of conflicts if there are many
  const displayConflicts = conflicts.slice(0, maxItems);
  const hasMoreConflicts = conflicts.length > maxItems;

  return (
    <Alert 
      variant={variant}
      className={`border-l-4 ${className}`}
    >
      {showTitle && (
        <AlertTitle className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-4 w-4" />
          Scheduling Conflict{conflicts.length > 1 ? "s" : ""}
          {staffName && <span>for {staffName}</span>}
        </AlertTitle>
      )}
      <AlertDescription>
        <div className="mt-2 space-y-2 text-sm">
          {displayConflicts.map((conflict, index) => (
            <div 
              key={`${conflict.projectId}-${format(conflict.date, 'yyyy-MM-dd')}`}
              className="flex items-center gap-2 p-2 bg-background/50 rounded-md"
            >
              <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="font-medium">{format(conflict.date, 'MMM d, yyyy')}</span>
              <Building className="h-4 w-4 flex-shrink-0 ml-2 text-muted-foreground" />
              <Badge variant="outline" className="ml-auto">
                {conflict.projectTitle}
              </Badge>
            </div>
          ))}
          
          {hasMoreConflicts && (
            <div className="text-xs text-muted-foreground mt-1 italic">
              + {conflicts.length - maxItems} more conflict{conflicts.length - maxItems > 1 ? "s" : ""}
            </div>
          )}
          
          <div className="text-sm mt-2">
            Please select different dates or resolve these conflicts.
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function ConflictSummary({
  conflictsByStaff,
  className = ""
}: {
  conflictsByStaff: Record<string, { 
    staffId: string, 
    staffName: string, 
    conflicts: ScheduleConflict[] 
  }>;
  className?: string;
}) {
  const staffKeys = Object.keys(conflictsByStaff);
  
  if (staffKeys.length === 0) {
    return null;
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-destructive" />
        Staff Scheduling Conflicts
      </h3>
      
      <div className="space-y-3">
        {staffKeys.map(staffId => {
          const { staffName, conflicts } = conflictsByStaff[staffId];
          return (
            <ConflictAlert 
              key={staffId}
              conflicts={conflicts}
              staffName={staffName}
              variant="subtle"
              showTitle={false}
            />
          );
        })}
      </div>
    </div>
  );
}