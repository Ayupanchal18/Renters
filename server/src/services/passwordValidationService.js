import bcrypt from 'bcryptjs';

/**
 * Enhanced Password Validation Service
 * Handles password strength validation, blacklist checking, and history prevention
 */

// Comprehensive blacklist of common passwords
const COMMON_PASSWORDS = [
    // Basic patterns
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'admin123', 'root', 'user', 'guest', 'test', 'demo',

    // Keyboard patterns
    'qwerty123', 'asdf1234', 'zxcvbn', '1qaz2wsx', 'qwertyuiop',
    'asdfghjkl', 'zxcvbnm123',

    // Common substitutions
    'p@ssw0rd', 'passw0rd', '123qwe', 'qwe123', 'abc123!', 'password!',
    'admin!23', 'qwerty!23',

    // Sequential patterns
    '12345678', '87654321', 'abcdefgh', 'zyxwvuts', '11111111', '00000000',

    // Common phrases
    'welcome', 'welcome123', 'letmein', 'monkey', 'dragon', 'master',
    'shadow', 'superman', 'batman', 'football', 'baseball', 'basketball',
    'princess', 'sunshine', 'iloveyou', 'trustno1', 'freedom', 'whatever',

    // Years and dates
    '2020', '2021', '2022', '2023', '2024', '2025', '1234', '0000', '1111', '2222',
    '19901990', '20002000', '12345', '54321',

    // Company/service related
    'google', 'facebook', 'twitter', 'instagram', 'linkedin', 'microsoft',
    'apple', 'amazon', 'netflix', 'youtube', 'gmail', 'yahoo', 'hotmail',

    // Names and places (common ones)
    'john', 'mike', 'david', 'chris', 'alex', 'sarah', 'jennifer', 'jessica',
    'london', 'paris', 'newyork', 'california', 'texas', 'florida'
];

// Personal information patterns to avoid
const PERSONAL_INFO_PATTERNS = [
    /^(admin|user|guest|test|demo)/i,
    /^(name|email|phone|address)/i,
    /(birthday|birth|date)/i,
    /(company|work|office)/i,
    /(login|signin|signup)/i
];

/**
 * Validate password strength and security requirements
 * Simplified validation: just minimum 6 characters
 * @param {string} password - The password to validate
 * @param {Object} userInfo - User information (unused, kept for API compatibility)
 * @returns {Object} Validation result
 */
export function validatePasswordStrength(password, userInfo = {}) {
    const errors = [];
    const warnings = [];

    // Simple length requirement only
    if (password.length < 6) {
        errors.push("Password must be at least 6 characters long");
    }

    // Calculate simple strength score
    const score = calculatePasswordScore(password);
    const strength = getStrengthLevel(score);

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        score,
        strength,
        requirements: {
            minLength: password.length >= 6
        }
    };
}

/**
 * Check if password is in the blacklist
 * @param {string} password - Password to check
 * @returns {boolean} True if password is blacklisted
 */
function isCommonPassword(password) {
    const lowerPassword = password.toLowerCase();

    // Direct match
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
        return true;
    }

    // Check if password contains common patterns
    return COMMON_PASSWORDS.some(common => {
        if (common.length >= 4) {
            // Check if common pattern is a significant part of the password
            return lowerPassword.includes(common) &&
                (lowerPassword.length <= common.length + 3); // Allow some variation
        }
        return false;
    });
}

/**
 * Check if password contains personal information
 * @param {string} password - Password to check
 * @param {Object} userInfo - User information
 * @returns {boolean} True if contains personal info
 */
function containsPersonalInfo(password, userInfo) {
    const lowerPassword = password.toLowerCase();

    // Check against personal info patterns
    if (PERSONAL_INFO_PATTERNS.some(pattern => pattern.test(lowerPassword))) {
        return true;
    }

    // Check against user's name
    if (userInfo.name) {
        const nameParts = userInfo.name.toLowerCase().split(/\s+/);
        for (const part of nameParts) {
            if (part.length >= 3 && lowerPassword.includes(part)) {
                return true;
            }
        }
    }

    // Check against email username
    if (userInfo.email) {
        const emailUsername = userInfo.email.toLowerCase().split('@')[0];
        if (emailUsername.length >= 3 && lowerPassword.includes(emailUsername)) {
            return true;
        }
    }

    return false;
}

/**
 * Calculate password strength score (0-100)
 * @param {string} password - Password to score
 * @returns {number} Score from 0-100
 */
function calculatePasswordScore(password) {
    let score = 0;

    // Base requirements (50 points)
    if (password.length >= 8) score += 10;
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*(),.?":{}|<>[\]\\\/~`_+=\-]/.test(password)) score += 10;

    // Length bonuses (20 points)
    if (password.length >= 12) score += 5;
    if (password.length >= 16) score += 5;
    if (password.length >= 20) score += 10;

    // Character variety (15 points)
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 8) score += 5;
    if (uniqueChars >= 12) score += 5;
    if (uniqueChars >= 16) score += 5;

    // Multiple character types (10 points)
    const charTypes = [
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /\d/.test(password),
        /[!@#$%^&*(),.?":{}|<>]/.test(password),
        /[[\]\\\/~`_+=\-]/.test(password)
    ].filter(Boolean).length;

    if (charTypes >= 4) score += 5;
    if (charTypes >= 5) score += 5;

    // Pattern complexity (5 points)
    if (!hasRepeatingPatterns(password)) score += 2.5;
    if (!hasSequentialPatterns(password)) score += 2.5;

    // Penalties
    if (hasRepeatingChars(password)) score -= 10;
    if (hasKeyboardPatterns(password)) score -= 15;
    if (isCommonPassword(password)) score -= 20;

    return Math.max(0, Math.min(100, score));
}

/**
 * Check for repeating characters (3+ consecutive)
 */
function hasRepeatingChars(password) {
    return /(.)\1{2,}/.test(password);
}

/**
 * Check for repeating patterns
 */
function hasRepeatingPatterns(password) {
    for (let i = 2; i <= password.length / 2; i++) {
        const pattern = password.substring(0, i);
        const repeated = pattern.repeat(Math.floor(password.length / i));
        if (password.startsWith(repeated) && repeated.length >= 4) {
            return true;
        }
    }
    return false;
}

/**
 * Check for sequential patterns
 */
function hasSequentialPatterns(password) {
    const sequences = [
        '0123456789', 'abcdefghijklmnopqrstuvwxyz',
        'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
    ];
    const lowerPassword = password.toLowerCase();

    return sequences.some(seq => {
        for (let i = 0; i <= seq.length - 4; i++) {
            const subseq = seq.substring(i, i + 4);
            const reverseSubseq = subseq.split('').reverse().join('');
            if (lowerPassword.includes(subseq) || lowerPassword.includes(reverseSubseq)) {
                return true;
            }
        }
        return false;
    });
}

/**
 * Check for keyboard patterns
 */
function hasKeyboardPatterns(password) {
    const keyboardPatterns = [
        'qwerty', 'asdfgh', 'zxcvbn', '123456', '1qaz2wsx', 'qazwsx',
        'qwertyui', 'asdfghjk', 'zxcvbnm'
    ];
    const lowerPassword = password.toLowerCase();

    return keyboardPatterns.some(pattern =>
        lowerPassword.includes(pattern) ||
        lowerPassword.includes(pattern.split('').reverse().join(''))
    );
}

/**
 * Get strength level from score
 */
function getStrengthLevel(score) {
    if (score < 30) return 'weak';
    if (score < 50) return 'fair';
    if (score < 70) return 'good';
    if (score < 85) return 'strong';
    return 'excellent';
}

/**
 * Check if password was used recently (password history)
 * @param {string} newPassword - New password to check
 * @param {Array} passwordHistory - Array of previous password hashes
 * @param {number} historyLimit - Number of previous passwords to check (default 5)
 * @returns {Promise<boolean>} True if password was used recently
 */
export async function checkPasswordHistory(newPassword, passwordHistory = [], historyLimit = 5) {
    if (!passwordHistory || passwordHistory.length === 0) {
        return false;
    }

    // Check against the last N passwords
    const recentPasswords = passwordHistory
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, historyLimit);

    for (const historyEntry of recentPasswords) {
        const isMatch = await bcrypt.compare(newPassword, historyEntry.hash);
        if (isMatch) {
            return true;
        }
    }

    return false;
}

/**
 * Add password to history
 * @param {Array} passwordHistory - Current password history
 * @param {string} passwordHash - New password hash to add
 * @param {number} maxHistory - Maximum number of passwords to keep (default 10)
 * @returns {Array} Updated password history
 */
export function addToPasswordHistory(passwordHistory = [], passwordHash, maxHistory = 10) {
    const newEntry = {
        hash: passwordHash,
        createdAt: new Date()
    };

    // Add new entry and keep only the most recent entries
    const updatedHistory = [newEntry, ...passwordHistory]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, maxHistory);

    return updatedHistory;
}

/**
 * Clean old password history entries
 * @param {Array} passwordHistory - Current password history
 * @param {number} maxAgeMonths - Maximum age in months (default 12)
 * @returns {Array} Cleaned password history
 */
export function cleanPasswordHistory(passwordHistory = [], maxAgeMonths = 12) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - maxAgeMonths);

    return passwordHistory.filter(entry =>
        new Date(entry.createdAt) > cutoffDate
    );
}

export default {
    validatePasswordStrength,
    checkPasswordHistory,
    addToPasswordHistory,
    cleanPasswordHistory
};