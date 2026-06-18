import assert from "assert";
import mongoose from "mongoose";

// Setup dummy env before importing models to bypass check
process.env.MONGO_URI = "mongodb://localhost:27017/dummy";

// Dynamic imports to ensure env setup takes effect first
const { User } = await import("../models/User.js");
const { Property } = await import("../models/Property.js");
const { AuditLog } = await import("../models/AuditLog.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");

function testMongooseIndexes() {
    console.log("Testing Mongoose database index configurations...");

    // 1. Verify User index
    const userIndexes = User.schema.indexes();
    const hasUserIndex = userIndexes.some(idx => {
        const keys = Object.keys(idx[0]);
        return keys.includes('role') && keys.includes('isActive') && keys.includes('isBlocked') && keys.includes('email');
    });
    assert.ok(hasUserIndex, "User model should have compound index including role, isActive, isBlocked, and email");
    console.log("✅ User compound search index verified!");

    // 2. Verify Property index
    const propIndexes = Property.schema.indexes();
    const hasPropIndex = propIndexes.some(idx => {
        const keys = Object.keys(idx[0]);
        return keys.includes('status') && keys.includes('city') && keys.includes('category');
    });
    assert.ok(hasPropIndex, "Property model should have compound index including status, city, and category");
    console.log("✅ Property compound listing index verified!");

    // 3. Verify AuditLog index
    const auditIndexes = AuditLog.schema.indexes();
    const hasAuditIndex = auditIndexes.some(idx => {
        const keys = Object.keys(idx[0]);
        return keys.includes('adminId') && keys.includes('action') && keys.includes('timestamp');
    });
    assert.ok(hasAuditIndex, "AuditLog model should have compound index including adminId, action, and timestamp");
    console.log("✅ AuditLog compound chronological index verified!");

    console.log("🎉 All database index configurations passed validation!\n");
}

async function testErrorHandlerMiddleware() {
    console.log("Testing centralized error handling middleware...");

    const mockReq = {};
    let statusCalled = null;
    let jsonResponse = null;

    const mockRes = {
        status(code) {
            statusCalled = code;
            return this;
        },
        json(data) {
            jsonResponse = data;
            return this;
        }
    };

    const next = () => {};

    // 1. Test Mongoose CastError
    const castError = new Error("Cast failed");
    castError.name = "CastError";
    castError.value = "invalid-objectId-123";
    
    await errorHandler(castError, mockReq, mockRes, next);
    assert.strictEqual(statusCalled, 400, "CastError should return status 400");
    assert.strictEqual(jsonResponse.success, false, "Response success flag should be false");
    assert.strictEqual(jsonResponse.error, "INVALID_ID", "Response error code should be INVALID_ID");
    console.log("✅ CastError formatting verified!");

    // 2. Test Mongoose ValidationError
    const validationError = new Error("Validation failed");
    validationError.name = "ValidationError";
    validationError.errors = {
        email: { message: "Email is required", path: "email" }
    };

    await errorHandler(validationError, mockReq, mockRes, next);
    assert.strictEqual(statusCalled, 400, "ValidationError should return status 400");
    assert.strictEqual(jsonResponse.error, "VALIDATION_ERROR", "Response error code should be VALIDATION_ERROR");
    assert.ok(Array.isArray(jsonResponse.details), "Response details should be an array");
    assert.strictEqual(jsonResponse.details[0].field, "email");
    console.log("✅ ValidationError formatting verified!");

    // 3. Test MongoDB Duplicate Key Error (MongoServerError code 11000)
    const duplicateKeyError = new Error("Duplicate key");
    duplicateKeyError.code = 11000;
    duplicateKeyError.keyValue = { email: "test@test.com" };

    await errorHandler(duplicateKeyError, mockReq, mockRes, next);
    assert.strictEqual(statusCalled, 409, "DuplicateKey error should return status 409");
    assert.strictEqual(jsonResponse.error, "DUPLICATE_KEY", "Response error code should be DUPLICATE_KEY");
    assert.ok(jsonResponse.message.includes("email"), "Response message should list duplicate field");
    console.log("✅ DuplicateKey error formatting verified!");

    // 4. Test standard fallback error
    const standardError = new Error("Something went wrong");
    standardError.status = 503;

    await errorHandler(standardError, mockReq, mockRes, next);
    assert.strictEqual(statusCalled, 503, "Standard error with status field should return corresponding status");
    assert.strictEqual(jsonResponse.error, "INTERNAL_ERROR", "Response error code should be INTERNAL_ERROR");
    console.log("✅ Fallback standard error formatting verified!");

    console.log("🎉 Centralized error handler passed all middleware test cases!\n");
}

async function runAll() {
    console.log("=== STARTING BACKEND SCALE & QUALITY UPGRADES VERIFICATION ===\n");
    try {
        testMongooseIndexes();
        await testErrorHandlerMiddleware();
        console.log("🎉 ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!");
        process.exit(0);
    } catch (error) {
        console.error("❌ BACKEND TEST FAILED:", error);
        process.exit(1);
    }
}

runAll();
