const axios = require("axios");

const API_URL = "http://localhost:5000/api/forms/contact";

const testData = {
  name: "Test User",
  email: "test@example.com",
  phone: "1234567890",
  education: "B.Tech",
  readyToUpskill: "yes",
  modalId: "HOMEPAGE_CONTACT_FORM",
  sourcePage: "/",
};

console.log("🧪 Testing HomePage Contact Form Submission");
console.log("📤 Sending data:", JSON.stringify(testData, null, 2));

axios
  .post(API_URL, testData)
  .then((response) => {
    console.log("✅ Success!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
  })
  .catch((error) => {
    console.error("❌ Error!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  });
