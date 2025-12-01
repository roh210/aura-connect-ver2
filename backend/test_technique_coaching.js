/**
 * Test Script for Technique Coaching API
 *
 * Step 6.1 Testing Checklist:
 * - API detects when coaching would help
 * - Suggests appropriate technique
 * - Provides clear explanation
 * - Gives concrete example from conversation
 * - Returns false when coaching not needed
 *
 * Run: node backend/test_technique_coaching.js
 */

const testTechniqueCoaching = async () => {
  console.log("🧪 Testing Technique Coaching API (Step 6.1)\n");

  const testCases = [
    {
      name: "Student expressing overwhelm - Active Listening opportunity",
      recentMessages: [
        { sender: "senior", text: "Hi! How are you doing today?" },
        {
          sender: "student",
          text: "Not great. I have so much on my plate right now",
        },
        { sender: "senior", text: "What do you have going on?" },
        {
          sender: "student",
          text: "Three exams, a project due, and my roommate drama. I just feel so overwhelmed",
        },
      ],
      expectedTechnique: "Active Listening",
    },
    {
      name: "Student doubting themselves - Validation opportunity",
      recentMessages: [
        { sender: "student", text: "I got a C on my midterm" },
        { sender: "senior", text: "That must be disappointing" },
        {
          sender: "student",
          text: "I studied so hard. I feel like such a failure",
        },
      ],
      expectedTechnique: "Validation",
    },
    {
      name: "Student being vague - Open-Ended Questions opportunity",
      recentMessages: [
        { sender: "senior", text: "What brought you here today?" },
        { sender: "student", text: "Just feeling stressed" },
        { sender: "senior", text: "I see" },
        { sender: "student", text: "Yeah, things are tough" },
      ],
      expectedTechnique: "Open-Ended Questions",
    },
    {
      name: "Senior already using good techniques - No coaching needed",
      recentMessages: [
        { sender: "student", text: "I am so stressed about finals" },
        {
          sender: "senior",
          text: "It sounds like you are feeling really overwhelmed by the upcoming exams. What would help you most right now?",
        },
        { sender: "student", text: "I don't know where to start" },
      ],
      expectedShouldCoach: false,
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    console.log(
      `Last student message: "${
        testCase.recentMessages[testCase.recentMessages.length - 1].text
      }"`
    );

    try {
      const response = await fetch(
        "http://localhost:5000/api/ai/technique-coach",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recentMessages: testCase.recentMessages }),
        }
      );

      if (!response.ok) {
        console.error(
          `❌ API Error: ${response.status} ${response.statusText}`
        );
        const errorBody = await response.text();
        console.error(errorBody);
        continue;
      }

      const data = await response.json();

      console.log("\n✅ Response:");
      console.log(`  shouldCoach: ${data.shouldCoach}`);

      if (data.shouldCoach) {
        console.log(`  technique: ${data.technique}`);
        console.log(`  explanation: "${data.explanation}"`);
        console.log(`  example: "${data.example}"`);

        // Validations
        const explanationLength = data.explanation?.length || 0;
        console.log(`\n🔍 Validation:`);
        console.log(
          `  - Explanation length: ${explanationLength} chars ${
            explanationLength <= 80 ? "✓" : "⚠️ TOO LONG"
          }`
        );
        console.log(`  - Has example: ${data.example ? "✓" : "✗"}`);
        console.log(
          `  - Example is specific: ${
            data.example?.includes("...") ? "✗ TOO VAGUE" : "✓"
          }`
        );

        if (testCase.expectedTechnique) {
          const matchesTechnique =
            data.technique === testCase.expectedTechnique;
          console.log(
            `  - Expected ${testCase.expectedTechnique}: ${
              matchesTechnique ? "✓" : "⚠️ Got " + data.technique
            }`
          );
        }
      } else {
        console.log(
          `  No coaching suggested (appropriate when senior already doing well)`
        );

        if (testCase.expectedShouldCoach === false) {
          console.log(`  ✓ Correctly identified no coaching needed`);
        }
      }

      console.log("\n" + "─".repeat(80));
    } catch (error) {
      console.error(`❌ Test Failed:`, error.message);
    }
  }

  console.log("\n\n✅ Step 6.1 Testing Complete!");
  console.log("\nNext Steps:");
  console.log("  1. Review technique suggestions above");
  console.log("  2. Verify explanations are clear and concise");
  console.log("  3. Check examples are specific and actionable");
  console.log("  4. Proceed to Step 6.2 (Frontend TechniqueCard component)");
};

// Run tests
testTechniqueCoaching().catch(console.error);
