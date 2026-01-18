# Story Arcade

## Overview

Story Arcade is a community mythology engine that transforms personal stories into cinematic narratives. Users select from themed "tracks" (Origin Story, Future NYC, Neighborhood Legend), answer guided questions, and receive generated story cards. The application features a retro arcade aesthetic with CRT effects, confetti celebrations, and gamification elements like story streaks.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Stack:** React 18 with TypeScript, Vite bundler, TanStack Query for server state

**Routing:** Wouter (lightweight client-side router) with single-page application structure

**Styling:** 
- Tailwind CSS with custom arcade-themed design tokens
- shadcn/ui component library (New York style variant)
- Custom CSS variables for dark theme with neon accents
- Custom fonts: Space Grotesk (display), JetBrains Mono (monospace), Inter (body)

**Key Design Decisions:**
- Dark-first design with high contrast colors and CRT scanline overlay effects
- Component-based architecture with arcade-specific components separated from base UI
- Path aliases configured: `@/` for client/src, `@shared/` for shared types

### Backend Architecture

**Stack:** Express 5 on Node.js with TypeScript

**API Design:** RESTful endpoints under `/api/` prefix with JSON responses

**Current Endpoints:**
- `GET /api/stories` - Fetch all stories
- `GET /api/stories/:id` - Fetch single story
- `POST /api/stories` - Create new story
- `DELETE /api/stories/:id` - Delete story

**Storage Pattern:** Interface-based storage abstraction (`IStorage`) currently implemented with in-memory storage (`MemStorage`). This allows easy swap to database-backed storage without changing route handlers.

### Data Layer

**Schema Definition:** Drizzle ORM with PostgreSQL dialect configured (requires DATABASE_URL environment variable)

**Core Entities:**
- `users` - Basic auth with username/password
- `stories` - User-generated stories with track reference, content paragraphs, themes, and metadata

**Validation:** Zod schemas generated from Drizzle schemas using drizzle-zod for runtime validation

### Build System

**Development:** tsx for TypeScript execution, Vite dev server with HMR
**Production:** Custom build script using esbuild for server bundling, Vite for client

## External Dependencies

**Database:** PostgreSQL (configured via Drizzle, requires DATABASE_URL)

**UI Libraries:**
- Radix UI primitives for accessible components
- Embla Carousel for carousels
- Recharts for charts
- Vaul for drawer components
- cmdk for command palette

**Replit-Specific:**
- @replit/vite-plugin-runtime-error-modal for error display
- @replit/vite-plugin-cartographer and dev-banner for development features

**Session Management:** connect-pg-simple and express-session configured for PostgreSQL session storage

### Draft Auto-Save System

**Storage:** localStorage with key pattern `storyArcade_draft_[timestamp]`

**Features:**
- Auto-save every 10 seconds during story creation
- Uses ref-based ID tracking (currentDraftIdRef) for synchronous access
- Draft includes: trackId, trackTitle, sceneNumber, userInputs, createdAt, lastSavedAt
- Maximum 5 drafts with auto-cleanup of oldest

**UI Components:**
- `client/src/lib/draftStorage.ts` - Storage utilities
- `client/src/components/arcade/AutoSaveIndicator.tsx` - Shows "Auto-saved Xm ago"
- `client/src/components/arcade/DraftsList.tsx` - Drafts section with CONTINUE/DELETE
- `client/src/components/arcade/DraftRecoveryBanner.tsx` - Recovery prompt on startup
- `client/src/components/arcade/UnsavedStoryModal.tsx` - Modal on navigation during creation

**Navigation Protection:**
- HOME/EXPLORE links disabled during story creation (scenes 1-5)
- Tooltips show "Finish your story first! (Scene X/5)"
- Logo click shows unsaved modal with SAVE DRAFT/DISCARD/CONTINUE options
- Scene progress indicator in navbar during creation

**Draft Cleanup:**
- Draft automatically deleted when story successfully forged
- Auto-save interval cleared when entering forging state

### Interactive Guidance System

**Scene Examples** (`client/src/components/arcade/SceneExamples.tsx`):
- Expandable panel with 3 pre-written examples per scene (scenes 1-5)
- Clicking an example auto-fills the textarea with that text
- Uses Collapsible component with lightbulb icon

**Character Progress** (`client/src/components/arcade/CharacterProgress.tsx`):
- Visual progress bar showing character count vs 150 suggested
- Color-coded feedback: zinc-500 (0-50), cyan-400 (50-150), yellow-500 (150+)
- Replaces simple character counter

**AI-Powered Inspire Me** (`client/src/components/arcade/InspireMe.tsx`):
- Generates 3 AI suggestions based on scene context via Gemini API
- Limited to 3 uses per scene (tracks usage per scene number)
- Usage resets when starting a new track
- Shows loading state during generation

**Textarea Focus Tooltip** (`client/src/components/arcade/TextareaTooltip.tsx`):
- Shows helpful tip when textarea is focused
- Auto-dismisses after 5 seconds or on first keystroke
- hasTyped state resets per scene for fresh guidance

**API Endpoint:**
- `POST /api/inspire` - Generates AI suggestions using Gemini (gemini-2.5-flash)
- Body: `{ sceneNumber, trackTitle, prompt, currentInput }`
- Response: `{ suggestions: string[] }`

### Forge Progress System

**Component:** `client/src/components/arcade/ForgeProgress.tsx`

**Status States:**
- `running` - Shows progress bar, stage messages, estimated time
- `timeout` - 60 second timeout with RETRY/CANCEL buttons
- `error` - API failure with TRY AGAIN/SAVE DRAFT/VIEW ERROR DETAILS buttons
- `success` - Triggers confetti and transitions to REVEAL

**Stage Messages (every ~10s):**
1. Synthesizing themes... (Sparkles icon)
2. Crafting narrative... (BookOpen icon)
3. Enhancing story... (Wand2 icon)
4. Verifying legend... (CheckCircle icon)
5. Publishing... (PartyPopper icon)

**Implementation Details:**
- Minimum 8-second delay ensures forging UI is visible even for fast API responses
- Progress bar animates from 0% to 95% over 40 seconds, jumps to 100% on success
- 60-second timeout triggers warning state with retry option
- Error recovery preserves user inputs for retry or draft saving
- Uses lucide-react icons (no emojis per design guidelines)

### Mobile Responsive Design

**Breakpoint Strategy:** Mobile-first with md: (768px) for desktop overrides

**Navigation:**
- Mobile: Sheet-based drawer (left slide, 70vw max-w-[320px]) with hamburger menu
- Uses shadcn/ui Sheet component with Button components (variant="ghost") for nav items
- Desktop: Traditional horizontal nav with hover-elevate utility for interactions
- Scene progress indicator visible in both mobile and desktop during creation

**Touch Optimization:**
- Buttons use size="lg" for adequate touch targets
- Buttons stack vertically on mobile (flex-col md:flex-row) with full width (w-full md:w-auto)
- Textarea min-h-[120px] on mobile with 16px font size for zoom prevention

**Typography:**
- h1: text-[28px] md:text-7xl lg:text-8xl
- h2: text-3xl md:text-5xl
- Body: text-sm md:text-xl

**Particle Optimization (Confetti):**
- `client/src/hooks/use-mobile.tsx` - Mobile detection hook (< 768px)
- Mobile: Capped at 20 particles (vs 100 desktop), reduced velocity/size
- Respects prefers-reduced-motion with static Sparkles icon fallback

**Back to Top Button:**
- `client/src/components/arcade/BackToTop.tsx`
- Only renders on mobile when scrollY > 300px
- Fixed position bottom-right with smooth scroll behavior

**Gallery Layout:**
- grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for responsive card layout

### Drafts Management

**Pages:**
- `client/src/pages/drafts.tsx` - Dedicated DRAFTS page component
- `client/src/pages/my-stories.tsx` - Personal library component

**DRAFTS Page Features:**
- List view with sorting (recent/oldest/alphabetical)
- Pagination for large draft collections
- Inline renaming with editable title field
- Duplicate draft functionality
- Delete confirmation with warning
- Empty state with "CREATE YOUR FIRST STORY" CTA

**MY STORIES Page Features:**
- Search by title functionality
- Filter by theme tags
- Sorting (newest/oldest/alphabetical)
- Pagination with configurable page size
- Story viewing modal integration
- Export options: download as text, copy to clipboard, copy shareable link
- Empty state prompting story creation

**Storage Interface** (`client/src/lib/draftStorage.ts`):
```typescript
interface CompletedStory {
  id: string;              // Unique: story_[timestamp]_[random]
  title: string;
  trackId: string;
  trackTitle: string;
  content: string[];       // [p1, p2, p3]
  themes: string[];
  createdAt: string;
  userInputs: Record<string, string>;
  insight?: string;
  logline?: string;
  author?: string;
  neighborhood?: string;
}
```

**Storage Limits:**
- Maximum 10 drafts (oldest auto-deleted when limit reached)
- Maximum 100 completed stories
- 30-day draft expiry with auto-cleanup
- All data stored in localStorage

**Navigation:**
- View type: `'ATTRACT' | 'TRACK_SELECT' | 'QUESTIONS' | 'FORGING' | 'REVEAL' | 'GALLERY' | 'DRAFTS' | 'MY_STORIES'`
- Navigation items in both desktop navbar and mobile drawer
- Disabled during story creation (with tooltip explanation)

**Auto-Save on Completion:**
- Completed stories automatically saved to localStorage after successful forging
- Includes all story content, themes, user inputs, and metadata

### Accessibility (WCAG 2.1 AA Compliance)

**Landmark Structure:**
- All views implement `<main id="main-content" role="main">` landmark
- SkipLink component (`client/src/components/arcade/SkipLink.tsx`) provides "Skip to main content" link
- Semantic HTML structure with proper heading hierarchy

**Keyboard Navigation:**
- Tab navigation through all interactive elements
- Enter/Space activates buttons and cards
- ESC closes modals and returns focus to trigger element
- Focus trap implemented in all modal dialogs
- Custom focus ring: `focus:ring-cyan-400` for brand-consistent visibility

**Screen Reader Support:**
- All decorative icons marked with `aria-hidden="true"`
- Interactive elements have descriptive `aria-label` attributes
- Live regions (`aria-live="polite"`) for dynamic content updates
- `aria-busy` states for loading indicators
- `aria-describedby` for contextual help text

**Modal Accessibility:**
- `role="dialog"` and `aria-modal="true"` on all modals
- `aria-labelledby` references modal title
- `aria-describedby` references modal description
- Focus automatically moves to first focusable element on open
- Focus restored to trigger element on close (`previousFocusRef` pattern)

**Form Accessibility:**
- `<fieldset>` and `<legend>` wrap related form controls
- All inputs have associated `<label>` elements
- `aria-required="true"` on required fields
- `aria-invalid` reflects validation state
- `aria-describedby` links to error messages and help text
- Character count announced via `aria-live="polite"`

**Component Accessibility:**
- TrackCard: `role="button"`, keyboard activatable, `aria-pressed` state
- StoryCard: Semantic `<article>` element, descriptive `aria-label`
- Navigation: `role="navigation"` with `aria-label` descriptions
- Toast notifications: `aria-live="polite"` for announcements

**Key Components:**
- `client/src/components/arcade/SkipLink.tsx` - Skip navigation link
- `client/src/components/arcade/UnsavedStoryModal.tsx` - Focus trap and restoration
- `client/src/components/arcade/TrackCard.tsx` - Keyboard-accessible cards
- `client/src/components/arcade/StoryCard.tsx` - Semantic article cards