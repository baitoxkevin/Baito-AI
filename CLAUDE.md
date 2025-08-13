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

## Deployment Workflow

### IMPORTANT RULES:
1. **No deployment guides** - Just provide the zip file path
2. **Clean folder after testing** - Remove all test files after implementation
3. **Keep project clean** - Delete temporary files, test scripts, and guides

### Standard Deployment Process:
1. Build: `npm run build`
2. Copy extras: `cp _headers dist/`
3. Create zip: `cd dist && zip -r ../netlify-deploy.zip .`
4. Provide only: "Deployment package ready: `netlify-deploy.zip`"

### Files to Remove After Testing:
- Python test scripts (`*test*.py`)
- Test results (`*.png`, `*.json` from tests)
- Deployment guides (`NETLIFY_*.md`, `DEPLOY_*.md`)
- Temporary debug scripts
- Investigation files

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