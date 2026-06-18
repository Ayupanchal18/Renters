/**
 * useWebStateRestore — Web state persistence utilities
 *
 * Mirrors what the mobile app does with AsyncStorage, but uses
 * localStorage (cross-session) and sessionStorage (tab-session).
 *
 * Usage:
 *   const [city, setCity] = usePersistedState('search:city', '');
 *   const { saveScroll, restoreScroll } = useScrollRestore('rent-listings');
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/* ─── Generic Persisted State ──────────────────────────────── */

/**
 * Like useState but reads/writes from localStorage.
 * Falls back silently if localStorage is unavailable (incognito, SSR).
 */
export function usePersistedState(key, initialValue, storage = 'local') {
    const getStore = () => {
        try { return storage === 'session' ? sessionStorage : localStorage; }
        catch { return null; }
    };

    const [state, setState] = useState(() => {
        const store = getStore();
        if (!store) return initialValue;
        try {
            const raw = store.getItem(key);
            return raw !== null ? JSON.parse(raw) : initialValue;
        } catch { return initialValue; }
    });

    // Debounced write
    const timerRef = useRef(null);
    const set = useCallback((value) => {
        setState(prev => {
            const resolved = typeof value === 'function' ? value(prev) : value;
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                const store = getStore();
                if (store) {
                    try { store.setItem(key, JSON.stringify(resolved)); } catch { /* quota */ }
                }
            }, 300);
            return resolved;
        });
    }, [key]);

    const clear = useCallback(() => {
        const store = getStore();
        if (store) { try { store.removeItem(key); } catch { } }
        setState(initialValue);
    }, [key, initialValue]);

    return [state, set, clear];
}

/* ─── Scroll Restore ───────────────────────────────────────── */

/**
 * Saves the Y scroll position to sessionStorage when leaving the page,
 * restores it when returning to the same path.
 *
 * Usage:
 *   useScrollRestore();   // call anywhere in the page component
 */
export function useScrollRestore() {
    const { pathname } = useLocation();
    const scrollKey = `scroll:${pathname}`;

    // Restore on mount
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(scrollKey);
            if (saved) {
                const y = parseInt(saved, 10);
                // Small delay to let DOM settle before scrolling
                const t = setTimeout(() => window.scrollTo({ top: y, behavior: 'instant' }), 60);
                return () => clearTimeout(t);
            }
        } catch { /* ignore */ }
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    // Save on unload / route change
    useEffect(() => {
        const save = () => {
            try { sessionStorage.setItem(scrollKey, String(window.scrollY)); } catch { }
        };
        window.addEventListener('beforeunload', save);
        return () => {
            save(); // save on component unmount (route change)
            window.removeEventListener('beforeunload', save);
        };
    }, [pathname]);
}

/* ─── Active Tab Persist ───────────────────────────────────── */

/**
 * Persist a tab string to localStorage and restore it on re-visit.
 * Returns [activeTab, setActiveTab].
 */
export function usePersistedTab(key, defaultTab) {
    return usePersistedState(key, defaultTab);
}

/* ─── Onboarding Flag ──────────────────────────────────────── */

const ONBOARDING_KEY = 'app:onboarding_done';

export function useOnboarding() {
    const isDone = () => {
        try { return localStorage.getItem(ONBOARDING_KEY) === 'true'; } catch { return true; }
    };

    const [shown, setShown] = useState(!isDone());

    const completeOnboarding = useCallback(() => {
        try { localStorage.setItem(ONBOARDING_KEY, 'true'); } catch { }
        setShown(false);
    }, []);

    return { showOnboarding: shown, completeOnboarding };
}
