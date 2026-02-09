# UI/UX Design Guide
## PKM Review Application

> **Purpose**: Design system and user experience guidelines for consistent, accessible, and beautiful interfaces.

---

## 🎨 Design Philosophy

### Core Principles

1. **Clarity**: Information is easy to find and understand
2. **Efficiency**: Users complete tasks quickly
3. **Consistency**: Predictable patterns throughout
4. **Accessibility**: Usable by everyone
5. **Professional**: Academic institution aesthetic

---

## 🎯 User Roles & Needs

### Mahasiswa (Students)
- **Goals**: Submit proposals, track status, view feedback
- **Pain Points**: Complex forms, unclear requirements
- **Design Focus**: Guided workflows, clear status indicators

### Reviewer (Lecturers)
- **Goals**: Review proposals efficiently, provide feedback
- **Pain Points**: Too many proposals, annotation difficulties
- **Design Focus**: Batch operations, inline feedback tools

### Admin (Staff)
- **Goals**: Manage system, assign reviewers, reports
- **Pain Points**: Manual data entry, lack of overview
- **Design Focus**: Dashboard overview, bulk actions

---

## 🎨 Design System

### Color Palette

**Primary Colors** (Academic Blue):
```css
--primary-50:  #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;  /* Main brand color */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;
```

**Semantic Colors**:
```css
/* Success - Green */
--success: #10b981;
--success-bg: #d1fae5;
--success-text: #065f46;

/* Warning - Yellow */
--warning: #f59e0b;
--warning-bg: #fef3c7;
--warning-text: #92400e;

/* Error - Red */
--error: #ef4444;
--error-bg: #fee2e2;
--error-text: #991b1b;

/* Info - Blue */
--info: #0ea5e9;
--info-bg: #e0f2fe;
--info-text: #075985;
```

**Neutral Colors**:
```css
--gray-50:  #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

**Usage**:
```tsx
// Primary actions
<Button className="bg-primary-600 hover:bg-primary-700">Submit</Button>

// Success states
<Badge className="bg-success-bg text-success-text">Approved</Badge>

// Error states
<Alert variant="destructive">Error message</Alert>
```

---

### Typography

**Font Stack**:
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;
```

**Type Scale**:
```css
--text-xs:   0.75rem;  /* 12px */
--text-sm:   0.875rem; /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg:   1.125rem; /* 18px */
--text-xl:   1.25rem;  /* 20px */
--text-2xl:  1.5rem;   /* 24px */
--text-3xl:  1.875rem; /* 30px */
--text-4xl:  2.25rem;  /* 36px */
```

**Font Weights**:
```css
--font-normal:    400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
```

**Usage**:
```tsx
<h1 className="text-3xl font-bold">Page Title</h1>
<h2 className="text-2xl font-semibold">Section Header</h2>
<p className="text-base text-gray-700">Body text</p>
<span className="text-sm text-gray-500">Helper text</span>
```

---

### Spacing System

**Base Unit**: 4px (0.25rem)

```css
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

**Layout Spacing**:
```tsx
// Between components
<div className="space-y-6">

// Card padding
<Card className="p-6">

// Section margins
<section className="mb-8">

// Page padding
<main className="px-4 py-8 lg:px-8">
```

---

### Border Radius

```css
--radius-sm:   0.25rem; /* 4px - Small elements */
--radius-base: 0.5rem;  /* 8px - Cards, buttons */
--radius-lg:   0.75rem; /* 12px - Large cards */
--radius-xl:   1rem;    /* 16px - Modals */
--radius-full: 9999px;  /* Circular */
```

**Usage**:
```tsx
<Button className="rounded-base">Default Button</Button>
<Card className="rounded-lg">Card Content</Card>
<Avatar className="rounded-full">KR</Avatar>
```

---

### Shadows

```css
--shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1);
--shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.1);
```

**Usage by Component**:
- Cards: `shadow-base`
- Dropdowns: `shadow-lg`
- Modals: `shadow-xl`
- Buttons (hover): `shadow-md`

---

## 🧩 Component Guidelines

### Buttons

**Variants**:
```tsx
// Primary - Main actions
<Button variant="default">Submit Proposal</Button>

// Secondary - Less important actions
<Button variant="secondary">Cancel</Button>

// Outline - Tertiary actions
<Button variant="outline">View Details</Button>

// Destructive - Dangerous actions
<Button variant="destructive">Delete Team</Button>

// Ghost - Minimal emphasis
<Button variant="ghost">Skip</Button>
```

**Sizes**:
```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

**States**:
```tsx
// Loading
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Submitting...
</Button>

// Disabled
<Button disabled>Disabled</Button>

// With Icon
<Button>
  <Upload className="mr-2 h-4 w-4" />
  Upload File
</Button>
```

---

### Forms

**Input Fields**:
```tsx
<div className="space-y-2">
  <Label htmlFor="teamName">Team Name</Label>
  <Input
    id="teamName"
    placeholder="Enter team name"
    aria-describedby="teamName-error"
  />
  <p id="teamName-error" className="text-sm text-error">
    {error?.message}
  </p>
</div>
```

**Form Layout**:
```tsx
<form className="space-y-6">
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
    <FormField name="namaTeam" />
    <FormField name="jenisPkm" />
  </div>
  
  <FormField name="judulProposal" className="col-span-full" />
  
  <div className="flex justify-end gap-3">
    <Button variant="outline">Cancel</Button>
    <Button type="submit">Create Team</Button>
  </div>
</form>
```

---

### Cards

**Basic Card**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Team Name</CardTitle>
    <CardDescription>Proposal title here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter className="justify-end gap-2">
    <Button variant="outline">Edit</Button>
    <Button>View</Button>
  </CardFooter>
</Card>
```

**Interactive Card**:
```tsx
<Card className="cursor-pointer transition-shadow hover:shadow-md">
  {/* Clickable card content */}
</Card>
```

---

### Status Badges

**Proposal Status**:
```tsx
const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'default' },
  under_review: { label: 'Under Review', variant: 'default' },
  needs_revision: { label: 'Needs Revision', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

<Badge variant={statusConfig[status].variant}>
  {statusConfig[status].label}
</Badge>
```

---

### Modals/Dialogs

**Standard Modal**:
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description goes here
      </DialogDescription>
    </DialogHeader>
    
    {/* Dialog content */}
    
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Tables

**Data Table**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Team Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell>
          <Badge variant={getVariant(item.status)}>
            {item.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## ♿ Accessibility Guidelines

### WCAG 2.1 AA Compliance

**Color Contrast**:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Keyboard Navigation**:
```tsx
// All interactive elements must be keyboard accessible
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click me
</button>

// Skip to main content
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

**ARIA Labels**:
```tsx
// Buttons with icons only
<Button aria-label="Delete proposal">
  <Trash2 className="h-4 w-4" />
</Button>

// Form inputs
<Label htmlFor="email">Email</Label>
<Input
  id="email"
  type="email"
  aria-describedby="email-error"
  aria-invalid={!!error}
/>
<p id="email-error" role="alert">{error}</p>
```

**Focus Indicators**:
```css
/* Always visible focus ring */
.focus-visible:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

---

## 📱 Responsive Design

### Breakpoints

```css
--screen-sm: 640px;   /* Small devices */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Laptops */
--screen-xl: 1280px;  /* Desktops */
--screen-2xl: 1536px; /* Large screens */
```

**Usage**:
```tsx
<div className="
  px-4              /* Mobile: 16px padding */
  md:px-8           /* Tablet: 32px padding */
  lg:px-12          /* Desktop: 48px padding */
">
  <div className="
    grid 
    grid-cols-1     /* Mobile: 1 column */
    md:grid-cols-2  /* Tablet: 2 columns */
    lg:grid-cols-3  /* Desktop: 3 columns */
    gap-6
  ">
    {/* Cards */}
  </div>
</div>
```

### Mobile-First Approach

```tsx
// ✅ Good: Mobile first
<nav className="
  flex-col        /* Mobile: vertical */
  md:flex-row     /* Tablet+: horizontal */
">

// ❌ Bad: Desktop first
<nav className="
  flex-row 
  max-md:flex-col
">
```

---

## 🎭 Interactive States

### Hover States

```tsx
<Button className="
  bg-primary-600 
  hover:bg-primary-700 
  transition-colors
">
  Hover Me
</Button>

<Card className="
  cursor-pointer 
  transition-all 
  hover:shadow-lg 
  hover:-translate-y-1
">
  Hoverable Card
</Card>
```

### Loading States

```tsx
// Full page loading
<div className="flex h-screen items-center justify-center">
  <Loader2 className="h-8 w-8 animate-spin" />
</div>

// Component loading
<Skeleton className="h-20 w-full" />

// Button loading
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>
```

### Empty States

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Inbox className="h-16 w-16 text-gray-400 mb-4" />
  <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
  <p className="text-gray-600 mb-4">
    Create your first team to get started
  </p>
  <Button>
    <Plus className="mr-2 h-4 w-4" />
    Create Team
  </Button>
</div>
```

---

## 📊 Data Visualization

### Progress Indicators

```tsx
// Linear progress
<Progress value={65} className="w-full" />

// Circular progress
<div className="relative h-20 w-20">
  <svg className="h-full w-full">
    <circle
      cx="40"
      cy="40"
      r="35"
      stroke="currentColor"
      strokeWidth="8"
      fill="none"
      className="text-gray-200"
    />
    <circle
      cx="40"
      cy="40"
      r="35"
      stroke="currentColor"
      strokeWidth="8"
      fill="none"
      strokeDasharray="220"
      strokeDashoffset={220 - (220 * progress) / 100}
      className="text-primary-600"
    />
  </svg>
  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
    {progress}%
  </span>
</div>
```

### Score Display

```tsx
<div className="flex items-center gap-2">
  <div className="flex-1">
    <div className="flex justify-between text-sm mb-1">
      <span>Administratif</span>
      <span className="font-semibold">85/100</span>
    </div>
    <Progress value={85} />
  </div>
</div>
```

---

## 🚦 User Feedback

### Toast Notifications

```tsx
import { toast } from '@/components/ui/use-toast';

// Success
toast({
  title: 'Success',
  description: 'Team created successfully',
});

// Error
toast({
  title: 'Error',
  description: 'Failed to create team',
  variant: 'destructive',
});

// With action
toast({
  title: 'Proposal submitted',
  description: 'Your proposal has been submitted for review',
  action: <Button size="sm">View</Button>,
});
```

### Alert Messages

```tsx
<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You need to complete your profile before submitting.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <XCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please login again.
  </AlertDescription>
</Alert>
```

---

## 🎯 Common Patterns

### List with Actions

```tsx
<div className="divide-y">
  {items.map((item) => (
    <div key={item.id} className="flex items-center justify-between py-4">
      <div>
        <h3 className="font-semibold">{item.title}</h3>
        <p className="text-sm text-gray-600">{item.description}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">Edit</Button>
        <Button variant="ghost" size="sm">Delete</Button>
      </div>
    </div>
  ))}
</div>
```

### Stats Cards

```tsx
<div className="grid gap-6 md:grid-cols-3">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
      <Users className="h-4 w-4 text-gray-600" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">24</div>
      <p className="text-xs text-gray-600">+2 from last month</p>
    </CardContent>
  </Card>
</div>
```

---

## ✅ Best Practices

### DO ✅

- Use semantic HTML elements
- Provide alt text for images
- Maintain consistent spacing
- Use loading states
- Show empty states
- Provide clear error messages
- Make clickable areas large enough (44x44px minimum)
- Test with keyboard only
- Support dark mode (if implemented)

### DON'T ❌

- Use color alone to convey information
- Disable zoom on mobile
- Use tiny click targets
- Hide focus indicators
- Use auto-playing audio/video
- Override browser default behaviors
- Leave form errors unclear
- Use generic error messages

---

## 📱 Mobile Considerations

**Touch Targets**: Minimum 44x44px
**Typography**: Minimum 16px to prevent zoom on iOS
**Navigation**: Thumb-friendly bottom navigation
**Forms**: Use appropriate input types

```tsx
<Input type="email" inputMode="email" />
<Input type="tel" inputMode="tel" />
<Input type="number" inputMode="numeric" />
```

---

**Design with users in mind, not just screens!** 🎨
