/**
 * Performance Targets Configuration
 * 
 * This file defines Core Web Vitals thresholds and performance targets
 * for the Renters platform. These values align with Google's recommended
 * thresholds for good user experience.
 * 
 * Requirements: 11.1, 11.2, 11.3
 */

/**
 * Core Web Vitals target thresholds (in milliseconds unless noted)
 * These are the "good" thresholds we aim to achieve
 */
export const performanceTargets = {
    // Largest Contentful Paint - measures loading performance
    // Target: < 2.5 seconds on mobile 4G connections
    lcp: 2500,

    // First Input Delay - measures interactivity (legacy metric)
    // Target: < 100 milliseconds
    fid: 100,

    // Interaction to Next Paint - measures interactivity (replaces FID)
    // Target: < 200 milliseconds
    inp: 200,

    // Cumulative Layout Shift - measures visual stability (score, not ms)
    // Target: < 0.1
    cls: 0.1,

    // First Contentful Paint - measures initial render
    // Target: < 1.8 seconds
    fcp: 1800,

    // Time to First Byte - measures server response time
    // Target: < 800 milliseconds
    ttfb: 800,
};

/**
 * Extended thresholds including "needs improvement" boundaries
 * Used for rating metric values
 */
export const performanceThresholds = {
    LCP: {
        good: 2500,
        needsImprovement: 4000,
        unit: 'ms',
        description: 'Largest Contentful Paint - loading performance',
    },
    FID: {
        good: 100,
        needsImprovement: 300,
        unit: 'ms',
        description: 'First Input Delay - interactivity (legacy)',
    },
    INP: {
        good: 200,
        needsImprovement: 500,
        unit: 'ms',
        description: 'Interaction to Next Paint - interactivity',
    },
    CLS: {
        good: 0.1,
        needsImprovement: 0.25,
        unit: 'score',
        description: 'Cumulative Layout Shift - visual stability',
    },
    FCP: {
        good: 1800,
        needsImprovement: 3000,
        unit: 'ms',
        description: 'First Contentful Paint - initial render',
    },
    TTFB: {
        good: 800,
        needsImprovement: 1800,
        unit: 'ms',
        description: 'Time to First Byte - server response',
    },
};

/**
 * Lighthouse score targets
 * Target: 90+ in all categories
 */
export const lighthouseTargets = {
    performance: 90,
    accessibility: 90,
    bestPractices: 90,
    seo: 90,
};

/**
 * Bundle size limits (in KB, gzipped)
 */
export const bundleSizeLimits = {
    mainBundle: 200,
    vendorBundle: 300,
    totalInitial: 400,
};

/**
 * Get rating for a metric value
 * @param {string} metricName - Metric name (LCP, FID, CLS, etc.)
 * @param {number} value - Metric value
 * @returns {'good' | 'needs-improvement' | 'poor'}
 */
export function getPerformanceRating(metricName, value) {
    const threshold = performanceThresholds[metricName];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
}

/**
 * Check if all Core Web Vitals meet targets
 * @param {Object} metrics - Object with metric values { lcp, fid, cls, ... }
 * @returns {boolean}
 */
export function meetsPerformanceTargets(metrics) {
    const checks = [
        metrics.lcp === undefined || metrics.lcp <= performanceTargets.lcp,
        metrics.fid === undefined || metrics.fid <= performanceTargets.fid,
        metrics.inp === undefined || metrics.inp <= performanceTargets.inp,
        metrics.cls === undefined || metrics.cls <= performanceTargets.cls,
        metrics.fcp === undefined || metrics.fcp <= performanceTargets.fcp,
        metrics.ttfb === undefined || metrics.ttfb <= performanceTargets.ttfb,
    ];

    return checks.every(Boolean);
}

export default performanceTargets;
