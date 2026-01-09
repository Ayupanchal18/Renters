/**
 * Enhanced XSS Sanitization Module
 * 
 * This module provides comprehensive XSS pattern detection and sanitization.
 * It extends the existing sanitizeInput function with additional security measures.
 * 
 * Requirements: 9.5
 */

/**
 * Dangerous XSS patterns to detect and neutralize
 * These patterns cover common XSS attack vectors
 */
const XSS_PATTERNS = [
    // Script tags (various forms)
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<script[^>]*>/gi,
    /<\/script>/gi,

    // Event handlers (onclick, onerror, onload, etc.)
    /\bon\w+\s*=/gi,

    // JavaScript protocol
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /data\s*:\s*text\/html/gi,

    // Expression and behavior (IE-specific)
    /expression\s*\(/gi,
    /behavior\s*:/gi,

    // Embedded objects
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<applet\b[^>]*>/gi,

    // iframes
    /<iframe\b[^>]*>/gi,

    // Form hijacking
    /<form\b[^>]*>/gi,

    // Base tag hijacking
    /<base\b[^>]*>/gi,

    // Link with javascript
    /<link\b[^>]*>/gi,

    // Meta refresh/redirect
    /<meta\b[^>]*http-equiv\s*=\s*["']?refresh/gi,

    // SVG with scripts
    /<svg\b[^>]*onload/gi,
    /<svg\b[^>]*>/gi,

    // Math ML attacks
    /<math\b[^>]*>/gi,

    // Style with expression
    /style\s*=\s*["'][^"']*expression/gi,
    /style\s*=\s*["'][^"']*javascript/gi,

    // HTML entities that could be used for obfuscation
    /&#x?[0-9a-f]+;?/gi,
];

/**
 * Dangerous attribute patterns
 */
const DANGEROUS_ATTRIBUTES = [
    'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover',
    'onmousemove', 'onmouseout', 'onmouseenter', 'onmouseleave',
    'onkeydown', 'onkeypress', 'onkeyup',
    'onload', 'onerror', 'onabort', 'onunload', 'onbeforeunload',
    'onfocus', 'onblur', 'onchange', 'oninput', 'onsubmit', 'onreset',
    'onscroll', 'onresize', 'onhashchange',
    'ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop',
    'oncopy', 'oncut', 'onpaste',
    'onanimationstart', 'onanimationend', 'onanimationiteration',
    'ontransitionend',
    'oncontextmenu', 'onwheel',
    'onpointerdown', 'onpointerup', 'onpointermove', 'onpointerenter', 'onpointerleave',
    'ontouchstart', 'ontouchend', 'ontouchmove', 'ontouchcancel',
    'formaction', 'xlink:href', 'href', 'src', 'data', 'action'
];

/**
 * Check if a string contains potential XSS patterns
 * @param {string} input - String to check
 * @returns {boolean} True if XSS patterns detected
 */
export function containsXSSPatterns(input) {
    if (typeof input !== 'string') return false;

    // Check against all XSS patterns
    for (const pattern of XSS_PATTERNS) {
        if (pattern.test(input)) {
            // Reset regex lastIndex for global patterns
            pattern.lastIndex = 0;
            return true;
        }
        pattern.lastIndex = 0;
    }

    return false;
}

/**
 * Basic HTML entity encoding for special characters
 * @param {string} input - String to encode
 * @returns {string} Encoded string
 */
export function encodeHTMLEntities(input) {
    if (typeof input !== 'string') return input;

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/`/g, '&#x60;')
        .replace(/=/g, '&#x3D;');
}

/**
 * Remove dangerous HTML tags and attributes
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
export function stripDangerousTags(input) {
    if (typeof input !== 'string') return input;

    let sanitized = input;

    // Remove script tags and content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove other dangerous tags
    const dangerousTags = ['script', 'object', 'embed', 'applet', 'iframe', 'frame',
        'frameset', 'base', 'form', 'input', 'button', 'select',
        'textarea', 'link', 'style', 'meta'];

    for (const tag of dangerousTags) {
        const openTagRegex = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
        const closeTagRegex = new RegExp(`</${tag}>`, 'gi');
        sanitized = sanitized.replace(openTagRegex, '');
        sanitized = sanitized.replace(closeTagRegex, '');
    }

    // Remove event handlers from remaining tags
    for (const attr of DANGEROUS_ATTRIBUTES) {
        const attrRegex = new RegExp(`\\s*${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
        sanitized = sanitized.replace(attrRegex, '');

        // Also handle unquoted attributes
        const unquotedRegex = new RegExp(`\\s*${attr}\\s*=\\s*[^\\s>]+`, 'gi');
        sanitized = sanitized.replace(unquotedRegex, '');
    }

    // Remove javascript: and vbscript: protocols
    sanitized = sanitized.replace(/javascript\s*:/gi, '');
    sanitized = sanitized.replace(/vbscript\s*:/gi, '');
    sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, '');

    return sanitized;
}

/**
 * Enhanced sanitize input function
 * Provides comprehensive XSS protection while preserving safe content
 * 
 * @param {string} input - String to sanitize
 * @param {Object} options - Sanitization options
 * @param {boolean} [options.encodeAll=false] - Encode all HTML entities (strictest)
 * @param {boolean} [options.stripTags=true] - Strip dangerous tags
 * @param {boolean} [options.allowBasicHTML=false] - Allow basic safe HTML tags
 * @returns {string} Sanitized string
 */
export function sanitizeInputEnhanced(input, options = {}) {
    if (typeof input !== 'string') return input;

    const {
        encodeAll = false,
        stripTags = true,
        allowBasicHTML = false
    } = options;

    let sanitized = input;

    // Option 1: Encode all HTML entities (strictest mode)
    if (encodeAll) {
        return encodeHTMLEntities(sanitized);
    }

    // Option 2: Strip dangerous tags but allow basic HTML
    if (stripTags) {
        sanitized = stripDangerousTags(sanitized);
    }

    // If not allowing basic HTML, encode remaining angle brackets
    if (!allowBasicHTML) {
        // Encode any remaining < and > that might be part of incomplete tags
        sanitized = sanitized
            .replace(/<(?![a-zA-Z\/])/g, '&lt;')
            .replace(/(?<![a-zA-Z"'])>/g, '&gt;');
    }

    // Always remove null bytes and other control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
}


/**
 * Sanitize an object recursively
 * @param {Object} obj - Object to sanitize
 * @param {Object} options - Sanitization options
 * @param {Array<string>} [options.skipFields=[]] - Fields to skip (e.g., passwords)
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj, options = {}) {
    if (!obj || typeof obj !== 'object') return obj;

    const { skipFields = ['password', 'passwordHash', 'token', 'refreshToken'] } = options;

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

        const value = obj[key];

        // Skip specified fields
        if (skipFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            sanitized[key] = value;
            continue;
        }

        if (typeof value === 'string') {
            sanitized[key] = sanitizeInputEnhanced(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'string'
                    ? sanitizeInputEnhanced(item)
                    : typeof item === 'object'
                        ? sanitizeObject(item, options)
                        : item
            );
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value, options);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Express middleware for enhanced XSS sanitization
 * Sanitizes request body, query, and params
 * 
 * @param {Object} options - Middleware options
 * @param {boolean} [options.sanitizeBody=true] - Sanitize request body
 * @param {boolean} [options.sanitizeQuery=true] - Sanitize query parameters
 * @param {boolean} [options.sanitizeParams=true] - Sanitize URL parameters
 * @param {Array<string>} [options.skipFields=[]] - Fields to skip
 * @returns {Function} Express middleware
 */
export function xssSanitizationMiddleware(options = {}) {
    const {
        sanitizeBody = true,
        sanitizeQuery = true,
        sanitizeParams = true,
        skipFields = ['password', 'passwordHash', 'token', 'refreshToken', 'secret']
    } = options;

    return (req, res, next) => {
        try {
            if (sanitizeBody && req.body && typeof req.body === 'object') {
                req.body = sanitizeObject(req.body, { skipFields });
            }

            if (sanitizeQuery && req.query && typeof req.query === 'object') {
                req.query = sanitizeObject(req.query, { skipFields });
            }

            if (sanitizeParams && req.params && typeof req.params === 'object') {
                req.params = sanitizeObject(req.params, { skipFields });
            }

            next();
        } catch (error) {
            console.error('XSS sanitization error:', error);
            next(); // Continue even if sanitization fails
        }
    };
}

/**
 * Validate that input doesn't contain XSS patterns
 * Returns validation result instead of sanitizing
 * 
 * @param {string} input - String to validate
 * @returns {{valid: boolean, patterns: string[]}} Validation result
 */
export function validateNoXSS(input) {
    if (typeof input !== 'string') {
        return { valid: true, patterns: [] };
    }

    const detectedPatterns = [];

    for (const pattern of XSS_PATTERNS) {
        if (pattern.test(input)) {
            detectedPatterns.push(pattern.source);
        }
        pattern.lastIndex = 0;
    }

    return {
        valid: detectedPatterns.length === 0,
        patterns: detectedPatterns
    };
}

/**
 * Create a Zod transformer that sanitizes string input
 * Use with Zod schemas for automatic sanitization during validation
 * 
 * @param {Object} options - Sanitization options
 * @returns {Function} Zod transform function
 */
export function createSanitizeTransform(options = {}) {
    return (val) => {
        if (typeof val !== 'string') return val;
        return sanitizeInputEnhanced(val, options);
    };
}

export default {
    containsXSSPatterns,
    encodeHTMLEntities,
    stripDangerousTags,
    sanitizeInputEnhanced,
    sanitizeObject,
    xssSanitizationMiddleware,
    validateNoXSS,
    createSanitizeTransform,
    XSS_PATTERNS,
    DANGEROUS_ATTRIBUTES
};
