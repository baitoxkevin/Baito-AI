import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

// Create a completely custom dialog that doesn't auto-close
const PersistentDialog = ({ open, onOpenChange, children, onExternalClick, ...props }) => {
  // Ignore automatic close requests and let the client control the open state
  const handleOpenChange = (newOpenState) => {
    // Only allow closing through explicit buttons
    if (newOpenState === false) {
      // Do nothing - dialog stays open
      return;
    }
    
    // For opening, pass through to the handler
    if (onOpenChange) {
      onOpenChange(newOpenState);
    }
  };
  
  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} {...props}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[150] bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        />
        {children}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

// We need our own custom content component as well
const PersistentDialogContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-[200] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg rounded-lg',
        'animate-in fade-in-0 zoom-in-95 slide-in-from-center duration-200',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      // Crucial handlers to prevent auto-closing
      onEscapeKeyDown={(e) => e.preventDefault()}
      onPointerDownOutside={(e) => e.preventDefault()}
      onInteractOutside={(e) => e.preventDefault()}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  )
);
PersistentDialogContent.displayName = DialogPrimitive.Content.displayName;

export {
  PersistentDialog,
  PersistentDialogContent
};