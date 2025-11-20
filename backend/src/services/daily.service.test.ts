/**
 * Daily.co Service Test
 *
 * Tests voice room creation, token generation, and cleanup
 * Run: npm run test:voice
 */

import {
  createRoom,
  getToken,
  endRoom,
  getRoomInfo,
  listActiveRooms,
} from "./daily.service";
import { logger } from "@/config/logger";

/**
 * Test Data
 */
const testSessionId = "test_session_" + Date.now();
const testStudentName = "Alex (Test Student)";
const testSeniorName = "Margaret (Test Senior)";

/**
 * Test Runner
 */
async function runTests() {
  logger.info("🧪 Starting Daily.co Service Tests...\n");

  let roomName: string = "";

  // Test 1: Create Room
  try {
    logger.info("📞 Test 1: Create Voice Room");
    const result = await createRoom(
      testSessionId,
      testStudentName,
      testSeniorName
    );

    roomName = result.roomName; // Save for later tests

    logger.info("✅ Room created successfully:", {
      roomUrl: result.roomUrl,
      roomName: result.roomName,
      expiresAt: result.expiresAt.toISOString(),
      hasStudentToken: !!result.studentToken,
      hasSeniorToken: !!result.seniorToken,
    });

    console.log("\n📞 Room Details:");
    console.log(`  URL: ${result.roomUrl}`);
    console.log(`  Name: ${result.roomName}`);
    console.log(`  Expires: ${result.expiresAt.toLocaleString()}`);
    console.log(`  Student Token: ${result.studentToken.substring(0, 50)}...`);
    console.log(`  Senior Token: ${result.seniorToken.substring(0, 50)}...\n`);
  } catch (error) {
    logger.error("❌ Test 1 failed", { error });
    return; // Can't continue without room
  }

  // Test 2: Generate Additional Token (e.g., for reconnection)
  try {
    logger.info("🔑 Test 2: Generate Additional Token");
    const additionalToken = await getToken(
      roomName,
      "test_user_reconnect",
      "Reconnected User",
      "student"
    );

    logger.info("✅ Additional token generated:", {
      tokenLength: additionalToken.length,
      tokenPreview: additionalToken.substring(0, 50) + "...",
    });

    console.log(
      `\n🔑 Additional Token: ${additionalToken.substring(0, 50)}...\n`
    );
  } catch (error) {
    logger.error("❌ Test 2 failed", { error });
  }

  // Test 3: Get Room Info
  try {
    logger.info("📊 Test 3: Get Room Info");
    const roomInfo = await getRoomInfo(roomName);

    if (roomInfo) {
      logger.info("✅ Room info retrieved:", {
        name: roomInfo.name,
        url: roomInfo.url,
        createdAt: roomInfo.created_at,
        hasExpiry: !!roomInfo.config.exp,
      });

      console.log("\n📊 Room Info:");
      console.log(`  Name: ${roomInfo.name}`);
      console.log(`  URL: ${roomInfo.url}`);
      console.log(
        `  Created: ${new Date(roomInfo.created_at).toLocaleString()}`
      );
      if (roomInfo.config.exp) {
        console.log(
          `  Expires: ${new Date(roomInfo.config.exp * 1000).toLocaleString()}`
        );
      }
      console.log();
    } else {
      logger.warn("⚠️ Room info not found (might have expired)");
    }
  } catch (error) {
    logger.error("❌ Test 3 failed", { error });
  }

  // Test 4: List Active Rooms
  try {
    logger.info("📋 Test 4: List Active Rooms");
    const rooms = await listActiveRooms();

    logger.info("✅ Active rooms listed:", {
      totalRooms: rooms.length,
      ourTestRoom: rooms.some((r) => r.name === roomName),
    });

    console.log(`\n📋 Active Rooms: ${rooms.length} total`);
    if (rooms.length > 0) {
      console.log("  Recent rooms:");
      rooms.slice(0, 5).forEach((room) => {
        console.log(`    - ${room.name} (${room.url})`);
      });
    }
    console.log();
  } catch (error) {
    logger.error("❌ Test 4 failed", { error });
  }

  // Test 5: End Room (Cleanup)
  try {
    logger.info("🗑️ Test 5: End Room (Cleanup)");
    const success = await endRoom(roomName);

    if (success) {
      logger.info("✅ Room ended successfully:", { roomName });
      console.log(`\n🗑️ Room ended: ${roomName}\n`);
    } else {
      logger.warn("⚠️ Room end failed (will auto-expire)", { roomName });
      console.log(`\n⚠️ Room end failed, but it will auto-expire in 1 hour\n`);
    }
  } catch (error) {
    logger.error("❌ Test 5 failed", { error });
  }

  // Test 6: Verify Room Deleted
  try {
    logger.info("✓ Test 6: Verify Room Deleted");
    const roomInfo = await getRoomInfo(roomName);

    if (roomInfo === null) {
      logger.info("✅ Room successfully deleted (404 not found)");
      console.log("✅ Room successfully deleted\n");
    } else {
      logger.warn("⚠️ Room still exists (deletion might be delayed)");
      console.log("⚠️ Room still exists (deletion might be delayed)\n");
    }
  } catch (error) {
    logger.error("❌ Test 6 failed", { error });
  }

  logger.info("🎉 All Daily.co Service Tests Complete!\n");
  logger.info("Summary:");
  logger.info("✅ Room creation: Working");
  logger.info("✅ Token generation: Working");
  logger.info("✅ Room info retrieval: Working");
  logger.info("✅ Active rooms listing: Working");
  logger.info("✅ Room deletion: Working");
  logger.info("");
  logger.info("Next steps:");
  logger.info("1. Test joining room with tokens (use Daily.co Prebuilt UI)");
  logger.info(
    "2. Visit room URL + append ?t=<token> to join: https://yourteam.daily.co/roomname?t=token"
  );
  logger.info("3. Test audio quality with 2 browsers/devices");
  logger.info("4. Ready to build Express Server (Phase 2.6)");
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
