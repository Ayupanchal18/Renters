/**
 * WCAG Contrast Ratio Calculation Utility
 * 
 * Provides functions to compute WCAG contrast ratios and verify
 * accessibility compliance for text/background color pairs.
 * 
 * WCAG AA Requirements:
 * - Normal text: 4.5:1 minimum contrast ratio
 * - Large text (≥18px or ≥14px bold): 3:1 minimum contrast ratio
 */

import { lightPalette, darkPalette } from './design-tokens.js';

/**
 * Parse a hex color string to RGB values
 * @param {string} hex - Hex color string (e.g., '#2B50FF' or '2B50FF')
 * @returns {{ r: number, g: number, b: number }} RGB values (0-255)
 */
export const hexToRgb = (hex) => {
    // Remove # if present
    const cleanHex = hex.replace(/^#/, '');

    // Handle shorthand hex (e.g., #FFF)
    const fullHex = cleanHex.length === 3
        ? cleanHex.split('').map(c => c + c).join('')
        : cleanHex;

    const bigint = parseInt(fullHex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    };
};

/**
 * Convert RGB color to relative luminance
 * Uses the WCAG 2.1 formula for relative luminance
 * @param {{ r: number, g: number, b: number }} rgb - RGB values (0-255)
 * @returns {number} Relative luminance (0-1)
 */
export const rgbToLuminance = ({ r, g, b }) => {
    // Convert to sRGB (0-1 range)
    const sR = r / 255;
    const sG = g / 255;
    const sB = b / 255;

    // Apply gamma correction
    const linearize = (c) => {
        return c <= 0.03928
            ? c / 12.92
            : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    const R = linearize(sR);
    const G = linearize(sG);
    const B = linearize(sB);

    // Calculate luminance using WCAG coefficients
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

/**
 * Calculate WCAG contrast ratio between two colors
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {number} Contrast ratio (1-21)
 */
export const getContrastRatio = (foreground, background) => {
    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);

    const fgLuminance = rgbToLuminance(fgRgb);
    const bgLuminance = rgbToLuminance(bgRgb);

    // Ensure lighter color is in numerator
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    // WCAG contrast ratio formula: (L1 + 0.05) / (L2 + 0.05)
    return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if a color pair meets WCAG AA requirements for normal text
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {boolean} True if contrast ratio >= 4.5:1
 */
export const meetsWCAGAA = (foreground, background) => {
    return getContrastRatio(foreground, background) >= 4.5;
};

/**
 * Check if a color pair meets WCAG AA requirements for large text
 * Large text is defined as ≥18px or ≥14px bold
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {boolean} True if contrast ratio >= 3:1
 */
export const meetsWCAGAALargeText = (foreground, background) => {
    return getContrastRatio(foreground, background) >= 3;
};

/**
 * Check if a color pair meets WCAG AAA requirements for normal text
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {boolean} True if contrast ratio >= 7:1
 */
export const meetsWCAGAAA = (foreground, background) => {
    return getContrastRatio(foreground, background) >= 7;
};

/**
 * Get WCAG compliance level for a color pair
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {'AAA' | 'AA' | 'AA-large' | 'fail'} Compliance level
 */
export const getWCAGLevel = (foreground, background) => {
    const ratio = getContrastRatio(foreground, background);

    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    if (ratio >= 3) return 'AA-large';
    return 'fail';
};

/**
 * Define text/background color pairs to test for each theme
 * These represent the most common text/background combinations in the design system
 */
export const getColorPairsToTest = (palette) => {
    return [
        // Primary text on backgrounds
        { name: 'text-on-background', foreground: palette.text, background: palette.background },
        { name: 'text-on-surface', foreground: palette.text, background: palette.surface },

        // Primary color usage
        { name: 'primary-on-background', foreground: palette.primary, background: palette.background },
        { name: 'primary-on-surface', foreground: palette.primary, background: palette.surface },

        // Secondary color usage
        { name: 'secondary-on-background', foreground: palette.secondary, background: palette.background },
        { name: 'secondary-on-surface', foreground: palette.secondary, background: palette.surface },

        // Status colors on backgrounds
        { name: 'success-on-background', foreground: palette.success, background: palette.background },
        { name: 'error-on-background', foreground: palette.error, background: palette.background },
        { name: 'warning-on-background', foreground: palette.warning, background: palette.background },

        // Muted text
        { name: 'muted-on-background', foreground: palette.muted, background: palette.background },
        { name: 'muted-on-surface', foreground: palette.muted, background: palette.surface },
    ];
};

/**
 * Test all color pairs in a palette for WCAG AA compliance
 * @param {object} palette - Color palette object
 * @param {boolean} largeText - Whether to test for large text (3:1) or normal text (4.5:1)
 * @returns {Array<{ name: string, foreground: string, background: string, ratio: number, passes: boolean, level: string }>}
 */
export const testPaletteContrast = (palette, largeText = false) => {
    const pairs = getColorPairsToTest(palette);
    const minRatio = largeText ? 3 : 4.5;

    return pairs.map(pair => {
        const ratio = getContrastRatio(pair.foreground, pair.background);
        return {
            ...pair,
            ratio: Math.round(ratio * 100) / 100, // Round to 2 decimal places
            passes: ratio >= minRatio,
            level: getWCAGLevel(pair.foreground, pair.background),
        };
    });
};

/**
 * Test both light and dark palettes for WCAG compliance
 * @param {boolean} largeText - Whether to test for large text requirements
 * @returns {{ light: Array, dark: Array }}
 */
export const testAllPalettesContrast = (largeText = false) => {
    return {
        light: testPaletteContrast(lightPalette, largeText),
        dark: testPaletteContrast(darkPalette, largeText),
    };
};

/**
 * Get a summary of contrast compliance for a palette
 * @param {object} palette - Color palette object
 * @returns {{ total: number, passing: number, failing: number, failingPairs: Array }}
 */
export const getContrastSummary = (palette) => {
    const results = testPaletteContrast(palette);
    const passing = results.filter(r => r.passes);
    const failing = results.filter(r => !r.passes);

    return {
        total: results.length,
        passing: passing.length,
        failing: failing.length,
        failingPairs: failing,
    };
};

export default {
    hexToRgb,
    rgbToLuminance,
    getContrastRatio,
    meetsWCAGAA,
    meetsWCAGAALargeText,
    meetsWCAGAAA,
    getWCAGLevel,
    getColorPairsToTest,
    testPaletteContrast,
    testAllPalettesContrast,
    getContrastSummary,
};
