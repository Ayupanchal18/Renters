/**
 * Comprehensive Password Validation Utility
 * Implements password strength checking, requirements validation, and blacklist checking
 */

// Comprehensive list of common passwords to blacklist
const COMMON_PASSWORDS = [
    // Basic patterns
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'admin123', 'root', 'user', 'guest', 'test', 'demo',

    // Keyboard patterns
    'qwerty123', 'asdf1234', 'zxcvbn', '1qaz2wsx', 'qwertyuiop',

    // Common substitutions
    'p@ssw0rd', 'passw0rd', '123qwe', 'qwe123', 'abc123!',

    // Sequential patterns
    '12345678', '87654321', 'abcdefgh', 'zyxwvuts',

    // Common phrases
    'welcome', 'welcome123', 'letmein', 'monkey', 'dragon',
    'master', 'shadow', 'superman', 'batman', 'football',

    // Years and dates
    '2023', '2024', '2025', '1234', '0000', '1111', '2222',

    // Company/service related
    'google', 'facebook', 'twitter', 'instagram', 'linkedin',
    'microsoft', 'apple', 'amazon', 'netflix'
];

// Common personal information patterns to avoid
const PERSONAL_INFO_PATTERNS = [
    /^(admin|user|guest|test|demo)/i,
    /^(name|email|phone|address)/i,
    /(birthday|birth|date)/i,
    /(company|work|office)/i
];

/**
 * Validate password strength and requirements
 * Simplified: just minimum 6 characters
 * @param {string} password - The password to validate
 * @param {Object} userInfo - Optional user information (unused, kept for API compatibility)
 * @returns {Object} Validation result with requirements, score, and feedback
 */
export function validatePasswordStrength(password, userInfo = {}) {
    if (!password) {
        return {
            isValid: false,
            score: 0,
            strength: 'none',
            requirements: {},
            errors: ['Password is required'],
            suggestions: []
        };
    }

    // Simple requirement: minimum 6 characters
    const requirements = {
        minLength: password.length >= 6
    };

    // Simple score based on length
    let score = 0;
    if (password.length >= 6) score = 50;
    if (password.length >= 8) score = 70;
    if (password.length >= 10) score = 85;
    if (password.length >= 12) score = 100;

    // Determine strength level based on length
    let strength = 'weak';
    if (password.length >= 12) strength = 'excellent';
    else if (password.length >= 10) strength = 'strong';
    else if (password.length >= 8) strength = 'good';
    else if (password.length >= 6) strength = 'fair';

    // Check if password meets requirement
    const isValid = requirements.minLength;

    // Generate error messages
    const errors = isValid ? [] : ['Password must be at least 6 characters long'];

    return {
        isValid,
        score,
        strength,
        requirements,
        errors,
        suggestions: [],
        feedback: {
            color: getStrengthColor(strength),
            message: getStrengthMessage(strength, score)
        }
    };
}

/**
 * Check if password is in the common passwords blacklist
 * @param {string} password - Password to check
 * @returns {boolean} True if password is common/blacklisted
 */
function isCommonPassword(password) {
    const lowerPassword = password.toLowerCase();

    // Direct match with common passwords
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
        return true;
    }

    // Check if password contains common patterns
    return COMMON_PASSWORDS.some(common => {
        // Check if password starts or ends with common pattern
        return lowerPassword.startsWith(common) ||
            lowerPassword.endsWith(common) ||
            // Check if common pattern is a significant part of the password
            (common.length >= 4 && lowerPassword.includes(common));
    });
}

/**
 * Check if password contains personal information
 * @param {string} password - Password to check
 * @param {Object} userInfo - User information (name, email, etc.)
 * @returns {boolean} True if password contains personal info
 */
function containsPersonalInfo(password, userInfo) {
    const lowerPassword = password.toLowerCase();

    // Check against personal info patterns
    if (PERSONAL_INFO_PATTERNS.some(pattern => pattern.test(lowerPassword))) {
        return true;
    }

    // Check against provided user information
    if (userInfo.name && lowerPassword.includes(userInfo.name.toLowerCase())) {
        return true;
    }

    if (userInfo.email) {
        const emailParts = userInfo.email.toLowerCase().split('@')[0];
        if (emailParts.length >= 3 && lowerPassword.includes(emailParts)) {
            return true;
        }
    }

    return false;
}

/**
 * Calculate password strength score
 * @param {string} password - Password to score
 * @param {Object} requirements - Requirements check results
 * @returns {number} Score from 0-100
 */
function calculatePasswordScore(password, requirements) {
    let score = 0;

    // Base score for meeting requirements (60 points total)
    if (requirements.minLength) score += 10;
    if (requirements.hasUppercase) score += 10;
    if (requirements.hasLowercase) score += 10;
    if (requirements.hasNumber) score += 10;
    if (requirements.hasSpecialChar) score += 10;
    if (requirements.notCommon) score += 10;

    // Bonus points for additional complexity (40 points total)

    // Length bonus
    if (password.length >= 12) score += 5;
    if (password.length >= 16) score += 5;
    if (password.length >= 20) score += 5;

    // Character variety bonus
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 8) score += 5;
    if (uniqueChars >= 12) score += 5;

    // Multiple character types bonus
    const charTypes = [
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /\d/.test(password),
        /[!@#$%^&*(),.?":{}|<>]/.test(password),
        /[[\]\\\/~`_+=\-]/.test(password)
    ].filter(Boolean).length;

    if (charTypes >= 4) score += 5;
    if (charTypes >= 5) score += 5;

    // Pattern complexity bonus
    if (!hasRepeatingPatterns(password)) score += 5;
    if (!hasSequentialPatterns(password)) score += 5;

    // Penalties
    if (hasRepeatingChars(password)) score -= 10;
    if (hasKeyboardPatterns(password)) score -= 15;

    return Math.max(0, Math.min(100, score));
}

/**
 * Check for repeating characters
 * @param {string} password - Password to check
 * @returns {boolean} True if has repeating characters
 */
function hasRepeatingChars(password) {
    return /(.)\1{2,}/.test(password); // 3 or more consecutive same characters
}

/**
 * Check for repeating patterns
 * @param {string} password - Password to check
 * @returns {boolean} True if has repeating patterns
 */
function hasRepeatingPatterns(password) {
    // Check for patterns like "abcabc" or "123123"
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
 * @param {string} password - Password to check
 * @returns {boolean} True if has sequential patterns
 */
function hasSequentialPatterns(password) {
    const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    const lowerPassword = password.toLowerCase();

    return sequences.some(seq => {
        for (let i = 0; i <= seq.length - 4; i++) {
            const subseq = seq.substring(i, i + 4);
            if (lowerPassword.includes(subseq) || lowerPassword.includes(subseq.split('').reverse().join(''))) {
                return true;
            }
        }
        return false;
    });
}

/**
 * Check for keyboard patterns
 * @param {string} password - Password to check
 * @returns {boolean} True if has keyboard patterns
 */
function hasKeyboardPatterns(password) {
    const keyboardPatterns = [
        'qwerty', 'asdfgh', 'zxcvbn', '123456', '1qaz2wsx', 'qazwsx'
    ];
    const lowerPassword = password.toLowerCase();

    return keyboardPatterns.some(pattern =>
        lowerPassword.includes(pattern) ||
        lowerPassword.includes(pattern.split('').reverse().join(''))
    );
}

/**
 * Get strength level from score
 * @param {number} score - Password score
 * @returns {string} Strength level
 */
function getStrengthLevel(score) {
    if (score < 30) return 'weak';
    if (score < 50) return 'fair';
    if (score < 70) return 'good';
    if (score < 85) return 'strong';
    return 'excellent';
}

/**
 * Get color for strength level
 * @param {string} strength - Strength level
 * @returns {Object} Color classes
 */
function getStrengthColor(strength) {
    const colors = {
        weak: { text: 'text-red-600', bg: 'bg-red-500', border: 'border-red-300' },
        fair: { text: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-300' },
        good: { text: 'text-yellow-600', bg: 'bg-yellow-500', border: 'border-yellow-300' },
        strong: { text: 'text-blue-600', bg: 'bg-blue-500', border: 'border-blue-300' },
        excellent: { text: 'text-green-600', bg: 'bg-green-500', border: 'border-green-300' }
    };
    return colors[strength] || colors.weak;
}

/**
 * Get strength message
 * @param {string} strength - Strength level
 * @param {number} score - Password score
 * @returns {string} Strength message
 */
function getStrengthMessage(strength, score) {
    const messages = {
        weak: 'Very weak - easily guessed',
        fair: 'Weak - could be stronger',
        good: 'Good - meets basic requirements',
        strong: 'Strong - well protected',
        excellent: 'Excellent - very secure'
    };
    return `${messages[strength]} (${score}/100)`;
}

/**
 * Generate error messages for failed requirements
 * @param {Object} requirements - Requirements check results
 * @returns {Array} Array of error messages
 */
function generateErrorMessages(requirements) {
    const errors = [];

    if (!requirements.minLength) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!requirements.hasUppercase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!requirements.hasLowercase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!requirements.hasNumber) {
        errors.push('Password must contain at least one number');
    }
    if (!requirements.hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }
    if (!requirements.notCommon) {
        errors.push('Password is too common - please choose a more unique password');
    }
    if (!requirements.notPersonal) {
        errors.push('Password should not contain personal information');
    }

    return errors;
}

/**
 * Generate suggestions for password improvement
 * @param {string} password - Current password
 * @param {Object} requirements - Requirements check results
 * @param {number} score - Current score
 * @returns {Array} Array of suggestions
 */
function generateSuggestions(password, requirements, score) {
    const suggestions = [];

    if (password.length < 12) {
        suggestions.push('Consider using a longer password (12+ characters)');
    }

    if (!requirements.hasSpecialChar || !/[[\]\\\/~`_+=\-]/.test(password)) {
        suggestions.push('Add more variety of special characters');
    }

    if (score < 70) {
        suggestions.push('Avoid common words and patterns');
        suggestions.push('Mix uppercase, lowercase, numbers, and symbols');
    }

    if (hasRepeatingChars(password)) {
        suggestions.push('Avoid repeating the same character multiple times');
    }

    if (hasKeyboardPatterns(password)) {
        suggestions.push('Avoid keyboard patterns like "qwerty" or "123456"');
    }

    if (suggestions.length === 0 && score < 85) {
        suggestions.push('Consider adding more characters for even better security');
    }

    return suggestions;
}

/**
 * Check if password was used recently (for password history)
 * This would typically check against a server-side password history
 * @param {string} password - New password
 * @param {Array} passwordHistory - Array of previous password hashes
 * @returns {Promise<boolean>} True if password was used recently
 */
export async function checkPasswordHistory(password, passwordHistory = []) {
    // This is a placeholder - in a real implementation, you would:
    // 1. Hash the new password
    // 2. Compare against stored password hashes
    // 3. Check server-side password history

    // For now, return false (password not in history)
    // This should be implemented server-side for security
    return false;
}

/**
 * Generate a strong password suggestion
 * @param {number} length - Desired password length (default 12)
 * @returns {string} Generated strong password
 */
export function generateStrongPassword(length = 12) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*(),.?":{}|<>[]\\~`_+=';

    const allChars = lowercase + uppercase + numbers + symbols;

    let password = '';

    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

export default {
    validatePasswordStrength,
    checkPasswordHistory,
    generateStrongPassword
};