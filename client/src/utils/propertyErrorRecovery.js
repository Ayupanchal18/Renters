/**
 * Property Error Recovery Utilities
 * Provides recovery strategies for property-related errors
 * Validates: Requirements 6.2, 6.3, 6.4, 6.5
 */

import { categorizeError, createUserFriendlyError } from './errorHandling';

/**
 * Property Error Recovery Strategies
 */
export const RECOVERY_STRATEGIES = {
    RETRY: 'retry',
    FALLBACK_DATA: 'fallback_data',
    CACHED_DATA: 'cached_data',
    SKIP_SECTION: 'skip_section',
    REDIRECT: 'redirect',
    MANUAL_INTERVENTION: 'manual_intervention'
};

/**
 * Property Error Recovery Service
 */
export class PropertyErrorRecoveryService {
    constructor(options = {}) {
        this.cache = options.cache || new Map();
        this.fallbackData = options.fallbackData || {};
        this.retryAttempts = new Map();
        this.maxRetries = options.maxRetries || 3;
    }

    /**
     * Analyze error and determine recovery strategy
     */
    analyzeError(error, context = {}) {
        const categorized = categorizeError(error);
        const { propertyId, componentName, operation } = context;

        const analysis = {
            error: categorized,
            context,
            strategies: [],
            priority: 'medium',
            userMessage: createUserFriendlyError(error, operation).message
        };

        // Determine available recovery strategies
        switch (categorized.type) {
            case 'NETWORK':
                analysis.strategies = [
                    RECOVERY_STRATEGIES.CACHED_DATA,
                    RECOVERY_STRATEGIES.RETRY,
                    RECOVERY_STRATEGIES.FALLBACK_DATA
                ];
                analysis.priority = 'high';
                break;

            case 'TIMEOUT':
                analysis.strategies = [
                    RECOVERY_STRATEGIES.RETRY,
                    RECOVERY_STRATEGIES.CACHED_DATA,
                    RECOVERY_STRATEGIES.FALLBACK_DATA
                ];
                analysis.priority = 'medium';
                break;

            case 'NOT_FOUND':
                if (propertyId) {
                    analysis.strategies = [
                        RECOVERY_STRATEGIES.REDIRECT,
                        RECOVERY_STRATEGIES.FALLBACK_DATA
                    ];
                } else {
                    analysis.strategies = [
                        RECOVERY_STRATEGIES.SKIP_SECTION,
                        RECOVERY_STRATEGIES.FALLBACK_DATA
                    ];
                }
                analysis.priority = 'high';
                break;

            case 'SERVER':
                analysis.strategies = [
                    RECOVERY_STRATEGIES.RETRY,
                    RECOVERY_STRATEGIES.CACHED_DATA,
                    RECOVERY_STRATEGIES.FALLBACK_DATA
                ];
                analysis.priority = 'high';
                break;

            case 'VALIDATION':
                analysis.strategies = [
                    RECOVERY_STRATEGIES.FALLBACK_DATA,
                    RECOVERY_STRATEGIES.MANUAL_INTERVENTION
                ];
                analysis.priority = 'low';
                break;

            default:
                analysis.strategies = [
                    RECOVERY_STRATEGIES.RETRY,
                    RECOVERY_STRATEGIES.FALLBACK_DATA,
                    RECOVERY_STRATEGIES.SKIP_SECTION
                ];
                analysis.priority = 'medium';
        }

        return analysis;
    }

    /**
     * Execute recovery strategy
     */
    async executeRecovery(strategy, context = {}) {
        const { propertyId, componentName, operation, error } = context;

        switch (strategy) {
            case RECOVERY_STRATEGIES.RETRY:
                return this.executeRetry(context);

            case RECOVERY_STRATEGIES.CACHED_DATA:
                return this.getCachedData(propertyId);

            case RECOVERY_STRATEGIES.FALLBACK_DATA:
                return this.getFallbackData(componentName, propertyId);

            case RECOVERY_STRATEGIES.SKIP_SECTION:
                return this.createSkipResult(componentName);

            case RECOVERY_STRATEGIES.REDIRECT:
                return this.createRedirectResult();

            case RECOVERY_STRATEGIES.MANUAL_INTERVENTION:
                return this.createManualInterventionResult(error);

            default:
                throw new Error(`Unknown recovery strategy: ${strategy}`);
        }
    }

    /**
     * Execute retry with exponential backoff
     */
    async executeRetry(context) {
        const { operation, propertyId, retryOperation } = context;
        const retryKey = `${operation}-${propertyId}`;
        const attempts = this.retryAttempts.get(retryKey) || 0;

        if (attempts >= this.maxRetries) {
            throw new Error('Maximum retry attempts exceeded');
        }

        this.retryAttempts.set(retryKey, attempts + 1);

        // Exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            const result = await retryOperation();
            this.retryAttempts.delete(retryKey);
            return {
                success: true,
                data: result,
                strategy: RECOVERY_STRATEGIES.RETRY,
                message: 'Operation completed successfully after retry'
            };
        } catch (error) {
            if (attempts + 1 >= this.maxRetries) {
                this.retryAttempts.delete(retryKey);
            }
            throw error;
        }
    }

    /**
     * Get cached data for property
     */
    getCachedData(propertyId) {
        if (!propertyId || !this.cache.has(propertyId)) {
            throw new Error('No cached data available');
        }

        const cachedData = this.cache.get(propertyId);
        return {
            success: true,
            data: cachedData,
            strategy: RECOVERY_STRATEGIES.CACHED_DATA,
            message: 'Using cached data (may not be up to date)',
            isStale: true
        };
    }

    /**
     * Get fallback data for component
     */
    getFallbackData(componentName, propertyId) {
        const fallbackData = this.generateFallbackData(componentName, propertyId);

        return {
            success: true,
            data: fallbackData,
            strategy: RECOVERY_STRATEGIES.FALLBACK_DATA,
            message: 'Using default data due to loading error',
            isFallback: true
        };
    }

    /**
     * Create skip result for non-critical components
     */
    createSkipResult(componentName) {
        return {
            success: true,
            data: null,
            strategy: RECOVERY_STRATEGIES.SKIP_SECTION,
            message: `Skipped ${componentName} due to error`,
            isSkipped: true
        };
    }

    /**
     * Create redirect result for critical errors
     */
    createRedirectResult() {
        return {
            success: false,
            data: null,
            strategy: RECOVERY_STRATEGIES.REDIRECT,
            message: 'Redirecting to property listings',
            shouldRedirect: true,
            redirectUrl: '/properties'
        };
    }

    /**
     * Create manual intervention result
     */
    createManualInterventionResult(error) {
        return {
            success: false,
            data: null,
            strategy: RECOVERY_STRATEGIES.MANUAL_INTERVENTION,
            message: 'Manual intervention required',
            requiresUserAction: true,
            error: createUserFriendlyError(error)
        };
    }

    /**
     * Generate fallback data based on component type
     */
    generateFallbackData(componentName, propertyId) {
        const fallbackTemplates = {
            'property-header': {
                title: 'Property Details',
                category: 'Residential',
                propertyType: 'Apartment',
                verificationStatus: 'pending'
            },
            'property-details': {
                description: 'Property details are currently unavailable. Please contact the owner for more information.',
                bedrooms: 'N/A',
                bathrooms: 'N/A',
                builtUpArea: 'N/A',
                amenities: []
            },
            'financial-details': {
                monthlyRent: 'Contact for pricing',
                securityDeposit: 'N/A',
                maintenanceCharge: 'N/A',
                totalMonthlyCost: 'N/A'
            },
            'property-location': {
                address: 'Address not available',
                city: 'Location not specified',
                mapLocation: null,
                coordinates: null
            },
            'owner-contact': {
                name: 'Property Owner',
                phone: 'Contact information not available',
                email: 'Not provided',
                verificationStatus: 'pending'
            },
            'image-carousel': {
                images: ['/placeholder-property.jpg'],
                title: 'Property Images'
            },
            'nearby-recommendations': {
                recommendations: [],
                message: 'Nearby recommendations are currently unavailable'
            }
        };

        return {
            ...fallbackTemplates[componentName] || {},
            _id: propertyId,
            _isFallback: true,
            _timestamp: new Date().toISOString()
        };
    }

    /**
     * Update cache with new data
     */
    updateCache(propertyId, data) {
        if (propertyId && data) {
            this.cache.set(propertyId, {
                ...data,
                _cached: true,
                _cachedAt: new Date().toISOString()
            });
        }
    }

    /**
     * Clear cache for property
     */
    clearCache(propertyId) {
        if (propertyId) {
            this.cache.delete(propertyId);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Get recovery recommendations for error
     */
    getRecoveryRecommendations(error, context = {}) {
        const analysis = this.analyzeError(error, context);

        return {
            primary: analysis.strategies[0],
            alternatives: analysis.strategies.slice(1),
            userMessage: analysis.userMessage,
            priority: analysis.priority,
            canAutoRecover: analysis.strategies.includes(RECOVERY_STRATEGIES.RETRY) ||
                analysis.strategies.includes(RECOVERY_STRATEGIES.CACHED_DATA) ||
                analysis.strategies.includes(RECOVERY_STRATEGIES.FALLBACK_DATA)
        };
    }

    /**
     * Auto-recover from error using best available strategy
     */
    async autoRecover(error, context = {}) {
        const recommendations = this.getRecoveryRecommendations(error, context);

        if (!recommendations.canAutoRecover) {
            throw new Error('Auto-recovery not possible for this error type');
        }

        // Try strategies in order of preference
        for (const strategy of [recommendations.primary, ...recommendations.alternatives]) {
            try {
                const result = await this.executeRecovery(strategy, { ...context, error });
                if (result.success) {
                    return result;
                }
            } catch (recoveryError) {
                console.warn(`Recovery strategy ${strategy} failed:`, recoveryError);
                continue;
            }
        }

        throw new Error('All recovery strategies failed');
    }
}

/**
 * Create default property error recovery service
 */
export function createPropertyErrorRecovery(options = {}) {
    return new PropertyErrorRecoveryService(options);
}

/**
 * Property Error Recovery Hook
 */
export function usePropertyErrorRecovery(options = {}) {
    const [recoveryService] = useState(() => createPropertyErrorRecovery(options));

    const recover = useCallback(async (error, context = {}) => {
        try {
            return await recoveryService.autoRecover(error, context);
        } catch (recoveryError) {
            console.error('Error recovery failed:', recoveryError);
            throw recoveryError;
        }
    }, [recoveryService]);

    const getRecommendations = useCallback((error, context = {}) => {
        return recoveryService.getRecoveryRecommendations(error, context);
    }, [recoveryService]);

    const updateCache = useCallback((propertyId, data) => {
        recoveryService.updateCache(propertyId, data);
    }, [recoveryService]);

    const clearCache = useCallback((propertyId) => {
        recoveryService.clearCache(propertyId);
    }, [recoveryService]);

    return {
        recover,
        getRecommendations,
        updateCache,
        clearCache,
        service: recoveryService
    };
}