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