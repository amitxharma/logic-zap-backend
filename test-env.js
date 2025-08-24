require("dotenv").config();

console.log("🔍 Environment Variables Test");
console.log("============================");
console.log(`PORT: ${process.env.PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(
  `JWT_SECRET: ${process.env.JWT_SECRET ? "✅ Loaded" : "❌ Missing"}`
);
console.log(
  `GOOGLE_CLIENT_ID: ${
    process.env.GOOGLE_CLIENT_ID ? "✅ Loaded" : "❌ Missing"
  }`
);
console.log(
  `GOOGLE_CLIENT_SECRET: ${
    process.env.GOOGLE_CLIENT_SECRET ? "✅ Loaded" : "❌ Missing"
  }`
);
console.log(
  `MONGODB_URI: ${process.env.MONGODB_URI ? "✅ Loaded" : "❌ Missing"}`
);
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);

if (!process.env.JWT_SECRET) {
  console.log("\n❌ JWT_SECRET is missing!");
  console.log(
    "Make sure your .env file exists and contains JWT_SECRET=your-secret-here"
  );
  process.exit(1);
} else {
  console.log("\n✅ All required environment variables are loaded!");
}
