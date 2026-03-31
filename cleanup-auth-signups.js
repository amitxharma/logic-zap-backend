/**
 * ONE-TIME CLEANUP SCRIPT
 * Run this script to clean up the Auth_Signups Google Sheet
 *
 * Usage: node cleanup-auth-signups.js
 */

require("dotenv").config();
const googleSheetsService = require("./utils/googleSheets");

async function runCleanup() {
  try {
    console.log("🚀 Initializing Google Sheets service...");
    await googleSheetsService.initialize();

    console.log("🧹 Running cleanup on Auth_Signups sheet...");
    const result = await googleSheetsService.cleanupAuthSignupsSheet();

    console.log("\n📊 CLEANUP SUMMARY:");
    console.log("==================");
    console.log(`✅ Login entries deleted: ${result.deletedLogins}`);
    console.log(`✅ Duplicate signups deleted: ${result.deletedDuplicates}`);
    console.log(`✅ Total rows deleted: ${result.totalDeleted}`);
    console.log(`📝 Remaining unique signups: ${result.remainingSignups}`);
    console.log("==================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

runCleanup();
