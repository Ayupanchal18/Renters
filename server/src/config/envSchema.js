/**
 * Environment Variable Validation Schema
 * Validates all required and optional environment variables at server startup
 * 
 * Requirements: 6.3, 6.4, 6.5
 */

import { z } from 'zod';

/**
 * Environment variable schema using Zod
 * Defines required variables, optional variables with defaults, and format validation
 */
export const envSchema = z.object({
    // ========================
    // REQUIRED VARIABLES
    // ========================

    /**
     * MongoDB connection URI
     * Must be a valid MongoDB connection string
     */
    MONGO_URI: z.string({
        required_error: 'MONGO_URI is required. Please set it in your .env file.',
        invalid_type_error: 'MONGO_URI must be a string'
    }).min(1, 'MONGO_URI cannot be empty')
        .refine(
            (uri) => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
            'MONGO_URI must be a valid MongoDB connection string (mongodb:// or mongodb+srv://)'
        ),

    /**
     * JWT Secret for token signing
     * Must be at least 32 characters for security
     */
    JWT_SECRET: z.string({
        required_error: 'JWT_SECRET is required. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"',
        invalid_type_error: 'JWT_SECRET must be a string'
    }).min(32, 'JWT_SECRET must be at least 32 characters for security'),

    // ========================
    // OPTIONAL WITH DEFAULTS
    // ========================

    /**
     * Node environment
     */
    NODE_ENV: z.enum(['development', 'production', 'test'])
        .default('development'),

    /**
     * Server port
     */
    PORT: z.coerce.number()
        .int('PORT must be an integer')
        .min(1, 'PORT must be at least 1')
        .max(65535, 'PORT must be at most 65535')
        .default(3000),

    /**
     * Database name
     */
    DB_NAME: z.string().default('renters'),

    /**
     * Log level for the logging system
     */
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error'])
        .optional(),

    /**
     * Enable structured JSON logging
     */
    ENABLE_STRUCTURED_LOGGING: z.string()
        .transform(val => val !== 'false')
        .optional(),

    /**
     * CORS allowed origins (comma-separated)
     */
    ALLOWED_ORIGINS: z.string().optional(),

    /**
     * Audit logging for all requests
     */
    AUDIT_LOG_ALL_REQUESTS: z.string()
        .transform(val => val === 'true')
        .optional(),

    /**
     * Request logging configuration
     */
    LOG_REQUEST_START: z.string()
        .transform(val => val !== 'false')
        .optional(),

    SLOW_REQUEST_THRESHOLD_MS: z.coerce.number()
        .int()
        .min(0)
        .optional(),

    // ========================
    // OPTIONAL SERVICES
    // ========================

    /**
     * Cloudinary configuration (for image uploads)
     */
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    /**
     * Email service configuration (SMTP)
     */
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    SMTP_SECURE: z.string()
        .transform(val => val === 'true')
        .optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),

    /**
     * Phone.email service configuration
     */
    PHONE_EMAIL_API_KEY: z.string().optional(),
    PHONE_EMAIL_API_URL: z.string().url().optional(),

    /**
     * Twilio SMS configuration
     */
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),

    /**
     * OAuth configuration
     */
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    FACEBOOK_APP_ID: z.string().optional(),
    FACEBOOK_APP_SECRET: z.string().optional(),

    /**
     * Vite frontend variables
     */
    VITE_API_BASE_URL: z.string().url().optional(),
    VITE_GOOGLE_CLIENT_ID: z.string().optional(),
    VITE_FACEBOOK_APP_ID: z.string().optional(),

    /**
     * Maps API keys
     */
    MAPBOX_API_KEY: z.string().optional(),
    GOOGLE_MAPS_API_KEY: z.string().optional(),

    /**
     * AWS S3 configuration
     */
    AWS_S3_BUCKET: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),

    /**
     * Ping message for health check
     */
    PING_MESSAGE: z.string().optional(),

    /**
     * Development auth bypass (DANGEROUS - only for local dev)
     */
    ALLOW_DEV_AUTH: z.string()
        .transform(val => val === 'true')
        .optional(),

    /**
     * Strict environment validation mode
     */
    STRICT_ENV_VALIDATION: z.string()
        .transform(val => val === 'true')
        .optional()
});

/**
 * Custom error class for environment validation failures
 */
export class EnvValidationError extends Error {
    constructor(zodError) {
        const issues = zodError.issues.map(issue => {
            const path = issue.path.join('.');
            return `  - ${path || 'root'}: ${issue.message}`;
        }).join('\n');

        super(`Environment validation failed:\n${issues}`);
        this.name = 'EnvValidationError';
        this.issues = zodError.issues;
    }
}

/**
 * Validate environment variables against the schema
 * @returns {Object} Validated and typed environment configuration
 * @throws {EnvValidationError} If validation fails
 */
export function validateEnv() {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        throw new EnvValidationError(result.error);
    }

    return result.data;
}

/**
 * Get a safe representation of the environment config for logging
 * Masks sensitive values like secrets and tokens
 * @param {Object} config - Validated environment configuration
 * @returns {Object} Safe config object for logging
 */
export function getSafeConfigForLogging(config) {
    const safeConfig = { ...config };

    // List of sensitive keys to mask
    const sensitiveKeys = [
        'JWT_SECRET',
        'MONGO_URI',
        'CLOUDINARY_API_SECRET',
        'SMTP_PASS',
        'PHONE_EMAIL_API_KEY',
        'TWILIO_AUTH_TOKEN',
        'GOOGLE_CLIENT_SECRET',
        'FACEBOOK_APP_SECRET',
        'AWS_SECRET_ACCESS_KEY',
        'CLOUDINARY_API_KEY',
        'TWILIO_ACCOUNT_SID'
    ];

    for (const key of sensitiveKeys) {
        if (safeConfig[key]) {
            const value = String(safeConfig[key]);
            if (value.length > 8) {
                safeConfig[key] = `${value.substring(0, 4)}****${value.substring(value.length - 4)}`;
            } else {
                safeConfig[key] = '****';
            }
        }
    }

    return safeConfig;
}

/**
 * Check if all required environment variables are set (quick check without full validation)
 * @returns {Object} Object with isValid boolean and missing array
 */
export function checkRequiredEnvVars() {
    const required = ['MONGO_URI', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    return {
        isValid: missing.length === 0,
        missing
    };
}

export default {
    envSchema,
    validateEnv,
    getSafeConfigForLogging,
    checkRequiredEnvVars,
    EnvValidationError
};
