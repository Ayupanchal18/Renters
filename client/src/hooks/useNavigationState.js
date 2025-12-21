import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Custom hook for managing navigation state preservation
 * Maintains scroll position and view state across page transitions
 */
export const useNavigationState = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const scrollPositions = useRef(new Map());
    const viewStates = useRef(new Map());

    // Save current scroll position
    const saveScrollPosition = useCallback((path = location.pathname) => {
        const scrollY = window.scrollY;
        scrollPositions.current.set(path, scrollY);

        // Also save to sessionStorage for persistence across page reloads
        sessionStorage.setItem(`scroll_${path}`, scrollY.toString());
    }, [location.pathname]);

    // Restore scroll position
    const restoreScrollPosition = useCallback((path = location.pathname) => {
        // Try to get from memory first, then sessionStorage
        let scrollY = scrollPositions.current.get(path);

        if (scrollY === undefined) {
            const stored = sessionStorage.getItem(`scroll_${path}`);
            scrollY = stored ? parseInt(stored, 10) : 0;
        }

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
        });
    }, [location.pathname]);

    // Save view state (filters, search, etc.)
    const saveViewState = useCallback((path = location.pathname, state) => {
        viewStates.current.set(path, state);

        // Also save to sessionStorage
        sessionStorage.setItem(`viewState_${path}`, JSON.stringify(state));
    }, [location.pathname]);

    // Restore view state
    const restoreViewState = useCallback((path = location.pathname) => {
        // Try to get from memory first, then sessionStorage
        let state = viewStates.current.get(path);

        if (!state) {
            const stored = sessionStorage.getItem(`viewState_${path}`);
            state = stored ? JSON.parse(stored) : null;
        }

        return state;
    }, [location.pathname]);

    // Enhanced navigate function that preserves current state
    const navigateWithState = useCallback((to, options = {}) => {
        // Save current scroll position and view state before navigating
        saveScrollPosition();

        if (options.saveViewState) {
            saveViewState(location.pathname, options.saveViewState);
        }

        navigate(to, options);
    }, [navigate, location.pathname, saveScrollPosition, saveViewState]);

    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = () => {
            // Small delay to ensure location has updated
            setTimeout(() => {
                restoreScrollPosition();
            }, 50);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [restoreScrollPosition]);

    // Save scroll position when leaving the page
    useEffect(() => {
        const handleBeforeUnload = () => {
            saveScrollPosition();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [saveScrollPosition]);

    // Auto-save scroll position periodically
    useEffect(() => {
        const handleScroll = () => {
            // Debounce scroll saves
            clearTimeout(handleScroll.timeoutId);
            handleScroll.timeoutId = setTimeout(() => {
                saveScrollPosition();
            }, 100);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(handleScroll.timeoutId);
        };
    }, [saveScrollPosition]);

    // Clear old navigation states (keep only last 10 pages)
    const clearOldStates = useCallback(() => {
        const maxEntries = 10;

        // Clean memory maps
        if (scrollPositions.current.size > maxEntries) {
            const entries = Array.from(scrollPositions.current.entries());
            const toKeep = entries.slice(-maxEntries);
            scrollPositions.current.clear();
            toKeep.forEach(([key, value]) => {
                scrollPositions.current.set(key, value);
            });
        }

        if (viewStates.current.size > maxEntries) {
            const entries = Array.from(viewStates.current.entries());
            const toKeep = entries.slice(-maxEntries);
            viewStates.current.clear();
            toKeep.forEach(([key, value]) => {
                viewStates.current.set(key, value);
            });
        }

        // Clean sessionStorage - get all keys and sort by timestamp if available
        const keys = Object.keys(sessionStorage);
        const scrollKeys = keys.filter(key => key.startsWith('scroll_'));
        const viewStateKeys = keys.filter(key => key.startsWith('viewState_'));

        // For scroll keys, if we have more than maxEntries, remove the oldest ones
        if (scrollKeys.length > maxEntries) {
            // Sort keys to get consistent ordering (lexicographic by path)
            scrollKeys.sort();
            const keysToRemove = scrollKeys.slice(0, scrollKeys.length - maxEntries);
            keysToRemove.forEach(key => {
                sessionStorage.removeItem(key);
            });
        }

        // Same for view state keys
        if (viewStateKeys.length > maxEntries) {
            viewStateKeys.sort();
            const keysToRemove = viewStateKeys.slice(0, viewStateKeys.length - maxEntries);
            keysToRemove.forEach(key => {
                sessionStorage.removeItem(key);
            });
        }
    }, []);

    // Clean up old states periodically
    useEffect(() => {
        clearOldStates();
    }, [location.pathname, clearOldStates]);

    return {
        saveScrollPosition,
        restoreScrollPosition,
        saveViewState,
        restoreViewState,
        navigateWithState,
        clearOldStates
    };
};

export default useNavigationState;