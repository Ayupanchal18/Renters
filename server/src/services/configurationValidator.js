import phoneEmailService from './phoneEmailService.js';
import smsService from './smsService.js';
import emailService from './emailService.js';

/**
 * Configuration Validator for OTP delivery services
 * Validates and monitors Phone.email, Twilio, and SMTP service configurations
 */
class ConfigurationValidator {
    constructor() {
        this.services = {
            'phone-email': phoneEmailService,
            'twilio': smsService,
            'smtp': emailService
        };

        this.serviceConfigs = new Map();
        this.validationResults = new Map();
        this.healthStatuses = new Map();
        this.lastValidation = null;
        this.monitoringInterval = null;
        this.validationInProgress = false;

        // Service priority order (primary to fallback)
        this.servicePriority = ['phone-email', 'twilio', 'smtp'];

        this.initializeValidator();
    }

    /**
     * Initialize the configuration validator
     */
    initializeValidator() {
        try {
            console.log('Initializing OTP service configuration validator...');

            // Load initial service configurations
            this.loadServiceConfigurations();

            // Start monitoring if not already running
            this.startMonitoring();

            console.log('Configuration validator initialized successfully');
        } catch (error) {
            console.error('Failed to initialize configuration validator:', error);
        }
    }

    /**
     * Load service configurations from environment variables
     */
    loadServiceConfigurations() {
        // Phone.email configuration
        this.serviceConfigs.set('phone-email', {
            serviceName: 'phone-email',
            displayName: 'Phone.email',
            isEnabled: true,
            isPrimary: true,
            credentials: {
                apiKey: process.env.PHONE_EMAIL_API_KEY,
                apiUrl: process.env.PHONE_EMAIL_API_URL || 'https://api.phone.email/v1'
            },
            capabilities: ['sms', 'email'],
            priority: 1
        });

        // Twilio SMS configuration
        this.serviceConfigs.set('twilio', {
            serviceName: 'twilio',
            displayName: 'Twilio SMS',
            isEnabled: true,
            isPrimary: false,
            credentials: {
                accountSid: process.env.TWILIO_ACCOUNT_SID,
                authToken: process.env.TWILIO_AUTH_TOKEN,
                phoneNumber: process.env.TWILIO_PHONE_NUMBER
            },
            capabilities: ['sms'],
            priority: 2
        });

        // SMTP Email configuration
        this.serviceConfigs.set('smtp', {
            serviceName: 'smtp',
            displayName: 'SMTP Email',
            isEnabled: true,
            isPrimary: false,
            credentials: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_SECURE,
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
                from: process.env.SMTP_FROM
            },
            capabilities: ['email'],
            priority: 3
        });
    }

    /**
     * Validate all configured services
     * @returns {Promise<{success: boolean, services: object, summary: object}>}
     */
    async validateAllServices() {
        if (this.validationInProgress) {
            console.log('Validation already in progress, skipping...');
            return this.getLastValidationResults();
        }

        this.validationInProgress = true;
        console.log('Starting comprehensive service validation...');

        try {
            const validationResults = {};
            const summary = {
                totalServices: this.serviceConfigs.size,
                validServices: 0,
                invalidServices: 0,
                primaryServiceValid: false,
                fallbackServicesAvailable: 0,
                recommendedActions: []
            };

            // Validate each service
            for (const [serviceName, config] of this.serviceConfigs) {
                console.log(`Validating ${config.displayName}...`);

                const result = await this.validateService(serviceName);
                validationResults[serviceName] = result;

                if (result.success) {
                    summary.validServices++;
                    if (config.isPrimary) {
                        summary.primaryServiceValid = true;
                    } else {
                        summary.fallbackServicesAvailable++;
                    }
                } else {
                    summary.invalidServices++;
                }

                // Update health status
                this.updateServiceHealth(serviceName, result);
            }

            // Generate recommendations
            summary.recommendedActions = this.generateRecommendations(validationResults);

            // Update validation timestamp
            this.lastValidation = new Date();

            // Determine overall success
            const overallSuccess = summary.validServices > 0;

            const finalResult = {
                success: overallSuccess,
                services: validationResults,
                summary,
                validatedAt: this.lastValidation
            };

            console.log(`Service validation completed. ${summary.validServices}/${summary.totalServices} services valid.`);

            return finalResult;

        } catch (error) {
            console.error('Error during service validation:', error);
            return {
                success: false,
                error: error.message,
                validatedAt: new Date()
            };
        } finally {
            this.validationInProgress = false;
        }
    }

    /**
     * Validate a specific service
     * @param {string} serviceName - Name of the service to validate
     * @returns {Promise<{success: boolean, details: object, error?: string}>}
     */
    async validateService(serviceName) {
        try {
            const config = this.serviceConfigs.get(serviceName);
            if (!config) {
                return {
                    success: false,
                    error: `Unknown service: ${serviceName}`,
                    details: { configured: false }
                };
            }

            const service = this.services[serviceName];
            if (!service) {
                return {
                    success: false,
                    error: `Service implementation not found: ${serviceName}`,
                    details: { configured: false }
                };
            }

            // Check if service has required credentials
            const credentialCheck = this.validateCredentials(serviceName, config.credentials);
            if (!credentialCheck.success) {
                return {
                    success: false,
                    error: credentialCheck.error,
                    details: {
                        configured: false,
                        credentialIssues: credentialCheck.issues
                    }
                };
            }

            // Test service connectivity and functionality
            let connectivityResult = { success: true };

            if (serviceName === 'phone-email') {
                connectivityResult = await phoneEmailService.validateCredentials();
            } else if (serviceName === 'twilio') {
                connectivityResult = await smsService.validateCredentials();
            } else if (serviceName === 'smtp') {
                // For SMTP, we check if it's ready (includes test mode)
                const status = emailService.getStatus();
                connectivityResult = {
                    success: emailService.isReady(),
                    testMode: status.testMode,
                    error: emailService.isReady() ? null : 'SMTP service not properly configured'
                };
            }

            if (!connectivityResult.success) {
                return {
                    success: false,
                    error: connectivityResult.error || 'Connectivity test failed',
                    details: {
                        configured: true,
                        credentialsValid: true,
                        connectivityFailed: true
                    }
                };
            }

            // Service is valid
            return {
                success: true,
                details: {
                    configured: true,
                    credentialsValid: true,
                    connectivitySuccessful: true,
                    capabilities: config.capabilities,
                    priority: config.priority,
                    accountInfo: connectivityResult.accountInfo || null
                }
            };

        } catch (error) {
            console.error(`Error validating service ${serviceName}:`, error);
            return {
                success: false,
                error: error.message,
                details: { validationError: true }
            };
        }
    }

    /**
     * Validate service credentials
     * @param {string} serviceName - Name of the service
     * @param {object} credentials - Service credentials
     * @returns {object} Validation result
     */
    validateCredentials(serviceName, credentials) {
        const issues = [];

        switch (serviceName) {
            case 'phone-email':
                if (!credentials.apiKey) {
                    issues.push('PHONE_EMAIL_API_KEY is required');
                }
                if (!credentials.apiUrl) {
                    issues.push('PHONE_EMAIL_API_URL is required');
                }
                break;

            case 'twilio':
                if (!credentials.accountSid) {
                    issues.push('TWILIO_ACCOUNT_SID is required');
                }
                if (!credentials.authToken) {
                    issues.push('TWILIO_AUTH_TOKEN is required');
                }
                if (!credentials.phoneNumber) {
                    issues.push('TWILIO_PHONE_NUMBER is required');
                }
                break;

            case 'smtp':
                // SMTP can work in test mode without credentials
                // Only require credentials if they're partially configured
                const hasAnySmtpConfig = credentials.host || credentials.user || credentials.pass;
                if (hasAnySmtpConfig) {
                    if (!credentials.host) {
                        issues.push('SMTP_HOST is required');
                    }
                    if (!credentials.user) {
                        issues.push('SMTP_USER is required');
                    }
                    if (!credentials.pass) {
                        issues.push('SMTP_PASS is required');
                    }
                }
                // If no SMTP config at all, it will use test mode - that's OK
                break;

            default:
                issues.push(`Unknown service type: ${serviceName}`);
        }

        return {
            success: issues.length === 0,
            error: issues.length > 0 ? `Missing required credentials: ${issues.join(', ')}` : null,
            issues
        };
    }

    /**
     * Generate recommendations based on validation results
     * @param {object} validationResults - Results from service validation
     * @returns {array} Array of recommendation strings
     */
    generateRecommendations(validationResults) {
        const recommendations = [];
        const phoneEmailValid = validationResults['phone-email']?.success;
        const twilioValid = validationResults['twilio']?.success;
        const smtpValid = validationResults['smtp']?.success;

        // Primary service recommendations
        if (!phoneEmailValid) {
            recommendations.push('Configure Phone.email service for optimal OTP delivery performance');

            if (!twilioValid && !smtpValid) {
                recommendations.push('CRITICAL: No OTP delivery services are configured. OTP functionality will be disabled.');
            } else {
                recommendations.push('Fallback services are available, but primary service should be configured for best reliability');
            }
        }

        // Fallback service recommendations
        if (phoneEmailValid && !twilioValid) {
            recommendations.push('Consider configuring Twilio SMS as a fallback for SMS delivery');
        }

        if (phoneEmailValid && !smtpValid) {
            recommendations.push('Consider configuring SMTP email as a fallback for email delivery');
        }

        // Service-specific recommendations
        if (twilioValid && !phoneEmailValid) {
            recommendations.push('Twilio is configured but Phone.email would provide better global coverage');
        }

        if (smtpValid && !phoneEmailValid) {
            recommendations.push('SMTP is configured but Phone.email would provide unified SMS/email delivery');
        }

        return recommendations;
    }

    /**
     * Update service health status
     * @param {string} serviceName - Name of the service
     * @param {object} validationResult - Validation result
     */
    updateServiceHealth(serviceName, validationResult) {
        const healthStatus = {
            serviceName,
            isHealthy: validationResult.success,
            lastChecked: new Date(),
            status: validationResult.success ? 'healthy' : 'unhealthy',
            error: validationResult.error || null,
            details: validationResult.details || {}
        };

        this.healthStatuses.set(serviceName, healthStatus);

        // Update service configuration status
        const config = this.serviceConfigs.get(serviceName);
        if (config) {
            config.lastValidated = new Date();
            config.validationStatus = validationResult.success ? 'valid' : 'invalid';
            config.healthStatus = healthStatus.status;
            config.lastError = validationResult.error || null;
        }
    }

    /**
     * Get available services for OTP delivery
     * @param {string} method - 'sms', 'email', or 'both'
     * @returns {array} Array of available service names
     */
    getAvailableServices(method = 'both') {
        const availableServices = [];

        for (const [serviceName, config] of this.serviceConfigs) {
            const healthStatus = this.healthStatuses.get(serviceName);

            // Check if service is healthy OR if it's SMTP/Twilio which always work in test mode
            const isAvailable = healthStatus?.isHealthy ||
                (serviceName === 'smtp' && emailService.isReady()) ||
                (serviceName === 'twilio' && smsService.isReady());

            if (isAvailable && config.isEnabled) {
                // Check if service supports the requested method
                if (method === 'both' || config.capabilities.includes(method)) {
                    availableServices.push({
                        serviceName,
                        displayName: config.displayName,
                        capabilities: config.capabilities,
                        priority: config.priority,
                        isPrimary: config.isPrimary
                    });
                }
            }
        }

        // Sort by priority (lower number = higher priority)
        return availableServices.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Start real-time monitoring of service health
     * @param {number} intervalMinutes - Monitoring interval in minutes (default: 15)
     */
    startMonitoring(intervalMinutes = 15) {
        if (this.monitoringInterval) {
            console.log('Service monitoring already running');
            return;
        }

        const intervalMs = intervalMinutes * 60 * 1000;

        this.monitoringInterval = setInterval(async () => {
            try {
                console.log('Running scheduled service health check...');
                await this.validateAllServices();
            } catch (error) {
                console.error('Error during scheduled service validation:', error);
            }
        }, intervalMs);

        console.log(`Service monitoring started with ${intervalMinutes}-minute intervals`);
    }

    /**
     * Stop real-time monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('Service monitoring stopped');
        }
    }

    /**
     * Get last validation results
     * @returns {object} Last validation results or null
     */
    getLastValidationResults() {
        if (!this.lastValidation) {
            return null;
        }

        const results = {};
        for (const [serviceName] of this.serviceConfigs) {
            const healthStatus = this.healthStatuses.get(serviceName);
            if (healthStatus) {
                results[serviceName] = {
                    success: healthStatus.isHealthy,
                    details: healthStatus.details,
                    error: healthStatus.error
                };
            }
        }

        return {
            success: Object.values(results).some(r => r.success),
            services: results,
            validatedAt: this.lastValidation
        };
    }

    /**
     * Get service configuration status
     * @returns {object} Configuration status for all services
     */
    getServiceStatus() {
        const status = {};

        for (const [serviceName, config] of this.serviceConfigs) {
            const healthStatus = this.healthStatuses.get(serviceName);

            status[serviceName] = {
                displayName: config.displayName,
                configured: this.validateCredentials(serviceName, config.credentials).success,
                enabled: config.isEnabled,
                primary: config.isPrimary,
                capabilities: config.capabilities,
                priority: config.priority,
                validationStatus: config.validationStatus || 'pending',
                healthStatus: config.healthStatus || 'unknown',
                lastValidated: config.lastValidated || null,
                lastError: config.lastError || null,
                isHealthy: healthStatus?.isHealthy || false
            };
        }

        return status;
    }

    /**
     * Enable or disable a service
     * @param {string} serviceName - Name of the service
     * @param {boolean} enabled - Enable/disable status
     * @returns {boolean} Success status
     */
    setServiceEnabled(serviceName, enabled) {
        const config = this.serviceConfigs.get(serviceName);
        if (!config) {
            return false;
        }

        config.isEnabled = enabled;
        console.log(`Service ${serviceName} ${enabled ? 'enabled' : 'disabled'}`);
        return true;
    }

    /**
     * Re-validate service configurations after changes
     * @returns {Promise<object>} Validation results
     */
    async revalidateConfigurations() {
        console.log('Re-validating service configurations after changes...');

        // Reload configurations from environment
        this.loadServiceConfigurations();

        // Re-validate all services
        return await this.validateAllServices();
    }

    /**
     * Get service health metrics
     * @returns {object} Health metrics for monitoring
     */
    getHealthMetrics() {
        const metrics = {
            totalServices: this.serviceConfigs.size,
            healthyServices: 0,
            unhealthyServices: 0,
            primaryServiceHealthy: false,
            fallbackServicesHealthy: 0,
            lastValidation: this.lastValidation,
            monitoringActive: this.monitoringInterval !== null
        };

        for (const [serviceName, config] of this.serviceConfigs) {
            const healthStatus = this.healthStatuses.get(serviceName);

            if (healthStatus?.isHealthy) {
                metrics.healthyServices++;
                if (config.isPrimary) {
                    metrics.primaryServiceHealthy = true;
                } else {
                    metrics.fallbackServicesHealthy++;
                }
            } else {
                metrics.unhealthyServices++;
            }
        }

        return metrics;
    }
}

// Create and export a singleton instance
const configurationValidator = new ConfigurationValidator();
export default configurationValidator;