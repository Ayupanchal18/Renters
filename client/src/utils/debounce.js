import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Debounce utilities for performance optimization
 * Validates: Requirements 6.3
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Options object
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait, options = {}) {
    let timeoutId;
    let lastCallTime;
    let lastInvokeTime = 0;
    let leadingValue;
    let maxTimeoutId;
    let result;

    const { leading = false, maxWait, trailing = true } = options;

    function invokeFunc(time) {
        const args = lastArgs;
        const thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
    }

    function leadingEdge(time) {
        lastInvokeTime = time;
        maxTimeoutId = setTimeout(timerExpired, wait);
        return leading ? invokeFunc(time) : result;
    }

    function remainingWait(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;
        const timeWaiting = wait - timeSinceLastCall;

        return maxWait !== undefined
            ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
            : timeWaiting;
    }

    function shouldInvoke(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;

        return (
            lastCallTime === undefined ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
        );
    }

    function timerExpired() {
        const time = Date.now();
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        timeoutId = setTimeout(timerExpired, remainingWait(time));
    }

    function trailingEdge(time) {
        timeoutId = undefined;

        if (trailing && lastArgs) {
            return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
    }

    function cancel() {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        if (maxTimeoutId !== undefined) {
            clearTimeout(maxTimeoutId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timeoutId = maxTimeoutId = undefined;
    }

    function flush() {
        return timeoutId === undefined ? result : trailingEdge(Date.now());
    }

    let lastArgs, lastThis;

    function debounced(...args) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
            if (timeoutId === undefined) {
                return leadingEdge(lastCallTime);
            }
            if (maxWait !== undefined) {
                timeoutId = setTimeout(timerExpired, wait);
                return invokeFunc(lastCallTime);
            }
        }
        if (timeoutId === undefined) {
            timeoutId = setTimeout(timerExpired, wait);
        }
        return result;
    }

    debounced.cancel = cancel;
    debounced.flush = flush;
    return debounced;
}

/**
 * React hook for debounced values
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} - Debounced value
 */
export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * React hook for debounced callbacks
 * @param {Function} callback - Callback function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} deps - Dependencies array
 * @returns {Function} - Debounced callback
 */
export function useDebouncedCallback(callback, delay, deps = []) {
    const callbackRef = useRef(callback);
    const timeoutRef = useRef(null);

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Create debounced function
    const debouncedCallback = useCallback(
        (...args) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        },
        [delay, ...deps]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Add cancel method
    debouncedCallback.cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    return debouncedCallback;
}

/**
 * Hook for debounced search functionality
 * @param {Function} searchFunction - Search function to call
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Object} - Search utilities
 */
export function useDebouncedSearch(searchFunction, delay = 300) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, delay);

    const performSearch = useDebouncedCallback(
        async (term) => {
            if (!term.trim()) return;

            setIsSearching(true);
            try {
                await searchFunction(term);
            } finally {
                setIsSearching(false);
            }
        },
        delay,
        [searchFunction]
    );

    useEffect(() => {
        if (debouncedSearchTerm) {
            performSearch(debouncedSearchTerm);
        }
    }, [debouncedSearchTerm, performSearch]);

    return {
        searchTerm,
        setSearchTerm,
        debouncedSearchTerm,
        isSearching,
        performSearch,
        cancelSearch: performSearch.cancel,
    };
}

/**
 * Hook for debounced filter functionality
 * @param {Function} filterFunction - Filter function to call
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Object} - Filter utilities
 */
export function useDebouncedFilter(filterFunction, delay = 200) {
    const [filters, setFilters] = useState({});
    const [isFiltering, setIsFiltering] = useState(false);
    const debouncedFilters = useDebounce(filters, delay);

    const applyFilters = useDebouncedCallback(
        async (filterValues) => {
            setIsFiltering(true);
            try {
                await filterFunction(filterValues);
            } finally {
                setIsFiltering(false);
            }
        },
        delay,
        [filterFunction]
    );

    useEffect(() => {
        if (Object.keys(debouncedFilters).length > 0) {
            applyFilters(debouncedFilters);
        }
    }, [debouncedFilters, applyFilters]);

    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
        applyFilters.cancel();
    }, [applyFilters]);

    return {
        filters,
        setFilters,
        updateFilter,
        clearFilters,
        debouncedFilters,
        isFiltering,
        applyFilters,
    };
}

/**
 * Throttle function for limiting function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Hook for throttled callbacks
 * @param {Function} callback - Callback to throttle
 * @param {number} limit - Throttle limit in milliseconds
 * @param {Array} deps - Dependencies
 * @returns {Function} - Throttled callback
 */
export function useThrottledCallback(callback, limit, deps = []) {
    const callbackRef = useRef(callback);
    const lastRan = useRef(Date.now());

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback(
        throttle((...args) => {
            callbackRef.current(...args);
        }, limit),
        [limit, ...deps]
    );
}