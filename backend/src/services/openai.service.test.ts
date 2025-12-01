/**
 * OpenAI Service Test
 *
 * Tests all 5 AI functions with realistic data
 * Run: npm run test:ai
 */

import {
  generateIcebreaker,
  analyzeStress,
  analyzeSentiment,
  checkSafety,
  shouldIntervene,
  type User,
  type StressAnalysisInput,
} from "./openai.service";
import { logger } from "@/config/logger";

/**
 * Test Data
 */
const testStudent: User = {
  id: "student_001",
  role: "student",
  displayName: "Alex",
  interests: ["computer science", "gaming", "music"],
  bio: "CS major, stressed about finals, loves video games",
};

const testSenior: User = {
  id: "senior_001",
  role: "senior",
  displayName: "Margaret",
  interests: ["reading", "gardening", "technology"],
  bio: "Retired teacher, loves helping young people",
};

/**
 * Test Runner
 */
async function runTests() {
  logger.info("🧪 Starting OpenAI Service Tests...\n");

  // Test 1: Generate Icebreaker
  try {
    logger.info("📝 Test 1: Generate Icebreaker");
    const icebreaker = await generateIcebreaker(testStudent, testSenior);
    logger.info("✅ Icebreaker generated:", { icebreaker });
    console.log(`\nIcebreaker: "${icebreaker}"\n`);
  } catch (error) {
    logger.error("❌ Test 1 failed", { error });
  }

  // Test 2: Analyze Stress (Low Stress)
  try {
    logger.info("📊 Test 2: Analyze Stress (Low Stress Student)");
    const lowStressInput: StressAnalysisInput = {
      userId: testStudent.id,
      calendarEvents: 5, // Light week
      moodRating: 7, // Feeling good
      sleepHours: 8, // Well rested
      recentMessages: ["Great day today!", "Finished my project early"],
    };
    const lowStress = await analyzeStress(lowStressInput);
    logger.info("✅ Low stress analysis:", { result: lowStress });
    console.log("\nLow Stress Result:");
    console.log(JSON.stringify(lowStress, null, 2));
    console.log();
  } catch (error) {
    logger.error("❌ Test 2 failed", { error });
  }

  // Test 3: Analyze Stress (High Stress)
  try {
    logger.info("📊 Test 3: Analyze Stress (High Stress Student)");
    const highStressInput: StressAnalysisInput = {
      userId: testStudent.id,
      calendarEvents: 20, // Overloaded week
      moodRating: 3, // Feeling terrible
      sleepHours: 4, // Sleep deprived
      recentMessages: [
        "I can't keep up with everything",
        "So overwhelmed",
        "Nothing is working",
      ],
    };
    const highStress = await analyzeStress(highStressInput);
    logger.info("✅ High stress analysis:", { result: highStress });
    console.log("\nHigh Stress Result:");
    console.log(JSON.stringify(highStress, null, 2));
    console.log();
  } catch (error) {
    logger.error("❌ Test 3 failed", { error });
  }

  // Test 4: Safety Check (Safe Message)
  try {
    logger.info("🛡️ Test 4: Safety Check (Safe Message)");
    const safeMessage = "I'm feeling stressed about my exam tomorrow";
    const safetyResult = await checkSafety(safeMessage);
    logger.info("✅ Safe message check:", { result: safetyResult });
    console.log("\nSafe Message Result:");
    console.log(JSON.stringify(safetyResult, null, 2));
    console.log();
  } catch (error) {
    logger.error("❌ Test 4 failed", { error });
  }

  // Test 5: Safety Check (Concerning Message)
  try {
    logger.info("🛡️ Test 5: Safety Check (Concerning Message)");
    const concerningMessage =
      "I just feel like nothing matters anymore. What's the point?";
    const concerningResult = await checkSafety(concerningMessage);
    logger.info("✅ Concerning message check:", { result: concerningResult });
    console.log("\nConcerning Message Result:");
    console.log(JSON.stringify(concerningResult, null, 2));
    console.log();
  } catch (error) {
    logger.error("❌ Test 5 failed", { error });
  }

  // Test 6: Should Intervene (No Intervention Needed)
  try {
    logger.info("🤖 Test 6: Should Intervene (Normal Session)");
    const normalSession = await shouldIntervene(testStudent.id, {
      stressLevel: 40,
      sessionDuration: 15,
      lastMessageSentiment: "positive",
      abruptDisconnect: false,
    });
    logger.info("✅ Normal session intervention check:", {
      result: normalSession,
    });
    console.log("\nNormal Session Intervention:");
    console.log(JSON.stringify(normalSession, null, 2));
    console.log();
  } catch (error) {
    logger.error("❌ Test 6 failed", { error });
  }

  // Test 7: Analyze Sentiment (Positive Messages)
  try {
    logger.info("😊 Test 7: Analyze Sentiment (Positive Messages)");
    const positiveMessages = [
      "I'm feeling much better today",
      "Things are really looking up",
      "I'm so grateful for all the support",
    ];
    const positiveSentiment = await analyzeSentiment(positiveMessages);
    logger.info("✅ Positive sentiment analyzed:", {
      result: positiveSentiment,
    });
    console.log("\nPositive Sentiment:");
    console.log(JSON.stringify(positiveSentiment, null, 2));
    console.log();
  } catch (error) {
    logger.error("❌ Test 7 failed", { error });
  }

  // Test 8: Analyze Sentiment (Declining Trend)
  try {
    logger.info("📉 Test 8: Analyze Sentiment (Declining Trend)");
    const decliningMessages = [
      "I was feeling great this morning",
      "Now I'm getting frustrated",
      "Everything is falling apart",
      "I feel hopeless",
    ];
    const decliningSentiment = await analyzeSentiment(decliningMessages);
    logger.info("✅ Declining sentiment analyzed:", {
      result: decliningSentiment,
    });
    console.log("\nDeclining Sentiment:");
    console.log(JSON.stringify(decliningSentiment, null, 2));
    console.log();
  } catch (error) {
    logger.error("❌ Test 8 failed", { error });
  }

  // Test 9: Should Intervene (High Stress + Short Session)
  try {
    logger.info("🤖 Test 9: Should Intervene (High Stress, Short Session)");
    const criticalSession = await shouldIntervene(testStudent.id, {
      stressLevel: 88,
      sessionDuration: 3,
      lastMessageSentiment: "negative",
      abruptDisconnect: true,
    });
    logger.info("✅ Critical session intervention check:", {
      result: criticalSession,
    });
    console.log("\nCritical Session Intervention:");
    console.log(JSON.stringify(criticalSession, null, 2));
    console.log();
  } catch (error) {
    logger.error("❌ Test 9 failed", { error });
  }

  logger.info("🎉 All OpenAI Service Tests Complete!\n");
  logger.info("Next steps:");
  logger.info("1. Review AI outputs above for quality and appropriateness");
  logger.info("2. Check logs for performance metrics (tokens used, latency)");
  logger.info("3. Test fallback functions by temporarily breaking API key");
  logger.info("4. Ready to build Daily.co Voice Service (Phase 2.5)");
}

// Run tests
runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error("💥 Test suite failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
  });
