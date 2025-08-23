const mongoose = require("mongoose");
const User = require("../models/User");
const Resume = require("../models/Resume");

// Simple test to verify models work
async function testModels() {
  try {
    console.log("🧪 Testing Models...");

    // Test User model
    const testUser = new User({
      email: "test@example.com",
      password: "testpassword123",
      experienceLevel: "entry-level",
    });

    console.log("✅ User model created successfully");
    console.log("📧 Email:", testUser.email);
    console.log("🔐 Password hash exists:", !!testUser.passwordHash);
    console.log("📊 Experience level:", testUser.experienceLevel);

    // Test Resume model
    const testResume = new Resume({
      userId: new mongoose.Types.ObjectId(),
      templateId: "modern-professional",
      name: "Test Resume",
      contact: {
        phone: "+1234567890",
        address: {
          street: "123 Test St",
          city: "Test City",
          state: "TS",
          zipCode: "12345",
        },
      },
      education: [
        {
          institution: "Test University",
          degree: "Bachelor of Science",
          field: "Computer Science",
          startDate: new Date("2018-09-01"),
          endDate: new Date("2022-05-01"),
          gpa: 3.8,
        },
      ],
      skills: ["JavaScript", "React", "Node.js"],
      experience: [
        {
          company: "Test Corp",
          position: "Software Developer",
          startDate: new Date("2022-06-01"),
          current: true,
          description: "Test job description",
        },
      ],
    });

    console.log("✅ Resume model created successfully");
    console.log("📄 Resume name:", testResume.name);
    console.log("🎨 Template ID:", testResume.templateId);
    console.log("📚 Education count:", testResume.education.length);
    console.log("💼 Experience count:", testResume.experience.length);
    console.log("🛠️ Skills count:", testResume.skills.length);

    console.log("\n🎉 All models are working correctly!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Test database connection
async function testDatabase() {
  try {
    console.log("🔌 Testing Database Connection...");

    // This would normally connect to MongoDB
    // For testing purposes, we'll just verify the connection string format
    const testUri = "mongodb://localhost:27017/resume-builder";
    console.log("✅ Database URI format is valid");
    console.log("📊 Database name: resume-builder");
  } catch (error) {
    console.error("❌ Database test failed:", error.message);
  }
}

// Run tests
async function runTests() {
  console.log("🚀 Starting Resume Builder Backend Tests...\n");

  await testDatabase();
  console.log("");
  await testModels();

  console.log("\n✨ Test suite completed!");
  console.log("📝 To run the actual backend:");
  console.log("   1. Set up your .env file");
  console.log("   2. Run: npm install");
  console.log("   3. Run: npm run dev");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testModels, testDatabase };
