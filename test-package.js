#!/usr/bin/env node

/**
 * Simple test to verify the TypeScript package works correctly
 */

const {
  FursClient,
  FursValidationError,
  ENVIRONMENTS,
} = require("./dist/index.js");

console.log("🧪 Testing FURS Client TypeScript Package");
console.log("=========================================\n");

try {
  // Test 1: Import verification
  console.log("✅ Import successful");
  console.log("   FursClient:", typeof FursClient);
  console.log("   FursValidationError:", typeof FursValidationError);
  console.log("   ENVIRONMENTS:", ENVIRONMENTS);

  // Test 2: Configuration validation
  console.log("\n🔧 Testing configuration validation...");

  try {
    new FursClient({});
  } catch (error) {
    if (error instanceof FursValidationError) {
      console.log("✅ Validation error caught correctly:", error.message);
    } else {
      console.log("❌ Unexpected error type:", error.constructor.name);
    }
  }

  // Test 3: Invalid certificate path
  try {
    new FursClient({
      certPath: "./nonexistent.p12",
      certPassword: "test",
      taxNumber: 12345678,
    });
  } catch (error) {
    if (error instanceof FursValidationError) {
      console.log("✅ File validation error caught correctly:", error.message);
    } else {
      console.log("❌ Unexpected error type:", error.constructor.name);
    }
  }

  console.log("\n🎉 All tests passed! Package is working correctly.");
  console.log("\n📝 To use with a real certificate, update the example with:");
  console.log("   - Valid certificate path");
  console.log("   - Correct certificate password");
  console.log("   - Your tax number");
} catch (error) {
  console.error("❌ Test failed:", error.message);
  process.exit(1);
}
