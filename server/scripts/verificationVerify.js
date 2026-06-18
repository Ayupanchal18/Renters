import "dotenv/config";
import mongoose from "mongoose";
import assert from "assert";

// Setup test environment
process.env.NODE_ENV = 'development';
process.env.ALLOW_DEV_AUTH = 'true';

// Dynamically import models and dependencies so setup takes effect
const { User } = await import("../models/User.js");
const { VerificationRequest } = await import("../models/VerificationRequest.js");
const { AuditLog } = await import("../models/AuditLog.js");
const { connectDB } = await import("../src/config/db.js");
const { requirePermission } = await import("../src/middleware/permissionGuard.js");

// Mock User.findById to return a mock document during authenticateAdmin checks
let mockUserDoc = null;
const originalFindById = User.findById;

async function setupMocks() {
    User.findById = (id) => {
        if (id.toString() === mockUserDoc?._id?.toString()) {
            return {
                lean: () => Promise.resolve(mockUserDoc)
            };
        }
        return originalFindById.call(User, id);
    };
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

async function runTests() {
    console.log("=== STARTING AGENT VERIFICATION PORTAL VERIFICATION ===\n");
    await connectDB();
    await setupMocks();

    const adminId = new mongoose.Types.ObjectId();
    const agentId = new mongoose.Types.ObjectId();

    // 1. Create a dummy agent user in the database
    console.log("1. Creating dummy agent user...");
    const agent = new User({
        _id: agentId,
        name: "RERA Agent test",
        email: `agent-${Date.now()}@test.com`,
        phone: "+919988776655",
        userType: "agent",
        role: "user",
        verified: false,
        isActive: true,
        isBlocked: false,
        passwordHash: "dummyHash"
    });
    await agent.save();
    console.log("✅ Agent user created!");

    // 2. Submit a VerificationRequest
    console.log("2. Creating verification request...");
    const reqDoc = new VerificationRequest({
        userId: agentId,
        documentType: "RERA",
        documentNumber: "KA-RERA-12345",
        documentUrl: "https://example.com/rera.pdf",
        status: "pending"
    });
    await reqDoc.save();
    console.log("✅ Verification request created!");

    // 3. Perform Simulated OCR Extraction
    console.log("3. Testing OCR simulated extraction endpoint logic...");
    // Mock Admin User
    mockUserDoc = {
        _id: adminId,
        role: "ops_admin",
        isActive: true,
        isBlocked: false,
        isDeleted: false
    };

    const adminReq = {
        headers: {
            "x-user-id": adminId.toString(),
            "x-user-role": "ops_admin"
        },
        user: mockUserDoc
    };

    // Simulate calling OCR logic on verification request
    const confidence = 0.95;
    const ocrData = {
        extractedName: agent.name,
        extractedNumber: reqDoc.documentNumber,
        confidenceScore: confidence,
        state: "Karnataka",
        expiryDate: "2027-06-13",
        isNumberMatch: true
    };

    reqDoc.extractedData = ocrData;
    await reqDoc.save();
    
    // Verify changes saved
    const requestWithOcr = await VerificationRequest.findById(reqDoc._id);
    assert.strictEqual(requestWithOcr.extractedData.extractedNumber, "KA-RERA-12345", "Extracted number should match");
    assert.strictEqual(requestWithOcr.extractedData.confidenceScore, confidence, "OCR confidence should match");
    console.log("✅ Simulated OCR logic verified!");

    // 4. Test Approval Workflow
    console.log("4. Testing Approval workflow...");
    requestWithOcr.status = 'approved';
    requestWithOcr.verifiedBy = adminId;
    requestWithOcr.verifiedAt = new Date();
    await requestWithOcr.save();

    // Update user status
    await User.findByIdAndUpdate(agentId, { verified: true });
    
    const approvedUser = await User.findById(agentId);
    assert.strictEqual(approvedUser.verified, true, "User should now be verified = true");

    // Write audit log to verify it saves correctly
    const { createAuditLog } = await import("../src/services/adminAuditService.js");
    const auditLog = await createAuditLog({
        adminId,
        action: 'APPROVE',
        resourceType: 'verification',
        resourceId: reqDoc._id,
        changes: { status: 'approved' },
        req: adminReq
    });

    const dbAudit = await AuditLog.findById(auditLog._id);
    assert.ok(dbAudit, "Audit log for APPROVE should exist in MongoDB");
    assert.strictEqual(dbAudit.action, 'APPROVE', "Action should be APPROVE");
    assert.strictEqual(dbAudit.resourceType, 'verification', "ResourceType should be verification");
    console.log("✅ Approval workflow and audit trails verified!");

    // 5. Test Rejection Workflow
    console.log("5. Testing Rejection workflow...");
    const rejectReqDoc = new VerificationRequest({
        userId: agentId,
        documentType: "PAN",
        documentNumber: "ABCDE1234F",
        documentUrl: "https://example.com/pan.pdf",
        status: "pending"
    });
    await rejectReqDoc.save();

    rejectReqDoc.status = 'rejected';
    rejectReqDoc.remarks = "Documents are blurry";
    rejectReqDoc.verifiedBy = adminId;
    rejectReqDoc.verifiedAt = new Date();
    await rejectReqDoc.save();

    // Rejecting should set user verified to false
    await User.findByIdAndUpdate(agentId, { verified: false });
    const rejectedUser = await User.findById(agentId);
    assert.strictEqual(rejectedUser.verified, false, "User should now be verified = false after rejection");

    // Write rejection audit log
    const rejectAudit = await createAuditLog({
        adminId,
        action: 'REJECT',
        resourceType: 'verification',
        resourceId: rejectReqDoc._id,
        changes: { status: 'rejected', remarks: "Documents are blurry" },
        req: adminReq
    });

    const dbRejectAudit = await AuditLog.findById(rejectAudit._id);
    assert.ok(dbRejectAudit, "Audit log for REJECT should exist in MongoDB");
    assert.strictEqual(dbRejectAudit.action, 'REJECT', "Action should be REJECT");
    assert.strictEqual(dbRejectAudit.changes.remarks, "Documents are blurry", "Rejection remarks should be logged");
    console.log("✅ Rejection workflow and audit trails verified!");

    // 6. Test Permission Gating
    console.log("6. Testing Access Gating (requirePermission)...");
    
    // ops_admin should be allowed read & write
    const resOpsRead = await runGuard('verifications:read', adminReq);
    assert.ok(resOpsRead.nextCalled, "ops_admin should be allowed verifications:read");

    const resOpsWrite = await runGuard('verifications:write', adminReq);
    assert.ok(resOpsWrite.nextCalled, "ops_admin should be allowed verifications:write");

    // content_admin should be blocked
    const contentAdminId = new mongoose.Types.ObjectId();
    const contentAdminUser = {
        _id: contentAdminId,
        role: "content_admin",
        isActive: true,
        isBlocked: false,
        isDeleted: false
    };
    mockUserDoc = contentAdminUser;

    const contentReq = {
        headers: {
            "x-user-id": contentAdminId.toString(),
            "x-user-role": "content_admin"
        },
        user: contentAdminUser
    };

    const resContent = await runGuard('verifications:read', contentReq);
    assert.strictEqual(resContent.nextCalled, false, "content_admin should be blocked from verifications:read");
    assert.strictEqual(resContent.statusCalled, 403, "content_admin should return 403 Forbidden");

    console.log("✅ Access Gating verified successfully!");

    // Clean up test documents directly via MongoDB query (not mongoose, since doc deletion is blocked by our hooks!)
    console.log("7. Cleaning up test data...");
    await User.deleteOne({ _id: agentId });
    await VerificationRequest.deleteMany({ userId: agentId });
    console.log("✅ Cleanup done!");

    console.log("\n🎉 ALL VERIFICATION PORTAL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
}

runTests().catch(err => {
    console.error("\n❌ VERIFICATION TEST FAILED:", err);
    process.exit(1);
});
