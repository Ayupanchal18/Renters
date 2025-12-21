/**
 * Theme Utilities for handling initialization edge cases and fallbacks
 * Validates: Requirements 1.1, 1.5, 3.5
 */

/**
 * Get system theme preference safely
 */
export function getSystemTheme() {
    if (typeof window === 'undefined') {
        return 'light'; // SSR fallback
    }

    try {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    } catch (error) {
        console.warn('Failed to detect system theme:', error);
        return 'light';
    }
}

/**
 * Get stored theme preference safely
 */
export function getStoredTheme() {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        return localStorage.getItem('theme');
    } catch (error) {
        console.warn('Failed to read stored theme:', error);
        return null;
    }
}

/**
 * Set theme preference safely
 */
export function setStoredTheme(theme) {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        if (theme) {
            localStorage.setItem('theme', theme);
        } else {
            localStorage.removeItem('theme');
        }
        return true;
    } catch (error) {
        console.warn('Failed to store theme:', error);
        return false;
    }
}

/**
 * Apply theme to document safely
 */
export function applyTheme(theme) {
    if (typeof document === 'undefined') {
        return false;
    }

    try {
        // Remove existing theme classes
        document.documentElement.classList.remove('light', 'dark');

        // Apply new theme class
        if (theme && ['light', 'dark'].includes(theme)) {
            document.documentElement.classList.add(theme);
        } else {
            // Fallback to system theme
            const systemTheme = getSystemTheme();
            document.documentElement.classList.add(systemTheme);
        }

        return true;
    } catch (error) {
        console.warn('Failed to apply theme:', error);
        return false;
    }
}

/**
 * Validate theme value
 */
export function validateTheme(theme) {
    const validThemes = ['light', 'dark', 'system'];
    return validThemes.includes(theme) ? theme : 'system';
}

/**
 * Get effective theme (resolves 'system' to actual theme)
 */
export function getEffectiveTheme(theme) {
    if (theme === 'system') {
        return getSystemTheme();
    }
    return validateTheme(theme);
}

/**
 * Initialize theme with fallbacks
 */
export function initializeTheme() {
    try {
        // Try to get stored theme first
        let theme = getStoredTheme();

        // If no stored theme, use system preference
        if (!theme) {
            theme = 'system';
        }

        // Validate and apply theme
        const validTheme = validateTheme(theme);
        const effectiveTheme = getEffectiveTheme(validTheme);

        applyTheme(effectiveTheme);

        return {
            theme: validTheme,
            effectiveTheme,
            success: true
        };
    } catch (error) {
        console.error('Theme initialization failed:', error);

        // Emergency fallback
        applyTheme('light');

        return {
            theme: 'light',
            effectiveTheme: 'light',
            success: false,
            error
        };
    }
}

/**
 * Create fallback theme context
 */
export function createFallbackThemeContext(initialTheme = 'light') {
    const theme = validateTheme(initialTheme);
    const effectiveTheme = getEffectiveTheme(theme);

    return {
        theme,
        setTheme: (newTheme) => {
            const validTheme = validateTheme(newTheme);
            const newEffectiveTheme = getEffectiveTheme(validTheme);

            setStoredTheme(validTheme);
            applyTheme(newEffectiveTheme);

            console.log(`Theme changed to: ${validTheme} (effective: ${newEffectiveTheme})`);
        },
        resolvedTheme: effectiveTheme,
        systemTheme: getSystemTheme(),
        themes: ['light', 'dark', 'system']
    };
}

/**
 * Monitor theme changes and handle errors
 */
export function createThemeMonitor(onError) {
    if (typeof window === 'undefined') {
        return () => { }; // No-op for SSR
    }

    const handleSystemThemeChange = (e) => {
        try {
            const newSystemTheme = e.matches ? 'dark' : 'light';

            // Only apply if current theme is 'system'
            const currentTheme = getStoredTheme() || 'system';
            if (currentTheme === 'system') {
                applyTheme(newSystemTheme);
            }
        } catch (error) {
            console.error('System theme change handling failed:', error);
            onError?.(error);
        }
    };

    const handleStorageChange = (e) => {
        try {
            if (e.key === 'theme') {
                const newTheme = e.newValue || 'system';
                const validTheme = validateTheme(newTheme);
                const effectiveTheme = getEffectiveTheme(validTheme);

                applyTheme(effectiveTheme);
            }
        } catch (error) {
            console.error('Storage theme change handling failed:', error);
            onError?.(error);
        }
    };

    // Set up listeners
    try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        window.addEventListener('storage', handleStorageChange);

        // Return cleanup function
        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    } catch (error) {
        console.error('Theme monitor setup failed:', error);
        onError?.(error);
        return () => { }; // Return no-op cleanup
    }
}

/**
 * Detect theme loading issues
 */
export function detectThemeIssues() {
    const issues = [];

    try {
        // Check if document has theme class
        if (typeof document !== 'undefined') {
            const hasThemeClass = document.documentElement.classList.contains('light') ||
                document.documentElement.classList.contains('dark');

            if (!hasThemeClass) {
                issues.push('No theme class applied to document');
            }
        }

        // Check localStorage access
        try {
            localStorage.setItem('theme-test', 'test');
            localStorage.removeItem('theme-test');
        } catch (error) {
            issues.push('localStorage not accessible');
        }

        // Check matchMedia support
        if (typeof window !== 'undefined' && !window.matchMedia) {
            issues.push('matchMedia not supported');
        }

    } catch (error) {
        issues.push(`Theme detection error: ${error.message}`);
    }

    return issues;
}

/**
 * Emergency theme recovery
 */
export function emergencyThemeRecovery() {
    // Only log in development mode to reduce console noise
    if (import.meta.env.DEV) {
        console.warn('Performing emergency theme recovery...');
    }

    try {
        // Don't clear localStorage - just provide fallback context
        // Apply safe default theme
        const systemTheme = getSystemTheme();
        applyTheme(systemTheme);

        // Set up minimal theme context
        return createFallbackThemeContext(systemTheme);
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('Emergency theme recovery failed:', error);
        }

        // Last resort: just apply light theme to document
        if (typeof document !== 'undefined') {
            document.documentElement.className = 'light';
        }

        return {
            theme: 'light',
            setTheme: () => { },
            resolvedTheme: 'light',
            systemTheme: 'light',
            themes: ['light', 'dark', 'system']
        };
    }
}