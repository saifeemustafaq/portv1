# Brand Design Guidelines

## 1. Introduction

This design system serves as the foundation for creating consistent, accessible, and visually appealing web experiences. These guidelines ensure brand consistency across all digital touchpoints while maintaining flexibility for creative expression.

## 2. Brand Elements

### Typography

We employ a sophisticated triple-font system:

- **Primary Font (Sans)**: Montserrat
  - Used for general UI, navigation, and body text
  - Weights: 400-700 (Regular to Bold) for optimal readability
  - Available in both regular and italic styles

- **Monospace Font**: JetBrains Mono
  - Used for code snippets and technical content
  - Weights: 400-600
  - Ideal for displaying code and technical information

- **Serif Font**: Crimson Pro
  - Used for headlines and editorial content
  - Weights: 500-800
  - Adds sophistication to long-form content

### Color Palette

#### Core Colors
- **Background**: 
  - Primary: #0a0f1a (Rich Dark Blue-Black)
  - Secondary: #1a1f2e (Lighter Dark Blue)
  - Surface: #2a2f3e (Interactive Elements)

- **Foreground**: 
  - Primary: #ffffff (Pure White, for main headings)
  - Secondary: #e2e8f0 (Soft White, for body text)
  - Tertiary: #94a3b8 (Muted, for less important text)

#### Accent Colors
- **Primary Blue**:
  - Base: #3b82f6 (Vibrant Blue)
  - Light: #60a5fa (Hover states)
  - Dark: #2563eb (Active states)
  - Muted: rgba(59, 130, 246, 0.2) (Backgrounds)

- **Secondary Colors**:
  - Success: #10b981 (Green)
  - Warning: #f59e0b (Amber)
  - Error: #ef4444 (Red)
  - Info: #0ea5e9 (Light Blue)

#### Interactive States
- **Button Gradients**:
  - Primary: #3b82f6 to #2563eb (Solid colors for better contrast)
  - Hover: Lighten base colors by 10%
  - Active: Darken base colors by 10%

- **Focus States**:
  - Ring Color: #60a5fa
  - Ring Width: 2px
  - Ring Offset: 2px
  - Ring Offset Color: #0a0f1a

## 3. UI Components

### Buttons

#### CTA Buttons
- **Border Radius**: 8px (rounded-lg) for better visual harmony
- **Padding**: px-6 py-3
- **Font**: Semibold (600), text-sm
- **Transitions**: 300ms duration
- **Accessibility**: Minimum touch target size of 44px

##### Primary Button
- Solid background: #3b82f6
- White text: #ffffff
- Hover: #60a5fa
- Active: #2563eb
- Disabled: 50% opacity

##### Secondary Button
- Background: #2a2f3e
- Text: #e2e8f0
- Hover: #3a3f4e
- Border: 1px solid #4a4f5e

### Form Elements

#### Input Fields
- Background: #1a1f2e
- Border: 1px solid #4a4f5e
- Text Color: #ffffff
- Placeholder: #94a3b8
- Focus Ring: #3b82f6

## 4. Accessibility Guidelines

### Color Contrast
- **Minimum Ratios**:
  - Normal Text: 4.5:1
  - Large Text: 3:1
  - Interactive Elements: 3:1
  - Focus Indicators: 3:1

### Text Sizes
- Body Text: Minimum 16px
- Interactive Elements: Minimum 14px
- Labels: Minimum 14px

### Focus Indicators
- Must be visible and high contrast
- Minimum 2px width
- Must not rely solely on color

## 5. Dark Theme Best Practices

1. **Avoid Pure Black**
   - Use rich dark colors instead of pure black
   - Maintain depth with subtle gradients
   - Use varying shades for hierarchy

2. **Text Hierarchy**
   - Primary Text: #ffffff (100% opacity)
   - Secondary Text: #e2e8f0 (90% opacity)
   - Disabled Text: #94a3b8 (70% opacity)

3. **Surface Elevation**
   - Base Surface: #0a0f1a
   - Elevated Surface: #1a1f2e
   - Top Surface: #2a2f3e

## 6. Implementation Notes

### CSS Classes

```css
/* Font family utilities */
.sans {
  font-family: "Montserrat", sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
}

.mono {
  font-family: "JetBrains Mono", monospace;
  font-optical-sizing: auto;
  font-style: normal;
}

.serif {
  font-family: "Crimson Pro", serif;
  font-optical-sizing: auto;
  font-style: normal;
}

/* Dark theme background utilities */
.bg-base { background-color: #0a0f1a; }
.bg-elevated { background-color: #1a1f2e; }
.bg-surface { background-color: #2a2f3e; }

/* Text utilities */
.text-primary { color: #ffffff; }
.text-secondary { color: #e2e8f0; }
.text-muted { color: #94a3b8; }
```

## 7. Resources

- Font imports: Google Fonts
- Icons: Remix Icons (consistent weight and style)
- Design tokens: Maintained in tailwind.config.ts
- Global styles: Defined in globals.css
