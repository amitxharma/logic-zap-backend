require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function testUserCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || process.env.MONGODB_URI_ATLAS,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ Connected to MongoDB");

    // Test 1: Create user without experienceLevel (like Google OAuth)
    console.log("\n🧪 Test 1: Creating user without experienceLevel...");
    const testUser1 = new User({
      googleId: "test-google-id-" + Date.now(),
      email: `test${Date.now()}@example.com`,
      name: "Test User",
      lastLogin: new Date(),
    });

    await testUser1.save();
    console.log("✅ User created successfully without experienceLevel");
    console.log("   Experience Level:", testUser1.experienceLevel);

    // Test 2: Create user with experienceLevel
    console.log("\n🧪 Test 2: Creating user with experienceLevel...");
    const testUser2 = new User({
      email: `test${Date.now() + 1}@example.com`,
      passwordHash: "hashedpassword123",
      experienceLevel: "intermediate",
    });

    await testUser2.save();
    console.log("✅ User created successfully with experienceLevel");
    console.log("   Experience Level:", testUser2.experienceLevel);

    // Test 3: Update experienceLevel to null
    console.log("\n🧪 Test 3: Setting experienceLevel to null...");
    testUser2.experienceLevel = null;
    await testUser2.save();
    console.log("✅ User updated successfully with null experienceLevel");
    console.log("   Experience Level:", testUser2.experienceLevel);

    // Clean up
    await User.deleteOne({ _id: testUser1._id });
    await User.deleteOne({ _id: testUser2._id });
    console.log("\n🧹 Test users cleaned up");

    console.log("\n🎉 All tests passed! Google OAuth should work now.");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from MongoDB");
  }
}

testUserCreation();
