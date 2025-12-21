import { Router } from "express";
import { z } from "zod";
import configurationValidator from "../src/services/configurationValidator.js";
import enhancedOTPManager from "../src/services/enhancedOTPManager.js";
import phoneEmailService from "../src/services/phoneEmailService.js";
import smsService from "../src/services/smsService.js";
import emailService from "../src/services/emailService.js";
import { connectDB } from "../src/config/db.js";
import { logVerificationEvent } from "../src/utils/auditUtils.js";

const router = Router();

/* ---------------------- SCHEMAS ---------------------- */
const testConfigurationSchema = z.object({
    serviceName: z.enum(["phone-email", "twilio", "smtp"]).optional(),
    method: z.enum(["sms", "email"]).optional()
});

const testDeliverySchema = z.object({
    serviceName: z.enum(["phone-email", "twilio", "smtp"]).optional(),
    method: z.enum(["sms", "email"]),
    contact: z.string().min(1),
    testMessage: z.string().optional()
});

const connectivityTestSchema = z.object({
    serviceName: z.enum(["phone-email", "twilio", "smtp"])
});

/* ---------------------- AUTHORIZATION MIDDLEWARE ---------------------- */
const requireAdminAuth = (req, res, next) => {
    const userId = req.headers["x-user-id"];
    const adminKey = req.headers["x-admin-key"];

    // Check for admin authorization
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
        return res.status(403).json({
            success: false,
            error: "Forbidden",
            message: "Administrative access required for configuration testing"
        });
    }

    if (!userId) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized",
            message: "User authentication required"
        });
    }

    req.userId = userId;
    next();
};

/* ---------------------- RATE LIMITING FOR TEST ENDPOINTS ---------------------- */
const testRateLimitMap = new Map();
const TEST_RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_TEST_REQUESTS_PER_WINDOW = 10; // More permissive for testing

const testRateLimitMiddleware = (req, res, next) => {
    const userId = req.userId || req.ip;
    const now = Date.now();
    const windowStart = now - TEST_RATE_LIMIT_WINDOW;

    if (!testRateLimitMap.has(userId)) {
        testRateLimitMap.set(userId, []);
    }

    const requests = testRateLimitMap.get(userId);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    testRateLimitMap.set(userId, validRequests);

    if (validRequests.length >= MAX_TEST_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
            success: false,
            error: "Test rate limit exceeded",
            message: `Too many test requests. Please wait ${Math.ceil(TEST_RATE_LIMIT_WINDOW / 60000)} minutes before trying again.`,
            retryAfter: Math.ceil((validRequests[0] + TEST_RATE_LIMIT_WINDOW - now) / 1000)
        });
    }

    validRequests.push(now);
    testRateLimitMap.set(userId, validRequests);
    next();
};

/* ---------------------- HELPER FUNCTIONS ---------------------- */
const validateContact = (method, contact) => {
    if (method === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(contact);
    } else if (method === 'sms') {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(contact);
    }
    return false;
};

const generateDiagnosticInfo = (serviceName, validationResult, testResult = null) => {
    const diagnostics = {
        serviceName,
        displayName: getServiceDisplayName(serviceName),
        timestamp: new Date().toISOString(),
        configuration: {
            configured: validationResult.success,
            credentialsValid: validationResult.details?.credentialsValid || false,
            connectivitySuccessful: validationResult.details?.connectivitySuccessful || false,
            capabilities: validationResult.details?.capabilities || [],
            priority: validationResult.details?.priority || null
        },
        troubleshooting: []
    };

    // Add troubleshooting guidance based on validation results
    if (!validationResult.success) {
        if (validationResult.details?.configured === false) {
            diagnostics.troubleshooting.push({
                issue: "Service not configured",
                solution: `Configure ${serviceName} service credentials in environment variables`,
                severity: "critical",
                requiredEnvVars: getRequiredEnvVars(serviceName)
            });
        } else if (validationResult.details?.credentialsValid === false) {
            diagnostics.troubleshooting.push({
                issue: "Invalid credentials",
                solution: "Verify API credentials are correct and active",
                severity: "critical",
                checkList: [
                    "Verify API key/credentials are not expired",
                    "Check for typos in environment variables",
                    "Ensure account is active and in good standing"
                ]
            });
        } else if (validationResult.details?.connectivityFailed) {
            diagnostics.troubleshooting.push({
                issue: "Connectivity failed",
                solution: "Check network connectivity and service endpoints",
                severity: "high",
                checkList: [
                    "Verify internet connectivity",
                    "Check firewall settings",
                    "Confirm service endpoints are accessible",
                    "Review service status pages"
                ]
            });
        }
    }

    // Add test delivery results if available
    if (testResult) {
        diagnostics.testDelivery = {
            success: testResult.success,
            duration: testResult.duration,
            messageId: testResult.messageId,
            error: testResult.error,
            testMode: testResult.testMode || false
        };

        if (!testResult.success) {
            diagnostics.troubleshooting.push({
                issue: "Test delivery failed",
                solution: "Review test delivery error and service configuration",
                severity: "medium",
                error: testResult.error,
                suggestions: [
                    "Verify recipient contact information format",
                    "Check service rate limits",
                    "Review service-specific error codes"
                ]
            });
        }
    }

    return diagnostics;
};

const getServiceDisplayName = (serviceName) => {
    const displayNames = {
        'phone-email': 'Phone.email',
        'twilio': 'Twilio SMS',
        'smtp': 'SMTP Email'
    };
    return displayNames[serviceName] || serviceName;
};

const getRequiredEnvVars = (serviceName) => {
    const envVars = {
        'phone-email': ['PHONE_EMAIL_API_KEY', 'PHONE_EMAIL_API_URL'],
        'twilio': ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
        'smtp': ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
    };
    return envVars[serviceName] || [];
};

/* ---------------------- VALIDATE ALL CONFIGURATIONS ENDPOINT ---------------------- */
router.get("/validate-all", requireAdminAuth, async (req, res) => {
    try {
        await connectDB();

        console.log(`Configuration validation requested by admin user: ${req.userId}`);

        // Run comprehensive validation
        const validationResult = await configurationValidator.validateAllServices();

        // Log the validation event
        await logVerificationEvent(req.userId, 'configuration', 'validation_all', validationResult.success, {
            totalServices: validationResult.summary?.totalServices || 0,
            validServices: validationResult.summary?.validServices || 0,
            invalidServices: validationResult.summary?.invalidServices || 0
        }, req);

        // Generate detailed diagnostics for each service
        const diagnostics = {};
        if (validationResult.services) {
            for (const [serviceName, serviceResult] of Object.entries(validationResult.services)) {
                diagnostics[serviceName] = generateDiagnosticInfo(serviceName, serviceResult);
            }
        }

        res.json({
            success: validationResult.success,
            message: validationResult.success ?
                "All service configurations validated successfully" :
                "Some service configurations have issues",
            validation: validationResult,
            diagnostics,
            recommendations: validationResult.summary?.recommendedActions || [],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Configuration validation error:", error);

        await logVerificationEvent(req.userId, 'configuration', 'validation_failed', false, {
            error: error.message
        }, req);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to validate service configurations",
            troubleshooting: [
                "Check server logs for detailed error information",
                "Verify database connectivity",
                "Ensure all required services are accessible"
            ]
        });
    }
});

/* ---------------------- VALIDATE SPECIFIC SERVICE ENDPOINT ---------------------- */
router.post("/validate-service", requireAdminAuth, async (req, res) => {
    try {
        await connectDB();

        const data = testConfigurationSchema.parse(req.body);
        const { serviceName } = data;

        if (!serviceName) {
            return res.status(400).json({
                success: false,
                error: "Missing service name",
                message: "Service name is required for validation"
            });
        }

        console.log(`Service validation requested for ${serviceName} by admin user: ${req.userId}`);

        // Validate specific service
        const validationResult = await configurationValidator.validateService(serviceName);

        // Log the validation event
        await logVerificationEvent(req.userId, 'configuration', 'validation_service', validationResult.success, {
            serviceName,
            configured: validationResult.details?.configured || false
        }, req);

        // Generate diagnostics
        const diagnostics = generateDiagnosticInfo(serviceName, validationResult);

        res.json({
            success: validationResult.success,
            message: validationResult.success ?
                `${getServiceDisplayName(serviceName)} configuration is valid` :
                `${getServiceDisplayName(serviceName)} configuration has issues`,
            serviceName,
            validation: validationResult,
            diagnostics,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Service validation error:", error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Validation error",
                message: "Invalid service validation request",
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to validate service configuration"
        });
    }
});

/* ---------------------- TEST CONNECTIVITY ENDPOINT ---------------------- */
router.post("/test-connectivity", requireAdminAuth, testRateLimitMiddleware, async (req, res) => {
    try {
        await connectDB();

        const data = connectivityTestSchema.parse(req.body);
        const { serviceName } = data;

        console.log(`Connectivity test requested for ${serviceName} by admin user: ${req.userId}`);

        // First validate the service configuration
        const validationResult = await configurationValidator.validateService(serviceName);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: "Service not properly configured",
                message: `Cannot test connectivity for ${getServiceDisplayName(serviceName)} - configuration issues detected`,
                validation: validationResult,
                diagnostics: generateDiagnosticInfo(serviceName, validationResult)
            });
        }

        // Test connectivity based on service type
        let connectivityResult;

        if (serviceName === 'phone-email') {
            connectivityResult = await phoneEmailService.validateCredentials();
        } else if (serviceName === 'twilio') {
            connectivityResult = await smsService.validateCredentials();
        } else if (serviceName === 'smtp') {
            // For SMTP, check if service is ready
            connectivityResult = {
                success: emailService.isReady(),
                error: emailService.isReady() ? null : 'SMTP service not ready'
            };
        } else {
            return res.status(400).json({
                success: false,
                error: "Unknown service",
                message: `Service ${serviceName} is not supported`
            });
        }

        // Log the connectivity test
        await logVerificationEvent(req.userId, 'configuration', 'connectivity_test', connectivityResult.success, {
            serviceName,
            accountInfo: connectivityResult.accountInfo || null
        }, req);

        // Generate diagnostics
        const diagnostics = generateDiagnosticInfo(serviceName, validationResult);
        diagnostics.connectivity = {
            success: connectivityResult.success,
            error: connectivityResult.error,
            accountInfo: connectivityResult.accountInfo || null,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: connectivityResult.success,
            message: connectivityResult.success ?
                `${getServiceDisplayName(serviceName)} connectivity test successful` :
                `${getServiceDisplayName(serviceName)} connectivity test failed`,
            serviceName,
            connectivity: connectivityResult,
            diagnostics,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Connectivity test error:", error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Validation error",
                message: "Invalid connectivity test request",
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to test service connectivity"
        });
    }
});

/* ---------------------- TEST DELIVERY ENDPOINT ---------------------- */
router.post("/test-delivery", requireAdminAuth, testRateLimitMiddleware, async (req, res) => {
    try {
        await connectDB();

        const data = testDeliverySchema.parse(req.body);
        const { serviceName, method, contact, testMessage } = data;

        // Validate contact format
        if (!validateContact(method, contact)) {
            return res.status(400).json({
                success: false,
                error: "Invalid contact format",
                message: `Please provide a valid ${method === 'email' ? 'email address' : 'phone number'}`,
                troubleshooting: [
                    method === 'email' ?
                        "Email format: user@domain.com" :
                        "Phone format: +1234567890 or (123) 456-7890"
                ]
            });
        }

        console.log(`Test delivery requested for ${serviceName || 'auto'} ${method} by admin user: ${req.userId}`);

        // Use enhanced OTP manager for test delivery
        const testResult = await enhancedOTPManager.testDelivery(method, contact, serviceName);

        // Log the test delivery
        await logVerificationEvent(req.userId, method, 'test_delivery', testResult.success, {
            serviceName: serviceName || 'auto',
            contact: method === 'email' ? contact : 'hidden',
            testMode: true,
            results: testResult.results?.length || 0
        }, req);

        // Generate comprehensive diagnostics
        const diagnostics = {
            testDelivery: {
                method,
                contact: method === 'email' ? contact : contact.replace(/\d/g, '*'),
                requestedService: serviceName || 'auto',
                timestamp: new Date().toISOString(),
                message: testMessage || `Test ${method} delivery to verify configuration`
            },
            results: testResult.results || [],
            summary: testResult.summary || {},
            troubleshooting: []
        };

        // Add troubleshooting guidance based on results
        if (!testResult.success) {
            diagnostics.troubleshooting.push({
                issue: "Test delivery failed",
                solution: "Review individual service results and configuration",
                severity: "high",
                checkList: [
                    "Verify service configurations are valid",
                    "Check recipient contact information",
                    "Review service-specific error messages",
                    "Ensure services are not rate-limited"
                ]
            });
        }

        // Add service-specific troubleshooting
        if (testResult.results) {
            testResult.results.forEach(result => {
                if (!result.success) {
                    diagnostics.troubleshooting.push({
                        issue: `${getServiceDisplayName(result.serviceName)} test failed`,
                        solution: result.error,
                        severity: "medium",
                        serviceName: result.serviceName,
                        suggestions: getServiceSpecificTroubleshooting(result.serviceName, result.error)
                    });
                }
            });
        }

        res.json({
            success: testResult.success,
            message: testResult.success ?
                "Test delivery completed successfully" :
                "Test delivery encountered issues",
            testResult,
            diagnostics,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Test delivery error:", error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Validation error",
                message: "Invalid test delivery request",
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to execute test delivery"
        });
    }
});

/* ---------------------- GET SERVICE STATUS ENDPOINT ---------------------- */
router.get("/service-status", requireAdminAuth, async (req, res) => {
    try {
        // Get comprehensive service status
        const serviceStatus = configurationValidator.getServiceStatus();
        const healthMetrics = configurationValidator.getHealthMetrics();
        const availableServices = configurationValidator.getAvailableServices('both');

        // Get service performance metrics from enhanced OTP manager
        const performanceMetrics = enhancedOTPManager.getServiceMetrics();

        res.json({
            success: true,
            message: "Service status retrieved successfully",
            services: serviceStatus,
            health: healthMetrics,
            available: availableServices,
            performance: performanceMetrics,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Get service status error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve service status"
        });
    }
});

/* ---------------------- GET DIAGNOSTIC INFORMATION ENDPOINT ---------------------- */
router.get("/diagnostics", requireAdminAuth, async (req, res) => {
    try {
        const serviceName = req.query.service;

        // Get validation results
        const validationResults = await configurationValidator.validateAllServices();

        // Generate diagnostics for all services or specific service
        const diagnostics = {};

        if (serviceName) {
            // Specific service diagnostics
            const serviceResult = validationResults.services?.[serviceName];
            if (!serviceResult) {
                return res.status(404).json({
                    success: false,
                    error: "Service not found",
                    message: `Service ${serviceName} not found`
                });
            }

            diagnostics[serviceName] = generateDiagnosticInfo(serviceName, serviceResult);
        } else {
            // All services diagnostics
            if (validationResults.services) {
                for (const [svcName, serviceResult] of Object.entries(validationResults.services)) {
                    diagnostics[svcName] = generateDiagnosticInfo(svcName, serviceResult);
                }
            }
        }

        // Add system-wide diagnostics
        const systemDiagnostics = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            totalServices: Object.keys(diagnostics).length,
            healthyServices: Object.values(diagnostics).filter(d => d.configuration.configured).length,
            recommendations: validationResults.summary?.recommendedActions || [],
            commonIssues: [
                {
                    issue: "Missing environment variables",
                    solution: "Ensure all required environment variables are set",
                    affectedServices: Object.entries(diagnostics)
                        .filter(([, d]) => d.troubleshooting.some(t => t.issue.includes("not configured")))
                        .map(([name]) => name)
                },
                {
                    issue: "Network connectivity problems",
                    solution: "Check firewall settings and internet connectivity",
                    affectedServices: Object.entries(diagnostics)
                        .filter(([, d]) => d.troubleshooting.some(t => t.issue.includes("Connectivity failed")))
                        .map(([name]) => name)
                }
            ].filter(issue => issue.affectedServices.length > 0)
        };

        res.json({
            success: true,
            message: "Diagnostic information retrieved successfully",
            diagnostics,
            system: systemDiagnostics,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Get diagnostics error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve diagnostic information"
        });
    }
});

/* ---------------------- HELPER FUNCTION FOR SERVICE-SPECIFIC TROUBLESHOOTING ---------------------- */
const getServiceSpecificTroubleshooting = (serviceName, error) => {
    const suggestions = {
        'phone-email': [
            "Verify Phone.email API key is valid and active",
            "Check Phone.email account balance and status",
            "Ensure API endpoints are accessible",
            "Review Phone.email service status page"
        ],
        'twilio': [
            "Verify Twilio Account SID and Auth Token",
            "Check Twilio phone number configuration",
            "Ensure Twilio account is active and funded",
            "Review Twilio console for error details"
        ],
        'smtp': [
            "Verify SMTP server credentials",
            "Check SMTP server hostname and port",
            "Ensure SMTP authentication is enabled",
            "Test SMTP connection manually"
        ]
    };

    return suggestions[serviceName] || [
        "Check service configuration",
        "Verify credentials are correct",
        "Ensure service is accessible"
    ];
};

export default router;