/**
 * Centralized configuration module.
 * Validates required environment variables at startup and exports typed config.
 *
 * This module is imported early in the application lifecycle, causing
 * the app to fail fast with clear error messages if required config is missing.
 */

interface RequiredEnvVar {
  name: string;
  description: string;
  value: string | undefined;
}

interface OptionalEnvVar {
  name: string;
  description: string;
  value: string | undefined;
  defaultValue: string;
}

// Define required environment variables
const requiredVars: RequiredEnvVar[] = [
  {
    name: 'DATABASE_URL',
    description: 'PostgreSQL connection string for the database',
    value: process.env.DATABASE_URL,
  },
  {
    name: 'SESSION_SECRET',
    description: 'Secret key for signing session cookies (should be a long random string)',
    value: process.env.SESSION_SECRET,
  },
  {
    name: 'REPL_ID',
    description: 'Replit project ID used as OAuth client ID for authentication',
    value: process.env.REPL_ID,
  },
];

// Define optional environment variables with defaults
const optionalVars: OptionalEnvVar[] = [
  {
    name: 'PORT',
    description: 'HTTP server port',
    value: process.env.PORT,
    defaultValue: '5000',
  },
  {
    name: 'ISSUER_URL',
    description: 'OpenID Connect issuer URL',
    value: process.env.ISSUER_URL,
    defaultValue: 'https://replit.com/oidc',
  },
  {
    name: 'NODE_ENV',
    description: 'Node environment (development/production)',
    value: process.env.NODE_ENV,
    defaultValue: 'development',
  },
  {
    name: 'AI_PROVIDER_FALLBACK_ORDER',
    description: 'Comma-separated list of AI providers in fallback order',
    value: process.env.AI_PROVIDER_FALLBACK_ORDER,
    defaultValue: 'anthropic,gemini,fallback',
  },
  {
    name: 'AI_HEALTH_CHECK_INTERVAL',
    description: 'Interval in ms for checking AI provider health',
    value: process.env.AI_HEALTH_CHECK_INTERVAL,
    defaultValue: '30000',
  },
  {
    name: 'REDIS_URL',
    description: 'Redis connection URL for caching',
    value: process.env.REDIS_URL,
    defaultValue: 'redis://localhost:6379',
  },
];

// Validate required variables
const missingVars = requiredVars.filter(v => !v.value);

if (missingVars.length > 0) {
  const errorLines = [
    '',
    '╔══════════════════════════════════════════════════════════════════╗',
    '║                 MISSING REQUIRED CONFIGURATION                   ║',
    '╠══════════════════════════════════════════════════════════════════╣',
    '║ The following required environment variables are not set:        ║',
    '╠══════════════════════════════════════════════════════════════════╣',
  ];

  for (const v of missingVars) {
    errorLines.push(`║  • ${v.name}`);
    errorLines.push(`║    └─ ${v.description}`);
  }

  errorLines.push('╠══════════════════════════════════════════════════════════════════╣');
  errorLines.push('║ In Replit: Go to "Secrets" tab and add these environment vars.  ║');
  errorLines.push('║ Locally: Create a .env file or export them in your shell.       ║');
  errorLines.push('╚══════════════════════════════════════════════════════════════════╝');
  errorLines.push('');

  console.error(errorLines.join('\n'));
  process.exit(1);
}

// Export validated configuration
export const config = {
  // Required (guaranteed to be defined after validation)
  databaseUrl: process.env.DATABASE_URL!,
  sessionSecret: process.env.SESSION_SECRET!,
  replId: process.env.REPL_ID!,

  // Optional with defaults
  port: parseInt(process.env.PORT || '5000', 10),
  issuerUrl: process.env.ISSUER_URL || 'https://replit.com/oidc',
  nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // AI integrations (optional - features degrade gracefully if missing)
  ai: {
    anthropic: {
      apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
      baseUrl: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    },
    gemini: {
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
      baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
    },
  },
} as const;

// Log configuration status on startup (without sensitive values)
// Note: Using configLogger imported after config is defined to avoid circular dependency
import { configLogger } from './logger';

configLogger.info('Configuration validated successfully');
configLogger.info({ env: config.nodeEnv, port: config.port }, 'Server configuration');
configLogger.info({
  database: config.databaseUrl ? 'configured' : 'missing',
  sessionSecret: config.sessionSecret ? 'configured' : 'missing',
  replId: config.replId ? 'configured' : 'missing',
  anthropicAi: config.ai.anthropic.apiKey ? 'configured' : 'not configured (fallback)',
  geminiAi: config.ai.gemini.apiKey ? 'configured' : 'not configured (fallback)',
}, 'Service status');
