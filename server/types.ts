/**
 * Shared TypeScript types for Express route handlers.
 * Provides type-safe access to authenticated users, params, and request bodies.
 */

import type { Request } from "express";

/**
 * OpenID Connect claims from Replit Auth.
 * These are the standard OIDC claims plus Replit-specific fields.
 */
export interface AuthClaims {
  sub: string;           // User ID (subject)
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  exp?: number;          // Token expiration timestamp
  [key: string]: unknown; // Allow other OIDC claims
}

/**
 * Authenticated user object stored in the session.
 * Populated by updateUserSession() in replitAuth.ts.
 */
export interface AuthenticatedUser {
  claims: AuthClaims;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

/**
 * Express Request extended with optional authenticated user.
 * Use this for routes where authentication is optional (user may or may not be logged in).
 */
export interface OptionalAuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Express Request with guaranteed authenticated user.
 * Use this for routes protected by requireAuth middleware.
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// ============ Common Parameter Types ============

/** Route params for endpoints with :id */
export interface IdParams {
  id: string;
}

/** Route params for endpoints with :shareableId */
export interface ShareableIdParams {
  shareableId: string;
}

/** Query params for endpoints requiring sessionId */
export interface SessionIdQuery {
  sessionId?: string;
}

// ============ Request Body Types ============
// These are inferred from Zod schemas in shared/schema.ts
// Import and use z.infer<typeof schema> for body types

// ============ Response Types ============

/** Standard error response */
export interface ErrorResponse {
  error: string;
  details?: unknown;
}

/** Poster generation response */
export interface PosterResponse {
  posterUrl?: string | null;
  status: string;
  message?: string;
}
