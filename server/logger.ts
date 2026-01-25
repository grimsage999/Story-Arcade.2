/**
 * Centralized logging module using pino.
 *
 * - Development: Pretty-printed, colorized output for Replit console
 * - Production: JSON format for log aggregation and analysis
 *
 * Usage:
 *   import { logger } from './logger';
 *   logger.info('Server started');
 *   logger.error({ err, storyId }, 'Failed to generate poster');
 *   logger.debug({ prompt }, 'Calling AI API');
 */

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

// Configure transport based on environment
const transport = isProduction
  ? undefined // JSON output in production
  : pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    });

// Create the logger instance
export const logger = pino(
  {
    level: isProduction ? 'info' : 'debug',
    // Base context added to all logs
    base: {
      env: process.env.NODE_ENV || 'development',
    },
    // Custom serializers for common objects
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
  },
  transport
);

// Create child loggers for specific subsystems
export const configLogger = logger.child({ module: 'config' });
export const routesLogger = logger.child({ module: 'routes' });
export const posterLogger = logger.child({ module: 'poster' });
export const storyLogger = logger.child({ module: 'story' });
export const authLogger = logger.child({ module: 'auth' });
export const rateLimitLogger = logger.child({ module: 'rate-limit' });

// Export types for TypeScript
export type Logger = typeof logger;
