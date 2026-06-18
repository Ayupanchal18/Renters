import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

/**
 * Derives a consistent 32-byte key from the environment secret.
 * Hashing the raw key ensures we always obtain a valid 256-bit buffer.
 */
const getEncryptionKey = () => {
    const rawKey = process.env.SECRET_ENCRYPTION_KEY || "temporary-dev-encryption-key-must-be-replaced-in-prod-32-chars";
    return crypto.createHash("sha256").update(rawKey).digest();
};

/**
 * Encrypt a plaintext string using AES-256-GCM
 * @param {string} text - Plaintext string to encrypt
 * @returns {string} - Ciphertext in the format iv:encryptedData:authTag
 */
export function encrypt(text) {
    if (typeof text !== "string") {
        text = JSON.stringify(text);
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    
    return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

/**
 * Decrypt a ciphertext string back to plaintext
 * @param {string} cipherText - Ciphertext in the format iv:encryptedData:authTag
 * @returns {string} - Decrypted plaintext string
 */
export function decrypt(cipherText) {
    if (!cipherText || typeof cipherText !== "string" || !cipherText.includes(":")) {
        return cipherText;
    }
    
    try {
        const parts = cipherText.split(":");
        if (parts.length !== 3) {
            return cipherText; // Not in encrypted format
        }
        
        const [ivHex, encryptedHex, authTagHex] = parts;
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const key = getEncryptionKey();
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedHex, "hex", "utf8");
        decrypted += decipher.final("utf8");
        
        try {
            return JSON.parse(decrypted);
        } catch {
            return decrypted;
        }
    } catch (error) {
        console.error("Decryption failed:", error.message);
        throw new Error("Failed to decrypt configuration value");
    }
}
