/**
 * Logging Configuration (Winston)
 * 
 * SYSTEM DESIGN CONCEPT: Observability
 * 
 * Why structured logging matters:
 * - Production debugging: "Show all errors for user123 in last hour"
 * - Performance monitoring: "Which AI calls are slowest?"
 * - Security auditing: "Who accessed sensitive data?"
 * - Business metrics: "How many sessions created today?"
 * 
 * Why console.log isn't enough:
 * ❌ Can't search logs later
 * ❌ Can't filter by severity (error vs info)
 * ❌ Disappears when server restarts
 * ❌ No timestamps or context
 * ❌ Can't send to external systems (CloudWatch, Datadog)
 * 
 * Real-world companies using Winston:
 * - Netflix: Logs to Elasticsearch
 * - Uber: Logs to Kafka
 * - Airbnb: Logs to Splunk
 * - Your app: Logs to files (can add CloudWatch later)
 */

import winston from 'winston';
import { env } from './env';

/**
 * Log Levels (RFC 5424 Standard)
 * 
 * error:  0 - Something broke, needs immediate attention
 * warn:   1 - Potential issue, might cause problems
 * info:   2 - Important events (session started, user logged in)
 * http:   3 - HTTP requests (can add later)
 * debug:  4 - Detailed diagnostic info
 * 
 * In production: Only log 'info' and above (hide debug noise)
 * In development: Log everything including 'debug'
 */

/**
 * Custom Log Format
 * 
 * ARCHITECTURE DECISION: JSON in production, pretty in development
 * 
 * Why JSON for production:
 * - Parseable by log aggregators (CloudWatch, Datadog, Elasticsearch)
 * - Queryable (SELECT * FROM logs WHERE userId = '123')
 * - Consistent structure
 * 
 * Why pretty for development:
 * - Easy to read in terminal
 * - Colors help identify errors quickly
 * - Shows nested objects nicely
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }), // Include stack traces for errors
  winston.format.splat(), // String interpolation support
  env.NODE_ENV === 'production'
    ? winston.format.json() // Production: JSON format
    : winston.format.combine(
        // Development: Pretty colored format
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaString =
            Object.keys(meta).length > 0
              ? `\n${JSON.stringify(meta, null, 2)}`
              : '';
          return `${timestamp} [${level}]: ${message}${metaString}`;
        })
      )
);

/**
 * Transport Configuration
 * 
 * ALGORITHM: Where to send logs based on environment
 * 
 * Development:
 * - Console only (see logs immediately in terminal)
 * - Level: debug (see everything)
 * 
 * Production:
 * - Console + Files (persistent storage)
 * - error.log: Only errors (easy to find problems)
 * - combined.log: Everything (full audit trail)
 * - Level: info (hide debug noise)
 * 
 * Why separate error.log:
 * - Errors are critical, need separate file
 * - Can set up alerts: "If error.log gets new entry, send Slack message"
 * - Easy to scan for problems
 */
const transports: winston.transport[] = [
  // Always log to console
  new winston.transports.Console(),
];

// In production, also log to files
if (env.NODE_ENV === 'production') {
  transports.push(
    // All logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5, // Keep 5 old files (rotate)
    }),
    // Only errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

/**
 * Create Logger Instance
 * 
 * SINGLETON PATTERN: One logger for entire app
 * 
 * Why singleton:
 * - Consistent configuration everywhere
 * - No duplicate file handles
 * - Single place to change log settings
 * 
 * Export and use:
 * import { logger } from '@/config/logger';
 * logger.info('Session started', { sessionId, userId });
 */
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports,
  // Don't exit on handled exceptions (keep server running)
  exitOnError: false,
});

/**
 * Usage Examples Throughout App:
 * 
 * 1. Info (important events):
 * logger.info('User logged in', { userId: 'user123', ip: req.ip });
 * 
 * 2. Error (something broke):
 * logger.error('OpenAI API failed', { 
 *   error: error.message, 
 *   stack: error.stack,
 *   userId 
 * });
 * 
 * 3. Warn (potential issue):
 * logger.warn('Rate limit approaching', { 
 *   current: 95, 
 *   limit: 100 
 * });
 * 
 * 4. Debug (diagnostic info):
 * logger.debug('Cache hit', { key: 'session:123', ttl: 300 });
 * 
 * Searching logs later:
 * grep "user123" logs/combined.log
 * grep "error" logs/combined.log
 * grep "OpenAI" logs/combined.log | grep "failed"
 */

/**
 * Performance Impact:
 * 
 * File writes are async (non-blocking):
 * - logger.info() returns immediately
 * - Actual write happens in background
 * - Zero performance penalty
 * 
 * Memory usage:
 * - ~10 MB for logger instance
 * - Log files rotate automatically (max 5 files × 5 MB = 25 MB)
 */

// Log successful initialization
logger.info('✅ Logger initialized', {
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: transports.map((t) => t.constructor.name),
});
