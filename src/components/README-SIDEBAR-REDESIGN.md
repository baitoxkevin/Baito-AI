# Redesigned Sidebar Component Documentation

The redesigned sidebar provides a modern, animated, and responsive navigation experience for the application. Built with Framer Motion animations, it features hover effects, collapsible sections, and improved mobile support.

## Key Features

- **Responsive Design**: Automatically adapts between desktop and mobile views
- **Expandable on Hover**: Desktop sidebar expands when hovered over
- **Animated Transitions**: Smooth animations for all state changes
- **Section Organization**: Group related navigation items into collapsible sections
- **Badge Support**: Display notification badges or status indicators
- **Active State Indicators**: Visual indicators for the current page
- **Enhanced User Profile**: Improved profile display with status indicator
- **Accessibility Features**: Proper ARIA attributes and keyboard support
- **Reduced Motion Support**: Respects user preference for reduced motion

## Integration Guide

### 1. Replace existing sidebar components

To use the redesigned sidebar, update your imports from:

```tsx
import SidebarAdapter from '@/components/SidebarAdapter';
```

To:

```tsx
import SidebarAdapter from '@/components/SidebarAdapter-redesigned';
```

### 2. Update MainAppLayout.tsx

The sidebar adapter handles the same props as before, so no changes are needed to the props passed to it:

```tsx
<SidebarAdapter activeView={activeView} onViewChange={setActiveView}>
  {/* Page content */}
</SidebarAdapter>
```

### 3. Customizing Navigation Items

Navigation items are now organized into sections. You can customize them in the `SidebarAdapter-redesigned.tsx` file:

```tsx
// Example of a navigation item with a badge
{
  label: "Projects",
  href: "/projects",
  icon: <FolderKanban className="h-full w-full" />,
  badge: { content: "3", variant: "secondary" },
  onClick: (e) => {
    e.preventDefault();
    handleViewChange("projects");
  },
  "aria-current": activeView === "projects" ? "page" : undefined,
}
```

Badge variants include: `default`, `secondary`, `outline`, and `destructive`.

### 4. Using Collapsible Sections

The sidebar now supports collapsible sections for organizing navigation items:

```tsx
<SidebarSection 
  id="tools" 
  title="TOOLS" 
  collapsible 
  defaultCollapsed
>
  {/* Navigation items */}
</SidebarSection>
```

Set `collapsible` to true to make a section collapsible, and `defaultCollapsed` to true to have it initially collapsed.

## Component Structure

- `Sidebar`: Main container component that provides context
- `SidebarBody`: Contains the sidebar content, renders both desktop and mobile versions
- `SidebarSection`: Groups related navigation items with optional headings
- `SidebarLink`: Individual navigation item with icon, label, and optional badge
- `SidebarFooter`: Footer section, typically containing user profile and actions
- `SidebarUser`: User profile component with avatar and status

## Advanced Customization

### Customizing Animations

The animations use Framer Motion variants that can be customized in the `sidebar-redesigned.tsx` file:

```tsx
const linkMotion = {
  initial: { 
    backgroundColor: "rgba(0, 0, 0, 0)",
    x: 0 
  },
  hover: { 
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    x: 2,
    transition: { duration: 0.2 } 
  },
  // Add additional variants as needed
};
```

### Tailwind Class Customization

Components use the `cn` utility for class name composition, making it easy to override styles:

```tsx
<SidebarLink 
  link={link} 
  className="custom-class" 
/>
```

## Accessibility Considerations

- The sidebar uses proper ARIA attributes for navigation
- It includes focus indicators and keyboard navigation support
- Respects user preferences for reduced motion
- Mobile drawer has proper ARIA roles and labels

## Example Usage

See `SidebarRedesignDemo.tsx` for a complete example of using all features of the redesigned sidebar.