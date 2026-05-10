---
name: Modern Civic Library System
colors:
  surface: '#fcf8ff'
  surface-dim: '#dad7f3'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#efecff'
  surface-container-high: '#e8e5ff'
  surface-container-highest: '#e2e0fc'
  on-surface: '#1a1a2e'
  on-surface-variant: '#434652'
  inverse-surface: '#2f2e43'
  inverse-on-surface: '#f2efff'
  outline: '#737783'
  outline-variant: '#c3c6d4'
  surface-tint: '#2b5bb5'
  primary: '#003178'
  on-primary: '#ffffff'
  primary-container: '#0d47a1'
  on-primary-container: '#a1bbff'
  inverse-primary: '#b0c6ff'
  secondary: '#b7131a'
  on-secondary: '#ffffff'
  secondary-container: '#db322f'
  on-secondary-container: '#fffbff'
  tertiary: '#4c2f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b4400'
  on-tertiary-container: '#fdac29'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b0c6ff'
  on-primary-fixed: '#001945'
  on-primary-fixed-variant: '#00429c'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ac'
  on-secondary-fixed: '#410002'
  on-secondary-fixed-variant: '#93000d'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#ffb957'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#643f00'
  background: '#fcf8ff'
  on-background: '#1a1a2e'
  surface-variant: '#e2e0fc'
typography:
  display:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  headline-sm:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Lexend
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Lexend
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Lexend
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-lg:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
  label-md:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
  display-mobile:
    fontFamily: Montserrat
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

This design system is built for a multi-branch library system that serves as a cornerstone of community growth and lifelong learning. The brand personality is **Trustworthy, Energetic, and Organized**. It bridges the gap between a traditional academic institution and a modern community hub.

The visual style is **Corporate / Modern** with a **High-Contrast** edge. It utilizes a structured grid, bold typographic statements, and a vibrant color palette to move away from the "quiet library" stereotype toward an active "community engine" feel. 

Key attributes include:
- **High Energy:** Using vibrant accents to highlight calls to action and critical programs.
- **Structured Authority:** Clear visual hierarchies that make vast amounts of information (catalogs, events, services) easy to navigate.
- **Accessibility:** Large, readable type and high-contrast ratios to ensure inclusivity for all community members.

## Colors

The color palette is designed for maximum impact and legibility. 

- **Primary Blue (#0D47A1):** Used for main navigation, headers, and primary buttons. It represents reliability and academic depth.
- **Vibrant Red (#E53935):** Reserved for high-priority CTAs, "Live Now" events, and urgent alerts.
- **Amber Gold (#F9A825):** Used for highlights, iconography, and secondary indicators like "New Arrivals" or "Featured" badges.
- **Deep Navy (#1A1A2E):** The primary color for text and dark-themed sections to provide a more sophisticated alternative to pure black.
- **Light Wash (#F5F7FF):** A cool-toned off-white used for backgrounds to reduce eye strain while maintaining a crisp, modern feel.

## Typography

This design system uses a dual-font approach to balance authority with accessibility.

- **Montserrat (Headlines/Labels):** Chosen for its geometric, confident, and clean appearance. It provides an authoritative voice for headers and navigation elements.
- **Lexend (Body):** Specifically designed to reduce visual stress and improve reading proficiency, making it the perfect choice for a library system dedicated to literacy.

**Usage Notes:**
- Use **Display** sizes for hero banners and major section headings.
- **Labels** should often use uppercase styling with slight letter spacing to differentiate them from body text.
- Maintain high contrast by using the Primary Blue or Deep Navy for all headline levels.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop to maintain a structured, editorial feel, transitioning to a fluid model for smaller devices.

- **Grid System:** A 12-column grid with 24px gutters. Content is typically grouped in 3, 4, or 6 column spans to create distinct "cards" of information.
- **Vertical Rhythm:** Large vertical gaps (80px+) are used between major sections to provide "breathing room" and clearly delineate different library services (e.g., from Book Catalog to Upcoming Events).
- **Mobile Adaptation:** At the 768px breakpoint, columns stack vertically, and horizontal margins reduce to 16px. 
- **Section Banners:** Use full-bleed background colors (Primary Blue or Light Wash) to break up the page and highlight specific statistics or calls to action.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Shadows**.

- **Surface Tiers:** The base background is the Light Wash (#F5F7FF). Cards and containers use pure White (#FFFFFF) to pop against the background.
- **Shadow Character:** Use soft, diffused shadows to indicate interactivity. Shadows should have a low opacity (10-15%) with a slight Primary Blue tint to maintain color harmony.
- **Interactive Depth:** On hover, card components should slightly increase their shadow spread and lift (Y-axis offset) to provide tactile feedback.
- **Flat Overlays:** For high-energy sections (like the blue highlight banners), use flat, unshadowed containers with high-contrast text to maintain the clean, modern aesthetic.

## Shapes

The design system utilizes **Rounded** corners to feel approachable and community-focused.

- **Standard Elements:** Buttons, input fields, and small UI elements use a 0.5rem (8px) radius.
- **Containers:** Content cards and feature blocks use a 1rem (16px) radius to create a soft, modern container.
- **Iconography:** Icons should be contained within rounded-square or circular containers to mirror the card shapes.
- **Visual Motif:** Subtle use of circular "burst" patterns or rounded decorative elements can be used in the background of hero sections to reinforce the community-centric brand.

## Components

### Buttons
- **Primary:** Solid Primary Blue with White text. Bold weight.
- **Secondary/High-Action:** Solid Vibrant Red with White text. Used for "Join" or "Register."
- **Ghost:** Primary Blue border and text with a transparent background.

### Cards
- **Program/Course Cards:** White background, 1rem corner radius, subtle ambient shadow. Features a top image, a category label (Amber Gold), a Montserrat title, and a brief description in Lexend.
- **Statistic Cards:** High-contrast Blue background with White typography for large numbers and Amber Gold for descriptive labels.

### Input Fields
- White background with a 1px soft border in Deep Navy (at 20% opacity). 8px corner radius. Focused state uses a 2px Primary Blue border.

### Chips & Badges
- Used for book categories or event types. Small, rounded-pill shapes with light blue backgrounds and Primary Blue text.

### Highlights
- **Service Banners:** Full-width sections with Primary Blue backgrounds, featuring white text and centered Montserrat headlines. These are used to display library impact statistics (e.g., "500,000 Books Loaned").