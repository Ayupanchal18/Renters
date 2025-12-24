import { useEffect, useCallback } from 'react';
import { onCLS, onLCP, onFCP, onTTFB, onINP } from 'web-vitals';

/**
 * Hook to measure and report Core Web Vitals metrics
 * Measures: LCP, FID/INP, CLS, FCP, TTFB
 * 
 * @param {Function} onReport - Callback function to receive metric reports
 * @param {Object} options - Configuration options
 * @param {boolean} options.reportAllChanges - Report all metric changes, not just final values
 * 
 * @example
 * useWebVitals((metric) => {
 *   console.log(metric.name, metric.value);
 * });
 */
export function useWebVitals(onReport, options = {}) {
    const { reportAllChanges = false } = options;

    const handleReport = useCallback((metric) => {
        if (typeof onReport === 'function') {
            onReport({
                name: metric.name,
                value: metric.value,
                rating: metric.rating,
                delta: metric.delta,
                id: metric.id,
                navigationType: metric.navigationType,
            });
        }
    }, [onReport]);

    useEffect(() => {
        // Cumulative Layout Shift - measures visual stability
        // Good: < 0.1, Needs Improvement: 0.1-0.25, Poor: > 0.25
        onCLS(handleReport, { reportAllChanges });

        // Interaction to Next Paint - measures interactivity (replaces FID)
        // Good: < 200ms, Needs Improvement: 200-500ms, Poor: > 500ms
        onINP(handleReport, { reportAllChanges });

        // Largest Contentful Paint - measures loading performance
        // Good: < 2.5s, Needs Improvement: 2.5-4s, Poor: > 4s
        onLCP(handleReport, { reportAllChanges });

        // First Contentful Paint - measures initial render
        // Good: < 1.8s, Needs Improvement: 1.8-3s, Poor: > 3s
        onFCP(handleReport, { reportAllChanges });

        // Time to First Byte - measures server response time
        // Good: < 800ms, Needs Improvement: 800-1800ms, Poor: > 1800ms
        onTTFB(handleReport, { reportAllChanges });
    }, [handleReport, reportAllChanges]);
}

/**
 * Performance thresholds based on Core Web Vitals standards
 */
export const WEB_VITALS_THRESHOLDS = {
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    INP: { good: 200, needsImprovement: 500 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 },
};

/**
 * Get rating for a metric value
 * @param {string} name - Metric name (LCP, FID, CLS, etc.)
 * @param {number} value - Metric value
 * @returns {'good' | 'needs-improvement' | 'poor'}
 */
export function getMetricRating(name, value) {
    const thresholds = WEB_VITALS_THRESHOLDS[name];
    if (!thresholds) return 'unknown';

    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
}

export default useWebVitals;
