/**
 * Property Retry Hook
 * Provides retry mechanisms for property-related operations
 * Validates: Requirements 6.2, 6.4
 */

import { useState, useCallback, useRef } from 'react';
import { createRetryMechanism, categorizeError } from '../utils/errorHandling';
import { useLoadingStates } from './useLoadingStates';

/**
 * Property Retry Hook
 */
export function usePropertyRetry(options = {}) {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        backoffFactor = 2
    } = options;

    const [retryAttempts, setRetryAttempts] = useState(new Map());
    const { setError, setSuccess, startLoading, clearState } = useLoadingStates();
    const abortControllersRef = useRef(new Map());

    // Create retry mechanism for property operations
    const createPropertyRetry = useCallback((operation, operationId) => {
        return createRetryMechanism(operation, {
            maxRetries,
            baseDelay,
            maxDelay,
            backoffFactor,
            retryCondition: (error) => {
                const categorized = categorizeError(error);
                // Don't retry for certain error types
                if (categorized.type === 'NOT_FOUND' || categorized.type === 'AUTHORIZATION') {
                    return false;
                }
                return categorized.retryable;
            }
        });
    }, [maxRetries, baseDelay, maxDelay, backoffFactor]);

    // Execute operation with retry
    const executeWithRetry = useCallback(async (operation, operationId, ...args) => {
        // Cancel any existing operation
        const existingController = abortControllersRef.current.get(operationId);
        if (existingController) {
            existingController.abort();
        }

        // Create new abort controller
        const abortController = new AbortController();
        abortControllersRef.current.set(operationId, abortController);

        try {
            startLoading(operationId);
            setRetryAttempts(prev => new Map(prev).set(operationId, 0));

            const retryableOperation = createPropertyRetry(
                async (...operationArgs) => {
                    // Check if operation was aborted
                    if (abortController.signal.aborted) {
                        throw new Error('Operation aborted');
                    }

                    // Increment retry attempt
                    setRetryAttempts(prev => {
                        const newMap = new Map(prev);
                        const currentAttempts = newMap.get(operationId) || 0;
                        newMap.set(operationId, currentAttempts + 1);
                        return newMap;
                    });

                    return await operation(...operationArgs);
                },
                operationId
            );

            const result = await retryableOperation(...args);

            setSuccess(operationId, result);
            setRetryAttempts(prev => {
                const newMap = new Map(prev);
                newMap.delete(operationId);
                return newMap;
            });

            return result;
        } catch (error) {
            if (error.message !== 'Operation aborted') {
                setError(operationId, error);
            }
            throw error;
        } finally {
            abortControllersRef.current.delete(operationId);
        }
    }, [createPropertyRetry, startLoading, setSuccess, setError]);

    // Manual retry function
    const retry = useCallback(async (operation, operationId, ...args) => {
        clearState(operationId);
        return executeWithRetry(operation, operationId, ...args);
    }, [executeWithRetry, clearState]);

    // Cancel operation
    const cancel = useCallback((operationId) => {
        const controller = abortControllersRef.current.get(operationId);
        if (controller) {
            controller.abort();
            abortControllersRef.current.delete(operationId);
        }
        clearState(operationId);
        setRetryAttempts(prev => {
            const newMap = new Map(prev);
            newMap.delete(operationId);
            return newMap;
        });
    }, [clearState]);

    // Get retry attempt count
    const getRetryAttempts = useCallback((operationId) => {
        return retryAttempts.get(operationId) || 0;
    }, [retryAttempts]);

    // Check if operation can be retried
    const canRetry = useCallback((operationId, error) => {
        const attempts = getRetryAttempts(operationId);
        const categorized = categorizeError(error);
        return attempts < maxRetries && categorized.retryable;
    }, [getRetryAttempts, maxRetries]);

    return {
        executeWithRetry,
        retry,
        cancel,
        getRetryAttempts,
        canRetry,
        retryAttempts: Array.from(retryAttempts.entries())
    };
}

/**
 * Property Fetch Hook with Retry
 */
export function usePropertyFetch(propertyService) {
    const { executeWithRetry, retry, cancel, getRetryAttempts, canRetry } = usePropertyRetry();
    const [cache, setCache] = useState(new Map());

    // Fetch property with caching and retry
    const fetchProperty = useCallback(async (propertyId, options = {}) => {
        const { useCache = true, forceRefresh = false } = options;
        const operationId = `fetch-property-${propertyId}`;

        // Return cached data if available and not forcing refresh
        if (useCache && !forceRefresh && cache.has(propertyId)) {
            return cache.get(propertyId);
        }

        try {
            const result = await executeWithRetry(
                async (id) => {
                    const property = await propertyService.getById(id);
                    if (!property) {
                        throw new Error('Property not found');
                    }
                    return property;
                },
                operationId,
                propertyId
            );

            // Cache the result
            setCache(prev => new Map(prev).set(propertyId, result));
            return result;
        } catch (error) {
            // If it's a network error and we have cached data, return it
            const categorized = categorizeError(error);
            if (categorized.type === 'NETWORK' && cache.has(propertyId)) {
                console.warn('Using cached data due to network error');
                return cache.get(propertyId);
            }
            throw error;
        }
    }, [executeWithRetry, cache, propertyService]);

    // Retry property fetch
    const retryFetch = useCallback((propertyId) => {
        const operationId = `fetch-property-${propertyId}`;
        return retry(
            async (id) => {
                const property = await propertyService.getById(id);
                if (!property) {
                    throw new Error('Property not found');
                }
                return property;
            },
            operationId,
            propertyId
        );
    }, [retry, propertyService]);

    // Cancel property fetch
    const cancelFetch = useCallback((propertyId) => {
        const operationId = `fetch-property-${propertyId}`;
        cancel(operationId);
    }, [cancel]);

    // Clear cache
    const clearCache = useCallback((propertyId) => {
        if (propertyId) {
            setCache(prev => {
                const newMap = new Map(prev);
                newMap.delete(propertyId);
                return newMap;
            });
        } else {
            setCache(new Map());
        }
    }, []);

    return {
        fetchProperty,
        retryFetch,
        cancelFetch,
        clearCache,
        getRetryAttempts,
        canRetry,
        cache: Array.from(cache.entries())
    };
}

/**
 * Property Batch Operations Hook
 */
export function usePropertyBatchRetry() {
    const { executeWithRetry, cancel } = usePropertyRetry();
    const [batchProgress, setBatchProgress] = useState({
        total: 0,
        completed: 0,
        failed: 0,
        current: null
    });

    // Execute batch operations with retry
    const executeBatch = useCallback(async (operations, onProgress) => {
        const total = operations.length;
        let completed = 0;
        let failed = 0;
        const results = [];

        setBatchProgress({ total, completed: 0, failed: 0, current: null });

        for (const [index, { id, operation, data }] of operations.entries()) {
            setBatchProgress(prev => ({ ...prev, current: id }));

            try {
                const result = await executeWithRetry(
                    operation,
                    `batch-${id}`,
                    data
                );

                results.push({ id, result, success: true });
                completed++;

                onProgress?.({
                    id,
                    result,
                    success: true,
                    completed,
                    failed,
                    total,
                    progress: (completed + failed) / total * 100
                });
            } catch (error) {
                results.push({ id, error, success: false });
                failed++;

                onProgress?.({
                    id,
                    error,
                    success: false,
                    completed,
                    failed,
                    total,
                    progress: (completed + failed) / total * 100
                });
            }

            setBatchProgress({ total, completed, failed, current: null });
        }

        return results;
    }, [executeWithRetry]);

    // Cancel batch operations
    const cancelBatch = useCallback((operationIds) => {
        operationIds.forEach(id => {
            cancel(`batch-${id}`);
        });
        setBatchProgress({ total: 0, completed: 0, failed: 0, current: null });
    }, [cancel]);

    return {
        executeBatch,
        cancelBatch,
        batchProgress
    };
}