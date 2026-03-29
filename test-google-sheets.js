/**
 * Google Sheets Connection Test Script
 *
 * Run this to diagnose Google Sheets connection issues:
 * node test-google-sheets.js
 */

require("dotenv").config();
const googleSheetsService = require("./utils/googleSheets");

async function testGoogleSheets() {
  console.log("\n🧪 Testing Google Sheets Connection...\n");

  // Step 1: Check environment variables
  console.log("📋 Step 1: Checking environment variables...");
  const hasEmail = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const hasKey = !!process.env.GOOGLE_PRIVATE_KEY;
  const hasSheetId = !!process.env.GOOGLE_SHEET_ID;

  console.log(
    `   GOOGLE_SERVICE_ACCOUNT_EMAIL: ${hasEmail ? "✅ Set" : "❌ Missing"}`
  );
  console.log(`   GOOGLE_PRIVATE_KEY: ${hasKey ? "✅ Set" : "❌ Missing"}`);
  console.log(`   GOOGLE_SHEET_ID: ${hasSheetId ? "✅ Set" : "❌ Missing"}`);

  if (!hasEmail || !hasKey || !hasSheetId) {
    console.log("\n❌ ERROR: Missing required environment variables!");
    console.log("\nPlease add these to your backend/.env file:");
    console.log(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com"
    );
    console.log(
      'GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"'
    );
    console.log("GOOGLE_SHEET_ID=your-spreadsheet-id");
    process.exit(1);
  }

  console.log("\n✅ All environment variables are set\n");

  // Step 2: Test initialization
  console.log("📋 Step 2: Testing Google Sheets initialization...");
  try {
    await googleSheetsService.initialize();
    console.log("✅ Google Sheets initialized successfully\n");
  } catch (error) {
    console.log("❌ Failed to initialize Google Sheets");
    console.log("Error:", error.message);
    console.log("\nPossible issues:");
    console.log("1. Invalid service account credentials");
    console.log("2. Spreadsheet ID is incorrect");
    console.log("3. Service account does not have access to the spreadsheet");
    console.log("4. Google Sheets API is not enabled");
    process.exit(1);
  }

  // Step 3: Test adding data
  console.log("📋 Step 3: Testing data submission...");
  const testData = {
    name: "Test User",
    email: "test@example.com",
    phone: "+1234567890",
    education: "B.Tech",
    readyToUpskill: "yes",
    modalId: "BOOK_DEMO",
    sourcePage: "http://localhost:3000/test",
  };

  try {
    const result = await googleSheetsService.addContactForm(
      testData,
      "BOOK_DEMO"
    );
    console.log("✅ Test data submitted successfully!");
    console.log("   Sheet:", result.sheetName);
    console.log("   Modal ID:", result.modalId);
    console.log(
      '\n📊 Check your Google Spreadsheet for a new "Book_Demo" tab with test data\n'
    );
  } catch (error) {
    console.log("❌ Failed to submit test data");
    console.log("Error:", error.message);
    console.log("\nPossible issues:");
    console.log(
      "1. Service account does not have Editor access to the spreadsheet"
    );
    console.log("2. Spreadsheet is locked or protected");
    console.log("3. Sheet creation failed");
    process.exit(1);
  }

  console.log("✅ All tests passed! Google Sheets is working correctly.\n");
}

// Run the test
testGoogleSheets().catch((error) => {
  console.error("\n❌ Test failed with error:", error);
  process.exit(1);
});
