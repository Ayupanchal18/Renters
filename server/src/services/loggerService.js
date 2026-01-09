/**
 * Centralized Logging Service
 * Provides structured JSON logging with request correlation and sensitive data filtering
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.6
 */

/* ---------------------- LOG LEVELS ---------------------- */
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

/* ---------------------- CONFIGURATION ---------------------- */
const config = {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    enableStructuredLogs: process.env.ENABLE_STRUCTURED_LOGGING !== 'false',
    enableConsolePassthrough: true // Keep console methods working for backward compatibility
};

/* ---------------------- SENSITIVE DATA PATTERNS ---------------------- */
const SENSITIVE_PATTERNS = [
    // Password fields
    /password/i,
    /passwd/i,
    /pwd/i,
    /secret/i,
    // Token fields
    /token/i,
    /jwt/i,
    /bearer/i,
    /authorization/i,
    /apikey/i,
    /api_key/i,
    // OTP/verification codes
    /otp/i,
    /verification_code/i,
    /verificationCode/i,
    /code/i,
    // PII fields
    /ssn/i,
    /social_security/i,
    /credit_card/i,
    /creditCard/i,
    /cvv/i,
    /pin/i
];

const SENSITIVE_VALUE_PATTERNS = [
    // JWT tokens (header.payload.signature format)
    /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    // Bearer tokens
    /^Bearer\s+.+$/i,
    // 6-digit OTP codes
    /^\d{6}$/
];

/* ---------------------- SENSITIVE DATA FILTERING ---------------------- */

/**
 * Check if a field name is sensitive
 * @param {string} fieldName - The field name to check
 * @returns {boolean} - True if the field is sensitive
 */
function isSensitiveField(fieldName) {
    if (typeof fieldName !== 'string') return false;
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName));
}

/**
 * Check if a value looks like sensitive data
 * @param {*} value - The value to check
 * @returns {boolean} - True if the value appears sensitive
 */
function isSensitiveValue(value) {
    if (typeof value !== 'string') return false;
    return SENSITIVE_VALUE_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Mask a sensitive value
 * @param {*} value - The value to mask
 * @returns {string} - Masked value
 */
function maskValue(value) {
    if (typeof value !== 'string') return '[REDACTED]';
    if (value.length <= 4) return '[REDACTED]';
    // Show first 2 and last 2 characters for debugging
    return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
}

/**
 * Mask email addresses (show first char and domain)
 * @param {string} email - Email to mask
 * @returns {string} - Masked email
 */
function maskEmail(email) {
    if (typeof email !== 'string' || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 1) return `*@${domain}`;
    return `${local[0]}***@${domain}`;
}

/**
 * Mask phone numbers (show last 4 digits)
 * @param {string} phone - Phone number to mask
 * @returns {string} - Masked phone
 */
function maskPhone(phone) {
    if (typeof phone !== 'string') return phone;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '[REDACTED]';
    return `***${digits.slice(-4)}`;
}

/**
 * Filter sensitive data from an object recursively
 * @param {*} obj - Object to filter
 * @param {Set} seen - Set of seen objects (for circular reference detection)
 * @returns {*} - Filtered object
 */
function filterSensitiveData(obj, seen = new Set()) {
    if (obj === null || obj === undefined) return obj;

    // Handle primitives
    if (typeof obj !== 'object') {
        if (isSensitiveValue(obj)) {
            return maskValue(obj);
        }
        return obj;
    }

    // Handle circular references
    if (seen.has(obj)) {
        return '[Circular Reference]';
    }
    seen.add(obj);

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => filterSensitiveData(item, seen));
    }

    // Handle Error objects
    if (obj instanceof Error) {
        return {
            name: obj.name,
            message: obj.message,
            stack: obj.stack
        };
    }

    // Handle regular objects
    const filtered = {};
    for (const [key, value] of Object.entries(obj)) {
        if (isSensitiveField(key)) {
            filtered[key] = '[REDACTED]';
        } else if (key === 'email' && typeof value === 'string') {
            filtered[key] = maskEmail(value);
        } else if ((key === 'phone' || key === 'phoneNumber') && typeof value === 'string') {
            filtered[key] = maskPhone(value);
        } else if (typeof value === 'object') {
            filtered[key] = filterSensitiveData(value, seen);
        } else if (isSensitiveValue(value)) {
            filtered[key] = maskValue(value);
        } else {
            filtered[key] = value;
        }
    }

    return filtered;
}

/* ---------------------- LOG ENTRY CREATION ---------------------- */

/**
 * Create a structured log entry
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {Object} - Structured log entry
 */
function createLogEntry(level, message, context = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message
    };

    // Add requestId if available in context
    if (context.requestId) {
        entry.requestId = context.requestId;
    }

    // Add other context fields (filtered for sensitive data)
    const { requestId, ...otherContext } = context;
    if (Object.keys(otherContext).length > 0) {
        const filteredContext = filterSensitiveData(otherContext);
        Object.assign(entry, filteredContext);
    }

    return entry;
}

/**
 * Format log entry for output
 * @param {Object} entry - Log entry
 * @returns {string} - Formatted log string
 */
function formatLogEntry(entry) {
    if (config.enableStructuredLogs) {
        return JSON.stringify(entry);
    }

    // Human-readable format for development
    const { timestamp, level, message, requestId, ...rest } = entry;
    let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (requestId) {
        formatted += ` (${requestId})`;
    }
    if (Object.keys(rest).length > 0) {
        formatted += ` ${JSON.stringify(rest)}`;
    }
    return formatted;
}

/**
 * Check if a log level should be output based on current configuration
 * @param {string} level - Log level to check
 * @returns {boolean} - True if the level should be logged
 */
function shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
}

/* ---------------------- LOGGER IMPLEMENTATION ---------------------- */

// Store original console methods for passthrough
const originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console)
};

/**
 * Main logger object
 */
const logger = {
    /**
     * Log a debug message
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     */
    debug(message, context = {}) {
        if (!shouldLog('debug')) return;
        const entry = createLogEntry('debug', message, context);
        originalConsole.debug(formatLogEntry(entry));
    },

    /**
     * Log an info message
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     */
    info(message, context = {}) {
        if (!shouldLog('info')) return;
        const entry = createLogEntry('info', message, context);
        originalConsole.info(formatLogEntry(entry));
    },

    /**
     * Log a warning message
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     */
    warn(message, context = {}) {
        if (!shouldLog('warn')) return;
        const entry = createLogEntry('warn', message, context);
        originalConsole.warn(formatLogEntry(entry));
    },

    /**
     * Log an error message
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     * @param {Error} error - Optional error object
     */
    error(message, context = {}, error = null) {
        if (!shouldLog('error')) return;

        const errorContext = { ...context };
        if (error) {
            errorContext.error = {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }

        const entry = createLogEntry('error', message, errorContext);
        originalConsole.error(formatLogEntry(entry));
    },

    /**
     * Create a child logger with preset context (e.g., requestId)
     * @param {Object} baseContext - Context to include in all logs
     * @returns {Object} - Child logger instance
     */
    child(baseContext = {}) {
        return {
            debug: (message, context = {}) => logger.debug(message, { ...baseContext, ...context }),
            info: (message, context = {}) => logger.info(message, { ...baseContext, ...context }),
            warn: (message, context = {}) => logger.warn(message, { ...baseContext, ...context }),
            error: (message, context = {}, error = null) => logger.error(message, { ...baseContext, ...context }, error)
        };
    },

    /**
     * Set the log level
     * @param {string} level - New log level
     */
    setLevel(level) {
        if (LOG_LEVELS[level] !== undefined) {
            config.level = level;
        }
    },

    /**
     * Get current log level
     * @returns {string} - Current log level
     */
    getLevel() {
        return config.level;
    },

    /**
     * Enable or disable structured logging
     * @param {boolean} enabled - Whether to enable structured logs
     */
    setStructuredLogging(enabled) {
        config.enableStructuredLogs = enabled;
    }
};

/* ---------------------- CONSOLE WRAPPER ---------------------- */

/**
 * Wrap console methods to use structured logging
 * This provides backward compatibility with existing console.log calls
 */
function wrapConsoleMethods() {
    if (!config.enableConsolePassthrough) return;

    console.log = (...args) => {
        if (config.enableStructuredLogs) {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(filterSensitiveData(arg)) : String(arg)
            ).join(' ');
            logger.info(message);
        } else {
            originalConsole.log(...args);
        }
    };

    console.info = (...args) => {
        if (config.enableStructuredLogs) {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(filterSensitiveData(arg)) : String(arg)
            ).join(' ');
            logger.info(message);
        } else {
            originalConsole.info(...args);
        }
    };

    console.warn = (...args) => {
        if (config.enableStructuredLogs) {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(filterSensitiveData(arg)) : String(arg)
            ).join(' ');
            logger.warn(message);
        } else {
            originalConsole.warn(...args);
        }
    };

    console.error = (...args) => {
        if (config.enableStructuredLogs) {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(filterSensitiveData(arg)) : String(arg)
            ).join(' ');
            logger.error(message);
        } else {
            originalConsole.error(...args);
        }
    };

    console.debug = (...args) => {
        if (config.enableStructuredLogs) {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(filterSensitiveData(arg)) : String(arg)
            ).join(' ');
            logger.debug(message);
        } else {
            originalConsole.debug(...args);
        }
    };
}

/**
 * Restore original console methods
 */
function restoreConsoleMethods() {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
}

/* ---------------------- EXPORTS ---------------------- */

export {
    logger,
    filterSensitiveData,
    isSensitiveField,
    isSensitiveValue,
    maskValue,
    maskEmail,
    maskPhone,
    createLogEntry,
    wrapConsoleMethods,
    restoreConsoleMethods,
    originalConsole,
    LOG_LEVELS
};

export default logger;
