/**
 * Configuration Layer Test
 *
 * This file tests that all three configuration modules work correctly:
 * 1. env.ts - Validates environment variables
 * 2. logger.ts - Sets up Winston logging
 * 3. firebase.ts - Initializes Firestore database
 *
 * Run: ts-node src/config/test-config.ts
 */

import { env } from "./env";
import { logger } from "./logger";
import { db, collections } from "./firebase";

async function testConfig() {
  logger.info("🧪 Starting configuration layer test...");

  // Test 1: Environment variables
  logger.info("📋 Test 1: Environment Variables", {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    hasOpenRouterKey: !!env.OPENROUTER_API_KEY,
    hasDailyKey: !!env.DAILY_API_KEY,
    hasFirebaseProject: !!env.FIREBASE_PROJECT_ID,
  });

  // Test 2: Logger functionality
  logger.debug("This is a DEBUG message (only shows in development)");
  logger.info("This is an INFO message (shows in all environments)");
  logger.warn("This is a WARN message (potential issue)");
  logger.error("This is an ERROR message (something broke)", {
    testError: "This is just a test, not a real error",
  });

  // Test 3: Firebase connection
  try {
    logger.info("🔥 Test 3: Firebase Connection");

    // Try to read from users collection (should be empty initially)
    const usersSnapshot = await collections.users.limit(1).get();
    logger.info("✅ Firebase connection successful", {
      usersCollectionExists: true,
      documentCount: usersSnapshot.size,
    });

    // Try to write a test document
    const testDocRef = await collections.analytics.add({
      type: "config_test",
      timestamp: new Date(),
      message: "Configuration layer test successful",
    });

    logger.info("✅ Firebase write successful", {
      testDocId: testDocRef.id,
    });

    // Clean up test document
    await testDocRef.delete();
    logger.info("✅ Test document cleaned up");
  } catch (error) {
    logger.error("❌ Firebase connection failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }

  logger.info("🎉 All configuration tests passed!");
  logger.info("");
  logger.info("Next steps:");
  logger.info(
    "1. Check logs/ folder for combined.log and error.log (production only)"
  );
  logger.info(
    "2. Verify Firebase project in console: https://console.firebase.google.com"
  );
  logger.info("3. Ready to build OpenAI Router Service (Phase 2.4)");
}

// Run tests
testConfig()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error("💥 Configuration test failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
  });
