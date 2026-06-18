import assert from "assert";
import { encrypt, decrypt } from "../src/utils/crypto.js";
import { generateAdminToken, verifyAdminToken } from "../src/middleware/adminAuth.js";

async function testCrypto() {
    console.log("Testing AES-256-GCM encryption/decryption...");
    
    // Set a dev key
    process.env.SECRET_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 64-hex chars (32 bytes)
    
    const plaintext = "my-secret-key-123";
    const encrypted = encrypt(plaintext);
    
    console.log(`- Plaintext: ${plaintext}`);
    console.log(`- Encrypted: ${encrypted}`);
    assert.ok(encrypted.includes(":"), "Ciphertext should be separated by colons");
    assert.strictEqual(encrypted.split(":").length, 3, "Ciphertext should have 3 parts (iv, data, tag)");
    
    const decrypted = decrypt(encrypted);
    console.log(`- Decrypted: ${decrypted}`);
    assert.strictEqual(decrypted, plaintext, "Decrypted text should match original plaintext");
    
    console.log("✅ Crypto test passed successfully!\n");
}

async function testJWTSecrets() {
    console.log("Testing JWT secret safety...");
    
    // Test that missing JWT_SECRET throws error
    delete process.env.JWT_SECRET;
    
    const mockUser = {
        _id: "60b8d29f1a2c3d4e5f6g7h89",
        role: "admin",
        email: "admin@renters.com"
    };
    
    try {
        generateAdminToken(mockUser);
        assert.fail("Should have thrown error because JWT_SECRET is not set");
    } catch (error) {
        console.log(`- generateAdminToken with missing key: ${error.message} (Expected error)`);
        assert.ok(error.message.includes("JWT_SECRET is not configured"), "Error message should report missing JWT_SECRET");
    }
    
    // Set secret and test normal generation/verification
    process.env.JWT_SECRET = "test-jwt-secret-min-32-chars-long-value-for-security";
    const token = generateAdminToken(mockUser);
    console.log(`- Generated Token: ${token.substring(0, 30)}...`);
    
    const decoded = verifyAdminToken(token);
    assert.ok(decoded, "Token should be verified successfully");
    assert.strictEqual(decoded.sub, mockUser._id, "Sub claim should match user ID");
    assert.strictEqual(decoded.role, mockUser.role, "Role claim should match user role");
    
    // Verify that using fallback secret fails
    delete process.env.JWT_SECRET;
    const decodedWithFallback = verifyAdminToken(token);
    assert.strictEqual(decodedWithFallback, null, "Should not verify token when JWT_SECRET is missing");
    
    console.log("✅ JWT secret safety test passed successfully!\n");
}

async function runAll() {
    console.log("=== STARTING SECURITY REMEDIATION VERIFICATION ===\n");
    try {
        await testCrypto();
        await testJWTSecrets();
        console.log("🎉 ALL AUTOMATED SECURITY TESTS PASSED!");
        process.exit(0);
    } catch (error) {
        console.error("❌ TEST FAILED:", error);
        process.exit(1);
    }
}

runAll();
