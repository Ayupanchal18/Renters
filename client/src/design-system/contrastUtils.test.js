/**
 * Tests for WCAG Contrast Ratio Calculation Utility
 */

import { describe, it, expect } from 'vitest';
import {
    hexToRgb,
    rgbToLuminance,
    getContrastRatio,
    meetsWCAGAA,
    meetsWCAGAALargeText,
    meetsWCAGAAA,
    getWCAGLevel,
    testPaletteContrast,
    getContrastSummary,
} from './contrastUtils.js';
import { lightPalette, darkPalette } from './design-tokens.js';

describe('hexToRgb', () => {
    it('should parse 6-digit hex colors correctly', () => {
        expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
        expect(hexToRgb('#2B50FF')).toEqual({ r: 43, g: 80, b: 255 });
    });

    it('should handle hex colors without # prefix', () => {
        expect(hexToRgb('FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('2B50FF')).toEqual({ r: 43, g: 80, b: 255 });
    });

    it('should handle 3-digit shorthand hex colors', () => {
        expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
        expect(hexToRgb('ABC')).toEqual({ r: 170, g: 187, b: 204 });
    });
});

describe('rgbToLuminance', () => {
    it('should return 1 for white', () => {
        expect(rgbToLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
    });

    it('should return 0 for black', () => {
        expect(rgbToLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
    });

    it('should return correct luminance for gray', () => {
        // Mid-gray should have luminance around 0.2
        const luminance = rgbToLuminance({ r: 128, g: 128, b: 128 });
        expect(luminance).toBeGreaterThan(0.1);
        expect(luminance).toBeLessThan(0.3);
    });
});

describe('getContrastRatio', () => {
    it('should return 21:1 for black on white', () => {
        const ratio = getContrastRatio('#000000', '#FFFFFF');
        expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 21:1 for white on black', () => {
        const ratio = getContrastRatio('#FFFFFF', '#000000');
        expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 1:1 for same colors', () => {
        const ratio = getContrastRatio('#2B50FF', '#2B50FF');
        expect(ratio).toBeCloseTo(1, 5);
    });

    it('should calculate correct ratio for design system primary on background', () => {
        // Royal Indigo (#2B50FF) on light background (#F8FAFC)
        const ratio = getContrastRatio(lightPalette.primary, lightPalette.background);
        expect(ratio).toBeGreaterThan(1);
    });
});

describe('meetsWCAGAA', () => {
    it('should return true for black on white (21:1)', () => {
        expect(meetsWCAGAA('#000000', '#FFFFFF')).toBe(true);
    });

    it('should return false for same colors (1:1)', () => {
        expect(meetsWCAGAA('#FFFFFF', '#FFFFFF')).toBe(false);
    });

    it('should return true for text on background in light palette', () => {
        expect(meetsWCAGAA(lightPalette.text, lightPalette.background)).toBe(true);
    });

    it('should return true for text on background in dark palette', () => {
        expect(meetsWCAGAA(darkPalette.text, darkPalette.background)).toBe(true);
    });
});

describe('meetsWCAGAALargeText', () => {
    it('should return true for black on white', () => {
        expect(meetsWCAGAALargeText('#000000', '#FFFFFF')).toBe(true);
    });

    it('should have lower threshold than normal text (3:1 vs 4.5:1)', () => {
        // A color pair that passes large text but might fail normal text
        // Gray on white with ~3.5:1 ratio
        const gray = '#767676'; // This has approximately 4.54:1 ratio with white
        expect(meetsWCAGAALargeText(gray, '#FFFFFF')).toBe(true);
    });
});

describe('meetsWCAGAAA', () => {
    it('should return true for black on white (21:1)', () => {
        expect(meetsWCAGAAA('#000000', '#FFFFFF')).toBe(true);
    });

    it('should require higher contrast than AA (7:1 vs 4.5:1)', () => {
        // A color that passes AA but might not pass AAA
        const ratio = getContrastRatio('#767676', '#FFFFFF');
        // #767676 on white is about 4.54:1, passes AA but not AAA
        expect(ratio).toBeGreaterThan(4.5);
        expect(ratio).toBeLessThan(7);
        expect(meetsWCAGAA('#767676', '#FFFFFF')).toBe(true);
        expect(meetsWCAGAAA('#767676', '#FFFFFF')).toBe(false);
    });
});

describe('getWCAGLevel', () => {
    it('should return AAA for black on white', () => {
        expect(getWCAGLevel('#000000', '#FFFFFF')).toBe('AAA');
    });

    it('should return fail for same colors', () => {
        expect(getWCAGLevel('#FFFFFF', '#FFFFFF')).toBe('fail');
    });

    it('should return AA for text on background in light palette', () => {
        const level = getWCAGLevel(lightPalette.text, lightPalette.background);
        expect(['AA', 'AAA']).toContain(level);
    });
});

describe('testPaletteContrast', () => {
    it('should return results for all color pairs in light palette', () => {
        const results = testPaletteContrast(lightPalette);
        expect(results.length).toBeGreaterThan(0);
        results.forEach(result => {
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('foreground');
            expect(result).toHaveProperty('background');
            expect(result).toHaveProperty('ratio');
            expect(result).toHaveProperty('passes');
            expect(result).toHaveProperty('level');
        });
    });

    it('should return results for all color pairs in dark palette', () => {
        const results = testPaletteContrast(darkPalette);
        expect(results.length).toBeGreaterThan(0);
        results.forEach(result => {
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('ratio');
            expect(typeof result.ratio).toBe('number');
        });
    });

    it('should have text-on-background pass for both palettes', () => {
        const lightResults = testPaletteContrast(lightPalette);
        const darkResults = testPaletteContrast(darkPalette);

        const lightTextOnBg = lightResults.find(r => r.name === 'text-on-background');
        const darkTextOnBg = darkResults.find(r => r.name === 'text-on-background');

        expect(lightTextOnBg.passes).toBe(true);
        expect(darkTextOnBg.passes).toBe(true);
    });
});

describe('getContrastSummary', () => {
    it('should return summary with correct structure', () => {
        const summary = getContrastSummary(lightPalette);
        expect(summary).toHaveProperty('total');
        expect(summary).toHaveProperty('passing');
        expect(summary).toHaveProperty('failing');
        expect(summary).toHaveProperty('failingPairs');
        expect(summary.total).toBe(summary.passing + summary.failing);
    });

    it('should identify failing pairs', () => {
        const summary = getContrastSummary(lightPalette);
        expect(Array.isArray(summary.failingPairs)).toBe(true);
        summary.failingPairs.forEach(pair => {
            expect(pair.passes).toBe(false);
        });
    });
});

describe('Design System Color Compliance', () => {
    it('should have text readable on background in light mode', () => {
        const ratio = getContrastRatio(lightPalette.text, lightPalette.background);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have text readable on background in dark mode', () => {
        const ratio = getContrastRatio(darkPalette.text, darkPalette.background);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have text readable on surface in light mode', () => {
        const ratio = getContrastRatio(lightPalette.text, lightPalette.surface);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have text readable on surface in dark mode', () => {
        const ratio = getContrastRatio(darkPalette.text, darkPalette.surface);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
});
