const axios = require("axios");

const API_BASE_URL = "http://localhost:5000/api";

async function testFormAPIs() {
  console.log("🔄 Testing Form API endpoints...");
  console.log("Make sure your server is running on port 5000\n");

  try {
    // Test contact form submission
    console.log("📝 Testing contact form API...");
    const contactResponse = await axios.post(`${API_BASE_URL}/forms/contact`, {
      name: "API Test User",
      email: "api-test@example.com",
      phone: "+1234567890",
      course: "EV Design",
      subject: "API Test Subject",
      message: "This is a test message from API test",
      preferredContact: "email",
      courseInterest: "EV Design",
    });

    console.log("✅ Contact form API:", contactResponse.data.message);

    // Test newsletter subscription
    console.log("\n📧 Testing newsletter API...");
    const newsletterResponse = await axios.post(
      `${API_BASE_URL}/forms/newsletter`,
      {
        email: "newsletter-api-test@example.com",
      }
    );

    console.log("✅ Newsletter API:", newsletterResponse.data.message);

    // Test auth tracking
    console.log("\n👤 Testing auth tracking API...");
    const authResponse = await axios.post(`${API_BASE_URL}/forms/auth-track`, {
      name: "Auth API Test",
      email: "auth-api-test@example.com",
      type: "signup",
    });

    console.log("✅ Auth tracking API:", authResponse.data.message);

    // Test resume activity tracking
    console.log("\n🎯 Testing resume activity API...");
    const resumeResponse = await axios.post(
      `${API_BASE_URL}/forms/resume-activity`,
      {
        name: "Resume API Test",
        email: "resume-api-test@example.com",
        resumeId: "api-test-resume-456",
        action: "created",
        templateUsed: "Modern Template",
      }
    );

    console.log("✅ Resume activity API:", resumeResponse.data.message);

    console.log("\n🎉 All API tests passed!");
    console.log("📊 Check your Google Sheet for the API test entries.");
  } catch (error) {
    console.error("\n❌ API test failed:");

    if (error.code === "ECONNREFUSED") {
      console.error("🔌 Server is not running. Start it with: npm run dev");
    } else if (error.response) {
      console.error(
        "📡 API Error:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error("🚨 Unexpected error:", error.message);
    }
  }
}

// Test validation errors
async function testValidationErrors() {
  console.log("\n🧪 Testing validation errors...");

  try {
    // Test invalid email
    await axios.post(`${API_BASE_URL}/forms/contact`, {
      name: "Test",
      email: "invalid-email",
      phone: "123",
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log("✅ Validation working:", error.response.data.message);
    }
  }

  try {
    // Test missing required fields
    await axios.post(`${API_BASE_URL}/forms/newsletter`, {
      email: "",
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log("✅ Required field validation working");
    }
  }
}

// Run tests
async function runAllTests() {
  await testFormAPIs();
  await testValidationErrors();
}

runAllTests();
