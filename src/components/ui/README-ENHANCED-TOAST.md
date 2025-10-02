# Enhanced Toast Notification System

A modern toast notification system with advanced features including animations, progress bars, and promise handling.

## Features

- **Multiple Variants**: Success, Error, Warning, Info, and Loading
- **Auto-Dismiss with Progress Bar**: Visual indicator of remaining time
- **Pause on Hover**: Interrupts auto-dismiss timer on hover
- **Custom Duration**: Set different durations per toast
- **Loading & Promise Handling**: Show loading states and update based on promise results
- **Framer Motion Animations**: Smooth entrance and exit animations
- **Responsive Design**: Works on all screen sizes
- **Fully Typed**: Complete TypeScript support

## Components

- `enhanced-toast.tsx`: Core toast component with progress bar and variants
- `enhanced-toaster.tsx`: Toast container with Framer Motion animations
- `use-enhanced-toast.ts`: Hook for managing toast state and helper functions

## Basic Usage

```tsx
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';

function MyComponent() {
  const { toast, success, error, warning, info, loading } = useEnhancedToast();
  
  const showBasicToast = () => {
    toast({
      title: "Notification",
      description: "This is a basic toast notification",
      duration: 5000, // 5 seconds
      pauseOnHover: true,
    });
  };
  
  const showSuccessToast = () => {
    success({
      title: "Success",
      description: "Operation completed successfully!",
    });
  };
  
  // Further examples...
}
```

## Global Toast Service

For easy access throughout the application, use the `toast-service.ts`:

```tsx
import { toastService } from '@/lib/toast-service';

// In any component or function
toastService.success("Operation successful", "Your data has been saved.");
toastService.error("Error", "Something went wrong. Please try again.");
```

## Advanced Features

### Promise Handling

```tsx
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';

function MyComponent() {
  const { promise } = useEnhancedToast();
  
  const handleApiCall = () => {
    promise(
      fetchData(), // Your async operation
      {
        loading: {
          title: "Loading",
          description: "Please wait while we fetch your data...",
        },
        success: (data) => ({
          title: "Success",
          description: `Loaded ${data.items.length} items successfully!`,
        }),
        error: (err) => ({
          title: "Error",
          description: err.message || "Failed to load data",
        }),
      }
    );
  };
}
```

### Loading with Manual Update

```tsx
const { loading } = useEnhancedToast();

const handleLongProcess = () => {
  const { update, dismiss } = loading({
    title: "Processing",
    description: "Starting the operation...",
  });
  
  // Update the toast after some work is done
  setTimeout(() => {
    update({
      description: "Step 1 completed, working on step 2...",
    });
  }, 2000);
  
  // Finally update to success when done
  setTimeout(() => {
    update({
      title: "Completed",
      description: "Operation finished successfully!",
      variant: "success",
    });
  }, 4000);
};
```

## Toast with Action Button

```tsx
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { ToastLink } from '@/components/ui/enhanced-toast';

function MyComponent() {
  const { toast } = useEnhancedToast();
  
  const showToastWithAction = () => {
    toast({
      title: "New message received",
      description: "You have a new message from John Doe",
      variant: "info",
      action: (
        <ToastLink onClick={() => navigate('/messages')}>
          View message
        </ToastLink>
      ),
    });
  };
}
```

## Setup

1. Add `<EnhancedToaster />` to your app layout
2. Use `useEnhancedToast()` hook in your components
3. Import the components and hook where needed

## Demo

Visit the `/toast-demo` route to see all toast variants and features in action.