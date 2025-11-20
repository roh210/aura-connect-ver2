/**
 * Configuration Barrel Export
 * 
 * Centralizes config imports for cleaner code
 * 
 * Instead of:
 * import { db } from './config/firebase';
 * import { logger } from './config/logger';
 * import { env } from './config/env';
 * 
 * Use:
 * import { db, logger, env } from './config';
 */

export { db } from './firebase';
export { logger } from './logger';
export { env } from './env';
