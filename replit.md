# Story Arcade

## Overview

Story Arcade is a community mythology engine designed to transform personal stories into cinematic narratives. Users engage by selecting themed "tracks," answering guided questions, and receiving generated story cards. The project aims to provide a gamified, retro arcade experience with features like CRT effects, celebratory confetti, and story streaks, fostering creativity and community through shared storytelling.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is built with React 18, TypeScript, and Vite, utilizing Wouter for client-side routing and TanStack Query for server state management. Styling is handled with Tailwind CSS, custom arcade-themed design tokens, and shadcn/ui components, featuring a dark-first design with neon accents and CRT scanline effects. Key design decisions include a component-based architecture separating arcade-specific elements from base UI, and extensive use of custom fonts. The application is mobile-first, with responsive design elements, touch optimization, and particle effects adjusted for mobile devices. Accessibility (WCAG 2.1 AA Compliance) is a core consideration, with semantic HTML, keyboard navigation, screen reader support, and accessible modal/form patterns implemented throughout.

### Backend

The backend uses Express 5 on Node.js with TypeScript, providing RESTful API endpoints under the `/api/` prefix that return JSON responses. Storage is abstracted via an `IStorage` interface, implemented with a PostgreSQL-backed `DatabaseStorage` class.

### Authentication

Authentication is managed using Replit Auth (OIDC) via Passport.js, with session storage in PostgreSQL. This system supports various providers like Google and GitHub, securely handling user login, session management, and protecting specific routes.

### Data Layer

Drizzle ORM with a PostgreSQL dialect defines the schema for `users`, `sessions`, and `stories` entities. Zod schemas generated from Drizzle provide runtime validation.

**Entities:**
- `users` - User profiles from Replit Auth (id, email, firstName, lastName, profileImageUrl, timestamps)
- `sessions` - PostgreSQL session storage for authentication (sid, sess, expire)
- `stories` - User-generated stories with optional userId for ownership, track reference, content paragraphs, themes, and metadata

### Features

- **Cross-Device Story Persistence:** Stories are saved to PostgreSQL and associated with authenticated users via userId, enabling access from any device after login.
- **Draft Auto-Save System:** Stories are automatically saved to `localStorage` every 10 seconds during creation, with a maximum of 5 drafts, auto-cleanup of older drafts, and UI components for recovery and navigation protection.
- **Shareable Story Links:** Each story receives a unique 8-character base64url shareable ID, enabling public sharing via dedicated `/story/:shareableId` URLs.
- **Social Sharing System:** Comprehensive sharing across the app with Twitter, Facebook, WhatsApp share buttons and copy link functionality. Features include Open Graph meta tags for rich social previews, share buttons on story reveal page, public story page, StoryCard, and StoryModal components. Native Web Share API with fallback to clipboard copy.
- **Typeform-Style Question Flow:** Immersive single-question-at-a-time story creation experience with full-screen centered layout, large typography, smooth Framer Motion slide transitions, keyboard navigation (Enter to advance, Cmd+Up/Escape to go back), progress bar with glow effects, dot indicators for question navigation, and floating navigation buttons.
- **Interactive Guidance System:** Includes "Scene Examples" for pre-written prompts, a "Character Progress" indicator with visual feedback, and "AI-Powered Inspire Me" suggestions generated via the Gemini API.
- **Forge Progress System:** Provides real-time feedback during story generation with progress bars, stage messages, and options for retrying or saving drafts in case of errors.
- **My Stories Management:** Authenticated users can view, search, filter, sort, and manage their completed stories from the "My Stories" page, with options for export and deletion.
- **XP & Level Progression System:** Authenticated users earn XP for creating stories, with a 20-level progression system. XP thresholds increase progressively (100, 200, 350... up to 10,000 XP). The XP progress bar appears in the navbar showing current level and progress to next level.
- **Achievement Badges:** 17 unlockable badges across 4 categories (milestone, streak, track, level) with 5 rarity tiers (common, uncommon, rare, epic, legendary). Badges are awarded automatically when conditions are met (e.g., "First Story" for creating first story, "Week Warrior" for 7-day streak). Each badge awards bonus XP.
- **Level-Up & Achievement Popups:** Celebratory notifications with retro arcade styling appear after earning XP, unlocking badges, or leveling up. Multiple badges queue and display sequentially.
- **Badges Collection Page:** Dedicated page showing all badges organized by category, with locked/unlocked states, rarity styling, and earned dates for collected badges.
- **Cinematic Poster Generation:** AI-generated movie poster-style images for each story, auto-generated when viewing the story reveal. Posters are created using Gemini 2.5-flash-image model with track-specific visual styles. Features include download functionality, regeneration option, and rate-limited async generation. Posters are stored as base64 data URLs in the `posterUrl` field with status tracking (`pending`, `generating`, `ready`, `failed`).
- **Retro Arcade Sound System:** Web Audio API-based synthesized 8-bit sound effects that play on interactive element hover/click. Features include global event delegation via ArcadeSoundProvider, SoundToggle component in Navbar with localStorage persistence for user preference, throttled hover sounds (80-100ms) to prevent audio spam, and dedicated sounds for achievements, level-ups, and story completion. Sound types: hover (short blip), click (percussive), achievement (ascending arpeggio), levelUp (fanfare), storyComplete (triumphant chord sequence).
- **Visual Hover Effects:** CSS-based arcade-styled hover animations including neon glow effects, scanline shimmer, CRT distortion, and pixel animations. Effects respect `prefers-reduced-motion` media query for accessibility.
- **Arcade Cabinet Aesthetics:** Immersive arcade cabinet experience with decorative components:
  - `ArcadeCabinet`: Bezel frame wrapper with side panels, stripe patterns, and control panel decorations
  - `CosmicMarquee`: Animated header with stars, planets, and shooting star effects
  - `OrbitalRings`: Targeting circle animations with coordinate displays for the forging experience
  - `HUDOverlay`: Corner brackets and tech readouts for sci-fi HUD aesthetic
  - `TVWallGallery`: Multi-screen TV wall effect with geometric stripe patterns and rotating CRT glow colors (cyan, pink, fuchsia, teal, amber, violet)
- **Visual Story Gallery:** Immersive poster-focused gallery showcasing community stories:
  - `StarfieldBackground`: Animated canvas-based starfield with twinkling stars, falling animation, and radial glow effects
  - `StaticStarfield`: CSS-based decorative stars with pulse animations and nebula-like gradient effects
  - `FeaturedStorySpotlight`: Auto-cycling carousel (6s intervals) showcasing stories with completed posters, navigation controls, and progress dots
  - `StoryGalleryCard`: Poster-focused cards with hover effects revealing title, logline, author, and neighborhood; CRT scanline overlays; track-based gradient placeholders for pending posters
  - `StoryGallery`: Responsive grid layout with search functionality (searches title, logline, author, track, neighborhood), track filtering (Origin/Legend/Future/All), grid/masonry layout toggle, and staggered entrance animations

**Progression Database Entities:**
- `badges` - Badge definitions (id, name, description, icon, category, requirement, xpReward, rarity)
- `user_badges` - Junction table tracking earned badges per user (userId, badgeId, earnedAt)
- `users` - Extended with xp, level, currentStreak, longestStreak, lastStoryDate fields

## External Dependencies

- **Database:** PostgreSQL (via Drizzle ORM)
- **UI Libraries:** Radix UI, Embla Carousel, Recharts, Vaul, cmdk
- **Replit-Specific:** `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/dev-banner`
- **Session Management:** `connect-pg-simple`, `express-session`
- **AI Integration:** Google Gemini API (gemini-2.5-flash) for AI suggestions