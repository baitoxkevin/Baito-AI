# CandidateActionButton Component

A versatile UI component that provides candidate profile sharing functionality through either a simple button or a dropdown menu.

## Features

- **Share candidate profile update links** with two security options:
  - Standard link with IC verification
  - Secure token-based link
- **Visual feedback** with loading and success states
- **Two display modes**:
  - Simple button with tooltip
  - Dropdown menu with multiple options
- **Responsive design** that works well in tables and card layouts

## Usage

### Basic Usage - Simple Button

```tsx
import { CandidateActionButton } from "@/components/CandidateActionButton";

// Simple usage with just the required candidateId
<CandidateActionButton candidateId="candidate-uuid-here" />

// With optional IC number for direct link generation
<CandidateActionButton 
  candidateId="candidate-uuid-here"
  candidateIc="901223145678" 
/>

// With custom styling
<CandidateActionButton 
  candidateId="candidate-uuid-here"
  className="my-custom-class" 
/>
```

### Dropdown Menu Mode

```tsx
// Using the dropdown menu option
<CandidateActionButton 
  candidateId="candidate-uuid-here"
  candidateIc="901223145678"
  showDropdown={true} 
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `candidateId` | `string` | (Required) | UUID of the candidate |
| `candidateIc` | `string` | `undefined` | Candidate's IC number (for link generation) |
| `candidateName` | `string` | `undefined` | Candidate's name (for reference/analytics) |
| `className` | `string` | `""` | Additional CSS classes |
| `showDropdown` | `boolean` | `false` | Whether to show a dropdown menu instead of a simple button |

## Example in a Table

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Contact</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {candidates.map((candidate) => (
      <TableRow key={candidate.id}>
        <TableCell>{candidate.name}</TableCell>
        <TableCell>{candidate.phone}</TableCell>
        <TableCell className="text-right">
          <CandidateActionButton 
            candidateId={candidate.id}
            candidateIc={candidate.ic}
          />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## How It Works

1. When clicked, the button generates either:
   - A standard URL with IC verification (`/candidate-update/{id}?code={lastFourDigitsOfIC}`)
   - A secure URL with a database-generated token (when `useSecureToken=true`)

2. The URL is copied to the clipboard and a success toast notification is displayed

3. The candidate can use this URL to access their profile update form without logging in

## Dependencies

- `@/components/ui/button`
- `@/components/ui/tooltip`
- `@/components/ui/dropdown-menu` 
- `@/hooks/use-toast`
- `lucide-react` for icons
- `@/lib/supabase` for database interactions

## Security Considerations

- The standard URL uses the last 4 digits of IC as verification
- The secure token option uses a database function to generate a time-limited token
- All update attempts are verified on the server side before allowing changes