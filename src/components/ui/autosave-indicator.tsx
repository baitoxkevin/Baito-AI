import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutosaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  className?: string;
}

export function AutosaveIndicator({ status, className }: AutosaveIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {status === 'saving' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving changes...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-600">All changes saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-600">Failed to save changes</span>
        </>
      )}
    </div>
  );
}