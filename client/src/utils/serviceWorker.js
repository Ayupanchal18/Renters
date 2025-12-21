import { useState, useEffect } from 'react';

/**
 * Service Worker registration and management utilities
 * Validates: Requirements 6.4
 */

const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

/**
 * Register service worker
 * @param {Object} config - Configuration options
 */
export function register(config = {}) {
    if ('serviceWorker' in navigator) {
        const publicUrl = new URL(import.meta.env.VITE_PUBLIC_URL || '', window.location.href);
        if (publicUrl.origin !== window.location.origin) {
            return;
        }

        const swUrl = `${import.meta.env.VITE_PUBLIC_URL || ''}/sw.js`;

        const loadServiceWorker = () => {
            if (isLocalhost) {
                checkValidServiceWorker(swUrl, config);
                navigator.serviceWorker.ready.then(() => {
                    console.log(
                        'This web app is being served cache-first by a service worker.'
                    );
                });
            } else {
                registerValidSW(swUrl, config);
            }
        };

        // FIX: Check if the window is already loaded
        if (document.readyState === 'complete') {
            loadServiceWorker();
        } else {
            window.addEventListener('load', loadServiceWorker);
        }
    }
}

/**
 * Register valid service worker
 */
function registerValidSW(swUrl, config) {
    navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
            console.log('SW registered: ', registration);

            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker == null) {
                    return;
                }

                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            console.log(
                                'New content is available and will be used when all tabs for this page are closed.'
                            );

                            if (config && config.onUpdate) {
                                config.onUpdate(registration);
                            }
                        } else {
                            console.log('Content is cached for offline use.');

                            if (config && config.onSuccess) {
                                config.onSuccess(registration);
                            }
                        }
                    }
                };
            };
        })
        .catch((error) => {
            console.error('Error during service worker registration:', error);
        });
}

/**
 * Check if service worker is valid
 */
function checkValidServiceWorker(swUrl, config) {
    fetch(swUrl, {
        headers: { 'Service-Worker': 'script' },
    })
        .then((response) => {
            const contentType = response.headers.get('content-type');
            if (
                response.status === 404 ||
                (contentType != null && contentType.indexOf('javascript') === -1)
            ) {
                navigator.serviceWorker.ready.then((registration) => {
                    registration.unregister().then(() => {
                        window.location.reload();
                    });
                });
            } else {
                registerValidSW(swUrl, config);
            }
        })
        .catch(() => {
            console.log('No internet connection found. App is running in offline mode.');
        });
}

/**
 * Unregister service worker
 */
export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => {
                registration.unregister();
            })
            .catch((error) => {
                console.error(error.message);
            });
    }
}

/**
 * Update service worker
 */
export function updateServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.update();
        });
    }
}

/**
 * Skip waiting and activate new service worker
 */
export function skipWaiting() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
}

/**
 * Cache property data for offline access
 */
export function cacheProperty(propertyData) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_PROPERTY',
            payload: propertyData,
        });
    }
}

/**
 * Clear service worker cache
 */
export function clearCache(cacheType = 'all') {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'CLEAR_CACHE',
            payload: { cacheType },
        });
    }
}

/**
 * Get cache size information
 */
export function getCacheSize() {
    return new Promise((resolve) => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const messageChannel = new MessageChannel();

            messageChannel.port1.onmessage = (event) => {
                if (event.data.type === 'CACHE_SIZE') {
                    resolve(event.data.size);
                }
            };

            navigator.serviceWorker.controller.postMessage(
                { type: 'GET_CACHE_SIZE' },
                [messageChannel.port2]
            );
        } else {
            resolve({ totalSize: 0, cacheCount: 0, formattedSize: '0 B' });
        }
    });
}

/**
 * Check if app is running offline
 */
export function isOffline() {
    return !navigator.onLine;
}

/**
 * Hook for online/offline status
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

/**
 * Service worker update notification hook
 */
export function useServiceWorkerUpdate() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [registration, setRegistration] = useState(null);

    useEffect(() => {
        const config = {
            onUpdate: (reg) => {
                setUpdateAvailable(true);
                setRegistration(reg);
            },
            onSuccess: () => {
                console.log('Service worker registered successfully');
            },
        };

        register(config);
    }, []);

    const applyUpdate = () => {
        if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    };

    return {
        updateAvailable,
        applyUpdate,
    };
}

/**
 * Cache management hook
 */
export function useCacheManagement() {
    const [cacheSize, setCacheSize] = useState(null);
    const [isClearing, setIsClearing] = useState(false);

    const refreshCacheSize = async () => {
        const size = await getCacheSize();
        setCacheSize(size);
    };

    const clearAppCache = async (cacheType = 'all') => {
        setIsClearing(true);
        try {
            clearCache(cacheType);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cache clear
            await refreshCacheSize();
        } finally {
            setIsClearing(false);
        }
    };

    useEffect(() => {
        refreshCacheSize();
    }, []);

    return {
        cacheSize,
        isClearing,
        refreshCacheSize,
        clearAppCache,
    };
}

export default {
    register,
    unregister,
    updateServiceWorker,
    skipWaiting,
    cacheProperty,
    clearCache,
    getCacheSize,
    isOffline,
    useOnlineStatus,
    useServiceWorkerUpdate,
    useCacheManagement,
};