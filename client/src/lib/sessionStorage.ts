const SESSION_ID_KEY = 'storyArcade_sessionId';

/**
 * Get or create an anonymous session ID for draft ownership.
 * This is only used when the user is not authenticated.
 */
export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create headers for draft API requests.
 * For anonymous users, includes the X-Session-ID header.
 * For authenticated users, relies on session cookies (no extra header needed).
 */
export function getDraftHeaders(isAuthenticated: boolean): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Only include session ID header for anonymous users
  if (!isAuthenticated) {
    headers['X-Session-ID'] = getSessionId();
  }

  return headers;
}
