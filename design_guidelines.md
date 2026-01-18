# Story Arcade - Design Guidelines

## Design Approach
**Reference-Based:** Inspired by retro arcade gaming aesthetics combined with modern web app patterns. Think: Tron meets Replit, with brutalist typography and cyberpunk accents.

## Core Design Principles
1. **Arcade Nostalgia**: CRT scanline effects, bold geometric shapes, neon accents
2. **High Contrast**: Dark backgrounds (#0F0F13) with vibrant accent colors
3. **Kinetic Energy**: Micro-interactions, confetti celebrations, ripple effects on interactions
4. **Information Density**: Compact layouts with clear hierarchy, minimal white space waste

---

## Typography System

**Font Families:**
- Primary Display: Use a bold, geometric sans-serif with wide tracking (e.g., "Space Grotesk" or "Rajdhani Bold")
- Secondary Mono: Monospace font for metadata, labels, timestamps (e.g., "JetBrains Mono" or "IBM Plex Mono")

**Hierarchy:**
- Hero Headlines: text-4xl to text-6xl, font-display, tracking-[0.15em], uppercase
- Section Titles: text-2xl to text-3xl, font-display, tracking-widest
- Body Text: text-sm to text-base, font-sans, leading-relaxed
- Metadata/Labels: text-xs, font-mono, uppercase, tracking-widest
- Micro-copy: text-[10px] to text-xs, font-mono

---

## Layout & Spacing System

**Tailwind Units:** Consistently use 2, 4, 6, 8, 10, 12, 16, 20, 24 for spacing
- Component padding: p-4 (mobile), p-6 to p-8 (desktop)
- Section gaps: gap-6 to gap-10
- Container margins: px-4 (mobile), px-8 to px-12 (desktop)
- Vertical rhythm: py-12 to py-20 for major sections

**Grid Patterns:**
- Track selection cards: 1-column mobile, 3-column desktop (grid-cols-1 lg:grid-cols-3)
- Gallery grid: 1-column mobile, 2-column tablet, 3-column desktop
- Max-width containers: max-w-7xl for full sections, max-w-4xl for focused content

---

## Component Library

### Navigation
- Fixed top navbar with backdrop blur (backdrop-blur-xl)
- Logo + brand on left, nav links center/right, streak counter badge on far right
- Mobile: Hamburger menu with full-screen slide-down panel
- Border: Single pixel bottom border (border-b border-gray-800)

### Buttons
**Primary (CTA):**
- Background: Vibrant accent color (cyan-400, fuchsia-500, amber-400)
- Text: Black, bold, uppercase, tracking-widest
- Shadow: Glowing box-shadow matching accent color
- Padding: px-6 py-4
- Hover: Shift to white background with intensified glow
- Active: scale-[0.98] with ripple effect emanating from click point

**Secondary (Ghost):**
- Transparent background with thin border (border-gray-700)
- Text: gray-300, uppercase, tracking-widest
- Hover: border-gray-400, bg-gray-900

### Cards (Track Selection)
- Gradient backgrounds matching track theme (from-cyan-400 to-blue-900)
- Rounded corners: rounded-lg
- Padding: p-6 to p-8
- Border accent on hover: Matching theme color, glow effect
- Badge overlay: Absolute positioned top-right, uppercase, small font
- Content structure: Icon → Title → Subtitle → Description → CTA button
- Hover state: Lift effect (transform scale-105) with enhanced shadow

### Story Cards (Gallery)
- Dark card background: bg-gray-900/80
- Border: border-gray-800
- Padding: p-6
- Structure: Author/location header → Title → Logline → Theme tags → Interaction buttons (share, bookmark)
- Theme tags: Inline pill badges with accent borders, rounded-full, text-xs

### Modals/Overlays
- Full-screen dark backdrop: bg-black/90 with backdrop-blur-md
- Modal container: max-w-4xl, centered, bg-[#0F0F13], border-cyan-500
- Close button: Absolute top-right, X icon with hover:text-cyan-400
- Content padding: p-8 to p-12

### Input Fields (Story Creation)
- Large textarea: min-h-[120px], bg-gray-900/50, border-gray-700
- Focus state: border-cyan-400 with subtle glow
- Placeholder text: text-gray-500, italic
- Character counter: Absolute bottom-right inside field, text-xs, gray-500
- Helper text: Below field, text-xs, text-gray-400 or text-cyan-400 for guidance

### Progress Indicators
- Question counter: "Q1/5" format, fixed position, font-mono, text-sm
- Loading states: Multi-step text updates ("ANALYZING STORY...", "WEAVING NARRATIVE...") with animated ellipsis
- Progress bars: Thin horizontal bars with gradient fill matching track theme

---

## Visual Effects

### CRT Overlay (Always Active)
- Fixed full-screen overlay, pointer-events-none, z-50
- Scanline pattern: 2px horizontal lines at 50% opacity
- Chromatic aberration: Subtle RGB shift effect
- Vignette: Radial gradient darkening edges

### Micro-Interactions
- Confetti burst: Trigger on story completion, 100 particles from center, gravity physics
- Ripple effect: Emanate from button click point, white/30 opacity, ping animation
- Shake animation: On input error, keyframes shake left-right
- Toast notifications: Slide-in from top-right, auto-dismiss after 3s, bg-cyan-900 with border-cyan-400

### Hover States
- Navigation links: text-cyan-400 color shift
- Cards: scale-105 transform with enhanced shadow
- Icons: rotate-12 on logo hover

---

## Images

**Hero Section (Attract View):**
- Full-width abstract/geometric background image suggesting futuristic cityscape or arcade cabinet aesthetic
- Overlay: Dark gradient (from-transparent to-black) for text readability
- Buttons over image: Blurred background (backdrop-blur-md), semi-transparent bg-black/40

**Track Cards:**
- Optional: Small iconic images representing each track theme (retro gaming iconography, futuristic city, mythical elements)
- Placement: Background image with gradient overlay, or icon/illustration accent in corner

**Gallery Stories:**
- No images in individual story cards (text-focused)
- Avatars: Not required for this aesthetic

**Loading/Generation View:**
- Animated SVG or Lottie animation showing "story being generated" - arcade-style pixel art or geometric patterns

---

## Accessibility Notes
- Maintain WCAG AA contrast ratios despite dark theme (white/cyan-400 on dark backgrounds)
- Focus states: Visible ring-2 ring-cyan-400 on all interactive elements
- Keyboard navigation: Full support with visible focus indicators
- Screen reader labels: Aria-labels on icon-only buttons
- Reduced motion: Disable confetti/animations when prefers-reduced-motion is active