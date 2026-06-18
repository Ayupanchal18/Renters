import assert from "assert";
import mongoose from "mongoose";

// Setup test environment
process.env.NODE_ENV = 'development';
process.env.ALLOW_DEV_AUTH = 'true';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long-value-for-security';
process.env.MONGO_URI = 'mongodb://localhost:27017/dummy'; // Dummy to bypass verification check

// Import other dependencies dynamically so environment variables are loaded first
const { User } = await import("../models/User.js");
const { requirePermission } = await import("../src/middleware/permissionGuard.js");
const { generateAdminToken } = await import("../src/middleware/adminAuth.js");
// Mock MongoDB state so connectDB doesn't attempt to connect to a real instance
Object.defineProperty(mongoose.connection, 'readyState', {
    value: 1,
    writable: true,
    configurable: true
});

let mockUserDoc = null;

// Mock User.findById to return our mockUserDoc
User.findById = (id) => {
    return {
        lean: () => Promise.resolve(mockUserDoc)
    };
};

/**
 * Executes the permission guard middleware against a mock request and response.
 */
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

/**
 * Creates a mock request using JWT headers
 */
function createJwtRequest(user) {
    const token = generateAdminToken(user);
    return {
        headers: {
            authorization: `Bearer ${token}`
        }
    };
}

/**
 * Creates a mock request using Dev bypass headers
 */
function createDevHeadersRequest(user) {
    return {
        headers: {
            "x-user-id": user._id.toString(),
            "x-user-role": user.role
        }
    };
}

async function testSuperAdmin() {
    console.log("Testing super_admin role capabilities...");

    mockUserDoc = {
        _id: "60b8d29f1a2c3d4e5f6g7h89",
        name: "Super Admin",
        email: "super@renters.com",
        role: "super_admin",
        isBlocked: false,
        isActive: true,
        isDeleted: false
    };

    // Test JWT auth
    const reqJwt = createJwtRequest(mockUserDoc);
    
    // super_admin should have wildcard full access
    const res1 = await runGuard('users:read', reqJwt);
    assert.ok(res1.nextCalled, "super_admin should be allowed users:read");

    const res2 = await runGuard('settings:api-keys:reveal', reqJwt);
    assert.ok(res2.nextCalled, "super_admin should be allowed settings:api-keys:reveal");

    const res3 = await runGuard('cms:write', reqJwt);
    assert.ok(res3.nextCalled, "super_admin should be allowed cms:write");

    // Test Dev headers bypass
    const reqDev = createDevHeadersRequest(mockUserDoc);
    const resDev = await runGuard('settings:write', reqDev);
    assert.ok(resDev.nextCalled, "super_admin should be allowed settings:write under dev bypass");

    console.log("✅ super_admin tests passed!\n");
}

async function testLegacyAdmin() {
    console.log("Testing legacy admin role backward compatibility...");

    mockUserDoc = {
        _id: "60b8d29f1a2c3d4e5f6g7h80",
        name: "Legacy Admin",
        email: "admin@renters.com",
        role: "admin",
        isBlocked: false,
        isActive: true,
        isDeleted: false
    };

    // Test JWT auth
    const reqJwt = createJwtRequest(mockUserDoc);

    // admin should have wildcard full access
    const res1 = await runGuard('users:read', reqJwt);
    assert.ok(res1.nextCalled, "legacy admin should be allowed users:read");

    const res2 = await runGuard('settings:api-keys:reveal', reqJwt);
    assert.ok(res2.nextCalled, "legacy admin should be allowed settings:api-keys:reveal");

    // Test Dev headers bypass
    const reqDev = createDevHeadersRequest(mockUserDoc);
    const resDev = await runGuard('settings:write', reqDev);
    assert.ok(resDev.nextCalled, "legacy admin should be allowed settings:write under dev bypass");

    console.log("✅ legacy admin tests passed!\n");
}

async function testOpsAdmin() {
    console.log("Testing ops_admin role limits and access control...");

    mockUserDoc = {
        _id: "60b8d29f1a2c3d4e5f6g7h81",
        name: "Ops Admin",
        email: "ops@renters.com",
        role: "ops_admin",
        isBlocked: false,
        isActive: true,
        isDeleted: false
    };

    const reqJwt = createJwtRequest(mockUserDoc);

    // Allowed permissions
    const res1 = await runGuard('users:read', reqJwt);
    assert.ok(res1.nextCalled, "ops_admin should be allowed users:read");

    const res2 = await runGuard('reviews:moderate', reqJwt);
    assert.ok(res2.nextCalled, "ops_admin should be allowed reviews:moderate");

    const res3 = await runGuard('conversations:read', reqJwt);
    assert.ok(res3.nextCalled, "ops_admin should be allowed conversations:read");

    // Blocked permissions
    const res4 = await runGuard('settings:api-keys:reveal', reqJwt);
    assert.strictEqual(res4.nextCalled, false, "ops_admin should NOT be allowed settings:api-keys:reveal");
    assert.strictEqual(res4.statusCalled, 403, "ops_admin settings:api-keys:reveal should return 403");

    const res5 = await runGuard('cms:write', reqJwt);
    assert.strictEqual(res5.nextCalled, false, "ops_admin should NOT be allowed cms:write");
    assert.strictEqual(res5.statusCalled, 403, "ops_admin cms:write should return 403");

    // Test Dev headers bypass
    const reqDev = createDevHeadersRequest(mockUserDoc);
    const resDev = await runGuard('users:write', reqDev);
    assert.ok(resDev.nextCalled, "ops_admin should be allowed users:write under dev bypass");

    console.log("✅ ops_admin tests passed!\n");
}

async function testContentAdmin() {
    console.log("Testing content_admin role limits and access control...");

    mockUserDoc = {
        _id: "60b8d29f1a2c3d4e5f6g7h82",
        name: "Content Admin",
        email: "content@renters.com",
        role: "content_admin",
        isBlocked: false,
        isActive: true,
        isDeleted: false
    };

    const reqJwt = createJwtRequest(mockUserDoc);

    // Allowed permissions
    const res1 = await runGuard('cms:write', reqJwt);
    assert.ok(res1.nextCalled, "content_admin should be allowed cms:write");

    const res2 = await runGuard('testimonials:write', reqJwt);
    assert.ok(res2.nextCalled, "content_admin should be allowed testimonials:write");

    // Blocked permissions
    const res3 = await runGuard('conversations:read', reqJwt);
    assert.strictEqual(res3.nextCalled, false, "content_admin should NOT be allowed conversations:read");
    assert.strictEqual(res3.statusCalled, 403, "content_admin conversations:read should return 403");

    const res4 = await runGuard('users:write', reqJwt);
    assert.strictEqual(res4.nextCalled, false, "content_admin should NOT be allowed users:write");
    assert.strictEqual(res4.statusCalled, 403, "content_admin users:write should return 403");

    const res5 = await runGuard('users:delete', reqJwt);
    assert.strictEqual(res5.nextCalled, false, "content_admin should NOT be allowed users:delete");
    assert.strictEqual(res5.statusCalled, 403, "content_admin users:delete should return 403");

    // Test Dev headers bypass
    const reqDev = createDevHeadersRequest(mockUserDoc);
    const resDev = await runGuard('cms:read', reqDev);
    assert.ok(resDev.nextCalled, "content_admin should be allowed cms:read under dev bypass");

    console.log("✅ content_admin tests passed!\n");
}

async function testBlockedAndInactive() {
    console.log("Testing security flags (blocked, inactive, deleted)...");

    // 1. Blocked User
    mockUserDoc = {
        _id: "60b8d29f1a2c3d4e5f6g7h83",
        name: "Blocked Admin",
        email: "blocked@renters.com",
        role: "super_admin",
        isBlocked: true,
        isActive: true,
        isDeleted: false
    };
    const reqBlocked = createJwtRequest(mockUserDoc);
    const resBlocked = await runGuard('users:read', reqBlocked);
    assert.strictEqual(resBlocked.nextCalled, false, "Blocked admin should be rejected");
    assert.strictEqual(resBlocked.statusCalled, 403, "Blocked admin should get 403");

    // 2. Inactive User
    mockUserDoc = {
        _id: "60b8d29f1a2c3d4e5f6g7h84",
        name: "Inactive Admin",
        email: "inactive@renters.com",
        role: "super_admin",
        isBlocked: false,
        isActive: false,
        isDeleted: false
    };
    const reqInactive = createJwtRequest(mockUserDoc);
    const resInactive = await runGuard('users:read', reqInactive);
    assert.strictEqual(resInactive.nextCalled, false, "Inactive admin should be rejected");
    assert.strictEqual(resInactive.statusCalled, 403, "Inactive admin should get 403");

    // 3. Deleted User
    mockUserDoc = {
        _id: "60b8d29f1a2c3d4e5f6g7h85",
        name: "Deleted Admin",
        email: "deleted@renters.com",
        role: "super_admin",
        isBlocked: false,
        isActive: true,
        isDeleted: true
    };
    const reqDeleted = createJwtRequest(mockUserDoc);
    const resDeleted = await runGuard('users:read', reqDeleted);
    assert.strictEqual(resDeleted.nextCalled, false, "Deleted admin should be rejected");
    assert.strictEqual(resDeleted.statusCalled, 401, "Deleted admin should get 401");

    console.log("✅ Security flags tests passed!\n");
}

async function runAll() {
    console.log("=== STARTING RBAC PERMISSIONS VERIFICATION ===\n");
    try {
        await testSuperAdmin();
        await testLegacyAdmin();
        await testOpsAdmin();
        await testContentAdmin();
        await testBlockedAndInactive();
        console.log("🎉 ALL RBAC VERIFICATION TESTS PASSED SUCCESSFULLY!");
        process.exit(0);
    } catch (error) {
        console.error("❌ RBAC TEST FAILED:", error);
        process.exit(1);
    }
}

runAll();
