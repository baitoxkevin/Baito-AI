# Project Guidelines

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Tech Stack
- React 18 + TypeScript + Vite
- TailwindCSS + ShadCN UI
- Supabase for backend
- Framer Motion for animations

## UI Components
- **Waves Background**: Interactive background with flowing lines that respond to mouse movement
  - Usage: Add to outside of the main UI elements for subtle visual effect
  - Props:
    - `lineColor`: Color of wave lines (supports rgba for transparency)
    - `waveSpeedX/Y`: Controls animation speed
    - `waveAmpX/Y`: Controls wave amplitude
    - `friction/tension`: Physics parameters for interactivity

## Code Style
- **Imports**: Use `@/` alias imports, group by type
- **Formatting**: TypeScript strict mode, no unused variables
- **Types**: Strong typing with interfaces for objects, explicit component props
- **Naming**: PascalCase for components/types, camelCase for functions/variables
- **Error Handling**: Try/catch with toast notifications
- **Components**: Functional components with hooks, props interface at top
- **File Structure**: Components, pages, hooks, and lib directories

## Git Workflow
- Commit message format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Keep commits focused on single responsibility

## ProjectCard Responsive styles

### Original (Desktop) Style:
```tsx
<Card className="overflow-hidden border-l-4" style={{ borderLeftColor: project.color }}>
  <CardHeader className="pb-2">
    <div className="flex items-start justify-between">
      <CardTitle className="text-lg font-bold truncate">{project.title}</CardTitle>
      <div className="flex space-x-2">
        <Badge className={statusColor}>{project.status}</Badge>
        <Badge className={priorityColor}>{project.priority}</Badge>
      </div>
    </div>
  </CardHeader>
  <CardContent className="pb-4 space-y-3">
    <div className="flex items-center text-sm text-gray-600">
      <Calendar className="w-4 h-4 mr-2" />
      {endDate ? `${startDate} - ${endDate}` : startDate}
    </div>
    <div className="flex items-center text-sm text-gray-600">
      <Clock className="w-4 h-4 mr-2" />
      {project.working_hours_start} - {project.working_hours_end}
    </div>
    <div className="flex items-center text-sm text-gray-600">
      <MapPin className="w-4 h-4 mr-2" />
      {project.venue_address}
    </div>
    <div className="flex items-center text-sm text-gray-600">
      <Users className="w-4 h-4 mr-2" />
      <div className="flex space-x-1 items-center">
        <span className="font-medium">{project.filled_positions}</span>
        <span>/</span>
        <span>{project.crew_count} Filled</span>
      </div>
    </div>
  </CardContent>
  <CardFooter className="pt-0 flex justify-end">
    <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
      View Details
    </Button>
  </CardFooter>
</Card>
```

### Responsive Style:
```tsx
<Card className="overflow-hidden border-l-4 h-full flex flex-col" style={{ borderLeftColor: project.color }}>
  <CardHeader className="pb-2">
    <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
      <CardTitle className="text-base sm:text-lg font-bold truncate">{project.title}</CardTitle>
      <div className="flex flex-wrap gap-2">
        <Badge className={statusColor}>{project.status}</Badge>
        <Badge className={priorityColor}>{project.priority}</Badge>
      </div>
    </div>
  </CardHeader>
  <CardContent className="pb-4 space-y-3 flex-grow">
    <div className="flex items-center text-xs sm:text-sm text-gray-600">
      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
      <span className="truncate">{endDate ? `${startDate} - ${endDate}` : startDate}</span>
    </div>
    <div className="flex items-center text-xs sm:text-sm text-gray-600">
      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
      <span className="truncate">{project.working_hours_start} - {project.working_hours_end}</span>
    </div>
    <div className="flex items-center text-xs sm:text-sm text-gray-600">
      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
      <span className="truncate">{project.venue_address}</span>
    </div>
    <div className="flex items-center text-xs sm:text-sm text-gray-600">
      <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
      <div className="flex space-x-1 items-center">
        <span className="font-medium">{project.filled_positions}</span>
        <span>/</span>
        <span>{project.crew_count} Filled</span>
      </div>
    </div>
  </CardContent>
  <CardFooter className="pt-0 flex justify-end mt-auto">
    <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
      View Details
    </Button>
  </CardFooter>
</Card>
```

## Expandable Card Component Integration

### Dependencies:
```bash
npm install lucide-react framer-motion @radix-ui/react-slot class-variance-authority @radix-ui/react-label @radix-ui/react-checkbox @radix-ui/react-select @radix-ui/react-switch @radix-ui/react-avatar @radix-ui/react-progress @radix-ui/react-tooltip
```

### Required Files:
- `/components/ui/expandable-card.tsx` - Main expandable card component
- `/components/hooks/use-expandable.ts` - Custom hook for expandable functionality
- `/components/ui/card.tsx` - ShadCN card component
- `/components/ui/button.tsx` - ShadCN button component
- `/components/ui/badge.tsx` - ShadCN badge component
- `/components/ui/avatar.tsx` - ShadCN avatar component
- `/components/ui/progress.tsx` - ShadCN progress component
- `/components/ui/tooltip.tsx` - ShadCN tooltip component

### Usage Example:
```tsx
import { ProjectStatusCard } from "@/components/ui/expandable-card"

function ExpandableCardDemo() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ProjectStatusCard
        title="Design System"
        progress={100}
        dueDate="Dec 31, 2023"
        contributors={[
          { name: "Emma" },
          { name: "John" },
          { name: "Lisa" },
          { name: "David" }
        ]}
        tasks={[
          { title: "Create Component Library", completed: true },
          { title: "Implement Design Tokens", completed: true },
          { title: "Write Style Guide", completed: true },
          { title: "Set up Documentation", completed: true }
        ]}
        githubStars={256}
        openIssues={0}
      />
    </div>
  )
}
```

## Component Development Standards - Standalone Logic

  ## Core Principle
  All components must be fully self-contained and operate
  independently without relying on parent components for
  critical functionality.

  ## Implementation Requirements

  ### 1. Database Operations
  - Components must directly handle all database operations
   internally
  - Never rely on parent components to persist data changes
  - Include error handling and user feedback for all
  database operations

  ### 2. State Management
  - Components should manage their own state completely
  - If state needs to be shared, provide it through props
  but include fallback logic
  - Always implement default/fallback handlers for critical
   operations

  ### 3. Handler Implementation Pattern
  ```typescript
  // CORRECT - Standalone implementation
  const handleOperation = async (params) => {
    try {
      // Update local state
      setState(newState);

      // Update database directly
      const { error } = await supabase
        .from('table')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      // Provide user feedback
      toast({ title: "Success", description: "Operation
  completed" });
    } catch (error) {
      // Handle errors
      toast({ title: "Error", description: "Operation
  failed" });
    }
  };

  // INCORRECT - Relies on parent
  const handleOperation = (params) => {
    if (props.onUpdate) {
      props.onUpdate(params);
    }
  };

  4. Required Features for Standalone Components

  - Direct database access (Supabase client)
  - Error handling with user notifications (toast)
  - Loading states for async operations
  - Input validation
  - Fallback values for all optional props

  5. Testing Standalone Behavior

  Before considering a component complete, verify:
  - It works correctly when used without any optional props
  - All CRUD operations persist to the database
  - Error states are handled gracefully
  - The component can be dropped into any part of the
  application

  6. Example Implementation Checklist

  For a staff management component:
  - Add staff → Updates database directly
  - Remove staff → Updates database and moves to
  appropriate list
  - Update status → Persists change to database
  - Modify schedule → Saves to database
  - All operations show success/error feedback
  - Works without parent-provided handlers

  7. Migration Pattern

  When updating existing components:
  1. Identify all operations that modify state
  2. Add database persistence to each operation
  3. Implement error handling and user feedback
  4. Test component in isolation
  5. Remove dependencies on parent handlers

  Key Reminder

  Every component should be able to answer "YES" to: "If I
  drop this component into a completely different part of the
  app with just the required props, will it still work
  perfectly?"