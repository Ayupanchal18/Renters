import { useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Create context with default fallback value to prevent null access
const NavigationStateContext = createContext({
    saveScrollPosition: () => {},
    restoreScrollPosition: () => {},
    saveViewState: () => {},
    restoreViewState: () => null,
    navigateWithState: () => {},
    clearOldStates: () => {}
});

/**
 * Navigation State Provider
 * Manages scroll position and view state persistence across navigation
 * Must be rendered inside BrowserRouter
 */
export const NavigationStateProvider = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const scrollPositions = useRef(new Map());
    const viewStates = useRef(new Map());

    // Save current scroll position
    const saveScrollPosition = useCallback((path) => {
        const currentPath = path || location.pathname;
        const scrollY = window.scrollY;
        scrollPositions.current.set(currentPath, scrollY);
        try {
            sessionStorage.setItem(`scroll_${currentPath}`, scrollY.toString());
        } catch (e) {
            // Ignore sessionStorage errors
        }
    }, [location.pathname]);

    // Restore scroll position
    const restoreScrollPosition = useCallback((path) => {
        const currentPath = path || location.pathname;
        let scrollY = scrollPositions.current.get(currentPath);

        if (scrollY === undefined) {
            try {
                const stored = sessionStorage.getItem(`scroll_${currentPath}`);
                scrollY = stored ? parseInt(stored, 10) : 0;
            } catch (e) {
                scrollY = 0;
            }
        }

        requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
        });
    }, [location.pathname]);

    // Save view state (filters, search, etc.)
    const saveViewState = useCallback((path, state) => {
        const currentPath = path || location.pathname;
        viewStates.current.set(currentPath, state);
        try {
            sessionStorage.setItem(`viewState_${currentPath}`, JSON.stringify(state));
        } catch (e) {
            // Ignore sessionStorage errors
        }
    }, [location.pathname]);

    // Restore view state
    const restoreViewState = useCallback((path) => {
        const currentPath = path || location.pathname;
        let state = viewStates.current.get(currentPath);

        if (!state) {
            try {
                const stored = sessionStorage.getItem(`viewState_${currentPath}`);
                state = stored ? JSON.parse(stored) : null;
            } catch (e) {
                state = null;
            }
        }

        return state;
    }, [location.pathname]);

    // Enhanced navigate function that preserves current state
    const navigateWithState = useCallback((to, options = {}) => {
        saveScrollPosition();

        if (options.saveViewState) {
            saveViewState(location.pathname, options.saveViewState);
        }

        navigate(to, options);
    }, [navigate, location.pathname, saveScrollPosition, saveViewState]);

    // Clear old navigation states (keep only last 10 pages)
    const clearOldStates = useCallback(() => {
        const maxEntries = 10;

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

        try {
            const keys = Object.keys(sessionStorage);
            const scrollKeys = keys.filter(key => key.startsWith('scroll_'));
            const viewStateKeys = keys.filter(key => key.startsWith('viewState_'));

            if (scrollKeys.length > maxEntries) {
                scrollKeys.sort();
                const keysToRemove = scrollKeys.slice(0, scrollKeys.length - maxEntries);
                keysToRemove.forEach(key => sessionStorage.removeItem(key));
            }

            if (viewStateKeys.length > maxEntries) {
                viewStateKeys.sort();
                const keysToRemove = viewStateKeys.slice(0, viewStateKeys.length - maxEntries);
                keysToRemove.forEach(key => sessionStorage.removeItem(key));
            }
        } catch (e) {
            // Ignore sessionStorage errors
        }
    }, []);

    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = () => {
            setTimeout(() => {
                restoreScrollPosition();
            }, 50);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [restoreScrollPosition]);

    // Save scroll position when leaving the page
    useEffect(() => {
        const handleBeforeUnload = () => saveScrollPosition();
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [saveScrollPosition]);

    // Auto-save scroll position periodically
    useEffect(() => {
        let timeoutId;
        const handleScroll = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => saveScrollPosition(), 100);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId);
        };
    }, [saveScrollPosition]);

    // Clean up old states periodically
    useEffect(() => {
        clearOldStates();
    }, [location.pathname, clearOldStates]);

    // Restore scroll position when location changes
    useEffect(() => {
        const timer = setTimeout(() => {
            restoreScrollPosition();
        }, 100);
        return () => clearTimeout(timer);
    }, [location.pathname, restoreScrollPosition]);

    const navigationState = {
        saveScrollPosition,
        restoreScrollPosition,
        saveViewState,
        restoreViewState,
        navigateWithState,
        clearOldStates
    };

    return (
        <NavigationStateContext.Provider value={navigationState}>
            {children}
        </NavigationStateContext.Provider>
    );
};

/**
 * Hook to access navigation state context
 */
export const useNavigationStateContext = () => {
    const context = useContext(NavigationStateContext);
    if (!context) {
        console.warn('useNavigationStateContext: Using default context. Make sure component is wrapped with NavigationStateProvider');
        return {
            saveScrollPosition: () => {},
            restoreScrollPosition: () => {},
            saveViewState: () => {},
            restoreViewState: () => null,
            navigateWithState: (to) => {
                if (typeof window !== 'undefined') {
                    window.location.href = to;
                }
            },
            clearOldStates: () => {}
        };
    }
    return context;
};

export default NavigationStateProvider;
