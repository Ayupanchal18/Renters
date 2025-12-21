import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { DeliveryAttempt } from "../models/DeliveryAttempt.js";
import { OTP } from "../models/OTP.js";
import enhancedOTPManager from "../src/services/enhancedOTPManager.js";
import configurationValidator from "../src/services/configurationValidator.js";
import { connectDB } from "../src/config/db.js";
import { logVerificationEvent } from "../src/utils/auditUtils.js";

const router = Router();

/* ---------------------- SCHEMAS ---------------------- */
const connectivityTestSchema = z.object({
    method: z.enum(["sms", "email"]),
    contact: z.string().min(1)
});

const diagnosticReportSchema = z.object({
    type: z.enum(["delivery_failure", "connectivity_issue", "service_unavailable", "other"]),
    description: z.string().min(10).max(500),
    deliveryId: z.string().optional(),
    contact: z.string().optional(),
    method: z.enum(["sms", "email"]).optional()
});

/* ---------------------- RATE LIMITING MIDDLEWARE ---------------------- */
const diagnosticRateLimitMap = new Map();
const DIAGNOSTIC_RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_DIAGNOSTIC_REQUESTS_PER_WINDOW = 5;

const diagnosticRateLimitMiddleware = (req, res, next) => {
    const userId = req.headers["x-user-id"];
    const ip = req.ip || req.connection.remoteAddress;
    const key = userId || ip;

    const now = Date.now();
    const windowStart = now - DIAGNOSTIC_RATE_LIMIT_WINDOW;

    if (!diagnosticRateLimitMap.has(key)) {
        diagnosticRateLimitMap.set(key, []);
    }

    const requests = diagnosticRateLimitMap.get(key);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    diagnosticRateLimitMap.set(key, validRequests);

    if (validRequests.length >= MAX_DIAGNOSTIC_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
            success: false,
            error: "Diagnostic rate limit exceeded",
            message: `Too many diagnostic requests. Please wait ${Math.ceil(DIAGNOSTIC_RATE_LIMIT_WINDOW / 60000)} minutes before trying again.`,
            retryAfter: Math.ceil((validRequests[0] + DIAGNOSTIC_RATE_LIMIT_WINDOW - now) / 1000)
        });
    }

    validRequests.push(now);
    diagnosticRateLimitMap.set(key, validRequests);
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

const generateUserDiagnostics = async (userId, method = null, contact = null) => {
    const diagnostics = {
        userId,
        timestamp: new Date().toISOString(),
        systemStatus: {},
        userHistory: {},
        recommendations: [],
        troubleshooting: [],
        escalationPaths: []
    };

    try {
        // Get system status
        const availableServices = configurationValidator.getAvailableServices(method || 'both');
        const serviceHealth = configurationValidator.getHealthMetrics();

        diagnostics.systemStatus = {
            availableServices: availableServices.length,
            healthyServices: availableServices.filter(s => s.isHealthy).length,
            services: availableServices.map(service => ({
                name: service.serviceName,
                displayName: service.displayName,
                healthy: service.isHealthy,
                capabilities: service.capabilities,
                priority: service.priority
            })),
            overallHealth: serviceHealth.overallHealth || 'unknown'
        };

        // Get user delivery history (last 24 hours)
        const historyResult = await enhancedOTPManager.getUserDeliveryHistory(userId, 10, 24);
        if (historyResult.success) {
            diagnostics.userHistory = {
                totalAttempts: historyResult.stats.totalAttempts,
                successfulDeliveries: historyResult.stats.successfulDeliveries,
                failedDeliveries: historyResult.stats.failedDeliveries,
                successRate: historyResult.stats.successRate,
                recentAttempts: historyResult.history.slice(0, 5).map(attempt => ({
                    deliveryId: attempt.deliveryId,
                    service: attempt.service,
                    method: attempt.method,
                    status: attempt.status,
                    error: attempt.error,
                    createdAt: attempt.createdAt
                }))
            };
        }

        // Generate recommendations based on system status and user history
        if (diagnostics.systemStatus.healthyServices === 0) {
            diagnostics.recommendations.push({
                type: "system_issue",
                priority: "critical",
                title: "All services are currently unavailable",
                description: "There appears to be a system-wide issue affecting OTP delivery services.",
                actions: [
                    "Wait a few minutes and try again",
                    "Check our status page for service updates",
                    "Contact support if the issue persists"
                ]
            });
        } else if (diagnostics.systemStatus.healthyServices < diagnostics.systemStatus.availableServices) {
            diagnostics.recommendations.push({
                type: "partial_outage",
                priority: "high",
                title: "Some delivery services are experiencing issues",
                description: "Not all delivery methods are currently available, but alternatives exist.",
                actions: [
                    "Try a different delivery method (SMS or email)",
                    "Wait for service restoration",
                    "Use the connectivity test to check specific methods"
                ]
            });
        }

        // Analyze user history for patterns
        if (diagnostics.userHistory.totalAttempts > 0) {
            if (diagnostics.userHistory.successRate < 50) {
                diagnostics.recommendations.push({
                    type: "delivery_issues",
                    priority: "high",
                    title: "Frequent delivery failures detected",
                    description: "Your recent OTP deliveries have a low success rate.",
                    actions: [
                        "Verify your contact information is correct",
                        "Check spam/junk folders for email OTPs",
                        "Ensure your phone can receive SMS messages",
                        "Try using a different delivery method"
                    ]
                });
            }

            // Check for specific error patterns
            const recentErrors = diagnostics.userHistory.recentAttempts
                .filter(attempt => attempt.error)
                .map(attempt => attempt.error);

            if (recentErrors.length > 0) {
                const commonErrors = [...new Set(recentErrors)];
                commonErrors.forEach(error => {
                    const troubleshootingSteps = getTroubleshootingForError(error);
                    if (troubleshootingSteps) {
                        diagnostics.troubleshooting.push(troubleshootingSteps);
                    }
                });
            }
        }

        // Add contact-specific recommendations
        if (method && contact) {
            if (method === 'email') {
                diagnostics.recommendations.push({
                    type: "email_tips",
                    priority: "medium",
                    title: "Email delivery tips",
                    description: "Improve email OTP delivery reliability.",
                    actions: [
                        "Check your spam/junk folder",
                        "Add our sender to your contacts",
                        "Ensure your email provider allows automated emails",
                        "Try using a different email address if issues persist"
                    ]
                });
            } else if (method === 'sms') {
                diagnostics.recommendations.push({
                    type: "sms_tips",
                    priority: "medium",
                    title: "SMS delivery tips",
                    description: "Improve SMS OTP delivery reliability.",
                    actions: [
                        "Ensure your phone has good signal strength",
                        "Check if SMS blocking is enabled",
                        "Verify your phone number is correct",
                        "Try restarting your phone if messages aren't arriving"
                    ]
                });
            }
        }

        // Generate escalation paths
        diagnostics.escalationPaths = generateEscalationPaths(diagnostics);

    } catch (error) {
        console.error('Error generating user diagnostics:', error);
        diagnostics.error = error.message;
    }

    return diagnostics;
};

const getTroubleshootingForError = (error) => {
    const errorPatterns = {
        'invalid phone number': {
            issue: "Invalid phone number format",
            solution: "Verify your phone number format",
            steps: [
                "Include country code (e.g., +1 for US)",
                "Remove any special characters except + - ( )",
                "Ensure the number is active and can receive SMS"
            ]
        },
        'invalid email': {
            issue: "Invalid email address format",
            solution: "Check your email address format",
            steps: [
                "Ensure the email contains @ symbol",
                "Verify the domain name is correct",
                "Check for typos in the email address"
            ]
        },
        'rate limit': {
            issue: "Too many requests",
            solution: "Wait before requesting another OTP",
            steps: [
                "Wait 15 minutes before trying again",
                "Avoid requesting multiple OTPs quickly",
                "Contact support if you need immediate access"
            ]
        },
        'service unavailable': {
            issue: "Delivery service temporarily unavailable",
            solution: "Try again later or use alternative method",
            steps: [
                "Wait 5-10 minutes and try again",
                "Try a different delivery method (SMS/email)",
                "Check our status page for service updates"
            ]
        }
    };

    for (const [pattern, troubleshooting] of Object.entries(errorPatterns)) {
        if (error.toLowerCase().includes(pattern)) {
            return troubleshooting;
        }
    }

    return {
        issue: "Delivery error occurred",
        solution: "General troubleshooting steps",
        steps: [
            "Verify your contact information is correct",
            "Check your internet connection",
            "Try again in a few minutes",
            "Contact support if the issue persists"
        ]
    };
};

const generateEscalationPaths = (diagnostics) => {
    const escalationPaths = [];

    // Critical system issues
    if (diagnostics.systemStatus.healthyServices === 0) {
        escalationPaths.push({
            level: 1,
            type: "system_outage",
            title: "Report System Outage",
            description: "All delivery services are down",
            contact: {
                method: "support_ticket",
                priority: "critical",
                expectedResponse: "Within 1 hour",
                includeData: ["systemStatus", "timestamp"]
            }
        });
    }

    // User-specific delivery issues
    if (diagnostics.userHistory.successRate < 30 && diagnostics.userHistory.totalAttempts >= 3) {
        escalationPaths.push({
            level: 2,
            type: "delivery_failure",
            title: "Report Persistent Delivery Issues",
            description: "Multiple delivery attempts have failed",
            contact: {
                method: "support_ticket",
                priority: "high",
                expectedResponse: "Within 4 hours",
                includeData: ["userHistory", "recentAttempts", "troubleshooting"]
            }
        });
    }

    // General support
    escalationPaths.push({
        level: 3,
        type: "general_support",
        title: "Contact Customer Support",
        description: "Get help with any OTP delivery issues",
        contact: {
            method: "support_ticket",
            priority: "normal",
            expectedResponse: "Within 24 hours",
            includeData: ["diagnostics_summary"]
        }
    });

    return escalationPaths;
};

/* ---------------------- GET USER DIAGNOSTICS ENDPOINT ---------------------- */
router.get("/", async (req, res) => {
    try {
        await connectDB();

        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "Authentication required"
            });
        }

        const method = req.query.method;
        const contact = req.query.contact;

        // Validate method if provided
        if (method && !['sms', 'email'].includes(method)) {
            return res.status(400).json({
                success: false,
                error: "Invalid method",
                message: "Method must be 'sms' or 'email'"
            });
        }

        // Validate contact if provided
        if (contact && method && !validateContact(method, contact)) {
            return res.status(400).json({
                success: false,
                error: "Invalid contact format",
                message: `Invalid ${method} format`
            });
        }

        console.log(`User diagnostics requested by user: ${userId}`);

        const diagnostics = await generateUserDiagnostics(userId, method, contact);

        // Log the diagnostic request
        await logVerificationEvent(userId, method || 'general', 'user_diagnostics', true, {
            systemHealth: diagnostics.systemStatus.overallHealth,
            userSuccessRate: diagnostics.userHistory.successRate || 0,
            recommendationsCount: diagnostics.recommendations.length
        }, req);

        res.json({
            success: true,
            message: "Diagnostic information retrieved successfully",
            diagnostics,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("User diagnostics error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve diagnostic information"
        });
    }
});

/* ---------------------- TEST CONNECTIVITY ENDPOINT ---------------------- */
router.post("/test-connectivity", diagnosticRateLimitMiddleware, async (req, res) => {
    try {
        await connectDB();

        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "Authentication required"
            });
        }

        const data = connectivityTestSchema.parse(req.body);
        const { method, contact } = data;

        // Validate contact format
        if (!validateContact(method, contact)) {
            return res.status(400).json({
                success: false,
                error: "Invalid contact format",
                message: `Please provide a valid ${method === 'email' ? 'email address' : 'phone number'}`,
                troubleshooting: {
                    issue: "Invalid contact format",
                    solution: method === 'email' ?
                        "Use format: user@domain.com" :
                        "Use format: +1234567890 or (123) 456-7890",
                    steps: [
                        method === 'email' ?
                            "Ensure the email contains @ and a valid domain" :
                            "Include country code and verify the number is active"
                    ]
                }
            });
        }

        // Verify the contact belongs to the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
                message: "User account not found"
            });
        }

        const userContact = method === 'email' ? user.email : user.phone;
        if (userContact !== contact) {
            return res.status(403).json({
                success: false,
                error: "Contact mismatch",
                message: `The provided ${method} does not match your account`,
                troubleshooting: {
                    issue: "Contact information mismatch",
                    solution: "Use the contact information associated with your account",
                    steps: [
                        "Verify you're using the correct email/phone number",
                        "Update your account information if needed",
                        "Contact support if you need to change your contact details"
                    ]
                }
            });
        }

        console.log(`Connectivity test requested for ${method} by user: ${userId}`);

        // Use enhanced OTP manager for connectivity test
        const testResult = await enhancedOTPManager.testDelivery(method, contact);

        // Log the connectivity test
        await logVerificationEvent(userId, method, 'connectivity_test', testResult.success, {
            contact: method === 'email' ? contact : 'hidden',
            testMode: true,
            servicesTestedCount: testResult.results?.length || 0
        }, req);

        // Generate user-friendly diagnostics
        const diagnostics = {
            testType: "connectivity",
            method,
            contact: method === 'email' ? contact : contact.replace(/\d/g, '*'),
            timestamp: new Date().toISOString(),
            results: testResult.results || [],
            summary: testResult.summary || {},
            recommendations: [],
            troubleshooting: []
        };

        // Add recommendations based on test results
        if (testResult.success) {
            diagnostics.recommendations.push({
                type: "success",
                priority: "low",
                title: "Connectivity test successful",
                description: `Your ${method} can receive OTP messages successfully.`,
                actions: [
                    "You should be able to receive OTP codes normally",
                    "If you still have issues, try requesting a new OTP",
                    "Contact support if problems persist"
                ]
            });
        } else {
            diagnostics.recommendations.push({
                type: "connectivity_failure",
                priority: "high",
                title: "Connectivity test failed",
                description: `Unable to deliver test message to your ${method}.`,
                actions: [
                    method === 'email' ? "Check your spam/junk folder" : "Verify your phone can receive SMS",
                    "Ensure your contact information is correct",
                    "Try again in a few minutes",
                    "Contact support if the issue persists"
                ]
            });

            // Add specific troubleshooting for failed services
            if (testResult.results) {
                testResult.results.forEach(result => {
                    if (!result.success) {
                        diagnostics.troubleshooting.push({
                            service: result.serviceName,
                            issue: result.error || "Test delivery failed",
                            solution: getServiceSpecificSolution(result.serviceName, method),
                            steps: getServiceSpecificSteps(result.serviceName, method)
                        });
                    }
                });
            }
        }

        res.json({
            success: testResult.success,
            message: testResult.success ?
                "Connectivity test completed successfully" :
                "Connectivity test detected issues",
            testResult,
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
            message: "Failed to execute connectivity test"
        });
    }
});

/* ---------------------- SUBMIT DIAGNOSTIC REPORT ENDPOINT ---------------------- */
router.post("/report", diagnosticRateLimitMiddleware, async (req, res) => {
    try {
        await connectDB();

        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "Authentication required"
            });
        }

        const data = diagnosticReportSchema.parse(req.body);
        const { type, description, deliveryId, contact, method } = data;

        console.log(`Diagnostic report submitted by user: ${userId}, type: ${type}`);

        // Generate diagnostic context
        const diagnostics = await generateUserDiagnostics(userId, method, contact);

        // Create support ticket data
        const supportTicket = {
            userId,
            type,
            description,
            deliveryId,
            contact: contact ? (method === 'email' ? contact : 'hidden') : null,
            method,
            diagnostics: {
                systemStatus: diagnostics.systemStatus,
                userHistory: diagnostics.userHistory,
                timestamp: diagnostics.timestamp
            },
            priority: determinePriority(type, diagnostics),
            status: 'open',
            createdAt: new Date()
        };

        // Log the diagnostic report
        await logVerificationEvent(userId, method || 'general', 'diagnostic_report', true, {
            reportType: type,
            deliveryId,
            priority: supportTicket.priority,
            systemHealth: diagnostics.systemStatus.overallHealth
        }, req);

        // Generate escalation information
        const escalation = {
            ticketId: `DIAG-${Date.now()}-${userId.slice(-6)}`,
            priority: supportTicket.priority,
            expectedResponse: getExpectedResponseTime(supportTicket.priority),
            nextSteps: getNextSteps(type, diagnostics),
            supportContact: {
                method: "support_portal",
                reference: supportTicket.ticketId || "Generated automatically"
            }
        };

        res.json({
            success: true,
            message: "Diagnostic report submitted successfully",
            report: {
                ticketId: escalation.ticketId,
                type,
                priority: supportTicket.priority,
                status: "submitted"
            },
            escalation,
            recommendations: diagnostics.recommendations,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Diagnostic report error:", error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Validation error",
                message: "Invalid diagnostic report request",
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to submit diagnostic report"
        });
    }
});

/* ---------------------- GET DELIVERY TROUBLESHOOTING ENDPOINT ---------------------- */
router.get("/troubleshoot/:deliveryId", async (req, res) => {
    try {
        await connectDB();

        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "Authentication required"
            });
        }

        const { deliveryId } = req.params;

        // Get delivery status and history
        const deliveryStatus = await enhancedOTPManager.getDeliveryStatus(userId, deliveryId);

        if (!deliveryStatus.found) {
            return res.status(404).json({
                success: false,
                error: "Delivery not found",
                message: "Delivery ID not found or does not belong to this user"
            });
        }

        // Generate specific troubleshooting for this delivery
        const troubleshooting = {
            deliveryId,
            status: deliveryStatus.status,
            method: deliveryStatus.type === 'phone' ? 'sms' : 'email',
            contact: deliveryStatus.contact,
            attempts: deliveryStatus.totalAttempts,
            lastAttempt: deliveryStatus.lastAttempt,
            recommendations: [],
            troubleshooting: [],
            nextSteps: []
        };

        // Analyze delivery status and generate recommendations
        if (deliveryStatus.status === 'failed') {
            troubleshooting.recommendations.push({
                type: "delivery_failed",
                priority: "high",
                title: "Delivery failed",
                description: "The OTP delivery was unsuccessful.",
                actions: [
                    "Request a new OTP code",
                    "Try a different delivery method",
                    "Verify your contact information is correct",
                    "Check connectivity using the test feature"
                ]
            });

            // Add specific troubleshooting based on errors
            if (deliveryStatus.attempts) {
                deliveryStatus.attempts.forEach(attempt => {
                    if (attempt.error) {
                        const troubleshootingSteps = getTroubleshootingForError(attempt.error);
                        troubleshooting.troubleshooting.push({
                            service: attempt.serviceName,
                            ...troubleshootingSteps
                        });
                    }
                });
            }
        } else if (deliveryStatus.status === 'sent') {
            troubleshooting.recommendations.push({
                type: "delivery_sent",
                priority: "medium",
                title: "OTP was sent successfully",
                description: "The OTP was delivered, but you may not have received it yet.",
                actions: [
                    troubleshooting.method === 'email' ? "Check your spam/junk folder" : "Wait a few minutes for SMS delivery",
                    "Ensure your device has good connectivity",
                    "Request a new OTP if you don't receive it within 5 minutes"
                ]
            });
        } else if (deliveryStatus.status === 'expired') {
            troubleshooting.recommendations.push({
                type: "delivery_expired",
                priority: "medium",
                title: "OTP has expired",
                description: "The OTP code is no longer valid.",
                actions: [
                    "Request a new OTP code",
                    "Complete verification promptly after receiving the new code"
                ]
            });
        }

        // Add next steps
        if (deliveryStatus.status === 'failed' || deliveryStatus.status === 'expired') {
            troubleshooting.nextSteps = [
                {
                    step: 1,
                    action: "Request new OTP",
                    description: "Generate a fresh OTP code"
                },
                {
                    step: 2,
                    action: "Try different method",
                    description: troubleshooting.method === 'sms' ?
                        "Switch to email delivery" : "Switch to SMS delivery"
                },
                {
                    step: 3,
                    action: "Test connectivity",
                    description: "Use the connectivity test to diagnose issues"
                },
                {
                    step: 4,
                    action: "Contact support",
                    description: "Get help if issues persist"
                }
            ];
        }

        res.json({
            success: true,
            message: "Troubleshooting information retrieved successfully",
            troubleshooting,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Delivery troubleshooting error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve troubleshooting information"
        });
    }
});

/* ---------------------- HELPER FUNCTIONS ---------------------- */
const getServiceSpecificSolution = (serviceName, method) => {
    const solutions = {
        'phone-email': `Phone.email ${method} service is experiencing issues`,
        'twilio': 'Twilio SMS service is experiencing issues',
        'smtp': 'Email service is experiencing issues'
    };
    return solutions[serviceName] || `${serviceName} service is experiencing issues`;
};

const getServiceSpecificSteps = (serviceName, method) => {
    const steps = {
        'phone-email': [
            "Phone.email service may be temporarily unavailable",
            "Try again in a few minutes",
            "Alternative delivery methods may be available"
        ],
        'twilio': [
            "SMS delivery service may be experiencing delays",
            "Check your phone's SMS settings",
            "Try using email delivery instead"
        ],
        'smtp': [
            "Email delivery service may be experiencing delays",
            "Check your spam/junk folder",
            "Try using SMS delivery instead"
        ]
    };
    return steps[serviceName] || ["Service may be temporarily unavailable", "Try again later"];
};

const determinePriority = (type, diagnostics) => {
    if (type === 'service_unavailable' || diagnostics.systemStatus.healthyServices === 0) {
        return 'critical';
    }
    if (type === 'delivery_failure' && diagnostics.userHistory.successRate < 30) {
        return 'high';
    }
    if (type === 'connectivity_issue') {
        return 'medium';
    }
    return 'normal';
};

const getExpectedResponseTime = (priority) => {
    const responseTimes = {
        'critical': 'Within 1 hour',
        'high': 'Within 4 hours',
        'medium': 'Within 12 hours',
        'normal': 'Within 24 hours'
    };
    return responseTimes[priority] || 'Within 24 hours';
};

const getNextSteps = (type, diagnostics) => {
    const steps = [];

    if (type === 'delivery_failure') {
        steps.push(
            "Our support team will investigate your delivery history",
            "We'll test your contact information for delivery issues",
            "You'll receive specific recommendations for your situation"
        );
    } else if (type === 'connectivity_issue') {
        steps.push(
            "We'll verify service connectivity to your location",
            "Our team will check for any service-specific issues",
            "You'll receive troubleshooting steps tailored to your setup"
        );
    } else if (type === 'service_unavailable') {
        steps.push(
            "We'll check the status of all delivery services",
            "Our team will provide updates on service restoration",
            "Alternative delivery methods will be suggested if available"
        );
    } else {
        steps.push(
            "Our support team will review your issue",
            "We'll provide specific guidance based on your situation",
            "Follow-up assistance will be provided as needed"
        );
    }

    return steps;
};

export default router;