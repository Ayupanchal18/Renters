import otpService from './otpService.js';
import phoneEmailService from './phoneEmailService.js';
import smsService from './smsService.js';
import emailService from './emailService.js';
import configurationValidator from './configurationValidator.js';
import fallbackManager from './fallbackManager.js';
import { alertManager } from './alertManager.js';
import escalationService from './escalationService.js';
import { OTP } from '../../models/OTP.js';
import { DeliveryPreferences } from '../../models/DeliveryPreferences.js';
import { DeliveryAttempt } from '../../models/DeliveryAttempt.js';

/**
 * Enhanced OTP Manager with service orchestration and fallback capabilities
 * Coordinates multiple delivery services based on availability and user preferences
 */
class EnhancedOTPManager {
    constructor() {
        this.services = {
            'phone-email': phoneEmailService,
            'twilio': smsService,
            'smtp': emailService
        };

        this.deliveryAttempts = new Map(); // Track delivery attempts per OTP
        this.serviceMetrics = new Map(); // Track service performance metrics

        this.initializeManager();
    }

    /**
     * Initialize the enhanced OTP manager
     */
    initializeManager() {
        console.log('Initializing Enhanced OTP Manager...');

        // Initialize service metrics
        for (const serviceName of Object.keys(this.services)) {
            this.serviceMetrics.set(serviceName, {
                totalAttempts: 0,
                successfulDeliveries: 0,
                failedDeliveries: 0,
                averageDeliveryTime: 0,
                lastUsed: null,
                errorRate: 0
            });
        }

        console.log('Enhanced OTP Manager initialized successfully');
    }

    /**
     * Generate and send OTP with intelligent service selection
     * @param {string} userId - User ID
     * @param {string} type - 'email' or 'phone'
     * @param {string} contact - Email address or phone number
     * @param {object} preferences - User delivery preferences (optional, will fetch from DB if not provided)
     * @returns {Promise<{success: boolean, deliveryId: string, attempts: array, error?: string}>}
     */
    async generateAndSend(userId, type, contact, preferences = null) {
        try {
            // Get user delivery preferences if not provided
            if (!preferences) {
                preferences = await DeliveryPreferences.getOrCreate(userId);
            }

            // Check if within delivery window
            if (!preferences.isWithinDeliveryWindow()) {
                return {
                    success: false,
                    error: 'OTP delivery is outside your configured delivery window',
                    deliveryWindow: {
                        enabled: preferences.deliveryWindow.enabled,
                        startTime: preferences.deliveryWindow.startTime,
                        endTime: preferences.deliveryWindow.endTime,
                        timezone: preferences.deliveryWindow.timezone
                    }
                };
            }

            // Check rate limits
            const rateLimitStatus = await preferences.checkRateLimit();
            if (!rateLimitStatus.withinHourlyLimit || !rateLimitStatus.withinDailyLimit) {
                return {
                    success: false,
                    error: 'Rate limit exceeded. Please try again later.',
                    rateLimitStatus
                };
            }

            // Generate OTP using existing service
            const { otp, expiresAt, otpId } = await otpService.createOTP(userId, type, contact);

            // Create delivery tracking ID
            const deliveryId = this.generateDeliveryId();

            // Initialize delivery attempt tracking
            this.deliveryAttempts.set(deliveryId, {
                userId,
                otpId,
                type,
                contact,
                otp,
                expiresAt,
                attempts: [],
                status: 'pending',
                createdAt: new Date(),
                preferences: {
                    preferredMethod: preferences.preferredMethod,
                    preferredService: preferences.preferredService,
                    allowFallback: preferences.allowFallback
                }
            });

            // Use fallback manager for intelligent delivery with retry and fallback
            const deliveryRequest = {
                userId,
                otpId,
                deliveryId,
                type,
                contact,
                otp,
                preferences: {
                    preferredMethod: preferences.preferredMethod,
                    preferredService: preferences.preferredService,
                    allowFallback: preferences.allowFallback
                }
            };

            const result = await fallbackManager.executeDelivery(deliveryRequest);

            // Update in-memory tracking with fallback manager results
            const deliveryData = this.deliveryAttempts.get(deliveryId);
            if (deliveryData && result.deliveryLog) {
                deliveryData.attempts = result.deliveryLog.attempts || [];
                deliveryData.status = result.success ? 'sent' : 'failed';
            }

            return {
                success: result.success,
                deliveryId,
                attempts: result.deliveryLog?.attempts || [],
                expiresAt,
                estimatedDelivery: result.estimatedDelivery,
                deliveryMethod: result.method,
                serviceName: result.serviceName,
                fallbacksUsed: result.fallbacksUsed || [],
                totalAttempts: result.attempts || 1,
                error: result.success ? null : result.error
            };

        } catch (error) {
            console.error('Error in generateAndSend:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Retry OTP delivery with fallback services
     * @param {string} deliveryId - Delivery tracking ID
     * @param {string} method - Optional specific method to try
     * @returns {Promise<{success: boolean, attempt: object, error?: string}>}
     */
    async retryDelivery(deliveryId, method = null) {
        try {
            const deliveryData = this.deliveryAttempts.get(deliveryId);
            if (!deliveryData) {
                return {
                    success: false,
                    error: 'Delivery ID not found'
                };
            }

            // Check if OTP is still valid
            if (new Date() > deliveryData.expiresAt) {
                return {
                    success: false,
                    error: 'OTP has expired. Please request a new one.'
                };
            }

            // Get previously attempted services to exclude them
            const attemptedServices = deliveryData.attempts.map(a => a.serviceName);

            // Use fallback manager to determine next fallback option
            const nextFallback = await fallbackManager.determineNextFallback(deliveryData.attempts);

            if (!nextFallback) {
                return {
                    success: false,
                    error: 'No additional delivery services available for retry'
                };
            }

            // Create retry request for fallback manager
            const retryRequest = {
                userId: deliveryData.userId,
                otpId: deliveryData.otpId,
                deliveryId,
                type: deliveryData.type,
                contact: deliveryData.contact,
                otp: deliveryData.otp,
                preferences: {
                    preferredMethod: method || deliveryData.preferences.preferredMethod,
                    allowFallback: deliveryData.preferences.allowFallback
                },
                excludeServices: attemptedServices
            };

            const result = await fallbackManager.executeDelivery(retryRequest);

            // Update in-memory tracking
            if (result.deliveryLog?.attempts) {
                deliveryData.attempts.push(...result.deliveryLog.attempts);
                deliveryData.status = result.success ? 'sent' : 'failed';
            }

            return {
                success: result.success,
                attempt: result.deliveryLog?.attempts?.[0] || null,
                fallbacksUsed: result.fallbacksUsed || [],
                error: result.success ? null : result.error
            };

        } catch (error) {
            console.error('Error in retryDelivery:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get delivery status and history
     * @param {string} userId - User ID
     * @param {string} deliveryId - Delivery tracking ID
     * @returns {Promise<object>} Delivery status information
     */
    async getDeliveryStatus(userId, deliveryId) {
        // First check in-memory tracking
        const deliveryData = this.deliveryAttempts.get(deliveryId);

        // Also check database for persistent tracking
        let dbAttempts = [];
        try {
            dbAttempts = await DeliveryAttempt.find({
                userId,
                deliveryId
            }).sort({ createdAt: 1 });
        } catch (error) {
            console.error('Error fetching delivery attempts from database:', error);
        }

        if (!deliveryData && dbAttempts.length === 0) {
            return {
                found: false,
                error: 'Delivery ID not found'
            };
        }

        // Use in-memory data if available, otherwise use database data
        let status, type, contact, createdAt, expiresAt, attempts;

        if (deliveryData) {
            const lastAttempt = deliveryData.attempts[deliveryData.attempts.length - 1];
            const isExpired = new Date() > deliveryData.expiresAt;

            status = isExpired ? 'expired' : deliveryData.status;
            type = deliveryData.type;
            contact = deliveryData.contact;
            createdAt = deliveryData.createdAt;
            expiresAt = deliveryData.expiresAt;
            attempts = deliveryData.attempts;
        } else {
            // Reconstruct from database data
            const latestAttempt = dbAttempts[dbAttempts.length - 1];
            status = latestAttempt.status;
            type = latestAttempt.method === 'sms' ? 'phone' : 'email';
            contact = latestAttempt.recipient;
            createdAt = dbAttempts[0].createdAt;
            expiresAt = null; // Would need to be stored in DeliveryAttempt model
            attempts = dbAttempts.map(attempt => ({
                serviceName: attempt.service,
                method: attempt.method,
                success: attempt.status === 'sent' || attempt.status === 'delivered',
                timestamp: attempt.createdAt,
                estimatedDelivery: attempt.estimatedDelivery,
                error: attempt.error,
                messageId: attempt.messageId
            }));
        }

        const lastAttempt = attempts[attempts.length - 1];

        return {
            found: true,
            deliveryId,
            status,
            type,
            contact,
            createdAt,
            expiresAt,
            totalAttempts: attempts.length,
            lastAttempt: lastAttempt ? {
                serviceName: lastAttempt.serviceName,
                method: lastAttempt.method,
                success: lastAttempt.success,
                timestamp: lastAttempt.timestamp,
                estimatedDelivery: lastAttempt.estimatedDelivery,
                error: lastAttempt.error
            } : null,
            attempts,
            dbAttempts: dbAttempts.length
        };
    }

    /**
     * Test delivery functionality
     * @param {string} method - 'sms' or 'email'
     * @param {string} contact - Phone number or email address
     * @param {string} serviceName - Optional specific service to test
     * @returns {Promise<{success: boolean, results: array, error?: string}>}
     */
    async testDelivery(method, contact, serviceName = null) {
        try {
            const testOTP = '123456';
            const results = [];

            if (serviceName) {
                // Test specific service
                const service = this.services[serviceName];
                if (!service) {
                    return {
                        success: false,
                        error: `Unknown service: ${serviceName}`
                    };
                }

                const result = await this.testServiceDelivery(serviceName, method, contact, testOTP);
                results.push(result);
            } else {
                // Test all available services for the method
                const availableServices = configurationValidator.getAvailableServices(method);

                for (const serviceInfo of availableServices) {
                    const result = await this.testServiceDelivery(serviceInfo.serviceName, method, contact, testOTP);
                    results.push(result);
                }
            }

            const overallSuccess = results.some(r => r.success);

            return {
                success: overallSuccess,
                results,
                summary: {
                    totalTested: results.length,
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length
                }
            };

        } catch (error) {
            console.error('Error in testDelivery:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create delivery plan based on available services and user preferences
     * @param {string} type - 'email' or 'phone'
     * @param {string} contact - Contact information
     * @param {object} preferences - User delivery preferences object
     * @param {array} excludeServices - Services to exclude from plan
     * @returns {Promise<array>} Ordered list of delivery options
     */
    async createDeliveryPlan(type, contact, preferences, excludeServices = []) {
        // Get available services from configuration validator
        const method = type === 'phone' ? 'sms' : 'email';
        const availableServices = configurationValidator.getAvailableServices(method);

        // Filter out excluded services
        const filteredServices = availableServices.filter(
            service => !excludeServices.includes(service.serviceName)
        );

        // Use DeliveryPreferences model method to get delivery plan
        if (preferences && typeof preferences.getDeliveryPlan === 'function') {
            const deliveryPlan = preferences.getDeliveryPlan(filteredServices);

            // Convert to the format expected by attemptDelivery
            return deliveryPlan.map(plan => ({
                serviceName: plan.service,
                displayName: this.getServiceDisplayName(plan.service),
                method: plan.method,
                contact,
                priority: plan.priority,
                isPrimary: plan.priority === 1
            }));
        }

        // Fallback to simple ordering if preferences object doesn't have the method
        let orderedServices = [...filteredServices];

        // Apply user preferences manually if needed
        if (preferences.preferredService && preferences.preferredService !== 'auto') {
            const preferredIndex = orderedServices.findIndex(
                s => s.serviceName === preferences.preferredService
            );
            if (preferredIndex > 0) {
                const preferred = orderedServices.splice(preferredIndex, 1)[0];
                orderedServices.unshift(preferred);
            }
        }

        // Handle method preference
        const preferredMethod = preferences.preferredMethod === 'auto' ? method : preferences.preferredMethod;

        // Filter services that support the preferred method
        if (preferredMethod !== method && preferences.allowFallback) {
            // If user prefers a different method but allows fallback, include both
            const bothMethods = configurationValidator.getAvailableServices(preferredMethod);
            orderedServices = [...bothMethods, ...orderedServices];
        }

        // Convert to delivery plan format
        return orderedServices.map((service, index) => ({
            serviceName: service.serviceName,
            displayName: service.displayName || this.getServiceDisplayName(service.serviceName),
            method: preferredMethod,
            contact,
            priority: index + 1,
            isPrimary: index === 0
        }));
    }

    /**
     * Get display name for a service
     * @param {string} serviceName - Service name
     * @returns {string} Display name
     */
    getServiceDisplayName(serviceName) {
        const displayNames = {
            'phone-email': 'Phone.email',
            'twilio': 'Twilio SMS',
            'smtp': 'SMTP Email'
        };
        return displayNames[serviceName] || serviceName;
    }

    /**
     * Attempt delivery using a specific service
     * @param {string} deliveryId - Delivery tracking ID
     * @param {object} deliveryOption - Service and method information
     * @param {string} otp - OTP code to send
     * @param {string} userId - User ID for tracking
     * @returns {Promise<object>} Delivery attempt result
     */
    async attemptDelivery(deliveryId, deliveryOption, otp, userId = null) {
        const startTime = Date.now();
        const attempt = {
            serviceName: deliveryOption.serviceName,
            method: deliveryOption.method,
            contact: deliveryOption.contact,
            timestamp: new Date(),
            success: false,
            error: null,
            messageId: null,
            estimatedDelivery: null,
            actualDeliveryTime: null
        };

        try {
            const service = this.services[deliveryOption.serviceName];
            if (!service) {
                throw new Error(`Service not found: ${deliveryOption.serviceName}`);
            }

            let result;

            // Call appropriate service method
            if (deliveryOption.serviceName === 'phone-email') {
                result = await phoneEmailService.sendOTP(deliveryOption.method, deliveryOption.contact, otp, 'User');
            } else if (deliveryOption.serviceName === 'twilio' && deliveryOption.method === 'sms') {
                result = await smsService.sendOTPSMS(deliveryOption.contact, otp, 'User');
            } else if (deliveryOption.serviceName === 'smtp' && deliveryOption.method === 'email') {
                result = await emailService.sendOTPEmail(deliveryOption.contact, otp, 'User');
            } else {
                throw new Error(`Invalid service/method combination: ${deliveryOption.serviceName}/${deliveryOption.method}`);
            }

            // Update attempt with results
            attempt.success = result.success;
            attempt.error = result.error || null;
            attempt.messageId = result.messageId || result.messageSid || null;
            attempt.estimatedDelivery = result.estimatedDelivery || null;
            attempt.actualDeliveryTime = Date.now() - startTime;

            // Update service metrics
            this.updateServiceMetrics(deliveryOption.serviceName, attempt);

            // Update delivery tracking
            const deliveryData = this.deliveryAttempts.get(deliveryId);
            if (deliveryData) {
                deliveryData.attempts.push(attempt);
                deliveryData.status = attempt.success ? 'sent' : 'failed';
            }

            // Store delivery attempt in database for persistent tracking
            if (userId) {
                try {
                    const deliveryAttempt = new DeliveryAttempt({
                        userId,
                        deliveryId,
                        service: deliveryOption.serviceName,
                        method: deliveryOption.method,
                        recipient: deliveryOption.contact,
                        status: attempt.success ? 'sent' : 'failed',
                        messageId: attempt.messageId,
                        error: attempt.error,
                        retryCount: 0,
                        estimatedDelivery: attempt.estimatedDelivery ? new Date(attempt.estimatedDelivery) : null,
                        actualDelivery: attempt.success ? new Date() : null
                    });
                    await deliveryAttempt.save();
                } catch (dbError) {
                    console.error('Failed to save delivery attempt to database:', dbError);
                }
            }

            return attempt;

        } catch (error) {
            console.error(`Delivery attempt failed for ${deliveryOption.serviceName}:`, error);

            attempt.error = error.message;
            attempt.actualDeliveryTime = Date.now() - startTime;

            // Update service metrics
            this.updateServiceMetrics(deliveryOption.serviceName, attempt);

            // Update delivery tracking
            const deliveryData = this.deliveryAttempts.get(deliveryId);
            if (deliveryData) {
                deliveryData.attempts.push(attempt);
                deliveryData.status = 'failed';
            }

            // Store failed delivery attempt in database
            if (userId) {
                try {
                    const deliveryAttempt = new DeliveryAttempt({
                        userId,
                        deliveryId,
                        service: deliveryOption.serviceName,
                        method: deliveryOption.method,
                        recipient: deliveryOption.contact,
                        status: 'failed',
                        error: attempt.error,
                        retryCount: 0
                    });
                    await deliveryAttempt.save();

                    // Check if user needs escalation after failed delivery
                    await this.checkUserEscalationNeeds(userId);

                } catch (dbError) {
                    console.error('Failed to save failed delivery attempt to database:', dbError);
                }
            }

            return attempt;
        }
    }

    /**
     * Test delivery for a specific service
     * @param {string} serviceName - Name of service to test
     * @param {string} method - Delivery method
     * @param {string} contact - Contact information
     * @param {string} testOTP - Test OTP code
     * @returns {Promise<object>} Test result
     */
    async testServiceDelivery(serviceName, method, contact, testOTP) {
        const startTime = Date.now();

        try {
            const service = this.services[serviceName];
            if (!service) {
                return {
                    serviceName,
                    method,
                    success: false,
                    error: `Service not found: ${serviceName}`,
                    duration: Date.now() - startTime
                };
            }

            let result;

            if (serviceName === 'phone-email') {
                result = await phoneEmailService.testDelivery(method, contact);
            } else if (serviceName === 'twilio' && method === 'sms') {
                result = await smsService.sendTestSMS(contact);
            } else if (serviceName === 'smtp' && method === 'email') {
                result = await emailService.sendOTPEmail(contact, testOTP, 'Test User');
            } else {
                return {
                    serviceName,
                    method,
                    success: false,
                    error: `Invalid service/method combination: ${serviceName}/${method}`,
                    duration: Date.now() - startTime
                };
            }

            return {
                serviceName,
                method,
                success: result.success,
                error: result.error || null,
                messageId: result.messageId || result.messageSid || null,
                duration: Date.now() - startTime,
                testMode: result.testMode || false
            };

        } catch (error) {
            return {
                serviceName,
                method,
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * Update service performance metrics
     * @param {string} serviceName - Name of the service
     * @param {object} attempt - Delivery attempt data
     */
    updateServiceMetrics(serviceName, attempt) {
        const metrics = this.serviceMetrics.get(serviceName);
        if (!metrics) return;

        metrics.totalAttempts++;
        metrics.lastUsed = new Date();

        if (attempt.success) {
            metrics.successfulDeliveries++;

            // Update average delivery time
            if (attempt.actualDeliveryTime) {
                const totalTime = metrics.averageDeliveryTime * (metrics.successfulDeliveries - 1) + attempt.actualDeliveryTime;
                metrics.averageDeliveryTime = totalTime / metrics.successfulDeliveries;
            }
        } else {
            metrics.failedDeliveries++;
        }

        // Calculate error rate
        metrics.errorRate = (metrics.failedDeliveries / metrics.totalAttempts) * 100;

        this.serviceMetrics.set(serviceName, metrics);
    }

    /**
     * Generate unique delivery ID
     * @returns {string} Unique delivery ID
     */
    generateDeliveryId() {
        return `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get service performance metrics
     * @returns {object} Performance metrics for all services
     */
    getServiceMetrics() {
        const metrics = {};

        for (const [serviceName, serviceMetrics] of this.serviceMetrics) {
            metrics[serviceName] = { ...serviceMetrics };
        }

        return metrics;
    }

    /**
     * Clean up expired delivery attempts
     * @param {number} maxAgeHours - Maximum age in hours (default: 24)
     * @returns {number} Number of cleaned up attempts
     */
    cleanupExpiredAttempts(maxAgeHours = 24) {
        const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
        let cleanedCount = 0;

        for (const [deliveryId, deliveryData] of this.deliveryAttempts) {
            if (deliveryData.createdAt < cutoffTime) {
                this.deliveryAttempts.delete(deliveryId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`Cleaned up ${cleanedCount} expired delivery attempts`);
        }

        return cleanedCount;
    }

    /**
     * Get user delivery history
     * @param {string} userId - User ID
     * @param {number} limit - Maximum number of records to return
     * @param {number} hours - Hours to look back (default: 24)
     * @returns {Promise<object>} User delivery history
     */
    async getUserDeliveryHistory(userId, limit = 10, hours = 24) {
        try {
            const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

            const attempts = await DeliveryAttempt.find({
                userId,
                createdAt: { $gte: cutoffTime }
            })
                .sort({ createdAt: -1 })
                .limit(limit);

            const stats = {
                totalAttempts: attempts.length,
                successfulDeliveries: attempts.filter(a => a.status === 'sent' || a.status === 'delivered').length,
                failedDeliveries: attempts.filter(a => a.status === 'failed').length,
                serviceBreakdown: {},
                methodBreakdown: { sms: 0, email: 0 }
            };

            // Calculate breakdowns
            attempts.forEach(attempt => {
                // Service breakdown
                if (!stats.serviceBreakdown[attempt.service]) {
                    stats.serviceBreakdown[attempt.service] = 0;
                }
                stats.serviceBreakdown[attempt.service]++;

                // Method breakdown
                stats.methodBreakdown[attempt.method]++;
            });

            stats.successRate = stats.totalAttempts > 0 ?
                (stats.successfulDeliveries / stats.totalAttempts) * 100 : 0;

            return {
                success: true,
                history: attempts.map(attempt => ({
                    deliveryId: attempt.deliveryId,
                    service: attempt.service,
                    method: attempt.method,
                    status: attempt.status,
                    recipient: attempt.recipient,
                    messageId: attempt.messageId,
                    error: attempt.error,
                    createdAt: attempt.createdAt,
                    estimatedDelivery: attempt.estimatedDelivery,
                    actualDelivery: attempt.actualDelivery
                })),
                stats
            };

        } catch (error) {
            console.error('Error getting user delivery history:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get delivery statistics
     * @param {number} hours - Hours to look back (default: 24)
     * @returns {object} Delivery statistics
     */
    getDeliveryStats(hours = 24) {
        const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
        const stats = {
            totalDeliveries: 0,
            successfulDeliveries: 0,
            failedDeliveries: 0,
            averageAttempts: 0,
            serviceBreakdown: {},
            methodBreakdown: { sms: 0, email: 0 }
        };

        let totalAttempts = 0;

        for (const [, deliveryData] of this.deliveryAttempts) {
            if (deliveryData.createdAt >= cutoffTime) {
                stats.totalDeliveries++;
                totalAttempts += deliveryData.attempts.length;

                const hasSuccess = deliveryData.attempts.some(a => a.success);
                if (hasSuccess) {
                    stats.successfulDeliveries++;
                } else {
                    stats.failedDeliveries++;
                }

                // Count by method
                stats.methodBreakdown[deliveryData.type === 'phone' ? 'sms' : 'email']++;

                // Count by service
                for (const attempt of deliveryData.attempts) {
                    if (!stats.serviceBreakdown[attempt.serviceName]) {
                        stats.serviceBreakdown[attempt.serviceName] = 0;
                    }
                    stats.serviceBreakdown[attempt.serviceName]++;
                }
            }
        }

        stats.averageAttempts = stats.totalDeliveries > 0 ? totalAttempts / stats.totalDeliveries : 0;
        stats.successRate = stats.totalDeliveries > 0 ? (stats.successfulDeliveries / stats.totalDeliveries) * 100 : 0;

        return stats;
    }
    /**
     * Check if user needs escalation based on delivery patterns
     * @param {string} userId - User ID
     */
    async checkUserEscalationNeeds(userId) {
        try {
            // Analyze user patterns to determine if escalation is needed
            const analysis = await escalationService.analyzeUserPatterns(userId, 24);

            if (analysis.escalationNeeded) {
                // Create user escalation alert
                await alertManager.createUserEscalationAlert(userId, {
                    reason: analysis.escalationReason,
                    priority: analysis.escalationReason === 'persistent_delivery_failure' ? 'high' : 'medium',
                    analysisData: analysis
                });

                console.log(`User escalation alert created for user ${userId}: ${analysis.escalationReason}`);
            }

        } catch (error) {
            console.error('Error checking user escalation needs:', error);
        }
    }
}

// Create and export a singleton instance
const enhancedOTPManager = new EnhancedOTPManager();
export default enhancedOTPManager;