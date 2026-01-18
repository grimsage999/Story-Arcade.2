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
- **Interactive Guidance System:** Includes "Scene Examples" for pre-written prompts, a "Character Progress" indicator with visual feedback, and "AI-Powered Inspire Me" suggestions generated via the Gemini API.
- **Forge Progress System:** Provides real-time feedback during story generation with progress bars, stage messages, and options for retrying or saving drafts in case of errors.
- **My Stories Management:** Authenticated users can view, search, filter, sort, and manage their completed stories from the "My Stories" page, with options for export and deletion.

## External Dependencies

- **Database:** PostgreSQL (via Drizzle ORM)
- **UI Libraries:** Radix UI, Embla Carousel, Recharts, Vaul, cmdk
- **Replit-Specific:** `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/dev-banner`
- **Session Management:** `connect-pg-simple`, `express-session`
- **AI Integration:** Google Gemini API (gemini-2.5-flash) for AI suggestions