/**
 * Test Script for Multi-Level Suggestions API
 *
 * Step 5.1 Testing Checklist:
 * - API returns all 3 arrays
 * - Quick replies are short (< 50 chars)
 * - Guided prompts are incomplete sentences
 * - AI draft is 2-3 sentences
 * - Responses are contextually relevant
 *
 * Run: node backend/test_multi_level_suggestions.js
 */

const testMultiLevelSuggestions = async () => {
  console.log("🧪 Testing Multi-Level Suggestions API (Step 5.1)\n");

  const testCases = [
    {
      name: "Stressed student about finals",
      recentMessages: [
        { sender: "student", text: "I am so stressed about finals" },
      ],
    },
    {
      name: "Student feeling overwhelmed",
      recentMessages: [
        { sender: "senior", text: "How are you doing?" },
        {
          sender: "student",
          text: "Not great. I have 3 exams next week and I feel overwhelmed",
        },
      ],
    },
    {
      name: "Student struggling with grades",
      recentMessages: [
        {
          sender: "student",
          text: "I got a D on my midterm and I don't know what to do",
        },
      ],
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    console.log(
      `Student message: "${
        testCase.recentMessages[testCase.recentMessages.length - 1].text
      }"`
    );

    try {
      const response = await fetch("http://localhost:5000/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recentMessages: testCase.recentMessages }),
      });

      if (!response.ok) {
        console.error(
          `❌ API Error: ${response.status} ${response.statusText}`
        );
        const errorBody = await response.text();
        console.error(errorBody);
        continue;
      }

      const data = await response.json();
      const { suggestions } = data;

      // Validation
      console.log("\n✅ Response Structure:");
      console.log(
        `  - quickReplies: ${suggestions.quickReplies ? "✓" : "✗"} (${
          suggestions.quickReplies?.length || 0
        } items)`
      );
      console.log(
        `  - guidedPrompts: ${suggestions.guidedPrompts ? "✓" : "✗"} (${
          suggestions.guidedPrompts?.length || 0
        } items)`
      );
      console.log(
        `  - aiDraft: ${suggestions.aiDraft ? "✓" : "✗"} (${
          suggestions.aiDraft?.length || 0
        } chars)`
      );

      // Quick Replies validation
      console.log("\n🔵 Quick Replies (ready to send):");
      suggestions.quickReplies?.forEach((reply, i) => {
        const isShort = reply.length <= 50;
        console.log(
          `  ${i + 1}. "${reply}" (${reply.length} chars) ${
            isShort ? "✓" : "⚠️ TOO LONG"
          }`
        );
      });

      // Guided Prompts validation
      console.log("\n🟢 Guided Prompts (sentence starters):");
      suggestions.guidedPrompts?.forEach((prompt, i) => {
        const isShort = prompt.length <= 30;
        const isIncomplete = !prompt.endsWith(".") && !prompt.endsWith("?");
        console.log(
          `  ${i + 1}. "${prompt}" (${prompt.length} chars) ${
            isShort ? "✓" : "⚠️ TOO LONG"
          } ${isIncomplete ? "✓" : "⚠️ COMPLETE SENTENCE"}`
        );
      });

      // AI Draft validation
      console.log("\n🟣 AI Draft (full response):");
      const draftLength = suggestions.aiDraft?.length || 0;
      const isGoodLength = draftLength >= 50 && draftLength <= 200;
      console.log(`  "${suggestions.aiDraft}"`);
      console.log(
        `  (${draftLength} chars) ${isGoodLength ? "✓" : "⚠️ LENGTH ISSUE"}`
      );

      console.log("\n" + "─".repeat(80));
    } catch (error) {
      console.error(`❌ Test Failed:`, error.message);
    }
  }

  console.log("\n\n✅ Step 5.1 Testing Complete!");
  console.log("\nNext Steps:");
  console.log("  1. Review responses above");
  console.log("  2. Check length constraints");
  console.log("  3. Verify empathetic tone");
  console.log("  4. Proceed to Step 5.2 (Frontend component)");
};

// Run tests
testMultiLevelSuggestions().catch(console.error);
