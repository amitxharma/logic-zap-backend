require("dotenv").config();
const googleSheetsService = require("./utils/googleSheets");

async function testConnection() {
  try {
    console.log("🔄 Testing Google Sheets connection...");
    console.log("📋 Environment check:");
    console.log(
      "  - Sheet ID:",
      process.env.GOOGLE_SHEET_ID ? "✅ Set" : "❌ Missing"
    );
    console.log(
      "  - Service Account Email:",
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "✅ Set" : "❌ Missing"
    );
    console.log(
      "  - Private Key:",
      process.env.GOOGLE_PRIVATE_KEY ? "✅ Set" : "❌ Missing"
    );

    if (
      !process.env.GOOGLE_SHEET_ID ||
      !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      !process.env.GOOGLE_PRIVATE_KEY
    ) {
      throw new Error(
        "Missing required environment variables. Please check your .env file."
      );
    }

    console.log("\n📝 Testing contact form submission...");

    // Test adding a sample contact form entry
    const testData = {
      name: "Test User",
      email: "test@example.com",
      phone: "+1234567890",
      course: "EV Design",
      subject: "Test Subject",
      message: "This is a test message from the integration test",
      sourcePage: "Test Page - Integration Test",
    };

    await googleSheetsService.addContactForm(testData);
    console.log("✅ Contact form test: SUCCESS");

    console.log("\n📧 Testing newsletter subscription...");

    // Test newsletter subscription
    const newsletterData = {
      email: "newsletter-test@example.com",
      sourcePage: "Test Page - Newsletter Test",
      ipAddress: "127.0.0.1",
    };

    await googleSheetsService.addNewsletterSubscription(newsletterData);
    console.log("✅ Newsletter subscription test: SUCCESS");

    console.log("\n👤 Testing auth tracking...");

    // Test auth tracking
    const authData = {
      name: "Test Auth User",
      email: "auth-test@example.com",
      type: "signup",
      ipAddress: "127.0.0.1",
      userAgent: "Test User Agent",
    };

    await googleSheetsService.addAuthSignup(authData);
    console.log("✅ Auth tracking test: SUCCESS");

    console.log("\n🎯 Testing resume builder activity...");

    // Test resume builder activity
    const resumeData = {
      name: "Resume Test User",
      email: "resume-test@example.com",
      resumeId: "test-resume-123",
      action: "created",
      templateUsed: "Professional Template",
    };

    await googleSheetsService.addResumeBuilderActivity(resumeData);
    console.log("✅ Resume builder activity test: SUCCESS");

    console.log("\n🎉 All tests passed successfully!");
    console.log("📊 Check your Google Sheet for the test entries:");
    console.log(
      `   https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}/edit`
    );
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("\n🔧 Troubleshooting steps:");
    console.error("1. Verify your .env file has all required variables");
    console.error(
      "2. Check that Google Sheets API is enabled in Google Cloud Console"
    );
    console.error("3. Ensure the service account has access to the sheet");
    console.error("4. Verify the sheet ID is correct");

    if (error.message.includes("PERMISSION_DENIED")) {
      console.error(
        "\n📧 Make sure you shared the sheet with:",
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      );
    }

    if (error.message.includes("INVALID_ARGUMENT")) {
      console.error("\n🔑 Check your private key format in the .env file");
    }
  }
}

// Run the test
testConnection();
