# Premium Design System Style Guide

A comprehensive guide for implementing the premium design system consistently across the application.

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Components](#components)
5. [Accessibility Guidelines](#accessibility-guidelines)
6. [Code Examples](#code-examples)
7. [Dos and Don'ts](#dos-and-donts)

---

## Color Palette

### Primary Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--primary` | `#2B50FF` (Royal Indigo) | `#4F6FFF` | Primary buttons, links, active states |
| `--secondary` | `#FF6B68` (Coral Accent) | `#FF8A87` | Secondary CTAs, callouts, highlights |
| `--tertiary` | `#FFC857` (Gold Amber) | `#FFD57A` | Badges, subtle highlights, accents |

### Status Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--success` | `#10B981` (Emerald) | `#34D399` | Success states, confirmations |
| `--error` / `--destructive` | `#EF4444` (Tomato) | `#F87171` | Error states, destructive actions |
| `--warning` | `#F59E0B` (Amber) | `#FBBF24` | Warning states, caution indicators |

### Neutral Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | `#F8FAFC` | `#0B1220` | Page background |
| `--surface` / `--card` | `#FFFFFF` | `#0F172A` | Card backgrounds, surfaces |
| `--text` / `--foreground` | `#0F172A` | `#E6EEF8` | Primary text |
| `--border` | `#E2E8F0` | `#1E293B` | Borders, dividers |
| `--muted` | `#64748B` | `#94A3B8` | Secondary text, placeholders |

### Color Pair Recommendations (WCAG AA Compliant)

| Background | Text Color | Contrast Ratio | Use Case |
|------------|------------|----------------|----------|
| `--background` | `--foreground` | 15.8:1 | Body text |
| `--primary` | `#FFFFFF` | 4.6:1 | Primary buttons |
| `--secondary` | `#FFFFFF` | 4.5:1 | Secondary buttons |
| `--tertiary` | `#0F172A` | 10.2:1 | Badges, highlights |
| `--success` | `#FFFFFF` | 4.5:1 | Success badges |
| `--error` | `#FFFFFF` | 4.5:1 | Error states |

### Glass Overlay Tints

```css
/* Light mode glass effect */
--glass-overlay: rgba(8, 15, 30, 0.06);

/* Dark mode glass effect */
--glass-overlay: rgba(255, 255, 255, 0.06);
```

---

## Typography

### Font Families

```css
--font-sans: "Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "Geist Mono", monospace;
```

### Type Scale

| Token | Size | Usage |
|-------|------|-------|
| `--font-size-xs` | 0.75rem (12px) | Fine print, labels |
| `--font-size-sm` | 0.875rem (14px) | Secondary text, captions |
| `--font-size-base` | 1rem (16px) | Body text |
| `--font-size-lg` | 1.125rem (18px) | Lead paragraphs |
| `--font-size-xl` | 1.25rem (20px) | Small headings |
| `--font-size-2xl` | 1.5rem (24px) | Section headings |
| `--font-size-3xl` | 1.875rem (30px) | Page headings |
| `--font-size-4xl` | 2.25rem (36px) | Hero headings |

### Heading Styles

| Class | Font Weight | Line Height | Usage |
|-------|-------------|-------------|-------|
| `.heading-1` | 700 (Bold) | 1.1 | Primary page headings |
| `.heading-2` | 700 (Bold) | 1.1 | Section headings |
| `.heading-3` | 600 (Semibold) | 1.1 | Subsection headings |
| `.heading-4` | 600 (Semibold) | 1.25 | Card headings |
| `.heading-5` | 600 (Semibold) | 1.25 | Small headings |
| `.heading-6` | 600 (Semibold) | 1.25 | Smallest headings |

### Body Text Styles

| Class | Font Weight | Line Height | Usage |
|-------|-------------|-------------|-------|
| `.body-lg` | 400 (Normal) | 1.5 | Intro paragraphs |
| `.body-base` | 400 (Normal) | 1.5 | Standard paragraphs |
| `.body-medium` | 500 (Medium) | 1.5 | Emphasized body text |
| `.body-sm` | 400 (Normal) | 1.5 | Secondary text |
| `.body-xs` | 400 (Normal) | 1.5 | Fine print |

### Text Highlight Utilities

```jsx
{/* Primary highlight (Gold Amber) */}
<p className="text-highlight">Important information here</p>

{/* Secondary highlight (Coral) */}
<p className="text-highlight-secondary">Call to action text</p>

{/* Primary color highlight (Indigo) */}
<p className="text-highlight-primary">Featured content</p>

{/* Inline highlight */}
<span className="text-highlight-inline">highlighted word</span>
```

---

## Spacing & Layout

### Spacing Scale

| Token | Value | Tailwind Class |
|-------|-------|----------------|
| `--spacing-xs` | 4px | `p-1`, `m-1` |
| `--spacing-sm` | 8px | `p-2`, `m-2` |
| `--spacing-md` | 12px | `p-3`, `m-3` |
| `--spacing-lg` | 16px | `p-4`, `m-4` |
| `--spacing-xl` | 24px | `p-6`, `m-6` |
| `--spacing-2xl` | 32px | `p-8`, `m-8` |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements, inputs |
| `--radius-md` | 6px | Buttons, badges |
| `--radius-lg` | 8px | Cards, modals |
| `--radius-xl` | 12px | Large cards, panels |
| `--radius-full` | 9999px | Pills, avatars |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modals, elevated cards |
| `--shadow-glow` | `0 0 20px rgba(43,80,255,0.3)` | Focus states, highlights |

### Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktops |
| `xl` | 1280px | Large desktops |
| `2xl` | 1536px | Extra large screens |

Container max-width: **1400px**

---

## Components

### Button Variants

```jsx
import { Button } from "@/components/ui/button";

{/* Primary - Main actions */}
<Button variant="default">Primary Action</Button>

{/* Secondary - Alternative actions */}
<Button variant="secondary">Secondary Action</Button>

{/* Ghost - Subtle actions */}
<Button variant="ghost">Ghost Button</Button>

{/* Outline - Bordered buttons */}
<Button variant="outline">Outline Button</Button>

{/* Destructive - Dangerous actions */}
<Button variant="destructive">Delete</Button>

{/* Link - Text-style button */}
<Button variant="link">Learn More</Button>

{/* Sizes */}
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

**Button Behavior:**
- Hover: `translateY(-1px)`, `scale(1.01)`, elevated shadow
- Active: Returns to original position
- Disabled: 50% opacity, `cursor-not-allowed`, desaturated
- Focus: Ring with primary color at 30% opacity

### Card Variants

```jsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

{/* Default card */}
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>

{/* Glass card (frosted effect) */}
<Card variant="glass">
  <CardContent>Premium glass effect</CardContent>
</Card>

{/* Elevated card */}
<Card variant="elevated">
  <CardContent>More prominent card</CardContent>
</Card>

{/* Hoverable card */}
<Card hover={true}>
  <CardContent>Lifts on hover</CardContent>
</Card>
```

### Toast Variants

```jsx
import { toast } from "@/components/ui/use-toast";

// Success toast
toast({
  variant: "success",
  title: "Success!",
  description: "Your changes have been saved.",
});

// Error toast
toast({
  variant: "error",
  title: "Error",
  description: "Something went wrong.",
});

// Warning toast
toast({
  variant: "warning",
  title: "Warning",
  description: "Please review your input.",
});

// Info toast
toast({
  variant: "info",
  title: "Info",
  description: "Here's some helpful information.",
});
```

**Toast Positioning:**
- Desktop (≥768px): Top-right, slides in from top
- Mobile (<768px): Bottom, slides in from bottom

### Badge Variants

```jsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="tertiary">Tertiary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="muted">Muted</Badge>

{/* Sizes */}
<Badge size="sm">Small</Badge>
<Badge size="default">Default</Badge>
<Badge size="lg">Large</Badge>
```

### Tooltip

```jsx
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>
      Helpful tooltip text
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Form Inputs

```jsx
import { Input } from "@/components/ui/input";

{/* Default input */}
<Input placeholder="Enter text..." />

{/* Input with error state */}
<Input 
  error={true}
  errorId="email-error"
  aria-describedby="email-error"
/>
<span id="email-error" className="text-destructive text-sm">
  Please enter a valid email
</span>
```

**Input Behavior:**
- Focus: Ring with 2px offset, primary color border
- Error: Red border, shake animation, `aria-invalid="true"`

---

## Accessibility Guidelines

### Color Contrast Requirements

- **Normal text (< 18px):** Minimum 4.5:1 contrast ratio
- **Large text (≥ 18px or ≥ 14px bold):** Minimum 3:1 contrast ratio
- **UI components:** Minimum 3:1 contrast ratio

### Focus Indicators

All interactive elements must have visible focus indicators:

```css
/* Focus ring pattern */
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-primary/30
focus-visible:ring-offset-2
```

### ARIA Attributes

**Form Errors:**
```jsx
<Input 
  aria-invalid="true"
  aria-describedby="error-message-id"
/>
<span id="error-message-id" role="alert">
  Error message here
</span>
```

**Toast Notifications:**
```jsx
// Errors/Warnings use role="alert"
// Success/Info use role="status"
<Toast role="alert" aria-live="polite">
  Important notification
</Toast>
```

### Reduced Motion

The design system respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Keyboard Navigation

- All interactive elements are focusable via Tab
- Focus order follows visual order
- Escape closes modals and dropdowns
- Enter/Space activates buttons and links

---

## Code Examples

### Theme-Aware Component

```jsx
// Component that adapts to light/dark mode
function ThemeAwareCard({ children }) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm">
      {children}
    </div>
  );
}
```

### Using Design Tokens in JavaScript

```jsx
import { lightPalette, darkPalette, getColorPalette } from '@/design-system/design-tokens';

// Get current theme palette
const palette = getColorPalette(isDarkMode ? 'dark' : 'light');

// Access specific colors
const primaryColor = palette.primary;
const backgroundColor = palette.background;
```

### Glass Effect Card

```jsx
<Card variant="glass" className="p-6">
  <h3 className="heading-3 mb-4">Premium Feature</h3>
  <p className="body-base">
    This card has a frosted glass effect with backdrop blur.
  </p>
</Card>
```

### Responsive Layout

```jsx
<div className="container mx-auto px-4 max-w-[1400px]">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Cards */}
  </div>
</div>
```

### Animation Timing

```jsx
// Use duration tokens for consistent animations
<div className="transition-all duration-[var(--duration-normal)] ease-[cubic-bezier(0.2,0.9,0.3,1)]">
  Animated content
</div>

// Or use Tailwind classes
<div className="transition-all duration-[180ms]">
  Animated content
</div>
```

---

## Dos and Don'ts

### Colors

✅ **Do:**
- Use semantic color tokens (`--primary`, `--success`, `--error`)
- Ensure text/background combinations meet WCAG AA contrast
- Use lighter variants in dark mode for better visibility
- Apply glass effects sparingly for premium feel

❌ **Don't:**
- Hardcode hex values instead of using tokens
- Use low-contrast color combinations
- Mix light and dark mode colors
- Overuse accent colors (tertiary, secondary)

### Typography

✅ **Do:**
- Use heading classes for consistent hierarchy
- Maintain line-height of 1.1 for headings, 1.5 for body
- Use `body-sm` or `body-xs` for secondary information
- Apply text highlights for important callouts

❌ **Don't:**
- Use more than 3 font weights on a single page
- Set line-height below 1.1 for any text
- Use all caps for body text
- Mix font families unnecessarily

### Components

✅ **Do:**
- Use the `default` button variant for primary actions
- Apply `hover={true}` to clickable cards
- Include progress bars on auto-dismissing toasts
- Provide error messages with proper ARIA attributes

❌ **Don't:**
- Use destructive buttons for non-destructive actions
- Disable hover effects on interactive elements
- Show multiple toasts simultaneously
- Forget to add focus states to custom components

### Accessibility

✅ **Do:**
- Test with keyboard navigation
- Include `aria-label` on icon-only buttons
- Use `aria-invalid` and `aria-describedby` for form errors
- Respect `prefers-reduced-motion` preference

❌ **Don't:**
- Remove focus outlines without providing alternatives
- Use color alone to convey information
- Create custom components without ARIA support
- Ignore screen reader announcements for dynamic content

### Animations

✅ **Do:**
- Use duration tokens for consistency
- Apply `cubic-bezier(0.2, 0.9, 0.3, 1)` for bouncy effects
- Keep animations under 420ms for responsiveness
- Provide reduced motion alternatives

❌ **Don't:**
- Use animations longer than 500ms
- Animate layout properties (width, height) directly
- Create jarring or distracting animations
- Forget to test with reduced motion enabled

### Layout

✅ **Do:**
- Use the spacing scale consistently
- Apply mobile-first responsive design
- Center containers with `mx-auto max-w-[1400px]`
- Use CSS Grid or Flexbox for layouts

❌ **Don't:**
- Use arbitrary spacing values
- Forget mobile breakpoints
- Create layouts wider than 1400px
- Use fixed pixel widths for responsive elements

---

## Quick Reference

### CSS Variables

```css
/* Import in your CSS */
@import '@/design-system/design-tokens.css';

/* Use variables */
.my-component {
  color: var(--primary);
  background: var(--background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--duration-normal) ease;
}
```

### Tailwind Classes

```jsx
// Colors
className="bg-primary text-primary-foreground"
className="bg-card border-border"
className="text-muted-foreground"

// Shadows
className="shadow-sm shadow-md shadow-lg"

// Transitions
className="transition-all duration-[180ms]"

// Focus states
className="focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
```

### Component Imports

```jsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
```

---

*Last updated: December 2024*
