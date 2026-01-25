# Story Arcade

## Overview
Story Arcade is a community mythology engine that transforms personal stories into cinematic narratives. It offers a gamified, retro arcade experience where users select themed "tracks," answer guided questions, and receive generated story cards. The project aims to foster creativity and community through shared storytelling, featuring elements like CRT effects, confetti, and story streaks. Its vision includes potential B2B2C applications for museums, events, and education, with features like "Gallery Mode" and "Kiosk Mode" to showcase stories and facilitate high-throughput story creation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state management. Styling utilizes Tailwind CSS, custom arcade-themed design tokens, and shadcn/ui components, featuring a dark-first design with neon accents and CRT scanline effects. It prioritizes a mobile-first, responsive design with touch optimization and accessibility (WCAG 2.1 AA Compliance). Core features include an animated logo stinger on first visit, visual hover effects, and an immersive arcade cabinet aesthetic with decorative components like `ArcadeCabinet`, `CosmicMarquee`, `OrbitalRings`, and `HUDOverlay`.

### Backend
The backend uses Express 5 on Node.js with TypeScript, providing RESTful API endpoints for JSON responses. Storage is abstracted via an `IStorage` interface, implemented with a PostgreSQL-backed `DatabaseStorage` class.

### Authentication
Authentication is managed using Replit Auth (OIDC) via Passport.js, with session storage in PostgreSQL, supporting providers like Google and GitHub for secure user login and session management.

### Data Layer
Drizzle ORM with a PostgreSQL dialect defines the schema for `users`, `sessions`, and `stories` entities. Zod schemas provide runtime validation.

### Key Features
- **Story Management:** Cross-device story persistence, draft auto-save to `localStorage`, shareable links with unique IDs, and a social sharing system with Open Graph meta tags. Authenticated users can manage their stories on a dedicated "My Stories" page.
- **Interactive Story Creation:** A Typeform-style question flow with full-screen layout, Framer Motion transitions, keyboard navigation, progress indicators, "Scene Examples," "Character Progress," and AI-powered "Inspire Me" suggestions.
- **Gamification:** XP & Level Progression (20 levels), 17 unlockable Achievement Badges across 4 categories and 5 rarity tiers, with celebratory popups for level-ups and achievements.
- **Cinematic Experience:** AI-generated movie poster-style images for each story using Gemini 2.5-flash-image model, a retro arcade sound system using Web Audio API for 8-bit sound effects, and a visual story gallery with a `StarfieldBackground` and `FeaturedStorySpotlight` carousel.
- **B2B2C Features:**
    - **Explore Page:** A public gallery with a featured story carousel, animated starfield, track-based filtering, and search functionality.
    - **Premium Story Cards:** Enhanced cinematic movie poster aesthetics with film frame design, grain overlay, and track-based gradient borders.
    - **Gallery Mode (`/gallery-mode`):** A fullscreen, auto-cycling story showcase for museums and events with cinematic transitions and CRT scanline overlays.
    - **Kiosk Mode (`/kiosk`):** An event-ready, full-screen immersive interface optimized for high-throughput story creation with URL parameter branding customization and idle detection.
- **Micro-Games System:** Canvas-based `GameEngine` with track-specific mini-games (`OriginGame`, `FutureCityGame`, `LegendGame`) integrated into the question flow on larger screens. Additionally, a `PersonalizedGame` is generated from story content, seeded by title, paragraphs, and neighborhood, offering a full playable platformer experience on the story reveal view.

## External Dependencies

- **Database:** PostgreSQL (via Drizzle ORM)
- **UI Libraries:** Radix UI, Embla Carousel, Recharts, Vaul, cmdk
- **Replit-Specific:** `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/dev-banner`
- **Session Management:** `connect-pg-simple`, `express-session`
- **AI Integration:** A multi-provider abstraction layer with automatic fallback:
    - **Anthropic** (via Replit integration) - Claude models for story generation.
    - **Gemini** (via Replit integration) - Gemini models for story and poster generation.
    - **Perplexity** (via user API key) - Perplexity models for story generation.
    - **Fallback** - Template-based generation when other AI providers fail.
    The system uses a circuit breaker pattern and configurable fallback order via `AI_PROVIDER_FALLBACK_ORDER` environment variable.