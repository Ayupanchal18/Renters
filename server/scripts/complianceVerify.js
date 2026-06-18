import "dotenv/config";
import mongoose from "mongoose";
import assert from "assert";

// Setup test environment
process.env.NODE_ENV = 'development';
process.env.ALLOW_DEV_AUTH = 'true';

// Dynamically import models and dependencies so setup takes effect
const { User } = await import("../models/User.js");
const { AuditLog } = await import("../models/AuditLog.js");
const { createAuditLog } = await import("../src/services/adminAuditService.js");
const { requirePermission } = await import("../src/middleware/permissionGuard.js");
const { connectDB } = await import("../src/config/db.js");

// Mock User.findById to return a mock document during authenticateAdmin checks
let mockUserDoc = null;
User.findById = (id) => {
    return {
        lean: () => Promise.resolve(mockUserDoc)
    };
};

async function testPiiRedaction() {
    console.log("1. Testing PII Redaction in Audit Logs...");

    const adminId = new mongoose.Types.ObjectId();
    const resourceId = new mongoose.Types.ObjectId();

    const changesPayload = {
        email: "sensitive-admin@example.com",
        phone: "+15555551234",
        address: "123 Main St, Springfield",
        password: "superSecretPassword123",
        passwordHash: "$2b$10$xyz...",
        token: "eyJhbGciOi...",
        avatar: "https://example.com/avatar.jpg",
        normalField: "public-info"
    };

    const prevPayload = {
        email: "old-email@example.com",
        phone: "+15555554321",
        normalField: "old-value"
    };

    const metaPayload = {
        email: "meta-email@example.com",
        justification: "System compliance run"
    };

    const log = await createAuditLog({
        adminId,
        action: "VIEW",
        resourceType: "report",
        resourceId,
        changes: changesPayload,
        previousValues: prevPayload,
        metadata: metaPayload
    });

    // Fetch the log from DB to verify raw serialized values
    const dbLog = await AuditLog.findById(log._id).lean();
    assert.ok(dbLog, "Audit log should be successfully saved and retrieved from MongoDB");

    // Assert changes redacted
    assert.strictEqual(dbLog.changes.email, "[REDACTED]");
    assert.strictEqual(dbLog.changes.phone, "[REDACTED]");
    assert.strictEqual(dbLog.changes.address, "[REDACTED]");
    assert.strictEqual(dbLog.changes.password, "[REDACTED]");
    assert.strictEqual(dbLog.changes.passwordHash, "[REDACTED]");
    assert.strictEqual(dbLog.changes.token, "[REDACTED]");
    assert.strictEqual(dbLog.changes.avatar, "[REDACTED]");
    assert.strictEqual(dbLog.changes.normalField, "public-info");

    // Assert previousValues redacted
    assert.strictEqual(dbLog.previousValues.email, "[REDACTED]");
    assert.strictEqual(dbLog.previousValues.phone, "[REDACTED]");
    assert.strictEqual(dbLog.previousValues.normalField, "old-value");

    // Assert metadata redacted
    assert.strictEqual(dbLog.metadata.email, "[REDACTED]");
    assert.strictEqual(dbLog.metadata.justification, "System compliance run");

    console.log("✅ PII Redaction validated successfully!");
    return dbLog._id;
}

async function testImmutability(logId) {
    console.log("\n2. Testing Audit Log Immutability (Block Update/Delete)...");

    const doc = await AuditLog.findById(logId);
    assert.ok(doc, "Found document for immutability check");

    // Test A: pre-save hook on existing document
    doc.action = "UPDATE";
    try {
        await doc.save();
        assert.fail("Document save update should have thrown an immutability error");
    } catch (err) {
        assert.ok(err.message.includes("immutable") || err.message.includes("cannot be modified"), `Expected save block error, got: ${err.message}`);
        console.log("✅ pre-save hook successfully blocked update!");
    }

    // Test B: pre-updateOne query middleware
    try {
        await AuditLog.updateOne({ _id: logId }, { $set: { action: "UPDATE" } });
        assert.fail("updateOne query should have thrown an immutability error");
    } catch (err) {
        assert.ok(err.message.includes("immutable"), `Expected updateOne block, got: ${err.message}`);
        console.log("✅ pre-updateOne hook successfully blocked query update!");
    }

    // Test C: pre-findOneAndUpdate query middleware
    try {
        await AuditLog.findOneAndUpdate({ _id: logId }, { $set: { action: "UPDATE" } });
        assert.fail("findOneAndUpdate query should have thrown an immutability error");
    } catch (err) {
        assert.ok(err.message.includes("immutable"), `Expected findOneAndUpdate block, got: ${err.message}`);
        console.log("✅ pre-findOneAndUpdate hook successfully blocked query update!");
    }

    // Test D: pre-remove / pre-deleteOne document middleware
    try {
        await doc.deleteOne();
        assert.fail("doc.deleteOne should have thrown an immutability error");
    } catch (err) {
        assert.ok(err.message.includes("immutable") || err.message.includes("cannot be deleted"), `Expected deleteOne block, got: ${err.message}`);
        console.log("✅ pre-delete/remove hook successfully blocked document deletion!");
    }

    // Test E: pre-deleteOne query middleware
    try {
        await AuditLog.deleteOne({ _id: logId });
        assert.fail("AuditLog.deleteOne query should have thrown an immutability error");
    } catch (err) {
        assert.ok(err.message.includes("immutable"), `Expected deleteOne block, got: ${err.message}`);
        console.log("✅ pre-deleteOne hook successfully blocked query deletion!");
    }

    console.log("✅ Log Immutability validated successfully!");
}

async function runGuard(permission, req) {
    const middleware = requirePermission(permission);
    let nextCalled = false;
    let statusCalled = null;
    let jsonResponse = null;

    const res = {
        status(code) {
            statusCalled = code;
            return this;
        },
        json(data) {
            jsonResponse = data;
            return this;
        }
    };

    const next = () => {
        nextCalled = true;
    };

    await middleware(req, res, next);
    return { nextCalled, statusCalled, jsonResponse };
}

async function testAccessControl() {
    console.log("\n3. Testing Access Gating (requirePermission)...");

    const superAdminId = new mongoose.Types.ObjectId().toString();
    const contentAdminId = new mongoose.Types.ObjectId().toString();

    // super_admin mock
    mockUserDoc = {
        _id: superAdminId,
        role: "super_admin",
        isActive: true,
        isBlocked: false,
        isDeleted: false
    };

    const superAdminReq = {
        headers: {
            "x-user-id": superAdminId,
            "x-user-role": "super_admin"
        }
    };

    const resSuper = await runGuard('audit-logs:read', superAdminReq);
    assert.ok(resSuper.nextCalled, "super_admin should be allowed 'audit-logs:read'");

    // content_admin mock
    mockUserDoc = {
        _id: contentAdminId,
        role: "content_admin",
        isActive: true,
        isBlocked: false,
        isDeleted: false
    };

    const contentAdminReq = {
        headers: {
            "x-user-id": contentAdminId,
            "x-user-role": "content_admin"
        }
    };

    const resContent = await runGuard('audit-logs:read', contentAdminReq);
    assert.strictEqual(resContent.nextCalled, false, "content_admin should be blocked from 'audit-logs:read'");
    assert.strictEqual(resContent.statusCalled, 403, "content_admin should return 403 Forbidden");
    assert.strictEqual(resContent.jsonResponse.error, "FORBIDDEN", "Error code should be FORBIDDEN");

    console.log("✅ Access Gating validated successfully!");
}

async function runAll() {
    console.log("=== STARTING COMPLIANCE & SECURITY VERIFICATION ===\n");
    try {
        await connectDB();
        const logId = await testPiiRedaction();
        await testImmutability(logId);
        await testAccessControl();
        console.log("\n🎉 ALL COMPLIANCE VERIFICATION TESTS PASSED SUCCESSFULLY!");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ COMPLIANCE TEST FAILED:", err);
        process.exit(1);
    }
}

runAll();
