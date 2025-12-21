/**
 * Loading States Management Hook
 * Centralized loading state management for dashboard components
 * Validates: Requirements 1.4, 7.5, 9.1, 9.2, 9.4
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Loading State Types
 */
export const LOADING_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
    RETRYING: 'retrying'
};

/**
 * Main Loading States Hook
 */
export function useLoadingStates(initialStates = {}) {
    const [states, setStates] = useState(initialStates);
    const timeoutsRef = useRef(new Map());

    // Set loading state for a specific operation
    const setLoadingState = useCallback((operation, state, data = null) => {
        setStates(prev => ({
            ...prev,
            [operation]: {
                state,
                data,
                timestamp: Date.now()
            }
        }));

        // Auto-clear success/error states after delay
        if (state === LOADING_STATES.SUCCESS || state === LOADING_STATES.ERROR) {
            const existingTimeout = timeoutsRef.current.get(operation);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            const timeout = setTimeout(() => {
                setStates(prev => {
                    const newStates = { ...prev };
                    if (newStates[operation]?.state === state) {
                        newStates[operation] = {
                            state: LOADING_STATES.IDLE,
                            data: null,
                            timestamp: Date.now()
                        };
                    }
                    return newStates;
                });
                timeoutsRef.current.delete(operation);
            }, state === LOADING_STATES.SUCCESS ? 3000 : 5000);

            timeoutsRef.current.set(operation, timeout);
        }
    }, []);

    // Get loading state for an operation
    const getLoadingState = useCallback((operation) => {
        return states[operation] || { state: LOADING_STATES.IDLE, data: null, timestamp: null };
    }, [states]);

    // Check if operation is in specific state
    const isLoading = useCallback((operation) => {
        return getLoadingState(operation).state === LOADING_STATES.LOADING;
    }, [getLoadingState]);

    const isSuccess = useCallback((operation) => {
        return getLoadingState(operation).state === LOADING_STATES.SUCCESS;
    }, [getLoadingState]);

    const isError = useCallback((operation) => {
        return getLoadingState(operation).state === LOADING_STATES.ERROR;
    }, [getLoadingState]);

    const isRetrying = useCallback((operation) => {
        return getLoadingState(operation).state === LOADING_STATES.RETRYING;
    }, [getLoadingState]);

    // Convenience methods
    const startLoading = useCallback((operation, data = null) => {
        setLoadingState(operation, LOADING_STATES.LOADING, data);
    }, [setLoadingState]);

    const setSuccess = useCallback((operation, data = null) => {
        setLoadingState(operation, LOADING_STATES.SUCCESS, data);
    }, [setLoadingState]);

    const setError = useCallback((operation, error = null) => {
        setLoadingState(operation, LOADING_STATES.ERROR, error);
    }, [setLoadingState]);

    const setRetrying = useCallback((operation, data = null) => {
        setLoadingState(operation, LOADING_STATES.RETRYING, data);
    }, [setLoadingState]);

    const clearState = useCallback((operation) => {
        setLoadingState(operation, LOADING_STATES.IDLE, null);

        // Clear any pending timeout
        const existingTimeout = timeoutsRef.current.get(operation);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            timeoutsRef.current.delete(operation);
        }
    }, [setLoadingState]);

    // Clear all states
    const clearAllStates = useCallback(() => {
        // Clear all timeouts
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current.clear();

        setStates({});
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
            timeoutsRef.current.clear();
        };
    }, []);

    return {
        // State getters
        getLoadingState,
        isLoading,
        isSuccess,
        isError,
        isRetrying,

        // State setters
        setLoadingState,
        startLoading,
        setSuccess,
        setError,
        setRetrying,
        clearState,
        clearAllStates,

        // Raw states for advanced usage
        states
    };
}

/**
 * Async Operation Hook with Loading States
 */
export function useAsyncOperation(operation, options = {}) {
    const {
        onSuccess,
        onError,
        retryAttempts = 3,
        retryDelay = 1000,
        autoRetry = false
    } = options;

    const [state, setState] = useState(LOADING_STATES.IDLE);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const retryTimeoutRef = useRef(null);

    const execute = useCallback(async (...args) => {
        setState(LOADING_STATES.LOADING);
        setError(null);
        setAttempt(prev => prev + 1);

        try {
            const result = await operation(...args);

            setState(LOADING_STATES.SUCCESS);
            setData(result);
            setAttempt(0);

            onSuccess?.(result);
            return result;
        } catch (err) {
            setError(err);

            if (attempt < retryAttempts && autoRetry) {
                setState(LOADING_STATES.RETRYING);

                retryTimeoutRef.current = setTimeout(() => {
                    execute(...args);
                }, retryDelay * Math.pow(2, attempt)); // Exponential backoff
            } else {
                setState(LOADING_STATES.ERROR);
                setAttempt(0);
                onError?.(err);
            }

            throw err;
        }
    }, [operation, attempt, retryAttempts, autoRetry, retryDelay, onSuccess, onError]);

    const retry = useCallback((...args) => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }
        setAttempt(0);
        return execute(...args);
    }, [execute]);

    const reset = useCallback(() => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }
        setState(LOADING_STATES.IDLE);
        setData(null);
        setError(null);
        setAttempt(0);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

    return {
        state,
        data,
        error,
        attempt,
        isLoading: state === LOADING_STATES.LOADING,
        isSuccess: state === LOADING_STATES.SUCCESS,
        isError: state === LOADING_STATES.ERROR,
        isRetrying: state === LOADING_STATES.RETRYING,
        execute,
        retry,
        reset
    };
}

/**
 * Batch Operations Hook
 */
export function useBatchOperations() {
    const [operations, setOperations] = useState(new Map());
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState({ completed: 0, total: 0, current: null });

    const addOperation = useCallback((id, operation, data = null) => {
        setOperations(prev => new Map(prev).set(id, {
            operation,
            data,
            state: LOADING_STATES.IDLE,
            result: null,
            error: null
        }));
    }, []);

    const removeOperation = useCallback((id) => {
        setOperations(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
        });
    }, []);

    const executeBatch = useCallback(async (onProgress) => {
        if (isRunning) return;

        setIsRunning(true);
        const operationEntries = Array.from(operations.entries());
        const total = operationEntries.length;
        let completed = 0;

        setProgress({ completed: 0, total, current: null });

        for (const [id, operationData] of operationEntries) {
            setProgress({ completed, total, current: id });

            // Update operation state to loading
            setOperations(prev => {
                const newMap = new Map(prev);
                const op = newMap.get(id);
                if (op) {
                    op.state = LOADING_STATES.LOADING;
                }
                return newMap;
            });

            try {
                const result = await operationData.operation(operationData.data);

                // Update operation state to success
                setOperations(prev => {
                    const newMap = new Map(prev);
                    const op = newMap.get(id);
                    if (op) {
                        op.state = LOADING_STATES.SUCCESS;
                        op.result = result;
                    }
                    return newMap;
                });

                completed++;
                onProgress?.({ id, result, completed, total });
            } catch (error) {
                // Update operation state to error
                setOperations(prev => {
                    const newMap = new Map(prev);
                    const op = newMap.get(id);
                    if (op) {
                        op.state = LOADING_STATES.ERROR;
                        op.error = error;
                    }
                    return newMap;
                });

                completed++;
                onProgress?.({ id, error, completed, total });
            }
        }

        setProgress({ completed, total, current: null });
        setIsRunning(false);
    }, [operations, isRunning]);

    const clearBatch = useCallback(() => {
        setOperations(new Map());
        setProgress({ completed: 0, total: 0, current: null });
    }, []);

    const getOperationState = useCallback((id) => {
        return operations.get(id) || null;
    }, [operations]);

    return {
        operations: Array.from(operations.entries()),
        isRunning,
        progress,
        addOperation,
        removeOperation,
        executeBatch,
        clearBatch,
        getOperationState
    };
}

/**
 * Page Loading Hook
 */
export function usePageLoading(dependencies = []) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingSteps, setLoadingSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    const addLoadingStep = useCallback((step) => {
        setLoadingSteps(prev => [...prev, step]);
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep(prev => prev + 1);
    }, []);

    const finishLoading = useCallback(() => {
        setIsLoading(false);
        setCurrentStep(loadingSteps.length);
    }, [loadingSteps.length]);

    const setLoadingError = useCallback((err) => {
        setError(err);
        setIsLoading(false);
    }, []);

    const reset = useCallback(() => {
        setIsLoading(true);
        setError(null);
        setCurrentStep(0);
        setLoadingSteps([]);
    }, []);

    // Auto-finish loading when all dependencies are ready
    useEffect(() => {
        const allReady = dependencies.every(dep => dep !== null && dep !== undefined);
        if (allReady && isLoading && loadingSteps.length > 0) {
            finishLoading();
        }
    }, [dependencies, isLoading, loadingSteps.length, finishLoading]);

    return {
        isLoading,
        error,
        loadingSteps,
        currentStep,
        progress: loadingSteps.length > 0 ? (currentStep / loadingSteps.length) * 100 : 0,
        addLoadingStep,
        nextStep,
        finishLoading,
        setLoadingError,
        reset
    };
}