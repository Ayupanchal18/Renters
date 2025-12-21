import { DeliveryAttempt } from "../../models/DeliveryAttempt.js";
import { OTP } from "../../models/OTP.js";
import { User } from "../../models/User.js";
import { logVerificationEvent } from "../utils/auditUtils.js";

/**
 * Escalation Service for OTP Delivery Issues
 * Handles escalation paths, proactive monitoring, and solution suggestions
 */
class EscalationService {
    constructor() {
        this.escalationRules = new Map();
        this.solutionDatabase = new Map();
        this.initializeEscalationRules();
        this.initializeSolutionDatabase();
    }

    /**
     * Initialize escalation rules based on issue patterns
     */
    initializeEscalationRules() {
        // Critical system-wide issues
        this.escalationRules.set('system_outage', {
            priority: 'critical',
            autoEscalate: true,
            escalationTime: 0, // Immediate
            requiredData: ['systemStatus', 'affectedServices', 'timestamp'],
            notificationChannels: ['email', 'sms', 'slack'],
            expectedResponse: '1 hour'
        });

        // High-priority user-specific issues
        this.escalationRules.set('persistent_delivery_failure', {
            priority: 'high',
            autoEscalate: true,
            escalationTime: 30 * 60 * 1000, // 30 minutes
            requiredData: ['userHistory', 'deliveryAttempts', 'errorPatterns'],
            notificationChannels: ['email'],
            expectedResponse: '4 hours'
        });

        // Medium-priority connectivity issues
        this.escalationRules.set('connectivity_degradation', {
            priority: 'medium',
            autoEscalate: false,
            escalationTime: 2 * 60 * 60 * 1000, // 2 hours
            requiredData: ['connectivityTests', 'serviceMetrics'],
            notificationChannels: ['email'],
            expectedResponse: '12 hours'
        });

        // Low-priority general issues
        this.escalationRules.set('general_support', {
            priority: 'normal',
            autoEscalate: false,
            escalationTime: 24 * 60 * 60 * 1000, // 24 hours
            requiredData: ['userReport', 'basicDiagnostics'],
            notificationChannels: ['email'],
            expectedResponse: '24 hours'
        });
    }

    /**
     * Initialize solution database with common issues and fixes
     */
    initializeSolutionDatabase() {
        // SMS-related solutions
        this.solutionDatabase.set('sms_not_received', {
            category: 'sms',
            commonCauses: [
                'Poor signal strength',
                'SMS blocking enabled',
                'Carrier filtering',
                'Phone storage full'
            ],
            solutions: [
                {
                    step: 1,
                    action: 'Check signal strength',
                    description: 'Ensure your phone has good cellular signal',
                    success_rate: 0.3
                },
                {
                    step: 2,
                    action: 'Disable SMS blocking',
                    description: 'Check if SMS blocking or filtering is enabled',
                    success_rate: 0.4
                },
                {
                    step: 3,
                    action: 'Restart phone',
                    description: 'Power cycle your device to refresh connections',
                    success_rate: 0.2
                },
                {
                    step: 4,
                    action: 'Contact carrier',
                    description: 'Check with your mobile carrier about SMS delivery',
                    success_rate: 0.8
                }
            ],
            escalationTriggers: ['multiple_failures', 'carrier_issues']
        });

        // Email-related solutions
        this.solutionDatabase.set('email_not_received', {
            category: 'email',
            commonCauses: [
                'Spam filtering',
                'Email provider blocking',
                'Incorrect email address',
                'Server delays'
            ],
            solutions: [
                {
                    step: 1,
                    action: 'Check spam folder',
                    description: 'Look in spam, junk, or promotions folder',
                    success_rate: 0.6
                },
                {
                    step: 2,
                    action: 'Add sender to contacts',
                    description: 'Whitelist our sending address',
                    success_rate: 0.3
                },
                {
                    step: 3,
                    action: 'Check email filters',
                    description: 'Review email rules and filters',
                    success_rate: 0.2
                },
                {
                    step: 4,
                    action: 'Try different email',
                    description: 'Use an alternative email address',
                    success_rate: 0.7
                }
            ],
            escalationTriggers: ['provider_blocking', 'persistent_filtering']
        });

        // Service-specific solutions
        this.solutionDatabase.set('service_unavailable', {
            category: 'system',
            commonCauses: [
                'Service maintenance',
                'API rate limits',
                'Network connectivity',
                'Configuration issues'
            ],
            solutions: [
                {
                    step: 1,
                    action: 'Wait and retry',
                    description: 'Wait 5-10 minutes and try again',
                    success_rate: 0.5
                },
                {
                    step: 2,
                    action: 'Try alternative method',
                    description: 'Switch between SMS and email delivery',
                    success_rate: 0.7
                },
                {
                    step: 3,
                    action: 'Check status page',
                    description: 'Review service status for known issues',
                    success_rate: 0.3
                },
                {
                    step: 4,
                    action: 'Contact support',
                    description: 'Report the service issue to support',
                    success_rate: 0.9
                }
            ],
            escalationTriggers: ['extended_outage', 'multiple_services_down']
        });
    }

    /**
     * Analyze user delivery patterns and suggest proactive solutions
     * @param {string} userId - User ID
     * @param {number} lookbackHours - Hours to analyze (default: 24)
     * @returns {Promise<object>} Analysis and recommendations
     */
    async analyzeUserPatterns(userId, lookbackHours = 24) {
        try {
            const cutoffTime = new Date(Date.now() - (lookbackHours * 60 * 60 * 1000));

            // Get user's delivery history
            const deliveryAttempts = await DeliveryAttempt.find({
                userId,
                createdAt: { $gte: cutoffTime }
            }).sort({ createdAt: -1 });

            const analysis = {
                userId,
                timeframe: `${lookbackHours} hours`,
                totalAttempts: deliveryAttempts.length,
                patterns: {},
                recommendations: [],
                escalationNeeded: false,
                escalationReason: null
            };

            if (deliveryAttempts.length === 0) {
                return analysis;
            }

            // Analyze failure patterns
            const failedAttempts = deliveryAttempts.filter(a => a.status === 'failed');
            const successRate = ((deliveryAttempts.length - failedAttempts.length) / deliveryAttempts.length) * 100;

            analysis.patterns = {
                successRate,
                failureRate: 100 - successRate,
                methodBreakdown: this.analyzeMethodBreakdown(deliveryAttempts),
                serviceBreakdown: this.analyzeServiceBreakdown(deliveryAttempts),
                errorPatterns: this.analyzeErrorPatterns(failedAttempts),
                timePatterns: this.analyzeTimePatterns(deliveryAttempts)
            };

            // Generate recommendations based on patterns
            analysis.recommendations = await this.generateRecommendations(analysis.patterns, userId);

            // Check if escalation is needed
            const escalationCheck = this.checkEscalationNeeded(analysis.patterns, deliveryAttempts);
            analysis.escalationNeeded = escalationCheck.needed;
            analysis.escalationReason = escalationCheck.reason;

            return analysis;

        } catch (error) {
            console.error('Error analyzing user patterns:', error);
            throw error;
        }
    }

    /**
     * Analyze delivery method breakdown
     * @param {Array} attempts - Delivery attempts
     * @returns {object} Method analysis
     */
    analyzeMethodBreakdown(attempts) {
        const breakdown = { sms: { total: 0, failed: 0 }, email: { total: 0, failed: 0 } };

        attempts.forEach(attempt => {
            const method = attempt.method;
            if (breakdown[method]) {
                breakdown[method].total++;
                if (attempt.status === 'failed') {
                    breakdown[method].failed++;
                }
            }
        });

        // Calculate success rates
        Object.keys(breakdown).forEach(method => {
            const data = breakdown[method];
            data.successRate = data.total > 0 ? ((data.total - data.failed) / data.total) * 100 : 0;
        });

        return breakdown;
    }

    /**
     * Analyze service breakdown
     * @param {Array} attempts - Delivery attempts
     * @returns {object} Service analysis
     */
    analyzeServiceBreakdown(attempts) {
        const breakdown = {};

        attempts.forEach(attempt => {
            const service = attempt.service;
            if (!breakdown[service]) {
                breakdown[service] = { total: 0, failed: 0, errors: [] };
            }
            breakdown[service].total++;
            if (attempt.status === 'failed') {
                breakdown[service].failed++;
                if (attempt.error) {
                    breakdown[service].errors.push(attempt.error);
                }
            }
        });

        // Calculate success rates and common errors
        Object.keys(breakdown).forEach(service => {
            const data = breakdown[service];
            data.successRate = data.total > 0 ? ((data.total - data.failed) / data.total) * 100 : 0;
            data.commonErrors = this.getCommonErrors(data.errors);
        });

        return breakdown;
    }

    /**
     * Analyze error patterns
     * @param {Array} failedAttempts - Failed delivery attempts
     * @returns {object} Error analysis
     */
    analyzeErrorPatterns(failedAttempts) {
        const errorCounts = {};
        const errorCategories = {
            network: ['timeout', 'connection', 'network'],
            authentication: ['auth', 'credential', 'unauthorized'],
            validation: ['invalid', 'format', 'validation'],
            rateLimit: ['rate', 'limit', 'throttle'],
            service: ['service', 'unavailable', 'maintenance']
        };

        failedAttempts.forEach(attempt => {
            if (attempt.error) {
                const error = attempt.error.toLowerCase();

                // Count specific errors
                if (!errorCounts[error]) {
                    errorCounts[error] = 0;
                }
                errorCounts[error]++;
            }
        });

        // Categorize errors
        const categorizedErrors = {};
        Object.keys(errorCategories).forEach(category => {
            categorizedErrors[category] = 0;
        });

        Object.keys(errorCounts).forEach(error => {
            Object.keys(errorCategories).forEach(category => {
                if (errorCategories[category].some(keyword => error.includes(keyword))) {
                    categorizedErrors[category] += errorCounts[error];
                }
            });
        });

        return {
            specificErrors: errorCounts,
            categorizedErrors,
            mostCommonError: Object.keys(errorCounts).reduce((a, b) =>
                errorCounts[a] > errorCounts[b] ? a : b, null),
            totalErrors: failedAttempts.length
        };
    }

    /**
     * Analyze time patterns in delivery attempts
     * @param {Array} attempts - Delivery attempts
     * @returns {object} Time analysis
     */
    analyzeTimePatterns(attempts) {
        const hourlyBreakdown = {};
        const recentTrend = [];

        attempts.forEach(attempt => {
            const hour = new Date(attempt.createdAt).getHours();
            if (!hourlyBreakdown[hour]) {
                hourlyBreakdown[hour] = { total: 0, failed: 0 };
            }
            hourlyBreakdown[hour].total++;
            if (attempt.status === 'failed') {
                hourlyBreakdown[hour].failed++;
            }
        });

        // Get recent trend (last 6 attempts)
        const recentAttempts = attempts.slice(0, 6);
        recentAttempts.forEach(attempt => {
            recentTrend.push({
                timestamp: attempt.createdAt,
                success: attempt.status !== 'failed',
                service: attempt.service,
                method: attempt.method
            });
        });

        return {
            hourlyBreakdown,
            recentTrend,
            peakFailureHour: this.getPeakFailureHour(hourlyBreakdown)
        };
    }

    /**
     * Generate proactive recommendations based on patterns
     * @param {object} patterns - Analyzed patterns
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Recommendations
     */
    async generateRecommendations(patterns, userId) {
        const recommendations = [];

        // Low success rate recommendations
        if (patterns.successRate < 50) {
            recommendations.push({
                type: 'critical',
                priority: 'high',
                title: 'Low delivery success rate detected',
                description: `Your OTP delivery success rate is ${patterns.successRate.toFixed(1)}%`,
                solutions: await this.getSolutionsForPattern('persistent_failure', patterns),
                escalationSuggested: true
            });
        }

        // Method-specific recommendations
        if (patterns.methodBreakdown.sms.successRate < patterns.methodBreakdown.email.successRate - 20) {
            recommendations.push({
                type: 'method_preference',
                priority: 'medium',
                title: 'SMS delivery issues detected',
                description: 'Email delivery is significantly more reliable for you',
                solutions: [
                    'Switch to email as your primary OTP method',
                    'Test SMS connectivity to identify issues',
                    'Contact your mobile carrier about SMS delivery'
                ]
            });
        }

        // Service-specific recommendations
        const worstService = this.getWorstPerformingService(patterns.serviceBreakdown);
        if (worstService && worstService.successRate < 30) {
            recommendations.push({
                type: 'service_issue',
                priority: 'medium',
                title: `${worstService.name} service experiencing issues`,
                description: `${worstService.name} has a ${worstService.successRate.toFixed(1)}% success rate`,
                solutions: await this.getSolutionsForService(worstService.name, worstService.errors)
            });
        }

        // Error pattern recommendations
        if (patterns.errorPatterns.categorizedErrors.network > 0) {
            recommendations.push({
                type: 'network_issue',
                priority: 'medium',
                title: 'Network connectivity issues detected',
                description: 'Multiple network-related delivery failures',
                solutions: [
                    'Check your internet connection stability',
                    'Try switching between WiFi and mobile data',
                    'Test connectivity during different times of day'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Check if escalation is needed based on patterns
     * @param {object} patterns - Analyzed patterns
     * @param {Array} attempts - Delivery attempts
     * @returns {object} Escalation decision
     */
    checkEscalationNeeded(patterns, attempts) {
        // Critical: Success rate below 30% with multiple attempts
        if (patterns.successRate < 30 && attempts.length >= 3) {
            return {
                needed: true,
                reason: 'persistent_delivery_failure',
                priority: 'high',
                autoEscalate: true
            };
        }

        // High: Consistent failures across multiple services
        const failingServices = Object.values(patterns.serviceBreakdown)
            .filter(service => service.successRate < 50).length;

        if (failingServices >= 2) {
            return {
                needed: true,
                reason: 'multiple_service_failure',
                priority: 'high',
                autoEscalate: true
            };
        }

        // Medium: High error rate in specific category
        if (patterns.errorPatterns.categorizedErrors.service > 5) {
            return {
                needed: true,
                reason: 'service_degradation',
                priority: 'medium',
                autoEscalate: false
            };
        }

        return { needed: false, reason: null };
    }

    /**
     * Create escalation ticket
     * @param {string} userId - User ID
     * @param {string} reason - Escalation reason
     * @param {object} analysisData - Analysis data
     * @param {object} additionalContext - Additional context
     * @returns {Promise<object>} Escalation ticket
     */
    async createEscalationTicket(userId, reason, analysisData, additionalContext = {}) {
        try {
            const escalationRule = this.escalationRules.get(reason);
            if (!escalationRule) {
                throw new Error(`Unknown escalation reason: ${reason}`);
            }

            const ticket = {
                ticketId: `ESC-${Date.now()}-${userId.slice(-6)}`,
                userId,
                reason,
                priority: escalationRule.priority,
                status: 'open',
                createdAt: new Date(),
                expectedResponse: escalationRule.expectedResponse,
                autoEscalated: escalationRule.autoEscalate,
                analysisData,
                additionalContext,
                escalationPath: this.generateEscalationPath(escalationRule),
                requiredActions: this.generateRequiredActions(reason, analysisData)
            };

            // Log escalation event
            await logVerificationEvent(userId, 'escalation', 'ticket_created', true, {
                ticketId: ticket.ticketId,
                reason,
                priority: escalationRule.priority,
                autoEscalated: escalationRule.autoEscalate
            });

            return ticket;

        } catch (error) {
            console.error('Error creating escalation ticket:', error);
            throw error;
        }
    }

    /**
     * Generate escalation path based on rules
     * @param {object} escalationRule - Escalation rule
     * @returns {Array} Escalation path steps
     */
    generateEscalationPath(escalationRule) {
        const basePath = [
            {
                level: 1,
                role: 'L1 Support',
                timeframe: '0-2 hours',
                actions: ['Initial triage', 'Basic troubleshooting', 'User communication']
            }
        ];

        if (escalationRule.priority === 'critical' || escalationRule.priority === 'high') {
            basePath.push({
                level: 2,
                role: 'L2 Technical Support',
                timeframe: '2-8 hours',
                actions: ['Deep technical analysis', 'Service investigation', 'Configuration review']
            });
        }

        if (escalationRule.priority === 'critical') {
            basePath.push({
                level: 3,
                role: 'Engineering Team',
                timeframe: '8-24 hours',
                actions: ['System-level investigation', 'Code review', 'Infrastructure analysis']
            });
        }

        return basePath;
    }

    /**
     * Generate required actions for escalation
     * @param {string} reason - Escalation reason
     * @param {object} analysisData - Analysis data
     * @returns {Array} Required actions
     */
    generateRequiredActions(reason, analysisData) {
        const actions = [];

        switch (reason) {
            case 'persistent_delivery_failure':
                actions.push(
                    'Review user delivery history and patterns',
                    'Test connectivity to user\'s contact methods',
                    'Check service configurations for user\'s region',
                    'Provide alternative delivery methods'
                );
                break;

            case 'multiple_service_failure':
                actions.push(
                    'Investigate service health across all providers',
                    'Check for regional service issues',
                    'Review service configurations and credentials',
                    'Implement temporary workarounds if needed'
                );
                break;

            case 'service_degradation':
                actions.push(
                    'Monitor service performance metrics',
                    'Check for capacity or rate limiting issues',
                    'Review recent service changes or updates',
                    'Coordinate with service providers if needed'
                );
                break;

            default:
                actions.push(
                    'Investigate reported issue',
                    'Provide user with status updates',
                    'Implement appropriate resolution'
                );
        }

        return actions;
    }

    /**
     * Helper methods
     */
    getCommonErrors(errors) {
        const errorCounts = {};
        errors.forEach(error => {
            errorCounts[error] = (errorCounts[error] || 0) + 1;
        });
        return Object.entries(errorCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([error, count]) => ({ error, count }));
    }

    getPeakFailureHour(hourlyBreakdown) {
        let peakHour = null;
        let maxFailureRate = 0;

        Object.keys(hourlyBreakdown).forEach(hour => {
            const data = hourlyBreakdown[hour];
            const failureRate = data.total > 0 ? (data.failed / data.total) * 100 : 0;
            if (failureRate > maxFailureRate) {
                maxFailureRate = failureRate;
                peakHour = parseInt(hour);
            }
        });

        return { hour: peakHour, failureRate: maxFailureRate };
    }

    getWorstPerformingService(serviceBreakdown) {
        let worstService = null;
        let lowestSuccessRate = 100;

        Object.keys(serviceBreakdown).forEach(serviceName => {
            const service = serviceBreakdown[serviceName];
            if (service.successRate < lowestSuccessRate && service.total >= 2) {
                lowestSuccessRate = service.successRate;
                worstService = {
                    name: serviceName,
                    successRate: service.successRate,
                    errors: service.commonErrors
                };
            }
        });

        return worstService;
    }

    async getSolutionsForPattern(pattern, analysisData) {
        // Return solutions based on pattern analysis
        const solutions = [];

        if (pattern === 'persistent_failure') {
            solutions.push(
                'Switch to the more reliable delivery method',
                'Test connectivity using diagnostic tools',
                'Update contact information if needed',
                'Contact support for personalized assistance'
            );
        }

        return solutions;
    }

    async getSolutionsForService(serviceName, errors) {
        const solutions = [];

        // Add service-specific solutions based on common errors
        if (errors.some(e => e.error.includes('timeout'))) {
            solutions.push('Service may be experiencing delays - try again later');
        }

        if (errors.some(e => e.error.includes('rate'))) {
            solutions.push('Rate limiting detected - wait before retrying');
        }

        solutions.push(`Switch to alternative delivery service temporarily`);

        return solutions;
    }
}

// Create and export singleton instance
const escalationService = new EscalationService();
export default escalationService;