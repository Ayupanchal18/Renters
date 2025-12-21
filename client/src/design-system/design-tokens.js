/**
 * Design Tokens - JavaScript Exports
 * Provides programmatic access to design tokens for JavaScript/TypeScript usage
 */

// Light Mode Color Palette
export const lightPalette = {
    primary: '#2B50FF',        // Royal Indigo
    secondary: '#FF6B68',      // Coral Accent
    tertiary: '#FFC857',       // Gold Amber
    success: '#10B981',        // Emerald
    error: '#EF4444',          // Tomato
    warning: '#F59E0B',        // Amber
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    border: '#E2E8F0',
    muted: '#64748B',
    glassOverlay: 'rgba(8, 15, 30, 0.06)',
};

// Dark Mode Color Palette
export const darkPalette = {
    primary: '#4F6FFF',        // Slightly brighter for dark mode
    secondary: '#FF8A87',      // Slightly brighter for dark mode
    tertiary: '#FFD57A',       // Slightly brighter for dark mode
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    background: '#0B1220',
    surface: '#0F172A',
    text: '#E6EEF8',
    border: '#1E293B',
    muted: '#94A3B8',
    glassOverlay: 'rgba(255, 255, 255, 0.06)',
};

// Spacing Scale (4/8/12/16/24/32px)
export const spacing = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
};

// Border Radius Tokens
export const radii = {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
};

// Shadow Tokens
export const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    glow: '0 0 20px rgba(43, 80, 255, 0.3)',
};

// Transition Duration Tokens
export const transitions = {
    fast: '120ms',
    normal: '180ms',
    slow: '320ms',
    slower: '420ms',
};

// Font Family Tokens
export const fonts = {
    sans: '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"Geist Mono", monospace',
};

// Animation Easing Functions
export const easing = {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
    smooth: 'cubic-bezier(0.4, 0, 0.6, 1)',
};

// Breakpoints
export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
};

// Container Max Width
export const containerMaxWidth = '1400px';

// Utility Functions for Token Access

/**
 * Get color palette based on theme
 * @param {string} theme - 'light' or 'dark'
 * @returns {object} Color palette object
 */
export const getColorPalette = (theme = 'light') => {
    return theme === 'dark' ? darkPalette : lightPalette;
};

/**
 * Get CSS custom property name for a token
 * @param {string} tokenName - Name of the token (e.g., 'primary', 'spacing-lg')
 * @returns {string} CSS custom property name (e.g., 'var(--primary)')
 */
export const getCSSVar = (tokenName) => {
    return `var(--${tokenName})`;
};

/**
 * Get spacing value by key
 * @param {string} key - Spacing key (xs, sm, md, lg, xl, 2xl)
 * @returns {string} Spacing value in pixels
 */
export const getSpacing = (key) => {
    return spacing[key] || spacing.md;
};

/**
 * Get shadow value by key
 * @param {string} key - Shadow key (sm, md, lg, glow)
 * @returns {string} Shadow CSS value
 */
export const getShadow = (key) => {
    return shadows[key] || shadows.sm;
};

/**
 * Get transition duration by key
 * @param {string} key - Duration key (fast, normal, slow, slower)
 * @returns {string} Duration value in milliseconds
 */
export const getTransition = (key) => {
    return transitions[key] || transitions.normal;
};

// Default export with all tokens
const designTokens = {
    lightPalette,
    darkPalette,
    spacing,
    radii,
    shadows,
    transitions,
    fonts,
    easing,
    breakpoints,
    containerMaxWidth,
    // Utility functions
    getColorPalette,
    getCSSVar,
    getSpacing,
    getShadow,
    getTransition,
};

export default designTokens;