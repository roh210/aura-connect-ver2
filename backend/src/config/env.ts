/**
 * Environment Configuration & Validation
 *
 * SYSTEM DESIGN CONCEPT: Fail Fast Principle
 *
 * Why this file exists:
 * - Validates ALL environment variables at startup (not at runtime)
 * - Provides type-safe access to config throughout the app
 * - Initializes external SDKs (OpenAI) with validated credentials
 *
 * Real-world parallel:
 * - AWS SDK validates credentials before allowing API calls
 * - Stripe checks API keys are valid format at initialization
 * - Docker validates environment variables in healthchecks
 *
 * What happens if validation fails:
 * - App throws error immediately (won't start)
 * - Developer sees clear message: "Missing OPENROUTER_API_KEY"
 * - Prevents silent failures in production
 */

import dotenv from "dotenv";
import OpenAI from "openai";

// Load .env file into process.env
// This reads backend/.env and makes variables available
dotenv.config();

/**
 * Environment Interface
 *
 * Why TypeScript interface:
 * - IDE autocomplete (env.OPENROUTER_API_KEY)
 * - Type safety (env.PORT is always a number)
 * - Documentation (developers know what's available)
 */
interface Env {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  FRONTEND_URL: string;
  OPENROUTER_API_KEY: string;
  DAILY_API_KEY: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
}

/**
 * Validate Environment Variables
 *
 * ALGORITHM: Check all required variables exist, fail if missing
 *
 * Time Complexity: O(n) where n = number of required variables
 * Space Complexity: O(1) - just stores missing array
 *
 * Why this approach:
 * - Simple and explicit (easy to debug)
 * - Fails immediately at startup (fail fast)
 * - Clear error messages (tells you exactly what's missing)
 *
 * Alternative approaches we didn't use:
 * ❌ try/catch around each variable → verbose, error happens later
 * ❌ Schema validation libraries (Joi, Zod) → overkill for simple validation
 * ✅ Manual check → clear, fast, no dependencies
 */
function validateEnv(): Env {
  // List of required environment variables
  const required = ["OPENROUTER_API_KEY", "DAILY_API_KEY"];

  // Firebase env vars only required in development (production uses Secret File)
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    required.push(
      "FIREBASE_PROJECT_ID",
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_PRIVATE_KEY"
    );
  }

  // Find missing variables (filter returns array of missing keys)
  const missing = required.filter((key) => !process.env[key]);

  // If any missing, throw error with helpful message
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n` +
        `   ${missing.join("\n   ")}\n\n` +
        `💡 Check your backend/.env file and add these values.\n` +
        `📖 See API_KEYS_SETUP_GUIDE.md for instructions.`
    );
    // App stops here! Won't proceed until fixed.
  }

  // All variables exist, return typed object
  return {
    NODE_ENV: (process.env.NODE_ENV as Env["NODE_ENV"]) || "development",
    PORT: parseInt(process.env.PORT || "5000", 10),
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
    DAILY_API_KEY: process.env.DAILY_API_KEY!,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "",
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || "",
  };
}

/**
 * Validated Environment Configuration
 *
 * Export this and use throughout the app:
 * import { env } from '@/config/env';
 * console.log(env.PORT); // TypeScript knows it's a number!
 */
export const env = validateEnv();

/**
 * OpenAI SDK Initialization (configured for OpenRouter)
 *
 * ARCHITECTURE DECISION: Why initialize here instead of in service file?
 *
 * ✅ Pros of initializing in config:
 * - Single instance (Singleton pattern)
 * - Validates credentials at startup
 * - Consistent configuration across all services
 * - Easy to swap providers (change baseURL in one place)
 *
 * ❌ Cons of initializing in each service:
 * - Multiple instances (wasteful)
 * - Errors happen at first API call (fail slow)
 * - Inconsistent config if different services use different settings
 *
 * Real-world parallel:
 * - AWS SDK: Initialize once with credentials, import everywhere
 * - MongoDB: Create connection pool once, reuse across app
 * - Redis: Create client once, import in all services
 *
 * Why OpenRouter instead of OpenAI direct:
 * - 50% cheaper for GPT-3.5 Turbo
 * - Free $5-10 credits to start
 * - Access to multiple models (GPT-4, Claude, Gemini)
 * - Same API interface (drop-in replacement)
 */
export const openai = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  // OpenRouter supports same API as OpenAI
  // We just change the baseURL and it routes to their servers
});

/**
 * Usage Examples:
 *
 * In any file:
 * import { env, openai } from '@/config/env';
 *
 * // Use environment variables
 * app.listen(env.PORT);
 *
 * // Use OpenAI (actually OpenRouter)
 * const response = await openai.chat.completions.create({
 *   model: 'openai/gpt-4o',  // OpenRouter model naming
 *   messages: [...]
 * });
 */

// Log successful initialization (will be picked up by logger later)
console.log("✅ Environment validated successfully");
console.log(`   NODE_ENV: ${env.NODE_ENV}`);
console.log(`   PORT: ${env.PORT}`);
console.log(`   OpenAI SDK: Configured for OpenRouter`);
