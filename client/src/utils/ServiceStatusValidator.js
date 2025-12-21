/**
 * Service Status Data Validation Utility
 * Handles validation and transformation of service status data
 */

/**
 * Validates service status data structure
 * @param {any} serviceStatus - The service status data to validate
 * @returns {Object} Validation result with isValid flag and normalized data
 */
export const validateServiceStatus = (serviceStatus) => {
    const result = {
        isValid: false,
        data: null,
        error: null,
        fallback: {
            services: {},
            ready: false,
            primary: null
        }
    };

    try {
        // Check if serviceStatus exists
        if (!serviceStatus) {
            result.error = 'Service status data is null or undefined';
            result.data = result.fallback;
            return result;
        }

        // Check if services property exists
        if (!serviceStatus.services) {
            result.error = 'Service status missing services property';
            result.data = { ...serviceStatus, services: {} };
            return result;
        }

        // Validate services structure - should be an object
        if (typeof serviceStatus.services !== 'object' || Array.isArray(serviceStatus.services)) {
            result.error = `Expected services to be an object, got ${Array.isArray(serviceStatus.services) ? 'array' : typeof serviceStatus.services}`;
            result.data = { ...serviceStatus, services: {} };
            return result;
        }

        // Data is valid
        result.isValid = true;
        result.data = serviceStatus;
        return result;

    } catch (error) {
        result.error = `Validation error: ${error.message}`;
        result.data = result.fallback;
        return result;
    }
};

/**
 * Safely converts services object to array format for processing
 * @param {Object} services - Services object from service status
 * @returns {Array} Array of service objects with normalized structure
 */
export const convertServicesToArray = (services) => {
    if (!services || typeof services !== 'object') {
        console.warn('convertServicesToArray: Invalid services data, returning empty array');
        return [];
    }

    try {
        return Object.entries(services)
            .filter(([key]) => !['ready', 'primary'].includes(key))
            .map(([name, statusObj]) => ({
                name,
                status: statusObj?.ready ? 'healthy' : 'down',
                ready: statusObj?.ready || false,
                originalStatus: statusObj?.status,
                capabilities: getServiceCapabilities(name),
                rawData: statusObj
            }));
    } catch (error) {
        console.error('Error converting services to array:', error);
        return [];
    }
};

/**
 * Gets capabilities for a service based on its name
 * @param {string} serviceName - Name of the service
 * @returns {Array} Array of capabilities
 */
const getServiceCapabilities = (serviceName) => {
    const capabilityMap = {
        'phone-email': ['sms', 'email'],
        'email': ['email'],
        'sms': ['sms'],
        'phone': ['sms']
    };

    return capabilityMap[serviceName] || [];
};

/**
 * Logs service status validation errors for debugging
 * @param {string} context - Context where the error occurred
 * @param {Object} validationResult - Result from validateServiceStatus
 */
export const logServiceStatusError = (context, validationResult) => {
    if (!validationResult.isValid && validationResult.error) {
        console.error(`[ServiceStatus] ${context}:`, {
            error: validationResult.error,
            receivedData: validationResult.data,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Gets fallback delivery methods when service status is unavailable
 * @returns {Array} Array of fallback delivery methods
 */
export const getFallbackDeliveryMethods = () => {
    return [
        {
            method: 'email',
            label: 'Email',
            icon: 'mail',
            available: false,
            services: [],
            fallback: true
        }
    ];
};